from __future__ import annotations

#!/usr/bin/env python3
"""
Experiment 2 – Direct VLM Detection
==================================
Runs an end‑to‑end detection benchmark in which a vision‑language model
receives the *entire* image together with a dataset‑specific prompt and
returns bounding boxes + class labels directly, without an external RPN.

• Prompts, model settings, and other hyper‑params live in *config/exp2.py*
• Supported VLM back‑ends: GPT (OpenAI) or Gemini (Google).
• Results:
    ├── <output_dir>/<source>.jsonl        – streamed predictions
    ├── <output_dir>/overlays/<src>/*.png  – optional overlay images
    └── <output_dir>/stat.json             – per‑class & global metrics

Example
-------
python exp2.py /data/FSOD/dataset_53_v1 \
       --output_dir results/exp2_detection \
       --sources BCCD malaria
"""


import ast
import base64
import io
import re
import json
import os
import random
from collections import defaultdict
from pathlib import Path
from typing import Any, DefaultDict, Dict, List, Sequence, Tuple

import cv2
import numpy as np
from PIL import Image
from tqdm.auto import tqdm

from dataloaders.hybrid import HybridDataLoader
from utils import plot_rpn_bbox  # reused for pretty overlays

from config import exp2 as cfg
from read_keys import read_keys

from pathlib import Path
from typing import Sequence

# ----------------------------------------------------------------------------
# Select VLM backend ----------------------------------------------------------
# ----------------------------------------------------------------------------
if cfg.config.model_type == "gpt":
    from api.gpt_exp2 import GPTAPI as _VLM_API
elif cfg.config.model_type == "gemini":
    from api.gemini_exp2 import GeminiAPI as _VLM_API
elif cfg.config.model_type == "anthropic":
    from api.anthropic_exp2 import AnthropicAPI as _VLM_API
else:
    raise ValueError(f"Unsupported model_type: {cfg.config.model_type}")


# ─── canonical label mapping ──────────────────────
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


# ----------------------------------------------------------------------------
# Helper functions -----------------------------------------------------------
# ----------------------------------------------------------------------------

def _encode_jpeg(img: np.ndarray) -> str:
    """BGR → Base64‑encoded JPEG string."""
    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    pil_img = Image.fromarray(img_rgb)
    buf = io.BytesIO()
    pil_img.save(buf, format="JPEG", quality=95)
    return base64.b64encode(buf.getvalue()).decode("utf-8")


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
    preds = sorted(preds, key=lambda t: t[1], reverse=True)  # score desc
    tp, fp = [], []
    matched = {img: [False] * len(bx) for img, bx in gts.items()}
    for img_id, score, pbox in preds:
        best_iou, best_idx = 0.0, -1
        for idx, gbox in enumerate(gts.get(img_id, [])):
            i = _iou(pbox, gbox)
            if i > best_iou:
                best_iou, best_idx = i, idx
        if best_iou >= thr and not (best_idx == -1 or matched[img_id][best_idx]):
            tp.append(1); fp.append(0); matched[img_id][best_idx] = True
        else:
            tp.append(0); fp.append(1)
    if not tp:
        return 0.0, 0.0, 0.0
    tp_c = np.cumsum(tp); fp_c = np.cumsum(fp)
    recalls = tp_c / max(1, sum(len(v) for v in gts.values()))
    precisions = tp_c / (tp_c + fp_c + 1e-12)
    ap = sum(max(precisions[recalls >= t], default=0.0) for t in [i/10 for i in range(11)]) / 11
    f1 = 2*precisions*recalls / (precisions + recalls + 1e-12)
    best = f1.argmax() if len(f1) else 0
    return float(ap), float(precisions[best]), float(recalls[best])


def _compute_metrics(preds_by_class: Dict[str, List[Tuple[str,float,List[int]]]],
                     gt_by_class: Dict[str, Dict[str, List[List[int]]]],
                     ap_ths=(0.10, 0.25, 0.50)) -> Dict[str, Dict[str, float]]:
    stats: Dict[str, Dict[str, float]] = {}
    overall_acc = defaultdict(float)
    for cls in gt_by_class.keys() | preds_by_class.keys():
        gts   = gt_by_class.get(cls, {})
        preds = preds_by_class.get(cls, [])
        ious = [max((_iou(p, g) for g in gts.get(img, [])), default=0.)
                 for img, _, p in preds if gts]
        cls_stats = {"IoU": sum(ious)/len(ious) if ious else 0.0}
        for thr in ap_ths:
            ap, pr, rc = _ap_at_threshold(preds, gts, thr)
            cls_stats[f"mAP@{int(thr*100):02d}"] = ap
            if thr == 0.50:
                cls_stats["Precision"], cls_stats["Recall"] = pr, rc
        stats[cls] = cls_stats
        for k, v in cls_stats.items():
            overall_acc[k] += v
    n_cls = max(1, len(stats))
    stats["__overall__"] = {k: v/n_cls for k,v in overall_acc.items()}
    return stats

