"""
Benchmark Metrics
=================
Pure-function metric computations for research evaluation.

IoU Threshold
-------------
The standard matching threshold is 0.50 (COCO AP@0.50 convention).
This value is fixed for every experiment and never modified between runs.
It is recorded in experiment metadata for full reproducibility.

mF1 Definition
--------------
Macro-averaged F1 across all cell classes present in the ground-truth annotations
of the evaluated experiment. For each class c:

    precision_c = TP_c / (TP_c + FP_c)  if (TP_c + FP_c) > 0 else 0
    recall_c    = TP_c / (TP_c + FN_c)  if (TP_c + FN_c) > 0 else 0
    f1_c        = 2 * precision_c * recall_c / (precision_c + recall_c)
               if (precision_c + recall_c) > 0 else 0

    mF1 = mean(f1_c for all classes c that appear in the ground truth)

If no classes appear in the ground truth, mF1 = 0.0.
"""

from typing import Any, Dict, List, Optional, Tuple


# ---------------------------------------------------------------------------
# IoU Computation
# ---------------------------------------------------------------------------

def compute_iou(box_a: List[int], box_b: List[int]) -> float:
    """
    Compute Intersection over Union between two axis-aligned bounding boxes.

    Both boxes must be in [x1, y1, x2, y2] format (top-left, bottom-right).
    Returns a float in [0.0, 1.0]. Returns 0.0 if either box is degenerate.

    Args:
        box_a: [x1, y1, x2, y2]
        box_b: [x1, y1, x2, y2]
    """
    ax1, ay1, ax2, ay2 = box_a
    bx1, by1, bx2, by2 = box_b

    # Degenerate box check
    if ax2 <= ax1 or ay2 <= ay1 or bx2 <= bx1 or by2 <= by1:
        return 0.0

    # Intersection
    ix1 = max(ax1, bx1)
    iy1 = max(ay1, by1)
    ix2 = min(ax2, bx2)
    iy2 = min(ay2, by2)

    if ix2 <= ix1 or iy2 <= iy1:
        return 0.0

    inter = (ix2 - ix1) * (iy2 - iy1)
    area_a = (ax2 - ax1) * (ay2 - ay1)
    area_b = (bx2 - bx1) * (by2 - by1)
    union = area_a + area_b - inter

    if union <= 0:
        return 0.0

    return float(inter) / float(union)


# ---------------------------------------------------------------------------
# Box Matching
# ---------------------------------------------------------------------------

def match_predictions_to_gt(
    predictions: List[Dict],
    ground_truth: List[Dict],
    iou_threshold: float = 0.50,
) -> Tuple[List[Tuple[int, int]], List[int], List[int]]:
    """
    Greedily match predicted detections to ground-truth annotations.

    Each prediction and GT box must be a dict with:
        {"label": str, "bbox": [x1, y1, x2, y2]}

    Matching rules:
    - A prediction can only be matched to a GT of the same class.
    - IoU between matched boxes must exceed `iou_threshold`.
    - Each GT box and each prediction box is matched at most once.
    - Greedy: sort all candidate pairs by IoU descending, assign best first.

    Returns:
        matches      : List of (pred_idx, gt_idx) matched pairs
        unmatched_preds : List of unmatched prediction indices (False Positives)
        unmatched_gts   : List of unmatched GT indices (False Negatives)
    """
    if not predictions or not ground_truth:
        return [], list(range(len(predictions))), list(range(len(ground_truth)))

    # Compute all valid same-class IoU pairs
    candidates: List[Tuple[float, int, int]] = []
    for pi, pred in enumerate(predictions):
        for gi, gt in enumerate(ground_truth):
            if pred["label"] == gt["label"]:
                iou = compute_iou(pred["bbox"], gt["bbox"])
                if iou >= iou_threshold:
                    candidates.append((iou, pi, gi))

    # Sort descending by IoU — best matches first
    candidates.sort(key=lambda x: x[0], reverse=True)

    matched_preds: set = set()
    matched_gts: set = set()
    matches: List[Tuple[int, int]] = []

    for iou_val, pi, gi in candidates:
        if pi not in matched_preds and gi not in matched_gts:
            matches.append((pi, gi))
            matched_preds.add(pi)
            matched_gts.add(gi)

    unmatched_preds = [i for i in range(len(predictions)) if i not in matched_preds]
    unmatched_gts = [i for i in range(len(ground_truth)) if i not in matched_gts]

    return matches, unmatched_preds, unmatched_gts


# ---------------------------------------------------------------------------
# Per-Class Accumulation
# ---------------------------------------------------------------------------

def accumulate_per_class(
    predictions: List[Dict],
    ground_truth: List[Dict],
    matches: List[Tuple[int, int]],
    unmatched_preds: List[int],
    unmatched_gts: List[int],
    class_stats: Dict[str, Dict[str, int]],
) -> None:
    """
    Update per-class TP/FP/FN counters in-place.

    class_stats maps class_name → {"tp": int, "fp": int, "fn": int}.
    """
    def _ensure(cls: str) -> None:
        if cls not in class_stats:
            class_stats[cls] = {"tp": 0, "fp": 0, "fn": 0}

    for pi, gi in matches:
        cls = ground_truth[gi]["label"]
        _ensure(cls)
        class_stats[cls]["tp"] += 1

    for pi in unmatched_preds:
        cls = predictions[pi]["label"]
        _ensure(cls)
        class_stats[cls]["fp"] += 1

    for gi in unmatched_gts:
        cls = ground_truth[gi]["label"]
        _ensure(cls)
        class_stats[cls]["fn"] += 1


