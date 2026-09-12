#!/usr/bin/env python3
# analyze_f1_iou.py
from __future__ import annotations
import argparse, json, re, os, sys
from pathlib import Path
from collections import defaultdict, OrderedDict
from typing import Dict, List, Tuple, Sequence, Optional
import math

import matplotlib.pyplot as plt
import seaborn as sns
sns.set_theme(style="whitegrid")

from collections import Counter


import copy
import csv

import math
try:
    from scipy.optimize import linear_sum_assignment
    _HAS_SCIPY = True
except Exception:
    _HAS_SCIPY = False


# -------------------------------
# Label canonicalization (matches your pipeline)
# -------------------------------
_CANON_PATTERNS = OrderedDict([
    (r"^rbc$|red\W*blood(\W*cell)?s?$",      "Red Blood Cells"),
    (r"^wbc$|white\W*blood(\W*cell)?s?$",    "White Blood Cells"),
    (r"^plate(let)?s?$",                     "Platelets"),
    (r"^ring$",                              "Ring Cells"),
    (r"trophozoite",                         "Trophozoite Cells"),
    (r"schizont",                            "Schizont Cells"),
    (r"gametocyte",                          "Gametocyte Cells"),
    (r"leukocyte",                           "White Blood Cells"),
    (r"^round$",                             "Round Cells"),
    (r"^spindle$",                           "Spindle Cells"),
    (r"^polygonal$",                         "Polygonal Cells"),
])
def canon_label(lbl: str) -> str:
    s = lbl.lower().strip()
    for pat, tgt in _CANON_PATTERNS.items():
        if re.fullmatch(pat, s):
            return tgt
    return lbl.strip()


def linspace_inclusive(a: float, b: float, n: int) -> list[float]:
    if n <= 1:
        return [round(a, 6)]
    step = (b - a) / (n - 1)
    return [round(a + i * step, 6) for i in range(n)]

def make_dense_iou_grid(min_iou: float, max_iou: float, step_iou: float | None, num_iou: int | None) -> list[float]:
    """
    Build IoU threshold list. If `num_iou` is provided, it takes precedence and
    generates an evenly-spaced grid between [min_iou, max_iou] (inclusive).
    Otherwise use `step_iou`.
    Ensures IoU=0.50 is present if 0.50 lies in [min,max].
    """
    if num_iou and num_iou > 1:
        ths = linspace_inclusive(min_iou, max_iou, num_iou)
    else:
        # step-based fallback
        ths = []
        x = min_iou
        while x <= max_iou + 1e-9:
            ths.append(round(x, 6))
            x += (step_iou or 0.05)
    # ensure 0.50 included if range covers it
    if min_iou - 1e-9 <= 0.5 <= max_iou + 1e-9:
        ths = sorted(set(ths + [0.5]))
    return ths

def sample_curve(curve: dict[str, float], k: int) -> dict[str, float]:
    """
    Keep k evenly spaced points from the curve (by threshold order).
    Always tries to keep the endpoints and a point at 0.50 if available.
    """
    if k <= 0 or k >= len(curve):
        return dict(curve)
    keys = sorted(curve.keys(), key=lambda s: float(s))
    # ensure 0.50 key exists if very close numerically
    if any(abs(float(t) - 0.5) < 5e-4 for t in keys):
        pass
    # indices
    idxs = [round(i * (len(keys) - 1) / (k - 1)) for i in range(k)]
    keep = sorted({keys[i] for i in idxs}, key=lambda s: float(s))
    return {t: curve[t] for t in keep}



def make_image_key(p: str, mode: str = "name") -> str:
    path = str(p).replace("\\", "/")
    parts = path.split("/")
    if mode == "name":
        return parts[-1].lower()
    elif mode == "tail2":
        tail = "/".join(parts[-2:]) if len(parts) >= 2 else parts[-1]
        return tail.lower()
    else:
        return parts[-1].lower()
    

# -------------------------------
# Geometry helpers
# -------------------------------
def flatten_box(b):
    """Accept [x1,y1,x2,y2] or [[[x1,y1],[x2,y2]]] and return [x1,y1,x2,y2] as floats.
       If format is invalid, return None instead of raising.
    """
    try:
        if isinstance(b, (list, tuple)) and len(b) == 2 and all(isinstance(v, (list, tuple)) for v in b):
            # [[x1,y1],[x2,y2]]
            return [float(b[0][0]), float(b[0][1]), float(b[1][0]), float(b[1][1])]
        if isinstance(b, (list, tuple)) and len(b) == 4 and all(isinstance(v, (int,float)) for v in b):
            return [float(b[0]), float(b[1]), float(b[2]), float(b[3])]
    except Exception:
        pass
    # log and ignore bad box
    print(f"[WARN] Unrecognized box format: {b}")
    return None

