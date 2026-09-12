# debug_metrics.py
#
# 1. Point at ONE prediction file that looks visually correct
# 2. It will print a table of (img_id, label, best-IoU, comment)
#
# Run:  python debug_metrics.py \
#          --pred /…/results/hybrid_results/NIH-3T3/predictions_6shot.jsonl \
#          --ann  /…/dataset_53_v1/reference/NIH-3T3/annotation.jsonl
#
import argparse, json
from pathlib import Path
from collections import defaultdict

def iou(a, b):
    xa1, ya1, xa2, ya2 = a
    xb1, yb1, xb2, yb2 = b
    ix1, iy1 = max(xa1, xb1), max(ya1, yb1)
    ix2, iy2 = min(xa2, xb2), min(ya2, yb2)
    iw, ih  = max(0, ix2-ix1), max(0, iy2-iy1)
    if iw == 0 or ih == 0: return 0.0
    ia, ib = (xa2-xa1)*(ya2-ya1), (xb2-xb1)*(yb2-yb1)
    return (iw*ih) / (ia+ib - iw*ih + 1e-9)

def load_jsonl(p): return [json.loads(l) for l in Path(p).open()]

ap = argparse.ArgumentParser()
ap.add_argument("--pred", required=True, type=Path)
ap.add_argument("--ann",  required=True, type=Path)
args = ap.parse_args()

# GT -> {img_id: {label: [boxes]}}
gt = defaultdict(lambda: defaultdict(list))
for rec in load_jsonl(args.ann):
    img_id = Path(rec["image_path"]).stem      # e.g. BloodImage_00148
    for lbl, boxes in rec["bbox"].items():
        gt[img_id][lbl].extend(
            [[b[0][0], b[0][1], b[1][0], b[1][1]] for b in boxes]
        )

print("Loaded GT  imgs:", len(gt))

# Scan predictions
for rec in load_jsonl(args.pred):
    img_id   = Path(rec["image_path"]).stem
    label    = rec.get("class_label") or "<?>"
    boxes    = rec["boxes"]
    scores   = rec.get("scores") or [1.0]*len(boxes)

    gt_for_img = gt.get(img_id, {})
    gt_boxes   = gt_for_img.get(label, [])

    for b, s in zip(boxes, scores):
        b = list(map(int, b))
        best = max((iou(b, g) for g in gt_boxes), default=0.)
        ok_img   = "✓" if img_id in gt else "✗"
        ok_label = "✓" if label in (gt_for_img.keys()) else "✗"
        comment  = []
        if ok_img == "✗":          comment.append("img_id mismatch")
        elif ok_label == "✗":      comment.append("label mismatch")
        elif best == 0.0:          comment.append("IoU 0")
        else:                      comment.append("match")
        print(f"{img_id:20}  {label:18}  IoU={best:5.3f}  {', '.join(comment)}")
