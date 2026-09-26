"""
Micro-OD Dataset Adapter
========================
Wraps existing dataset_loader.py logic under the unified DatasetAdapter interface.
This adapter is fully backward-compatible — it does not alter any existing
benchmark, inference, or annotation loading code paths.

Dataset structure:
    datasets/Micro-OD/
        example/{BBBC,BCCD,LIVECell,NIH-3T3}/
            annotation.jsonl
            images/
        test/{BBBC,BCCD,LIVECell,NIH-3T3}/
            annotation.jsonl
            images/
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import List, Optional

from app.core.config import settings
from app.core.logging import logger
from app.services.datasets.base import (
    AnnotationRecord,
    DatasetAdapter,
    ImageRecord,
    PromptContext,
    SupportExample,
    TaskType,
    ValidationResult,
)

_SUB_DATASETS = ["BBBC", "BCCD", "LIVECell", "NIH-3T3"]
_IMAGE_EXTS = {".png", ".jpg", ".jpeg"}


def _resolve_micro_od_root() -> Path:
    """Resolve Micro-OD root from MICRO_OD_PATH env or repo default."""
    if settings.MICRO_OD_PATH:
        return Path(settings.MICRO_OD_PATH)
    return settings.datasets_root_path / "Micro-OD"


class MicroODAdapter(DatasetAdapter):
    """Adapter for the Micro-OD few-shot optical microscopy benchmark."""

    @property
    def dataset_id(self) -> str:
        return "micro_od"

    @property
    def display_name(self) -> str:
        return "Micro-OD"

    @property
    def description(self) -> str:
        return (
            "Standardized benchmark combining diverse optical microscopy domains "
            "(BBBC, BCCD, LIVECell, NIH-3T3) for few-shot and zero-shot cell detection."
        )

    @property
    def modality(self) -> str:
        return "Multi-Modal Optical (Fluorescence, Phase-Contrast, Brightfield)"

    @property
    def domain(self) -> str:
        return "General Cell Detection"

    @property
    def task_type(self) -> TaskType:
        return TaskType.OBJECT_DETECTION

    @property
    def classes(self) -> List[str]:
        return [
            "Gametocyte Cells",
            "Platelets",
            "Polygonal Cells",
            "Red Blood Cells",
            "Ring Cells",
            "Round Cells",
            "Schizont Cells",
            "Spindle Cells",
            "Trophozoite Cells",
            "White Blood Cells",
        ]

    @property
    def annotation_type(self) -> str:
        return "Bounding Box (JSONL)"

    def get_dataset_root(self) -> Path:
        return _resolve_micro_od_root()

    def validate(self) -> ValidationResult:
        root = self.get_dataset_root()
        checks: dict = {}
        errors: list = []

        checks["root_exists"] = root.exists()
        if not checks["root_exists"]:
            errors.append(f"Micro-OD root not found: {root}")
            return ValidationResult(is_valid=False, dataset_id=self.dataset_id, checks=checks, errors=errors)

        img_count = 0
        for split in ("example", "test"):
            split_dir = root / split
            checks[f"{split}_dir"] = split_dir.exists()
            if split_dir.exists():
                for sub in _SUB_DATASETS:
                    img_dir = split_dir / sub / "images"
                    if img_dir.exists():
                        found = sum(1 for f in img_dir.iterdir() if f.suffix.lower() in _IMAGE_EXTS)
                        img_count += found

        checks["images_found"] = img_count > 0
        if not checks["images_found"]:
            errors.append("No images found in Micro-OD dataset")

        return ValidationResult(
            is_valid=all(checks.values()),
            dataset_id=self.dataset_id,
            checks=checks,
            errors=errors,
            image_count_estimate=img_count,
        )

    def list_images(
        self,
        split: Optional[str] = None,
        limit: Optional[int] = None,
    ) -> List[ImageRecord]:
        root = self.get_dataset_root()
        splits = [split] if split else ["example", "test"]
        records: List[ImageRecord] = []

        for sp in splits:
            split_dir = root / sp
            if not split_dir.exists():
                continue
            for sub in _SUB_DATASETS:
                img_dir = split_dir / sub / "images"
                if not img_dir.exists():
                    continue
                for f in sorted(img_dir.iterdir()):
                    if f.suffix.lower() in _IMAGE_EXTS:
                        records.append(ImageRecord(
                            image_id=f"{sub}/{sp}/{f.name}",
                            path=f,
                            class_label=None,
                            split=sp,
                            extra={"sub_dataset": sub},
                        ))
                        if limit and len(records) >= limit:
                            return records
        return records

    def load_annotations(self, image_id: str) -> AnnotationRecord:
        """
        Load annotations from annotation.jsonl for the given image_id.
        image_id format: "<sub_dataset>/<split>/<filename>"
        """
        parts = image_id.split("/", 2)
        if len(parts) != 3:
            return AnnotationRecord(image_id=image_id, task_type=self.task_type)

        sub, split, fname = parts
        root = self.get_dataset_root()
        annot_file = root / split / sub / "annotation.jsonl"
        if not annot_file.exists():
            return AnnotationRecord(image_id=image_id, task_type=self.task_type)

        try:
            with open(annot_file, "r", encoding="utf-8") as fh:
                for line in fh:
                    line = line.strip()
                    if not line:
                        continue
                    record = json.loads(line)
                    rel_path = record.get("image_path", "")
                    if Path(rel_path).name == fname:
                        annotations = []
                        for raw_label, box_list in record.get("bbox", {}).items():
                            for box in box_list:
                                if len(box) == 2 and isinstance(box[0], list):
                                    x1, y1, x2, y2 = int(box[0][0]), int(box[0][1]), int(box[1][0]), int(box[1][1])
                                elif len(box) == 4:
                                    x1, y1, x2, y2 = int(box[0]), int(box[1]), int(box[2]), int(box[3])
                                else:
                                    continue
                                if x2 > x1 and y2 > y1:
                                    annotations.append({"label": raw_label, "bbox": [x1, y1, x2, y2]})
                        return AnnotationRecord(
                            image_id=image_id,
                            task_type=self.task_type,
                            annotations=annotations,
                        )
        except Exception as exc:
            logger.warning("MicroODAdapter: annotation load error for %s: %s", image_id, exc)

        return AnnotationRecord(image_id=image_id, task_type=self.task_type)

    def get_support_examples(
        self,
        shots: int,
        seed_class: Optional[str] = None,
    ) -> List[SupportExample]:
        if shots == 0:
            return []

        root = self.get_dataset_root()
        example_dir = root / "example"
        examples: List[SupportExample] = []

        seen_images: set = set()

        for sub in _SUB_DATASETS:
            annot_file = example_dir / sub / "annotation.jsonl"
            if not annot_file.exists():
                continue
            try:
                with open(annot_file, "r", encoding="utf-8") as fh:
                    records = sorted(
                        [json.loads(l) for l in fh if l.strip()],
                        key=lambda r: r.get("image_path", ""),
                    )
                for rec in records:
                    img_path = example_dir / sub / rec.get("image_path", "")
                    if not img_path.exists() or img_path in seen_images:
                        continue
                    for raw_label, box_list in rec.get("bbox", {}).items():
                        for box in box_list:
                            if len(box) == 2 and isinstance(box[0], list):
                                x1, y1, x2, y2 = int(box[0][0]), int(box[0][1]), int(box[1][0]), int(box[1][1])
                            elif len(box) == 4:
                                x1, y1, x2, y2 = int(box[0]), int(box[1]), int(box[2]), int(box[3])
                            else:
                                continue
                            if x2 > x1 and y2 > y1:
                                examples.append(SupportExample(
                                    example_id=f"{sub}_{img_path.stem}_{raw_label}_{x1}_{y1}",
                                    class_label=raw_label,
                                    image_path=img_path,
                                    bbox=[x1, y1, x2, y2],
                                    dataset_id=self.dataset_id,
                                ))
                                seen_images.add(img_path)
                                break  # 1 exemplar per image
                        if img_path in seen_images:
                            break
                    if len(examples) >= shots * 3:
                        break
            except Exception as exc:
                logger.warning("MicroODAdapter: support example error %s: %s", sub, exc)

        # Round-robin selection across classes
        by_class: dict = {c: [] for c in self.classes}
        for ex in examples:
            if ex.class_label in by_class:
                by_class[ex.class_label].append(ex)

        selected: List[SupportExample] = []
        selected_images: set = set()
        while len(selected) < shots:
            added = False
            for cls in self.classes:
                while by_class[cls]:
                    cand = by_class[cls].pop(0)
                    if cand.image_path not in selected_images:
                        selected.append(cand)
                        selected_images.add(cand.image_path)
                        added = True
                        break
                if len(selected) >= shots:
                    break
            if not added:
                break

        return selected[:shots]
