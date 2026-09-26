"""
C-NMC 2019 Leukemia Dataset Adapter
=====================================
Handles the C-NMC 2019 Acute Lymphoblastic Leukemia (ALL) classification dataset.

IMPORTANT: This is a CELL_CLASSIFICATION dataset.
Do NOT treat it as an object detection dataset.
Do NOT compute IoU — return null for IoU in benchmark results.

Dataset structure:
    datasets/Leukemia/C-NMC 2019 (PKG)/C-NMC_training_data/
        fold_0/
            all/   -- ALL (Acute Lymphoblastic Leukemia) blast images (.bmp)
            hem/   -- Healthy hematopoietic cell images (.bmp)
        fold_1/
            all/
            hem/
        fold_2/
            all/
            hem/

Labels derived from folder name:
    all -> "ALL Blast"
    hem -> "Healthy Hematopoietic"

Supported shots: [0, 6]
"""

from __future__ import annotations

from pathlib import Path
from typing import Dict, List, Optional

from app.core.config import settings
from app.core.logging import logger
from app.services.datasets.base import (
    AnnotationRecord,
    DatasetAdapter,
    ImageRecord,
    SupportExample,
    TaskType,
    ValidationResult,
)

_IMAGE_EXTS = {".bmp", ".png", ".jpg", ".jpeg"}
_FOLDER_TO_CLASS = {
    "all": "ALL Blast",
    "hem": "Healthy Hematopoietic",
}
_DEFAULT_FOLD = "fold_0"


def _resolve_cnmc_root() -> Path:
    return settings.datasets_root_path / "Leukemia" / "C-NMC 2019 (PKG)"


class CNmc2019Adapter(DatasetAdapter):
    """Adapter for the C-NMC 2019 Acute Lymphoblastic Leukemia classification dataset."""

    @property
    def dataset_id(self) -> str:
        return "c_nmc_2019"

    @property
    def display_name(self) -> str:
        return "C-NMC 2019 \u2014 Leukemia"

    @property
    def description(self) -> str:
        return (
            "C-NMC 2019: Cell-level classification of Acute Lymphoblastic Leukemia (ALL) "
            "blasts versus healthy hematopoietic cells from bone marrow microscopy slides."
        )

    @property
    def modality(self) -> str:
        return "Bone Marrow Microscopy (Giemsa-stained)"

    @property
    def domain(self) -> str:
        return "Acute Lymphoblastic Leukemia (ALL)"

    @property
    def task_type(self) -> TaskType:
        return TaskType.CELL_CLASSIFICATION

    @property
    def classes(self) -> List[str]:
        return ["ALL Blast", "Healthy Hematopoietic"]

    @property
    def annotation_type(self) -> str:
        return "Folder Label (all=blast, hem=healthy)"

    def get_dataset_root(self) -> Path:
        return _resolve_cnmc_root()

    def _training_root(self) -> Path:
        return self.get_dataset_root() / "C-NMC_training_data"

    def _iter_class_images(
        self,
        fold: str = _DEFAULT_FOLD,
        class_folder: Optional[str] = None,
        limit_per_class: Optional[int] = None,
    ) -> List[ImageRecord]:
        """Iterate images in a given fold, optionally filtered by class folder."""
        records: List[ImageRecord] = []
        train_root = self._training_root()
        fold_dir = train_root / fold
        if not fold_dir.exists():
            return records

        class_folders = [class_folder] if class_folder else list(_FOLDER_TO_CLASS.keys())
        for cf in class_folders:
            cls_dir = fold_dir / cf
            if not cls_dir.exists():
                continue
            canonical = _FOLDER_TO_CLASS.get(cf, cf)
            count = 0
            for f in sorted(cls_dir.iterdir()):
                if f.suffix.lower() in _IMAGE_EXTS:
                    records.append(ImageRecord(
                        image_id=f"{fold}/{cf}/{f.name}",
                        path=f,
                        class_label=canonical,
                        split="train",
                        extra={"fold": fold, "class_folder": cf},
                    ))
                    count += 1
                    if limit_per_class and count >= limit_per_class:
                        break
        return records

    def validate(self) -> ValidationResult:
        root = self.get_dataset_root()
        checks: Dict[str, bool] = {}
        errors: List[str] = []

        checks["root_exists"] = root.exists()
        if not checks["root_exists"]:
            errors.append(f"C-NMC root not found: {root}")
            return ValidationResult(is_valid=False, dataset_id=self.dataset_id, checks=checks, errors=errors)

        train_root = self._training_root()
        checks["training_data_exists"] = train_root.exists()

        fold_dir = train_root / _DEFAULT_FOLD
        checks["fold_0_exists"] = fold_dir.exists()

        img_count = 0
        for cf, _ in _FOLDER_TO_CLASS.items():
            cls_dir = fold_dir / cf
            checks[f"{cf}_dir_exists"] = cls_dir.exists()
            if cls_dir.exists():
                found = sum(1 for f in cls_dir.iterdir() if f.suffix.lower() in _IMAGE_EXTS)
                img_count += found
                checks[f"{cf}_images_found"] = found > 0
                if found == 0:
                    errors.append(f"No images in {cls_dir}")

        checks["images_found"] = img_count > 0

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
        fold = _DEFAULT_FOLD
        records = self._iter_class_images(fold=fold)
        if limit:
            return records[:limit]
        return records

    def load_annotations(self, image_id: str) -> AnnotationRecord:
        """
        image_id format: "<fold>/<class_folder>/<filename>"
        Class label is derived from the class_folder name.
        """
        parts = image_id.split("/", 2)
        if len(parts) == 3:
            _, cf, _ = parts
            canonical = _FOLDER_TO_CLASS.get(cf)
            if canonical:
                return AnnotationRecord(
                    image_id=image_id,
                    task_type=self.task_type,
                    annotations=[{"label": canonical}],
                )
        return AnnotationRecord(image_id=image_id, task_type=self.task_type)

    def get_support_examples(
        self,
        shots: int,
        seed_class: Optional[str] = None,
    ) -> List[SupportExample]:
        if shots == 0:
            return []

        examples: List[SupportExample] = []
        per_class = max(1, shots // len(self.classes))

        for cf, canonical in _FOLDER_TO_CLASS.items():
            cls_dir = self._training_root() / _DEFAULT_FOLD / cf
            if not cls_dir.exists():
                continue
            count = 0
            for f in sorted(cls_dir.iterdir()):
                if f.suffix.lower() in _IMAGE_EXTS:
                    examples.append(SupportExample(
                        example_id=f"{cf}_{f.stem}",
                        class_label=canonical,
                        image_path=f,
                        bbox=None,  # whole-image classification
                        dataset_id=self.dataset_id,
                    ))
                    count += 1
                    if count >= per_class:
                        break

        return examples[:shots]