def iou(a: Sequence[float], b: Sequence[float]) -> float:
    x1 = max(a[0], b[0]); y1 = max(a[1], b[1])
    x2 = min(a[2], b[2]); y2 = min(a[3], b[3])
    inter = max(0.0, x2 - x1) * max(0.0, y2 - y1)
    if inter <= 0:
        return 0.0
    area_a = max(0.0, (a[2]-a[0])) * max(0.0, (a[3]-a[1]))
    area_b = max(0.0, (b[2]-b[0])) * max(0.0, (b[3]-b[1]))
    denom = area_a + area_b - inter
    return 0.0 if denom <= 0 else inter / denom

# Greedy one-to-one matching by IoU (build all pairs >= thr, take highest IoU first)
def match_counts_for_class_image(gt_boxes: List[Sequence[float]], pred_boxes: List[Sequence[float]], thr: float):
    if not gt_boxes and not pred_boxes:
        return 0, 0, 0, []  # TP, FP, FN, matched_ious
    pairs = []
    for gi, g in enumerate(gt_boxes):
        for pi, p in enumerate(pred_boxes):
            i = iou(g, p)
            if i >= thr:
                pairs.append((i, gi, pi))
    pairs.sort(reverse=True, key=lambda t: t[0])
    matched_g = set(); matched_p = set(); matched_ious = []
    for i, gi, pi in pairs:
        if gi in matched_g or pi in matched_p:
            continue
        matched_g.add(gi); matched_p.add(pi); matched_ious.append(i)
    TP = len(matched_g)
    FP = max(0, len(pred_boxes) - len(matched_p))
    FN = max(0, len(gt_boxes) - len(matched_g))
    return TP, FP, FN, matched_ious

def match_counts_hungarian(gt_boxes, pred_boxes, thr):
    """
    One-to-one matching using Hungarian on IoU.
    Returns: TP, FP, FN, matched_ious
    """
    G, P = len(gt_boxes), len(pred_boxes)
    if G == 0 and P == 0:
        return 0, 0, 0, []
    if not _HAS_SCIPY:
        # fallback to your greedy
        print("no scipy")
        return match_counts_for_class_image(gt_boxes, pred_boxes, thr)

    # Build cost matrix (rectangular allowed). We want to maximize IoU,
    # so minimize (1 - IoU); disallow pairs < thr by BIG_M.
    BIG_M = 1e6
    cost = [[0.0]*P for _ in range(G)]
    for i, g in enumerate(gt_boxes):
        for j, p in enumerate(pred_boxes):
            iou_ij = iou(g, p)
            cost[i][j] = (1.0 - iou_ij) if iou_ij >= thr else BIG_M

    if G == 0 or P == 0:
        # trivial counts
        return 0, P, G, []

    row_ind, col_ind = linear_sum_assignment(cost)
    TP = 0; matched_ious = []
    for i, j in zip(row_ind, col_ind):
        if cost[i][j] < BIG_M:  # valid match above threshold
            TP += 1
            matched_ious.append(1.0 - cost[i][j])
    FP = P - TP
    FN = G - TP
    return TP, FP, FN, matched_ious

# -------------------------------
# IO: predictions & ground truth
# -------------------------------
PRED_FILE_RE = re.compile(r".*?(\d+)\s*shot.*\.jsonl$", re.IGNORECASE)