# ---------------------- few‑shot example builder ---------------------------

def _build_example_pairs(extras: List[Tuple[np.ndarray, Any]], shots: int) -> List[Tuple[str,str]]:
    """Convert *extras* into (base64_image, json_bbox_dict) tuples.

    Parameters
    ----------
    extras : list[(img, annotations)] as provided by `HybridDataLoader`.
        • *img*  – numpy BGR image
        • *annotations* – either a list[(bbox,label)] **or** a dict{label:[bbox,…]}
          Bounding boxes may be [[x1,y1],[x2,y2]] or flattened.
    shots : int
        How many support images to use. If 0 → returns empty list.
    """
    if shots <= 0 or not extras:
        return []

    rng = random.Random(0)  # deterministic across calls
    rng.shuffle(extras)

    pairs: List[Tuple[str,str]] = []
    for img, ann in extras:
        if len(pairs) == shots:
            break
        img_b64 = _encode_jpeg(img)

        bbox_dict: Dict[str,List[List[int]]] = defaultdict(list)
        # unify annotation structure -----------------------------------
        if isinstance(ann, dict):
            # ann[cls] = list[[[x1,y1],[x2,y2]], …]
            for cls, boxes in ann.items():
                for b in boxes:
                    if isinstance(b[0], (list,tuple)):
                        x1,y1=b[0]; x2,y2=b[1]
                    else:
                        x1,y1,x2,y2=b
                    bbox_dict[cls].append([int(x1),int(y1),int(x2),int(y2)])
        else:  # list of (bbox,label)
            for bbox,label in ann:
                if isinstance(bbox[0], (list,tuple)):
                    x1,y1=bbox[0]; x2,y2=bbox[1]
                else:
                    x1,y1,x2,y2=bbox
                bbox_dict[label].append([int(x1),int(y1),int(x2),int(y2)])

        pairs.append((img_b64, json.dumps(bbox_dict, separators=(",",":"))))
    return pairs


def _pairs_to_parts(pairs: List[Tuple[str,str]], model_type: str) -> List[Dict[str,Any]]:
    """Transform `(b64, json)` tuples into *parts* list suitable for the chosen API."""
    if not pairs:
        return []
    parts: List[Dict[str,Any]] = []
    if model_type == "gpt":
        for img_b64, bbox_json in pairs:
            parts.append({"type":"image_url","image_url":{"url":f"data:image/jpeg;base64,{img_b64}","detail":"high"}})
            parts.append({"type":"text","text":bbox_json})
    elif model_type == "gemini":
        for img_b64, bbox_json in pairs:
            parts.append({"inline_data":{"mime_type":"image/jpeg","data":img_b64}})
            parts.append({"text":bbox_json})
    else:
        raise ValueError(model_type)
    return parts


def _collect_gts(dl: HybridDataLoader):
    gt: DefaultDict[str, Dict[str, List[List[int]]]] = defaultdict(lambda: defaultdict(list))
    for rec in dl.annotations:
        img_abs = str(Path(dl.dataset_path)/ rec["image_path"])
        for cls, boxes in rec["bbox"].items():
            for box in boxes:
                x1, y1, x2, y2 = box[0][0], box[0][1], box[1][0], box[1][1]
                gt[cls][img_abs].append([x1,y1,x2,y2])
    return gt

# ----------------------------------------------------------------------------
# Core experiment loop -------------------------------------------------------
# ----------------------------------------------------------------------------

