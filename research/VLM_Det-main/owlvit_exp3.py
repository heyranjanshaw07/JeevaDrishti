from __future__ import annotations

"""OwL‑ViT detector runner for few‑shot object‑detection experiments **with
live, crash‑safe logging and visual overlays**.

*Changes from the previous revision*
-----------------------------------
1. **Incremental logging** – predictions are *appended* to their JSONL files
   directly after each image is processed, so progress is never lost if the run
   is interrupted.
2. **Bounding‑box overlays** – for every image we also write a PNG that shows
   the predicted boxes (colour‑coded) in
   `<output_dir>/<SOURCE>/overlays/<SHOT>/<CLASS>/<imgname>.png`.
3. Added constructor flag ``save_overlays`` (default **True**).

Other behaviour (metrics, stats, progress bars) stays unchanged.
"""

from pathlib import Path
from typing import Dict, List, Tuple, Sequence, DefaultDict, Optional, Any
from collections import defaultdict
import json
import random

import torch
from PIL import Image, ImageDraw, ImageFont
from tqdm.auto import tqdm
from transformers import OwlViTProcessor, OwlViTForObjectDetection

from dataloaders.vis_prompt import FewShotDataset

__all__ = ["OwLViTDetector"]

# -----------------------------------------------------------------------------
# Utils – IoU & AP
# -----------------------------------------------------------------------------

def _iou(box_a: Sequence[int], box_b: Sequence[int]) -> float:
    x1, y1 = max(box_a[0], box_b[0]), max(box_a[1], box_b[1])
    x2, y2 = min(box_a[2], box_b[2]), min(box_a[3], box_b[3])
    inter = max(0, x2 - x1) * max(0, y2 - y1)
    if inter == 0:
        return 0.0
    area_a = (box_a[2] - box_a[0]) * (box_a[3] - box_a[1])
    area_b = (box_b[2] - box_b[0]) * (box_b[3] - box_b[1])
    return inter / (area_a + area_b - inter)


def _ap_at_threshold(
    preds: List[Tuple[str, float, Sequence[int]]],
    gts: Dict[str, List[Sequence[int]]],
    iou_thr: float,
) -> Tuple[float, float, float]:
    preds_sorted = sorted(preds, key=lambda t: t[1], reverse=True)
    tp, fp = [], []
    matched = {img: [False] * len(bx) for img, bx in gts.items()}

    for img_id, score, pbox in preds_sorted:
        gt_boxes = gts.get(img_id, [])
        best_iou, best_idx = 0.0, -1
        for idx, gbox in enumerate(gt_boxes):
            i = _iou(pbox, gbox)
            if i > best_iou:
                best_iou, best_idx = i, idx
        if best_iou >= iou_thr and not (best_idx == -1 or matched[img_id][best_idx]):
            tp.append(1)
            fp.append(0)
            matched[img_id][best_idx] = True
        else:
            tp.append(0)
            fp.append(1)

    tp_cum = torch.tensor(tp).cumsum(0).numpy()
    fp_cum = torch.tensor(fp).cumsum(0).numpy()
    recalls = tp_cum / max(1, sum(len(v) for v in gts.values()))
    precisions = tp_cum / (tp_cum + fp_cum + 1e-12)

    ap = 0.0
    for t in [i / 10 for i in range(11)]:
        prec_at_t = precisions[recalls >= t].max() if (recalls >= t).any() else 0.0
        ap += prec_at_t
    ap /= 11.0

    f1 = 2 * precisions * recalls / (precisions + recalls + 1e-12)
    best = f1.argmax() if len(f1) else 0
    return float(ap), float(precisions[best] if len(precisions) else 0.0), float(recalls[best] if len(recalls) else 0.0)


# -----------------------------------------------------------------------------
# Main class
# -----------------------------------------------------------------------------

