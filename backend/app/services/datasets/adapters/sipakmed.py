"""
SIPaKMeD — Cervical Cytology Dataset Adapter
=============================================
Handles the SIPaKMeD cervical cytology cell classification dataset.

Dataset structure (double-nested — outer dir name == inner dir name):
    datasets/Cervical/
        im_Dyskeratotic/
            im_Dyskeratotic/
                *.bmp
        im_Koilocytotic/
            im_Koilocytotic/
                *.bmp
        im_Metaplastic/
            im_Metaplastic/
                *.bmp
        im_Parabasal/
            im_Parabasal/
                *.bmp
        im_Superficial-Intermediate/
            im_Superficial-Intermediate/
                *.bmp

Label is derived from the outer directory name by stripping "im_" prefix.

Task: CELL_CLASSIFICATION (cytology cell-level classification)
Do NOT compute IoU — not an object detection dataset.
Supported shots: [0, 6] (1-2 examples per class for 6-shot over 5 classes).
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

# Mapping from outer-folder prefix -> canonical label
_FOLDER_TO_CLASS: Dict[str, str] = {
    "im_Dyskeratotic": "Dyskeratotic",
    "im_Koilocytotic": "Koilocytotic",
    "im_Metaplastic": "Metaplastic",
    "im_Parabasal": "Parabasal",
    "im_Superficial-Intermediate": "Superficial-Intermediate",
}


def _resolve_sipakmed_root() -> Path:
    return settings.datasets_root_path / "Cervical"


class SipakmedAdapter(DatasetAdapter):
    """Adapter for the SIPaKMeD Cervical Cytology classification dataset."""

    @property
    def dataset_id(self) -> str:
        return "sipakmed"

    @property
    def display_name(self) -> str:
        return "SIPaKMeD \u2014 Cervical Cytology"

    @property
    def description(self) -> str:
        return (
            "SIPaKMeD: Cervical cytology classification across five Pap smear cell categories "
            "(Dyskeratotic, Koilocytotic, Metaplastic, Parabasal, Superficial-Intermediate)."
        )

    @property
    def modality(self) -> str:
        return "Cervical Pap Smear Microscopy"

    @property
    def domain(self) -> str:
        return "Cervical Cytology / Colposcopy"

    @property
    def task_type(self) -> TaskType:
        return TaskType.CELL_CLASSIFICATION

    @property
    def classes(self) -> List[str]:
        return [
            "Dyskeratotic",
            "Koilocytotic",
            "Metaplastic",
            "Parabasal",
            "Superficial-Intermediate",
        ]

    @property
    def annotation_type(self) -> str:
        return "Folder Label (im_<ClassName>/<ClassName>/*.bmp)"

    def get_dataset_root(self) -> Path:
        return _resolve_sipakmed_root()

    def _get_class_image_dir(self, outer_folder: str) -> Path:
        """
        SIPaKMeD has a double-nested structure:
            im_Dyskeratotic/im_Dyskeratotic/*.bmp
        The inner folder name matches the outer folder name.
        """
        return self.get_dataset_root() / outer_folder / outer_folder

    def validate(self) -> ValidationResult:
        root = self.get_dataset_root()
        checks: Dict[str, bool] = {}
        errors: List[str] = []

        checks["root_exists"] = root.exists()
        if not checks["root_exists"]:
            errors.append(f"SIPaKMeD root not found: {root}")
            return ValidationResult(is_valid=False, dataset_id=self.dataset_id, checks=checks, errors=errors)

        img_count = 0
        for outer_folder, canonical in _FOLDER_TO_CLASS.items():
            outer_dir = root / outer_folder
            inner_dir = self._get_class_image_dir(outer_folder)

            checks[f"{outer_folder}_outer_exists"] = outer_dir.exists()
            checks[f"{outer_folder}_inner_exists"] = inner_dir.exists()

            if inner_dir.exists():
                found = sum(1 for f in inner_dir.iterdir() if f.suffix.lower() in _IMAGE_EXTS)
                img_count += found
                checks[f"{outer_folder}_images_found"] = found > 0
                if found == 0:
                    errors.append(f"No images in {inner_dir}")
            else:
                errors.append(f"Inner class dir not found: {inner_dir}")

        checks["all_classes_found"] = all(
            self._get_class_image_dir(of).exists() for of in _FOLDER_TO_CLASS
        )

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
        by_class: Dict[str, List[ImageRecord]] = {c: [] for c in self.classes}

        for outer_folder, canonical in _FOLDER_TO_CLASS.items():
            img_dir = self._get_class_image_dir(outer_folder)
            if not img_dir.exists():
                continue
            for f in sorted(img_dir.iterdir()):
                if f.suffix.lower() in _IMAGE_EXTS:
                    by_class[canonical].append(ImageRecord(
                        image_id=f"{outer_folder}/{f.name}",
                        path=f,
                        class_label=canonical,
                        split=None,
                        extra={"outer_folder": outer_folder},
                    ))

        if limit is None:
            records: List[ImageRecord] = []
            for img_list in by_class.values():
                records.extend(img_list)
            return records

        records: List[ImageRecord] = []
        while len(records) < limit:
            added = False
            for cls in self.classes:
                if by_class[cls]:
                    records.append(by_class[cls].pop(0))
                    added = True
                    if len(records) >= limit:
                        break
            if not added:
                break
        return records

    def load_annotations(self, image_id: str) -> AnnotationRecord:
        """
        image_id format: "<outer_folder>/<filename>"
        Class label is derived from the outer_folder name.
        """
        parts = image_id.split("/", 1)
        if len(parts) == 2:
            outer_folder = parts[0]
            canonical = _FOLDER_TO_CLASS.get(outer_folder)
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

        by_class: Dict[str, List[SupportExample]] = {c: [] for c in self.classes}
        for outer_folder, canonical in _FOLDER_TO_CLASS.items():
            img_dir = self._get_class_image_dir(outer_folder)
            if not img_dir.exists():
                continue
            for f in sorted(img_dir.iterdir()):
                if f.suffix.lower() in _IMAGE_EXTS:
                    by_class[canonical].append(SupportExample(
                        example_id=f"{outer_folder}_{f.stem}",
                        class_label=canonical,
                        image_path=f,
                        bbox=None,  # whole-image classification
                        dataset_id=self.dataset_id,
                    ))
                    if len(by_class[canonical]) >= shots:
                        break

        # Round-robin across classes to get exactly `shots` unique examples
        examples: List[SupportExample] = []
        while len(examples) < shots:
            added = False
            for cls in self.classes:
                if by_class[cls]:
                    examples.append(by_class[cls].pop(0))
                    added = True
                    if len(examples) >= shots:
                        break
            if not added:
                break

        return examples[:shots]