def read_predictions_jsonl(jsonl_path: Path) -> Dict[str, Dict[str, List[List[float]]]]:
    # ... keep canon_label, _to_box helpers as before ...
    preds_by_class_name: Dict[str, Dict[str, List[List[float]]]] = defaultdict(lambda: defaultdict(list))
    seen_keys = []

    with jsonl_path.open("r") as f:
        for lineno, line in enumerate(f, 1):
            line = line.strip()
            if not line:
                continue
            try:
                rec = json.loads(line)
            except Exception:
                continue

            img = rec.get("image_path") or rec.get("image") or rec.get("path")
            if not img:
                continue

            # First try by filename
            key = make_image_key(img, mode="name")
            seen_keys.append(key)

            preds = rec.get("predictions", [])
            # Support top-level {class_label, boxes, scores}
            lbl = rec.get("class_label") or rec.get("label") or rec.get("class")
            boxes = rec.get("boxes") or rec.get("bbox")
            if lbl and isinstance(boxes, (list, tuple)):
                for b in boxes:
                    box = flatten_box(b) if b is not None else None
                    if box is not None:
                        preds_by_class_name[canon_label(str(lbl))][key].append(box)
                continue
            if isinstance(preds, str):
                try:
                    preds = json.loads(preds)
                except Exception:
                    continue

            if isinstance(preds, dict):
                # Case A: nested under "bbox"/"boxes" => {"bbox": {"label": [boxes...]}}
                maybe_bbox = preds.get("bbox") if "bbox" in preds else preds.get("boxes")
                if isinstance(maybe_bbox, dict):
                    any_added = False
                    for raw_lbl, boxes in maybe_bbox.items():
                        lbl = canon_label(str(raw_lbl))
                        if isinstance(boxes, (list, tuple)):
                            for b in boxes:
                                box = flatten_box(b) if b is not None else None
                                if box is not None:
                                    preds_by_class_name[lbl][key].append(box)
                                    any_added = True
                    if any_added:
                        seen_keys.append(key)
                    continue  # next line

                # Case B: direct mapping => {"Platelets": [[...], ...], "RBC": [[...], ...], ...}
                any_added = False
                for raw_lbl, boxes in preds.items():
                    if not isinstance(boxes, (list, tuple)):
                        continue
                    lbl = canon_label(str(raw_lbl))
                    for b in boxes:
                        box = flatten_box(b) if b is not None else None
                        if box is not None:
                            preds_by_class_name[lbl][key].append(box)
                            any_added = True
                if any_added:
                    seen_keys.append(key)
                continue  # next line

            if isinstance(preds, list):
                for p in preds:
                    if isinstance(p, dict):
                        lbl = p.get("label") or p.get("class") or p.get("name")
                        box = p.get("box") or p.get("bbox") or p.get("b")
                        if box is None:
                            bs = p.get("box_str") or p.get("bbox_str")
                            if isinstance(bs, str):
                                try: box = json.loads(bs)
                                except Exception: box = None
                        if not (lbl and box): 
                            continue
                        box = flatten_box(box)
                        if box is None:
                            continue
                        preds_by_class_name[canon_label(str(lbl))][key].append(box)
                        continue

                    if isinstance(p, (list, tuple)):
                        if len(p) == 2:
                            a, b = p
                            box = flatten_box(a); lbl = b if isinstance(b, str) else None
                            if box is None and isinstance(b, (list, tuple)):
                                box = flatten_box(b); lbl = a if isinstance(a, str) else None
                            if box is not None and isinstance(lbl, str):
                                preds_by_class_name[canon_label(lbl)][key].append(box)
                                continue
                        if len(p) == 5 and isinstance(p[-1], str) and all(isinstance(v, (int, float)) for v in p[:4]):
                            box = flatten_box(list(p[:4]))
                            if box is not None:
                                preds_by_class_name[canon_label(p[-1])][key].append(box)
                                continue
                continue

    # Detect filename collisions; if many duplicates, advise tail2 mode
    dup_counts = Counter(seen_keys)
    collisions = [k for k, c in dup_counts.items() if c > 1]
    if collisions:
        print(f"[WARN] Filename key collisions detected in {jsonl_path.parent.name} ({len(collisions)} keys). "
              f"If metrics still look off, re-run with tail2 keying.")
    return preds_by_class_name



def find_gt_file(dataset_dir: Path, sample_image_paths: List[str], gt_root: Optional[Path]) -> Optional[Path]:
    """
    Try a few strategies:
    1) If gt_root is given: <gt_root>/<dataset>/annotation.jsonl or .../reference/<dataset>/annotation.jsonl
    2) Walk up from a sample image path, search for annotation.jsonl / annotations.jsonl for a few levels
    3) Look inside the dataset_dir itself for annotation.jsonl
    """
    candidates = []
    dataset_name = dataset_dir.name
    if gt_root:
        candidates += [
            gt_root / dataset_name / "annotation.jsonl",
            gt_root / dataset_name / "annotations.jsonl",
            gt_root / "reference" / dataset_name / "annotation.jsonl",
            gt_root / "reference" / dataset_name / "annotations.jsonl",
        ]
    # 2) Ascend from an image path
    for p in sample_image_paths[:3]:  # try a few
        cur = Path(p).resolve()
        for _ in range(5):  # up to 5 levels up
            for fname in ("annotation.jsonl", "annotations.jsonl", "annotation.json", "annotations.json"):
                cand = cur.parent / fname
                candidates.append(cand)
            cur = cur.parent
    # 3) Inside dataset dir
    for fname in ("annotation.jsonl", "annotations.jsonl", "annotation.json", "annotations.json"):
        candidates.append(dataset_dir / fname)

    for c in candidates:
        if c.exists() and c.is_file():
            return c
    return None

