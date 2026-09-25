"""
Micro-OD Dataset Loader
=======================
Loads real annotations and image paths from the Micro-OD benchmark dataset.

Dataset structure expected:
    datasets/Micro-OD/
        test/
            BBBC/  BCCD/  LIVECell/  NIH-3T3/
                annotation.jsonl
                images/
        example/
            BBBC/  BCCD/  LIVECell/  NIH-3T3/
                annotation.jsonl
                images/

Annotation format (one JSON record per line):
    {
        "image_path": "images/<name>.jpg",
        "bbox": {
            "Red Blood Cells": [[[x1,y1],[x2,y2]], ...],
            "White Blood Cells": [[[x1,y1],[x2,y2]], ...]
        }
    }

Deterministic ordering:
    All image records are sorted by their `image_path` field.
    Support example selection uses the first `shots` examples per class
    from sorted annotation order. This is deterministic and reproducible.
"""

import json
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from app.core.config import settings
from app.core.logging import logger
from app.services.inference.prompt_service import normalize_class_label


SUPPORTED_DATASETS = ["BBBC", "BCCD", "LIVECell", "NIH-3T3"]
MICRO_OD_DATASETS = SUPPORTED_DATASETS  # alias for clarity


def _get_micro_od_root() -> Path:
    """Resolve Micro-OD dataset root. Uses MICRO_OD_PATH env if set, else repo default."""
    if settings.MICRO_OD_PATH:
        return Path(settings.MICRO_OD_PATH)
    # Auto-discover: from <backend>/app/services/benchmark/ → ../../../../datasets/Micro-OD
    return Path(__file__).resolve().parent.parent.parent.parent.parent / "datasets" / "Micro-OD"


def _normalize_bbox(raw_box: Any) -> Optional[List[int]]:
    """
    Normalize a single bounding box to [x1, y1, x2, y2] int list.

    Accepts:
        [[x1, y1], [x2, y2]]  — corner-pair format (Micro-OD default)
        [x1, y1, x2, y2]      — flat format
    Returns None if the box is malformed or degenerate.
    """
    try:
        if len(raw_box) == 2 and isinstance(raw_box[0], (list, tuple)):
            x1, y1 = int(raw_box[0][0]), int(raw_box[0][1])
            x2, y2 = int(raw_box[1][0]), int(raw_box[1][1])
        elif len(raw_box) == 4:
            x1, y1, x2, y2 = int(raw_box[0]), int(raw_box[1]), int(raw_box[2]), int(raw_box[3])
        else:
            return None
    except (TypeError, ValueError, IndexError):
        return None

    if x2 <= x1 or y2 <= y1:
        return None

    return [x1, y1, x2, y2]


def _parse_annotation_record(record: Dict[str, Any]) -> Tuple[str, List[Dict]]:
    """
    Parse one annotation JSONL record into (image_path, gt_boxes).

    gt_boxes: list of {"label": canonical_str, "bbox": [x1,y1,x2,y2]}
    Skips boxes that fail normalization. Skips labels that cannot be canonicalized.
    """
    image_path = record.get("image_path", "")
    raw_bboxes: Dict[str, List] = record.get("bbox", {})

    gt_boxes: List[Dict] = []
    for raw_label, box_list in raw_bboxes.items():
        canonical = normalize_class_label(raw_label) or raw_label
        for raw_box in box_list:
            normalized = _normalize_bbox(raw_box)
            if normalized is None:
                continue
            gt_boxes.append({"label": canonical, "bbox": normalized})

    return image_path, gt_boxes


def load_test_records(dataset: str) -> List[Tuple[Path, List[Dict]]]:
    """
    Load all test records for a specific dataset sub-directory.

    Returns list of (absolute_image_path, gt_boxes), sorted deterministically
    by image filename for reproducibility.

    Raises FileNotFoundError if dataset directory or annotation file is missing.
    """
    micro_od_root = _get_micro_od_root()
    test_dir = micro_od_root / "test" / dataset
    annot_file = test_dir / "annotation.jsonl"

    if not test_dir.exists():
        raise FileNotFoundError(f"Test directory not found: {test_dir}")
    if not annot_file.exists():
        raise FileNotFoundError(f"Annotation file not found: {annot_file}")

    records: List[Tuple[str, List[Dict]]] = []
    with open(annot_file, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                record = json.loads(line)
                rel_path, gt_boxes = _parse_annotation_record(record)
                records.append((rel_path, gt_boxes))
            except (json.JSONDecodeError, Exception) as exc:
                logger.warning("Skipping malformed annotation record: %s", exc)
                continue

    # Deterministic sort by relative image path (filename)
    records.sort(key=lambda r: r[0])

    result: List[Tuple[Path, List[Dict]]] = []
    for rel_path, gt_boxes in records:
        abs_path = test_dir / rel_path
        if not abs_path.exists():
            logger.warning("Test image file not found — skipping: %s", abs_path)
            continue
        result.append((abs_path, gt_boxes))

    logger.info("Loaded %d test records for dataset '%s'", len(result), dataset)
    return result


def load_support_examples(dataset: str, shots: int) -> List[Dict[str, Any]]:
    """
    Load deterministic few-shot support examples for a given dataset and shot count.

    Research Few-Shot Specification:
    - 0-shot: 0 reference examples ([])
    - 1-shot: exactly 1 reference example
    - 3-shot: exactly 3 reference examples
    - 6-shot: exactly 6 reference examples

    Selection strategy:
    - Sort all example annotation records by image_path (deterministic).
    - Round-robin selection across canonical dataset classes.
    - Returns list of {"id": str, "label": str, "image_b64": str, "dataset": str, "bbox": [x1,y1,x2,y2]} dicts.
    """
    if shots == 0:
        return []

    # Delegate to the existing prompt_service which handles image loading and b64 encoding.
    # It uses the same example/ directory and sorts by filesystem iteration.
    # We wrap it here so the benchmark package has a clean interface.
    from app.services.inference.prompt_service import load_few_shot_examples
    try:
        examples = load_few_shot_examples(dataset_name=dataset, shots=shots)
        logger.info(
            "Loaded %d support examples for dataset='%s' shots=%d",
            len(examples), dataset, shots
        )
        return examples
    except Exception as exc:
        logger.error("Failed loading support examples for %s/%d: %s", dataset, shots, exc)
        return []


def get_dataset_classes(dataset: str) -> List[str]:
    """Return the canonical class list for a given dataset."""
    from app.services.inference.prompt_service import DATASET_CLASSES
    return DATASET_CLASSES.get(dataset, [])
