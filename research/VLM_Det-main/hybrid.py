from __future__ import annotations

"""Hybrid (SAM‑RPN + VLM classifier) detection pipeline with OwL‑ViT‑style
outputs.  Reuses the existing *hybrid* modules but wraps them in a driver class
that produces •streamed JSONL predictions, •overlay PNGs, and •a full metrics
report (IoU, mAP@10/25/50, Precision & Recall) per dataset source / class /
shot, plus global averages.

Usage example
-------------
```python
from pathlib import Path
from hybrid_detector import HybridDetector

rpn_cfg = {
    "NIH-3T3": {"top_n": 40, "padding": 8},   # override SAM params for NIH
    "RatC6":   {"top_n": 25},                 # only change one param
}

hd = HybridDetector(
    dataset_root = Path("./dataset"),
    output_dir   = Path("./hybrid_results"),
    shots        = (1, 3, 6),
    sources      = ["NIH-3T3", "RatC6"],
    rpn_cfg      = rpn_cfg,
)

hd.run()
```
"""

import re
from pathlib import Path
from typing import DefaultDict, Dict, List, Sequence, Tuple, Optional, Any
from collections import defaultdict
import json
import random
import os

import torch
from tqdm.auto import tqdm
from PIL import Image
import cv2

# ---- local hybrid modules ----------------------------------------------------
from dataloaders.hybrid import HybridDataLoader
from src.hybrid import RPN, Classifier
import config.hybrid as hybrid_cfg
from utils import plot_rpn_bbox

_CANON = {
    r"^rbc$|red\W*blood(\W*cell)?s?$":      "Red Blood Cells",
    r"^wbc$|white\W*blood(\W*cell)?s?$":    "White Blood Cells",
    r"^plate(let)?s?$":                     "Platelets",
    r"^ring$":                              "Ring Cells",
    r"trophozoite":                         "Trophozoite Cells",
    r"schizont":                            "Schizont Cells",
    r"gametocyte":                          "Gametocyte Cells",
    r"leukocyte":                           "White Blood Cells",
    r"^round$":                             "Round Cells",
    r"^spindle$":                           "Spindle Cells",
    r"^polygonal$":                         "Polygonal Cells",
}
def _canon(lbl: str) -> str:
    s = lbl.lower().strip()
    for pat, tgt in _CANON.items():
        if re.fullmatch(pat, s):
            return tgt
    return lbl.strip()

# -----------------------------------------------------------------------------
# Metric helpers (IoU + AP) — identical to earlier detector
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


def _ap_at_threshold(preds, gts, thr):
    """mAP, precision, recall at IoU *thr* for one class."""
    preds = sorted(preds, key=lambda t: t[1], reverse=True)  # sort by score desc
    tp, fp = [], []
    matched = {img: [False] * len(bx) for img, bx in gts.items()}
    for img_id, score, pbox in preds:
        best_iou, best_idx = 0.0, -1
        for idx, gbox in enumerate(gts.get(img_id, [])):
            i = _iou(pbox, gbox)
            if i > best_iou:
                best_iou, best_idx = i, idx
        if best_iou >= thr and not (best_idx == -1 or matched[img_id][best_idx]):
            tp.append(1)
            fp.append(0)
            matched[img_id][best_idx] = True
        else:
            tp.append(0)
            fp.append(1)
    if not tp:
        return 0.0, 0.0, 0.0
    tp_c = torch.tensor(tp).cumsum(0).numpy()
    fp_c = torch.tensor(fp).cumsum(0).numpy()
    recalls = tp_c / max(1, sum(len(v) for v in gts.values()))
    precisions = tp_c / (tp_c + fp_c + 1e-12)
    ap = 0.0
    for t in [i / 10 for i in range(11)]:
        p = precisions[recalls >= t].max() if (recalls >= t).any() else 0.0
        ap += p
    ap /= 11.0
    f1 = 2 * precisions * recalls / (precisions + recalls + 1e-12)
    best = f1.argmax() if len(f1) else 0
    return float(ap), float(precisions[best]), float(recalls[best])

# -----------------------------------------------------------------------------
# HybridDetector class
# -----------------------------------------------------------------------------