def read_gt_jsonl(gt_path: Path, key_mode: str = "name") -> Dict[str, Dict[str, List[List[float]]]]:
    gts_by_class_name: Dict[str, Dict[str, List[List[float]]]] = defaultdict(lambda: defaultdict(list))
    with gt_path.open("r") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                rec = json.loads(line)
            except Exception:
                continue
            img = rec.get("image_path") or rec.get("image") or rec.get("path")
            if not img:
                continue
            key = make_image_key(img, mode=key_mode)

            if "bbox" in rec and isinstance(rec["bbox"], dict):
                for raw_lbl, boxes in rec["bbox"].items():
                    lbl = canon_label(str(raw_lbl))
                    for b in boxes:
                        try:
                            gts_by_class_name[lbl][key].append(flatten_box(b))
                        except Exception:
                            continue

            if "annotations" in rec and isinstance(rec["annotations"], list):
                for a in rec["annotations"]:
                    raw_lbl = a.get("label") or a.get("class") or a.get("name") or "Unknown"
                    box = a.get("box") or a.get("bbox") or a.get("b")
                    if box is None:
                        continue
                    try:
                        gts_by_class_name[canon_label(str(raw_lbl))][key].append(flatten_box(box))
                    except Exception:
                        continue
    return gts_by_class_name


# -------------------------------
# Core analysis
# -------------------------------
def compute_dataset_metrics(
    preds_by_class_per_model_shot: Dict[str, Dict[int, Dict[str, Dict[str, List[List[float]]]]]],
    gts_by_class: Dict[str, Dict[str, List[List[float]]]],
    iou_thresholds: List[float]
):
    """
    Returns:
      metrics[model][shot] = {... as before ...}
      counts[model][shot] = {
         "per_thr": {
            "0.05": {"TP": int, "FP": int, "FN": int},
            ...
         },
         "sum_iou_tp_0.5": float,
         "n_tp_0.5": int
      }
    """
    metrics = {}
    counts = {}
    for model, shot_map in preds_by_class_per_model_shot.items():
        metrics[model] = {}
        counts[model] = {}
        for shot, preds_by_class in shot_map.items():
            f1_curve = {}
            mean_iou_tp_05_values = []
            per_thr_counts = {f"{thr:.2f}": {"TP": 0, "FP": 0, "FN": 0} for thr in iou_thresholds}

            p_05 = r_05 = f1_05 = 0.0

            for thr in iou_thresholds:
                TP = FP = FN = 0
                thr_key = f"{thr:.2f}"
                # union of classes
                for cls in set(list(gts_by_class.keys()) + list(preds_by_class.keys())):
                    g_img_map = gts_by_class.get(cls, {})
                    p_img_map = preds_by_class.get(cls, {})
                    img_keys = set(g_img_map.keys()) | set(p_img_map.keys())
                    for img in img_keys:
                        gt_boxes   = g_img_map.get(img, [])
                        pred_boxes = p_img_map.get(img, [])
                        tpc, fpc, fnc, matched_ious = match_counts_hungarian(gt_boxes, pred_boxes, thr)
                        TP += tpc; FP += fpc; FN += fnc
                        if abs(thr - 0.5) < 1e-9:
                            mean_iou_tp_05_values.extend(matched_ious)

                precision = TP / (TP + FP) if (TP + FP) > 0 else 0.0
                recall    = TP / (TP + FN) if (TP + FN) > 0 else 0.0
                f1        = (2 * precision * recall / (precision + recall)) if (precision + recall) > 0 else 0.0

                f1_curve[thr_key] = f1
                per_thr_counts[thr_key] = {"TP": TP, "FP": FP, "FN": FN}

                if abs(thr - 0.5) < 1e-9:
                    p_05, r_05, f1_05 = precision, recall, f1

            mF1 = sum(f1_curve.values()) / len(f1_curve) if f1_curve else 0.0
            mean_iou_tp_05 = (sum(mean_iou_tp_05_values) / len(mean_iou_tp_05_values)) if mean_iou_tp_05_values else 0.0

            metrics[model][shot] = {
                "mF1@[.05:.70]": mF1,
                "F1@0.5": f1_05,
                "Precision@0.5": p_05,
                "Recall@0.5": r_05,
                "MeanIoU_TP@0.5": mean_iou_tp_05,
                "F1_curve": f1_curve,
            }
            counts[model][shot] = {
                "per_thr": per_thr_counts,
                "sum_iou_tp_0.5": sum(mean_iou_tp_05_values),
                "n_tp_0.5": len(mean_iou_tp_05_values),
            }
    return metrics, counts