# ---------------------------------------------------------------------------
# Metric Computation
# ---------------------------------------------------------------------------

def compute_per_class_metrics(
    class_stats: Dict[str, Dict[str, int]],
) -> Dict[str, Dict[str, float]]:
    """
    Compute precision, recall, and F1 for each class from accumulated TP/FP/FN.

    Returns dict: class_name → {"precision": float, "recall": float, "f1": float}
    """
    metrics: Dict[str, Dict[str, float]] = {}

    for cls, counts in class_stats.items():
        tp = counts["tp"]
        fp = counts["fp"]
        fn = counts["fn"]

        prec = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        rec = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        f1 = (2 * prec * rec / (prec + rec)) if (prec + rec) > 0 else 0.0

        metrics[cls] = {
            "precision": round(prec, 6),
            "recall": round(rec, 6),
            "f1": round(f1, 6),
        }

    return metrics


def compute_mf1(per_class_metrics: Dict[str, Dict[str, float]]) -> float:
    """
    Compute macro-averaged F1 (mF1) over all evaluated classes.

    mF1 = mean(f1_c) for all classes c in per_class_metrics.
    Returns 0.0 if no classes were evaluated.

    This is the primary benchmark metric for JeevaDrishti / Micro-OD research.
    """
    if not per_class_metrics:
        return 0.0
    f1_scores = [m["f1"] for m in per_class_metrics.values()]
    return round(sum(f1_scores) / len(f1_scores), 6)


def compute_overall_precision_recall(
    per_class_metrics: Dict[str, Dict[str, float]],
) -> Tuple[float, float]:
    """
    Macro-averaged precision and recall across all evaluated classes.
    Returns (precision, recall).
    """
    if not per_class_metrics:
        return 0.0, 0.0
    precs = [m["precision"] for m in per_class_metrics.values()]
    recs = [m["recall"] for m in per_class_metrics.values()]
    return round(sum(precs) / len(precs), 6), round(sum(recs) / len(recs), 6)


# ---------------------------------------------------------------------------
# Mean IoU
# ---------------------------------------------------------------------------

def compute_mean_iou(
    predictions: List[Dict],
    ground_truth: List[Dict],
    matches: List[Tuple[int, int]],
    iou_threshold: float = 0.50,
) -> float:
    """
    Compute mean IoU over matched prediction–GT pairs.
    Returns 0.0 if there are no matches.
    """
    if not matches:
        return 0.0
    ious = [
        compute_iou(predictions[pi]["bbox"], ground_truth[gi]["bbox"])
        for pi, gi in matches
    ]
    return round(sum(ious) / len(ious), 6)
 
# ---------------------------------------------------------------------------
# Classification Metrics
# ---------------------------------------------------------------------------

def compute_classification_metrics(
    predictions: List[str],
    ground_truth: List[str],
    classes: List[str],
) -> Dict[str, Any]:
    """
    Compute Accuracy, per-class Precision/Recall/F1, and macro metrics for classification tasks.
    IoU is NEVER computed here and is not returned (must remain null).
    """
    total = len(ground_truth)
    if total == 0:
        return {
            "accuracy": 0.0,
            "precision": 0.0,
            "recall": 0.0,
            "f1": 0.0,
            "per_class": {},
        }

    correct = sum(1 for p, g in zip(predictions, ground_truth) if p == g)
    accuracy = round(correct / total, 6)

    per_class: Dict[str, Dict[str, Any]] = {}
    for cls in classes:
        tp = sum(1 for p, g in zip(predictions, ground_truth) if p == cls and g == cls)
        fp = sum(1 for p, g in zip(predictions, ground_truth) if p == cls and g != cls)
        fn = sum(1 for p, g in zip(predictions, ground_truth) if p != cls and g == cls)

        prec = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        rec = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        f1 = (2 * prec * rec / (prec + rec)) if (prec + rec) > 0 else 0.0

        per_class[cls] = {
            "precision": round(prec, 6),
            "recall": round(rec, 6),
            "f1": round(f1, 6),
            "tp": tp,
            "fp": fp,
            "fn": fn,
        }

    # Macro averages across classes that appear in ground truth
    present_classes = [cls for cls in classes if any(g == cls for g in ground_truth)]
    if present_classes:
        macro_prec = round(sum(per_class[c]["precision"] for c in present_classes) / len(present_classes), 6)
        macro_rec = round(sum(per_class[c]["recall"] for c in present_classes) / len(present_classes), 6)
        macro_f1 = round(sum(per_class[c]["f1"] for c in present_classes) / len(present_classes), 6)
    else:
        macro_prec, macro_rec, macro_f1 = 0.0, 0.0, 0.0

    return {
        "accuracy": accuracy,
        "precision": macro_prec,
        "recall": macro_rec,
        "f1": macro_f1,
        "per_class": per_class,
    }