class HybridDetector:
    """Wrapper that runs SAM‑based RPN + VLM classifier over the dataset.

    Parameters
    ----------
    dataset_root : Path        – directory containing <source>/images & annotation.jsonl
    output_dir   : Path        – where predictions / overlays / stats are saved
    sources      : list[str]   – subset of {NIH-3T3, RatC6, malaria, BCCD}; default all
    shots        : Sequence[int] – per‑class example counts to evaluate (default 1/3/6)
    rpn_cfg      : Dict[str, Dict] – per‑source overrides for RPN kwargs (top_n, padding, …)
    seed         : int         – RNG seed for deterministic sampling
    save_overlays: bool        – write PNGs with predicted boxes
    """

    _AP_THS = (0.10, 0.25, 0.50)

    def __init__(
        self,
        dataset_root: Path,
        output_dir: Path,
        *,
        sources: Optional[Sequence[str]] = None,
        shots: Sequence[int] = (1, 3, 6),
        max_images: int | None = None,
        rpn_cfg: Optional[Dict[str, Dict[str, Any]]] = None,
        seed: int = 42,
        save_overlays: bool = True,
        use_precomputed_boxes: bool = False, 
        precomputed_box_dir: str = None,
    ) -> None:
        self.dataset_root = Path(dataset_root)
        self.output_dir = Path(output_dir); self.output_dir.mkdir(parents=True, exist_ok=True)
        self.sources = list(sources) if sources is not None else ["NIH-3T3", "RatC6", "malaria", "BCCD"]
        self.shots = list(shots)
        self.max_images = max_images
        self.rpn_cfg = rpn_cfg or {}
        self.rng = random.Random(seed)
        self.save_overlays = save_overlays
        self.sam_cache = Path(precomputed_box_dir) if use_precomputed_boxes else None

        # storage for GT and stats
        self._gt_store: Dict[str, Dict[str, Dict[str, List[List[int]]]]] = {}
        self._stats: Dict[str, Any] = {}

        # prompt map (re‑use from original HybridDetection)
        self._prompt_map = {
            "NIH-3T3": hybrid_cfg.prompts.CELL_CLASSIFICATION_NIH,
            "RatC6":   hybrid_cfg.prompts.CELL_CLASSIFICATION_RATC6,
            "malaria": hybrid_cfg.prompts.CELL_CLASSIFICATION_MALARIA,
            "BCCD":    hybrid_cfg.prompts.CELL_CLASSIFICATION_BCCD,
        }

    # ------------------------------------------------------------------
    def run(self) -> None:
        for source in tqdm(self.sources, desc="Sources"):
            dl = HybridDataLoader(root=self.dataset_root, source=_alias(source))
            class_names = dl.get_class_names()
            gt_by_class = _collect_gts(dl)  # {cls: {img: [box,…]}}
            self._gt_store[source] = gt_by_class

            # build an RPN+Classifier pair per source (reuse across shots)
            rpn_kwargs = self.rpn_cfg.get(source, {})
            rpn = RPN(preload_dir=self.sam_cache, **rpn_kwargs)
            clf = Classifier()  # uses config.hybrid inside
            prompt = self._prompt_map[source]

            for nshot in self.shots:
                pred_file = self._open_jsonl(source, nshot)
                if self.save_overlays:
                    ov_root = self.output_dir / source / "overlays" / f"{nshot}shot"; ov_root.mkdir(parents=True, exist_ok=True)

                preds_by_class: DefaultDict[str, List[Tuple[str, float, List[int]]]] = defaultdict(list)
                skipped_imgs: set[str] = set()

                total_imgs = len(dl) if self.max_images is None else min(self.max_images, len(dl))
                
                for idx, (img, ann, extras) in tqdm(enumerate(dl.generator(extra_N=hybrid_cfg.config.support_images)), total=total_imgs, leave=False, desc=f"{source}-{nshot}shot"):
                    try:
                        if self.max_images is not None and idx >= self.max_images:
                            break
                        rel_path = dl.ref_annots[idx]["image_path"]
                        img_id   = Path(rel_path).stem
                        # few‑shot override
                        old_shot = clf.cfg.shot
                        clf.cfg.shot = nshot

                        cache_key = f"{source}/{img_id}"   # <== NEW
                        bboxes = rpn.propose(img, img_rel_path = cache_key)
                        results = clf.classify_regions(img, bboxes, prompt, extras=extras, allowed_classes=class_names)
                        # classify_regions returns [(bbox,label)] – no score; we fake score=1.0
                        # convert bbox to [x1,y1,x2,y2]
                        pred_recs = []
                        for bbox, label in results:
                            if isinstance(bbox[0], (list, tuple)):
                                # in case bbox is [[[x1,y1],[x2,y2]]]
                                x1, y1, x2, y2 = bbox[0][0], bbox[0][1], bbox[1][0], bbox[1][1]
                                flat = [x1, y1, x2, y2]
                            else:
                                flat = bbox
                            pred_recs.append((flat, label))

                        # restore shot
                        clf.cfg.shot = old_shot

                        img_path = dl.annotations[idx]["image_path"]
                        abs_img_path = str(self.dataset_root / "reference" / _alias(source) / img_path)

                        # append JSONL
                        pred_json = {
                                "image_path": abs_img_path,
                                "predictions": [
                                    {"box": p[0], "label": p[1], "score": 1.0}
                                    for p in pred_recs
                                ],
                            }
                        pred_file.write(json.dumps(pred_json) + "\n")
                        pred_file.flush()

                        # collect for metrics
                        for box, label in pred_recs:
                            preds_by_class[_canon(label)].append((abs_img_path, 1.0, box))  # fake score

                        # overlay
                        if self.save_overlays and pred_recs:
                            ov_path = ov_root / Path(abs_img_path).name
                            plot_rpn_bbox(img, [p[0] for p in pred_recs], str(ov_path), labels=[p[1] for p in pred_recs])
                    except Exception as e:
                        # Log and continue to next sample
                        print(f"[{source}] Skipped image {img_id} ({e})")
                        # make sure shot override doesn’t leak
                        clf.cfg.shot = old_shot
                        skipped_imgs.add(img_id)
                        continue

                pred_file.close()
                # compute stats for this shot
                shot_stats = _compute_metrics(
                    preds_by_class, gt_by_class,
                    self._AP_THS, nshot,
                    skip_ids=skipped_imgs,
                )

                self._stats.setdefault(source, {})
                for cls, metrics in shot_stats.items():
                    self._stats[source].setdefault(cls, {}).update(metrics)

        # ---------------- GLOBAL macro across ALL classes ----------------
        global_sum   = defaultdict(lambda: defaultdict(float))  # shot -> metric -> Σ
        global_count = defaultdict(int)                         # shot -> class-count

        for src in self.sources:
            for cls, v in self._stats.get(src, {}).items():
                if cls == "__overall__":
                    continue
                for shot, met in v.items():
                    for k, val in met.items():
                        global_sum[shot][k] += val
                    global_count[shot] += 1

        self._stats["GLOBAL"] = {
            shot: {k: v / max(1, global_count[shot]) for k, v in m.items()}
            for shot, m in global_sum.items()
        }

        # ---------------- final write ----------------
        out_path = self.output_dir / "stat.json"
        json.dump(self._stats, out_path.open("w"), indent=2)
        print(f"Overall_stat.json written to {out_path}")

    # ------------------------------------------------------------------
    # IO helpers
    def _open_jsonl(self, source: str, nshot: int):
        out_dir = self.output_dir / source; out_dir.mkdir(exist_ok=True)
        return (out_dir / f"predictions_{nshot}shot.jsonl").open("a")