# -------------------------------
# Scanning prediction root
# -------------------------------
def find_models_and_shots(dataset_dir: Path):
    """
    Detect whether dataset_dir contains:
      (a) prediction files directly (single-model), or
      (b) model subdirs each containing shot-wise prediction files.
    Returns: dict: model -> { shot -> jsonl_path }
    """
    model_to_shots = {}

    # Case (a): files directly in dataset_dir
    files = list(dataset_dir.glob("*.jsonl"))
    shot_map = {}
    for f in files:
        m = PRED_FILE_RE.match(f.name)
        if m:
            shot = int(m.group(1))
            shot_map[shot] = f
    if shot_map:
        model_to_shots["default"] = shot_map

    # Case (b): subdirectories for models
    for sub in sorted([p for p in dataset_dir.iterdir() if p.is_dir()]):
        files = list(sub.glob("*.jsonl"))
        shot_map = {}
        for f in files:
            m = PRED_FILE_RE.match(f.name)
            if m:
                shot = int(m.group(1))
                shot_map[shot] = f
        if shot_map:
            model_to_shots[sub.name] = shot_map

    return model_to_shots

# -------------------------------
# Plotting
# -------------------------------
def plot_f1_iou_per_dataset(
    dataset_name: str,
    metrics: Dict[str, Dict[int, Dict]],
    out_dir: Path,
    iou_thresholds: List[float],
    model_names_hint: Optional[List[str]] = None
):
    """
    One PNG per dataset.
    Single axes: all shots are overlaid; legend shows only the shot number.
    Title includes model name(s). If metrics only contain 'default', fall back to model_names_hint.
    """
    shots = sorted({shot for model in metrics.values() for shot in model.keys()})
    if not shots:
        return

    fig, ax = plt.subplots(figsize=(7, 5))
    xs = [float(f"{t:.2f}") for t in iou_thresholds]

    # Title model list:
    metric_models = sorted(metrics.keys())
    if set(metric_models) == {"default"} and model_names_hint:
        titled_models = model_names_hint[:]  # use hint when only 'default' is present
    else:
        titled_models = [m for m in metric_models if m.lower() != "default"] or (["default"] if metric_models else [])

    # Compact if too many names
    MAX_NAMES_IN_TITLE = 4
    if len(titled_models) == 0:
        model_title_part = ""
    elif len(titled_models) <= MAX_NAMES_IN_TITLE:
        model_title_part = " — " + ", ".join(titled_models)
    else:
        model_title_part = f" — {len(titled_models)} models"

    # Plot curves; legend label by shot only
    for model_name, shot_map in metrics.items():
        for shot in shots:
            if shot not in shot_map:
                continue
            curve = shot_map[shot].get("F1_curve", {})
            ys = [curve.get(f"{t:.2f}", 0.0) for t in iou_thresholds]
            sns.lineplot(x=xs, y=ys, ax=ax, label=f"{shot}-shot", linewidth=2)

    title_name = "Overall Benchmark" if dataset_name in {"ALL_macro", "ALL_MACRO"} else dataset_name
    ax.set_title(f"{title_name}{model_title_part} — F1 vs IoU")
    ax.set_xlabel("IoU threshold")
    ax.set_ylabel("F1")
    ax.set_ylim(0, 1.0)
    ax.set_xlim(min(xs), max(xs))
    ax.margins(x=0)
    ax.grid(True, alpha=0.3)

    # Deduplicate legend entries (since multiple models share identical shot labels)
    handles, labels = ax.get_legend_handles_labels()
    from collections import OrderedDict as _OD
    by_label = _OD(zip(labels, handles))
    ax.legend(by_label.values(), by_label.keys(), loc="best", fontsize=9, ncol=1)

    fig.tight_layout()
    out_dir.mkdir(parents=True, exist_ok=True)
    png_path = out_dir / f"{dataset_name}_f1_iou.png"
    fig.savefig(png_path, dpi=200)
    plt.close(fig)
    return str(png_path)