class OwLViTDetector:
    """Benchmark OwL‑ViT across dataset sources with incremental logging.

    Parameters
    ----------
    dataset_root : str | Path
    output_dir   : str | Path
    sources      : list[str] | None    – subset, else all 4
    shots        : Sequence[int]       – default (1,3,6)
    device       : torch.device | str  – auto‑select CUDA if available
    seed         : int                 – RNG seed
    save_overlays: bool, default True – save PNGs with drawn boxes
    """

    _AP_THRESHOLDS = (0.10, 0.25, 0.50)
    _COLORS = ["red", "lime", "cyan", "yellow", "magenta"]

    def __init__(
        self,
        dataset_root: str | Path,
        output_dir: str | Path,
        *,
        sources: Optional[Sequence[str]] = None,
        shots: Sequence[int] = (1, 3, 6),
        device: str | torch.device | None = None,
        seed: int = 42,
        save_overlays: bool = True,
        thresh_cfg: Optional[Dict[str, Dict[str, float]]] = None,
    ) -> None:
        self.dataset_root = Path(dataset_root).expanduser().resolve()
        self.output_dir = Path(output_dir).expanduser().resolve(); self.output_dir.mkdir(parents=True, exist_ok=True)
        self.sources = ["BCCD", "malaria", "NIH-3T3", "RatC6"] if sources is None else list(sources)
        self.shots = list(shots)
        self.rng = random.Random(seed)
        self.save_overlays = save_overlays

        self.device = torch.device(device if device is not None else ("cuda" if torch.cuda.is_available() else "cpu"))

        # per‑source thresholds → default fallback
        self._thr_cfg: Dict[str, Tuple[float, float]] = {}
        for s in self.sources:
            if thresh_cfg and s in thresh_cfg:
                self._thr_cfg[s] = (
                    thresh_cfg[s].get("score", 0.05),
                    thresh_cfg[s].get("nms",   0.50),
                )
            else:
                self._thr_cfg[s] = (0.05, 0.50)

        self._model: OwlViTForObjectDetection | None = None
        self._processor: OwlViTProcessor | None = None

        self._gt_store: DefaultDict[str, Dict[str, List[Sequence[int]]]] = defaultdict(dict)
        self._stats: Dict[str, Any] = {}

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def run(self) -> None:
        self._load_model()
        for source in tqdm(self.sources, desc="Sources"):
            ds = FewShotDataset(self.dataset_root, source, rng=self.rng)
            self._gt_store[source] = self._prepare_ground_truth(ds)
            for cls in tqdm(ds.get_classes(), desc=f"{source} classes", leave=False):
                for nshot in self.shots:
                    try:
                        ds.sample_episode(cls, nshot)
                    except ValueError:
                        continue
                    avg_q = self._prepare_query_embedding(ds, cls, nshot)
                    self._process_source_class(ds, source, cls, nshot, avg_q)
            self._compute_source_stats(source)
        self._dump_stats()

    # ------------------------------------------------------------------
    # Processing helpers
    # ------------------------------------------------------------------

    def _process_source_class(self, ds: FewShotDataset, source: str, cls: str, nshot: int, avg_q: torch.Tensor):
        ref_dir = self.dataset_root/"reference"/source/"images"
        jsonl = self._open_jsonl(source, nshot)
        overlay_root = self.output_dir/source/"overlays"/f"{nshot}shot"/cls
        if self.save_overlays:
            overlay_root.mkdir(parents=True, exist_ok=True)
        score_thr, nms_thr = self._thr_cfg[source]
        for img_path in tqdm(sorted(ref_dir.glob("*")), desc=f"{source}-{cls}-{nshot}", leave=False):
            img = Image.open(img_path).convert("RGB")
            preds = self._predict_image(img, avg_q, score_thr, nms_thr)
            rec = {"image_path": str(img_path), "class_label": cls, "boxes": preds["boxes"], "scores": preds["scores"]}
            jsonl.write(json.dumps(rec)+"\n"); jsonl.flush()
            if self.save_overlays and preds["boxes"]:
                self._draw_boxes(img, preds["boxes"], preds["scores"]).save(overlay_root/(img_path.stem+".png"))

    # helpers -----------------------------------------------------------
    def _draw_boxes(
        self, image: Image.Image, boxes: List[Sequence[int]], scores: List[float]
    ) -> Image.Image:
        img = image.copy()
        draw = ImageDraw.Draw(img)
        font = None
        try:
            font = ImageFont.truetype("DejaVuSans.ttf", 14)
        except Exception:  # pragma: no cover – fallback
            font = ImageFont.load_default()

        for idx, (box, score) in enumerate(zip(boxes, scores)):
            color = self._COLORS[idx % len(self._COLORS)]
            draw.rectangle(box, outline=color, width=3)
            draw.text((box[0], max(0, box[1] - 15)), f"{score:.2f}", fill=color, font=font)
        return img

    def _open_jsonl(self, source: str, nshot: int):
        out_dir = self.output_dir / source
        out_dir.mkdir(exist_ok=True)
        file = out_dir / f"predictions_{nshot}shot.jsonl"
        # open in append mode to support incremental logging
        return file.open("a")

    # ------------------------------------------------------------------
    # Ground truth & support prep
    # ------------------------------------------------------------------

    def _prepare_ground_truth(self, ds: FewShotDataset):
        ref_ann = ds._load_annotations(split="reference")  # pylint: disable=protected-access
        gt: DefaultDict[str, Dict[str, List[Sequence[int]]]] = defaultdict(dict)
        for img_path, bbox_map in ref_ann.items():
            for cls, boxes in bbox_map.items():
                gt[cls][str(img_path)] = [list(map(int, b[0] + b[1])) for b in boxes]
        return gt

    def _prepare_query_embedding(self, ds: FewShotDataset, cls: str, nshot: int):
        _, crops = ds.sample_episode(cls, nshot)
        q_inputs = self._processor(images=crops, return_tensors="pt")
        return q_inputs["pixel_values"].mean(dim=0, keepdim=True).to(self.device)

    # ------------------------------------------------------------------
    # Model inference
    # ------------------------------------------------------------------

    def _load_model(self):
        if self._model is None or self._processor is None:
            print("Loading OwlViT‑base‑patch32…")
            self._model = (
                OwlViTForObjectDetection.from_pretrained("google/owlvit-base-patch32")
                .to(self.device)
                .eval()
            )
            self._processor = OwlViTProcessor.from_pretrained("google/owlvit-base-patch32")

    def _predict_image(self, image: Image.Image, avg_q: torch.Tensor, score_thr: float, nms_thr: float):
        with torch.no_grad():
            t_in = self._processor(images=image, return_tensors="pt").to(self.device)
            out  = self._model.image_guided_detection(pixel_values=t_in["pixel_values"], query_pixel_values=avg_q)
        tgt_sz = torch.tensor([image.size[::-1]], device=self.device)
        res = self._processor.post_process_image_guided_detection(out, threshold=score_thr, nms_threshold=nms_thr, target_sizes=tgt_sz)
        return {"boxes": [list(map(int,b.tolist())) for b in res[0]["boxes"]], "scores": [float(s) for s in res[0]["scores"]]}

    # ------------------------------------------------------------------
    # Stats computation – called once per source for memory friendliness
    # ------------------------------------------------------------------

    def _compute_source_stats(self, source: str):
        # Read predictions back (because we streamed them out) → same memory as before
        pred_by_class_shot: DefaultDict[int, DefaultDict[str, List[Tuple[str, float, Sequence[int]]]]] = defaultdict(lambda: defaultdict(list))

        for nshot in self.shots:
            pred_file = self.output_dir / source / f"predictions_{nshot}shot.jsonl"
            if not pred_file.exists():
                continue
            with pred_file.open() as fh:
                for line in fh:
                    rec = json.loads(line)
                    img_id, cls = rec["image_path"], rec["class_label"]
                    pred_by_class_shot[nshot][cls].extend(
                        [(img_id, s, b) for s, b in zip(rec["scores"], rec["boxes"])]
                    )

        gt_by_class = self._gt_store[source]
        self._stats[source] = {}

        for nshot, cls_map in pred_by_class_shot.items():
            overall: DefaultDict[str, float] = defaultdict(float)
            for cls, preds in cls_map.items():
                gts = gt_by_class.get(cls, {})
                m: Dict[str, float] = {}

                # mean IoU on matched pairs
                ious = []
                for img_id, score, pbox in preds:
                    best = max((_iou(pbox, gt) for gt in gts.get(img_id, [])), default=0.0)
                    if best > 0:
                        ious.append(best)
                m["IoU"] = sum(ious) / len(ious) if ious else 0.0

                for thr in self._AP_THRESHOLDS:
                    ap, pr, rc = _ap_at_threshold(preds, gts, thr)
                    m[f"mAP@{int(thr*100):02d}"] = ap
                    if thr == 0.50:
                        m["Precision"], m["Recall"] = pr, rc

                self._stats[source].setdefault(cls, {})[str(nshot)] = m
                for k, v in m.items():
                    overall[k] += v

            if overall:
                for k in overall:
                    overall[k] /= len(gt_by_class)
                self._stats[source].setdefault("__overall__", {})[str(nshot)] = dict(overall)

    # ------------------------------------------------------------------
    # Saving stats
    # ------------------------------------------------------------------

    def _dump_stats(self):
        with (self.output_dir / "stats.json").open("w") as fh:
            json.dump(self._stats, fh, indent=2)
        print(f"Statistics saved to {self.output_dir / 'stats.json'}")