# -----------------------------------------------------------------------------
# Helper functions outside the class
# -----------------------------------------------------------------------------

def _alias(source: str) -> str:
    """Map canonical source to HybridDataLoader shorthand (NIH-3T3 → NIH)."""
    m = {"NIH-3T3": "NIH-3T3", "RatC6": "RatC6", "malaria": "malaria", "BCCD": "BCCD"}
    return m[source]


def _collect_gts(dl: HybridDataLoader):
    gt: DefaultDict[str, Dict[str, List[List[int]]]] = defaultdict(lambda: defaultdict(list))
    for rec in dl.annotations:
        img_abs = str(Path(dl.dataset_path) / rec["image_path"])
        for cls, boxes in rec["bbox"].items():
            for box in boxes:
                x1, y1, x2, y2 = box[0][0], box[0][1], box[1][0], box[1][1]
                gt[cls][img_abs].append([x1, y1, x2, y2])
    return gt


def _compute_metrics(
    preds_by_class: Dict[str, List[Tuple[str, float, List[int]]]],
    gt_by_class:    Dict[str, Dict[str, List[List[int]]]],
    ap_ths:         Sequence[float],
    nshot:          int,
    *,
    skip_ids: set[str] | None = None,
) -> Dict[str, Dict[str, Dict[str, float]]]:

    skip_ids = skip_ids or set()
    stats: Dict[str, Dict[str, Dict[str, float]]] = {}
    overall_acc = defaultdict(float)

    # work on the **union** of classes so missing-prediction classes get 0s
    for cls in gt_by_class.keys() | preds_by_class.keys():
        # 1) filter GT & prediction dictionaries
        gts   = {img: boxes for img, boxes in gt_by_class.get(cls, {}).items()
                 if img not in skip_ids}
        preds = [p for p in preds_by_class.get(cls, [])
                 if p[0] not in skip_ids]

        # 2) mean IoU over matched dets
        ious = []
        for img_id, _, pbox in preds:
            best = max((_iou(pbox, g) for g in gts.get(img_id, [])), default=0.)
            if best > 0:
                ious.append(best)
        cls_metrics = {"IoU": sum(ious)/len(ious) if ious else 0.0}

        # 3) AP / Precision / Recall for each IoU threshold
        for thr in ap_ths:
            ap, pr, rc = _ap_at_threshold(preds, gts, thr)
            cls_metrics[f"mAP@{int(thr*100):02d}"] = ap
            if thr == 0.50:
                cls_metrics["Precision"], cls_metrics["Recall"] = pr, rc

        stats.setdefault(cls, {})[str(nshot)] = cls_metrics
        for k, v in cls_metrics.items():
            overall_acc[k] += v

    # 4) macro across classes
    n_cls = max(1, len(stats))
    overall = {k: v / n_cls for k, v in overall_acc.items()}
    stats.setdefault("__overall__", {})[str(nshot)] = overall
    return stats


"""
For running the Qwen and Gemma model, `src.hybrid.py`->`Classifier` Class needs to be changed. Support to running the huggingface models need be provided,
currently only api calls are happening for classification. If the model type is of qwen or gemma, the api-call scripts will not be run, but new scripts which runs the inference locally
will be run.
"""