def aggregate_macro(all_metrics: Dict[str, Dict[str, Dict[int, Dict]]], iou_thresholds: List[float]):
    """
    Equal-weight average across datasets.
    Returns: agg[model][shot] = metrics dict (same schema as per-dataset)
    """
    agg = {}
    # collect dataset list
    datasets = list(all_metrics.keys())
    for dataset in datasets:
        for model, shot_map in all_metrics[dataset].items():
            agg.setdefault(model, {})
            for shot, m in shot_map.items():
                slot = agg[model].setdefault(shot, {
                    "mF1@[.05:.70]": 0.0,
                    "F1@0.5": 0.0,
                    "Precision@0.5": 0.0,
                    "Recall@0.5": 0.0,
                    "MeanIoU_TP@0.5": 0.0,
                    "F1_curve": {f"{t:.2f}": 0.0 for t in iou_thresholds},
                    "_count": 0
                })
                slot["mF1@[.05:.70]"] += m["mF1@[.05:.70]"]
                slot["F1@0.5"]         += m["F1@0.5"]
                slot["Precision@0.5"]  += m["Precision@0.5"]
                slot["Recall@0.5"]     += m["Recall@0.5"]
                slot["MeanIoU_TP@0.5"] += m["MeanIoU_TP@0.5"]
                for k,v in m["F1_curve"].items():
                    slot["F1_curve"][k] += v
                slot["_count"] += 1

    # finalize averages
    out = {}
    for model, shot_map in agg.items():
        out[model] = {}
        for shot, m in shot_map.items():
            c = max(1, m.pop("_count"))
            out[model][shot] = {
                "mF1@[.05:.70]": m["mF1@[.05:.70]"] / c,
                "F1@0.5":        m["F1@0.5"] / c,
                "Precision@0.5": m["Precision@0.5"] / c,
                "Recall@0.5":    m["Recall@0.5"] / c,
                "MeanIoU_TP@0.5":m["MeanIoU_TP@0.5"] / c,
                "F1_curve": {k: v / c for k, v in m["F1_curve"].items()},
            }
    return out

def aggregate_micro(all_counts: Dict[str, Dict[str, Dict[int, Dict]]], iou_thresholds: List[float]):
    """
    Pooled counts across datasets → recompute P/R/F1 per threshold.
    Returns: agg[model][shot] = metrics dict (same schema as per-dataset)
    """
    agg = {}
    for dataset, d_counts in all_counts.items():
        for model, shot_map in d_counts.items():
            agg.setdefault(model, {})
            for shot, cdict in shot_map.items():
                slot = agg[model].setdefault(shot, {
                    "per_thr": {f"{t:.2f}": {"TP":0,"FP":0,"FN":0} for t in iou_thresholds},
                    "sum_iou_tp_0.5": 0.0,
                    "n_tp_0.5": 0
                })
                # sum per-threshold counts
                for thr_key, cvals in cdict["per_thr"].items():
                    slot["per_thr"][thr_key]["TP"] += cvals["TP"]
                    slot["per_thr"][thr_key]["FP"] += cvals["FP"]
                    slot["per_thr"][thr_key]["FN"] += cvals["FN"]
                # sum IoU info
                slot["sum_iou_tp_0.5"] += cdict.get("sum_iou_tp_0.5", 0.0)
                slot["n_tp_0.5"]       += cdict.get("n_tp_0.5", 0)

    # turn counts into metrics
    out = {}
    for model, shot_map in agg.items():
        out[model] = {}
        for shot, slot in shot_map.items():
            f1_curve = {}
            p_05 = r_05 = f1_05 = 0.0
            for thr in iou_thresholds:
                k = f"{thr:.2f}"
                TP = slot["per_thr"][k]["TP"]; FP = slot["per_thr"][k]["FP"]; FN = slot["per_thr"][k]["FN"]
                P = TP / (TP + FP) if (TP + FP) > 0 else 0.0
                R = TP / (TP + FN) if (TP + FN) > 0 else 0.0
                F1 = (2*P*R/(P+R)) if (P+R) > 0 else 0.0
                f1_curve[k] = F1
                if abs(thr - 0.5) < 1e-9:
                    p_05, r_05, f1_05 = P, R, F1
            mF1 = sum(f1_curve.values()) / len(f1_curve) if f1_curve else 0.0
            mean_iou_tp_05 = (slot["sum_iou_tp_0.5"] / slot["n_tp_0.5"]) if slot["n_tp_0.5"] > 0 else 0.0
            out[model][shot] = {
                "mF1@[.05:.70]": mF1,
                "F1@0.5": f1_05,
                "Precision@0.5": p_05,
                "Recall@0.5": r_05,
                "MeanIoU_TP@0.5": mean_iou_tp_05,
                "F1_curve": f1_curve,
            }
    return out