def exp2(
    dataset_root: Path,
    output_dir: Path,
    sources: Sequence[str],
    *,
    shots: Sequence[int] | None = None,   # list / tuple of K values
    max_images: int | None = None,
    seed: int = 42,
) -> None:
    """Direct-VLM detection with HybridDetector-style I/O."""

    # ── setup ──────────────────────────────────────────────────────────
    read_keys()
    random.seed(seed)
    shots = list(shots) if shots is not None else [cfg.config.shot]

    if cfg.config.model_type == "gpt":
        api_key = os.environ["OPENAI_API_KEY"]
    elif cfg.config.model_type == "gemini":
        api_key = os.environ["GOOGLE_API_KEY"]
    elif cfg.config.model_type == "together":
        api_key = os.environ["TOGETHER_API_KEY"]
    elif cfg.config.model_type == "anthropic":
        api_key = os.environ["ANTHROPIC_API_KEY"]
        
    api = _VLM_API(
        api_key,
        cfg.config.vlm,
        temperature=cfg.config.temperature,
        p_factor=cfg.config.p_factor,
        thinking_budget= cfg.config.thinking_budget
    )

    stats_store: Dict[str, Any] = {}       # {source → class → shot → metrics}

    # ── per-source loop ────────────────────────────────────────────────
    for src in tqdm(sources, desc="Sources"):
        dl = HybridDataLoader(root=dataset_root, source=src)
        gt_by_cls = _collect_gts(dl)              # ground truth boxes
        prompt = cfg.prompts.MAP[src]             # detection prompt
        src_dir = output_dir / src                # e.g. …/BCCD/
        src_dir.mkdir(parents=True, exist_ok=True)
        stats_store[src] = {}

        # ── per-shot loop ──────────────────────────────────────────────
        for k in shots:
            preds_by_cls: DefaultDict[str, list] = defaultdict(list)

            pred_path = (src_dir / f"predictions_{k}shot.jsonl").open("w")
            ov_root = None
            if cfg.config.save_overlays:
                ov_root = src_dir / "overlays" / f"{k}shot"
                ov_root.mkdir(parents=True, exist_ok=True)

            # ── iterate over dataset images ────────────────────────────
            for idx, (img, ann, extras) in tqdm(
                enumerate(dl), total=len(dl), leave=False,
                desc=f"{src}-{k}shot"
            ):
                if max_images and idx >= max_images:
                    break

                rel = dl.ref_annots[idx]["image_path"]
                img_id = Path(rel).stem
                abs_img = str(dataset_root / "reference" / src / rel)

                inputs = {"prompt": prompt, "image": _encode_jpeg(img)}
                parts = _pairs_to_parts(
                    _build_example_pairs(extras, k) if extras else [],
                    cfg.config.model_type,
                )

                try:
                    resp = api.detect_objects(inputs, examples=parts)
                    det = ast.literal_eval(resp)
                except Exception as e:
                    print(f"[{src}] {img_id} error: {e}")
                    det = {}

                # stream prediction record
                pred_path.write(
                    json.dumps({"image_path": abs_img, "predictions": det}) + "\n"
                )

                # collect for metrics / overlays
                flats, lbls = [], []
                for cls, boxes in det.items():
                    canon = _canon(cls)  # canonicalise label
                    for bx in boxes:
                        try:
                            # Only accept boxes that are exactly 4 numbers
                            if isinstance(bx, (list, tuple)) and len(bx) == 4:
                                cleaned = [int(v) for v in bx]
                                preds_by_cls[canon].append((abs_img, 1.0, cleaned))
                                flats.append(cleaned)
                                lbls.append(canon)
                            else:
                                print(f"[{src}] Skipped malformed box {bx}")
                        except Exception as e:
                            print(f"[{src}] Error processing box {bx}: {e}")

                if flats and ov_root:
                    plot_rpn_bbox(
                        img, flats,
                        str(ov_root / f"{img_id}.png"),
                        labels=lbls,
                    )

            pred_path.close()

            # compute metrics for this shot
            shot_metrics = _compute_metrics(preds_by_cls, gt_by_cls)
            for cls, m in shot_metrics.items():
                stats_store[src].setdefault(cls, {})[str(k)] = m

    # ── global macro across sources ─────────────────────────────────────
    glob_sum = defaultdict(lambda: defaultdict(float))
    glob_n = defaultdict(int)

    for src in stats_store:
        for cls, v in stats_store[src].items():
            if cls == "__overall__":
                continue
            for kshot, met in v.items():
                for mk, val in met.items():
                    glob_sum[kshot][mk] += val
                glob_n[kshot] += 1

    stats_store["GLOBAL"] = {
        kshot: {mk: val / max(1, glob_n[kshot]) for mk, val in met.items()}
        for kshot, met in glob_sum.items()
    }

    # ── final write ────────────────────────────────────────────────────
    json.dump(stats_store, (output_dir / "stat.json").open("w"), indent=2)
    print(f"[exp2] ✔ Results + stats written under {output_dir}")


def exp2_multi(
    *,
    dataset_root: Path,
    output_dir: Path = Path("./results/exp2_results"),
    sources: Sequence[str] = ("BCCD", "malaria"),
    shots: Sequence[int] | None = None,
    max_images: int | None = None,
):
    """Programmatic wrapper – avoids CLI parsing."""
    exp2(
        dataset_root=dataset_root,
        output_dir=output_dir,
        sources=sources,
        shots=shots,
        max_images=max_images,
    )