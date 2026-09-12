import cv2
import os


def plot_rpn_bbox(
    image,
    bboxes,
    output_path,
    labels=None,
    color=(0, 255, 0),
    thickness=2
):
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    img_copy = image.copy()
    for i, box in enumerate(bboxes):
        try:
            x1, y1, x2, y2 = box
            cv2.rectangle(img_copy, (x1, y1), (x2, y2), color, thickness)
            if labels:
                label = labels[i]
                cv2.putText(img_copy, label, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX,
                            0.5, color, 1, cv2.LINE_AA)
        except Exception as e:
            print(f"[plot_rpn_bbox] Skipped bad box {box}: {e}")

    cv2.imwrite(output_path, img_copy)

def compute_iou(boxA, boxB):
    """Compute IoU between two boxes."""
    xA = max(boxA[0], boxB[0])
    yA = max(boxA[1], boxB[1])
    xB = min(boxA[2], boxB[2])
    yB = min(boxA[3], boxB[3])

    interArea = max(0, xB - xA + 1) * max(0, yB - yA + 1)
    boxAArea = (boxA[2] - boxA[0] + 1) * (boxA[3] - boxA[1] + 1)
    boxBArea = (boxB[2] - boxB[0] + 1) * (boxB[3] - boxB[1] + 1)

    iou = interArea / float(boxAArea + boxBArea - interArea + 1e-6)
    return iou


def match_predictions_to_ground_truth(predictions, ground_truth):
    """Match predicted boxes to ground truth boxes and return IoU scores."""
    iou_results = []
    gt_boxes = [[ann[0][0][0], ann[0][0][1], ann[0][1][0], ann[0][1][1]] for ann in ground_truth]

    for pred_box, label in predictions:
        best_iou = 0.0
        for gt_box in gt_boxes:
            iou = compute_iou(pred_box, gt_box)
            best_iou = max(best_iou, iou)
        iou_results.append((pred_box, label, best_iou))
    return iou_results