def maybe_prune_curves_inplace(metrics: dict, mode: str, k: int):
    """
    metrics: {dataset: {model: {shot: {"F1_curve": {...}, ...}}}}
    mode: 'none' -> drop F1_curve entirely
          'sampled' -> keep k points
          'all' -> keep full curve
    """
    for dataset, model_map in metrics.items():
        for model, shot_map in model_map.items():
            for shot, m in shot_map.items():
                if "F1_curve" not in m:
                    continue
                if mode == "none":
                    m.pop("F1_curve", None)
                elif mode == "sampled":
                    m["F1_curve"] = sample_curve(m["F1_curve"], k)
                elif mode == "all":
                    pass


# -------------------------------
# Main
# -------------------------------
def main():
    parser = argparse.ArgumentParser(description="Compute mF1@[.05:.70] and F1–IoU curves per dataset from shot-wise JSONL predictions.")
    parser.add_argument("--pred-root", type=Path, required=True, help="Root dir that contains DATASET directories with shot-wise prediction JSONLs.")
    parser.add_argument("--out-dir", type=Path, required=True, help="Directory to write metrics (JSON/CSV) and plots/")
    parser.add_argument("--gt-root", type=Path, default=None, help="(Optional) Root of datasets to help locate annotation.jsonl")
    parser.add_argument("--min-iou", type=float, default=0.05)
    parser.add_argument("--max-iou", type=float, default=0.70)
    parser.add_argument("--step-iou", type=float, default=0.05)
    parser.add_argument("--num-iou", type=int, default=None,
                        help="If set (e.g., 100), use this many evenly spaced IoU thresholds between [min,max].")
    parser.add_argument("--save-curve", choices=["none","sampled","all"], default="none",
                        help="Whether to save F1–IoU curve points in metrics.json. Default: none.")
    parser.add_argument("--curve-sample-k", type=int, default=11,
                        help="When --save-curve=sampled, keep this many evenly-spaced points.")
    args = parser.parse_args()

    root_model_name = args.pred_root.name

    iou_thresholds = make_dense_iou_grid(args.min_iou, args.max_iou, args.step_iou, args.num_iou)
    if not iou_thresholds:
        print("No IoU thresholds to evaluate.", file=sys.stderr); sys.exit(1)

    args.out_dir.mkdir(parents=True, exist_ok=True)
    plots_dir = args.out_dir / "plots"; plots_dir.mkdir(exist_ok=True)

    all_metrics = {}
    all_counts  = {}
    rows_csv = []

    # scan dataset directories
    dataset_dirs = [d for d in args.pred_root.iterdir() if d.is_dir()]
    if not dataset_dirs:
        print(f"No dataset directories found in {args.pred_root}", file=sys.stderr); sys.exit(1)

    for dset_dir in sorted(dataset_dirs):
        dataset = dset_dir.name
        model_shots = find_models_and_shots(dset_dir)
        if not model_shots:
            print(f"[{dataset}] No shot-wise prediction files found; skipping.", file=sys.stderr)
            continue

        # Load predictions for each (model, shot)
        preds_by_model_shot: Dict[str, Dict[int, Dict[str, Dict[str, List[List[float]]]]]] = {}
        # for GT discovery, collect some image paths from predictions
        sample_images_for_gt = []

        for model, shot_map in model_shots.items():
            preds_by_model_shot[model] = {}
            for shot, jsonl_path in sorted(shot_map.items()):
                preds_by_class = defaultdict(lambda: defaultdict(list))  # cls -> img -> [boxes]
                pb = read_predictions_jsonl(jsonl_path)
                # accumulate
                for cls, img_map in pb.items():
                    for img, boxes in img_map.items():
                        preds_by_class[cls][img].extend(boxes)
                        if len(sample_images_for_gt) < 5:
                            sample_images_for_gt.append(img)
                preds_by_model_shot[model][shot] = preds_by_class

        # Load GT
        gt_path = find_gt_file(dset_dir, sample_images_for_gt, args.gt_root)
        if not gt_path:
            print(f"[{dataset}] Could not locate ground-truth annotations (annotation.jsonl). "
                  f"Try passing --gt-root.", file=sys.stderr)
            continue
        gts_by_class = read_gt_jsonl(gt_path)

        # Compute metrics
        d_metrics, d_counts = compute_dataset_metrics(preds_by_model_shot, gts_by_class, iou_thresholds)
        all_metrics[dataset] = d_metrics
        all_counts[dataset]  = d_counts

        # ---- Benchmark-level aggregates ----
        macro_metrics  = aggregate_macro(all_metrics, iou_thresholds)
        #micro_metrics  = aggregate_micro(all_counts, iou_thresholds)

        all_metrics["_GLOBAL_MACRO_"] = macro_metrics
        #all_metrics["_GLOBAL_MICRO_"] = micro_metrics

        # Plot
        # Per-dataset plot
        model_names_hint = [root_model_name] if set(d_metrics.keys()) == {"default"} else None
        png_path = plot_f1_iou_per_dataset(dataset, d_metrics, plots_dir, iou_thresholds, model_names_hint=model_names_hint)

        # Overall (macro) plot
        macro_model_names_hint = [root_model_name] if set(aggregate_macro(all_metrics, iou_thresholds).keys()) == {"default"} else None
        plot_f1_iou_per_dataset("ALL_macro", aggregate_macro(all_metrics, iou_thresholds), plots_dir, iou_thresholds, model_names_hint=macro_model_names_hint)
        #plot_f1_iou_per_dataset("ALL_micro", micro_metrics, plots_dir, iou_thresholds)

        # Flatten for CSV
        for model, shot_map in d_metrics.items():
            for shot, m in shot_map.items():
                rows_csv.append({
                    "dataset": dataset,
                    "model": model,
                    "shot": shot,
                    "mF1@[.05:.70]": round(m["mF1@[.05:.70]"], 6),
                    "F1@0.5": round(m["F1@0.5"], 6),
                    "Precision@0.5": round(m["Precision@0.5"], 6),
                    "Recall@0.5": round(m["Recall@0.5"], 6),
                    "MeanIoU_TP@0.5": round(m["MeanIoU_TP@0.5"], 6),
                    "plot_png": png_path,
                })

        # Optionally: write CSV rows for macro/micro
        '''
        for label, agg in [("__macro__", macro_metrics), ("__micro__", micro_metrics)]:
            for model, shot_map in agg.items():
                for shot, m in shot_map.items():
                    rows_csv.append({
                        "dataset": label,
                        "model": model,
                        "shot": shot,
                        "mF1@[.05:.70]": round(m["mF1@[.05:.70]"], 6),
                        "F1@0.5": round(m["F1@0.5"], 6),
                        "Precision@0.5": round(m["Precision@0.5"], 6),
                        "Recall@0.5": round(m["Recall@0.5"], 6),
                        "MeanIoU_TP@0.5": round(m["MeanIoU_TP@0.5"], 6),
                        "plot_png": "",  # no global plot by default
                        "plot_jpg": "",
                    })
        '''

    # Write JSON
    (args.out_dir / "metrics.json").write_text(json.dumps(all_metrics, indent=2))

    # Write CSV
    if rows_csv:
        csv_path = args.out_dir / "metrics.csv"
        cols = ["dataset", "model", "shot", "mF1@[.05:.70]", "F1@0.5", "Precision@0.5", "Recall@0.5", "MeanIoU_TP@0.5", "plot_png"]
        with csv_path.open("w") as f:
            f.write(",".join(cols) + "\n")
            for r in rows_csv:
                f.write(",".join(str(r[c]) for c in cols) + "\n")
        print(f"Wrote:\n- {args.out_dir/'metrics.json'}\n- {csv_path}\n- {args.out_dir/'plots'}")

def frange(start: float, stop: float, step: float) -> List[float]:
    vals = []
    x = start
    # guard against floating step drift
    while x <= stop + 1e-9:
        vals.append(round(x, 4))
        x += step
    return vals

if __name__ == "__main__":
    main()
