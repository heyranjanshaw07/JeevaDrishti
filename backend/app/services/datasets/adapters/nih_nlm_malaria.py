"""
NIH-NLM Malaria Dataset Adapter
=================================
Handles the NIH-NLM Thin Blood Smears Pf (Plasmodium falciparum) dataset.

Dataset structure (Polygon Set used — richer annotations with Infected/Uninfected labels):
    datasets/Malaria/Polygon Set/<patient_folder>/
        Img/
            *.jpg              -- microscopy images
        GT/
            <same_stem>.txt    -- polygon annotation per image

Annotation format (GT .txt files):
    Line 1:  <count>,<width>,<height>
    Line 2+: <cell_id>,<Infected|Uninfected>,<comment>,Polygon,<n_points>,x1,y1,x2,y2,...

Task: OBJECT_DETECTION
  SAM generates proposals. Polygon annotations are converted to axis-aligned bboxes for IoU.
  Classes: Infected RBC, Uninfected RBC.
  Supported shots: [0, 6].
"""

from __future__ import annotations

import re
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

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

_IMAGE_EXTS = {".jpg", ".jpeg", ".png"}
_POLYGON_SET = "Polygon Set"
_LABEL_MAP = {
    "parasitized": "Infected RBC",
    "infected": "Infected RBC",
    "uninfected": "Uninfected RBC",
}


def _resolve_malaria_root() -> Path:
    return settings.datasets_root_path / "Malaria"


def _polygon_coords_to_bbox(coords: List[float]) -> Optional[List[int]]:
    """
    Convert a flat list of x,y,x,y,... polygon coordinates to an
    axis-aligned bounding box [x1, y1, x2, y2].
    Returns None if fewer than 4 coordinate values (2 points).
    """
    if len(coords) < 4:
        return None
    xs = coords[0::2]
    ys = coords[1::2]
    x1, y1, x2, y2 = int(min(xs)), int(min(ys)), int(max(xs)), int(max(ys))
    if x2 <= x1 or y2 <= y1:
        return None
    return [x1, y1, x2, y2]


def _parse_gt_file(gt_path: Path) -> List[Dict[str, Any]]:
    """
    Parse a Malaria Polygon Set GT text file.
    Returns list of {"label": str, "bbox": [x1,y1,x2,y2]}.
    """
    annotations = []
    try:
        lines = gt_path.read_text(encoding="utf-8", errors="replace").splitlines()
    except Exception:
        return annotations

    for line in lines[1:]:  # skip header line
        line = line.strip()
        if not line:
            continue
        parts = line.split(",")
        if len(parts) < 6:
            continue

        raw_label = parts[1].strip().lower()
        canonical = _LABEL_MAP.get(raw_label)
        if canonical is None:
            continue  # skip unknown labels

        # Format: cell_id, label, comment, "Polygon", n_points, x1, y1, x2, y2, ...
        try:
            n_points = int(parts[4].strip())
            coord_strs = parts[5:5 + n_points * 2]
            coords = [float(c.strip()) for c in coord_strs if c.strip()]
            bbox = _polygon_coords_to_bbox(coords)
            if bbox:
                annotations.append({"label": canonical, "bbox": bbox})
        except (ValueError, IndexError):
            continue

    return annotations


class NihNlmMalariaAdapter(DatasetAdapter):
    """Adapter for the NIH-NLM Thin Blood Smears Pf malaria microscopy dataset."""

    @property
    def dataset_id(self) -> str:
        return "nih_nlm_malaria"

    @property
    def display_name(self) -> str:
        return "NIH-NLM Malaria"

    @property
    def description(self) -> str:
        return (
            "NIH-NLM thin blood smear microscopy for Plasmodium falciparum malaria detection. "
            "Polygon annotations with Infected/Uninfected RBC labels."
        )

    @property
    def modality(self) -> str:
        return "Thin Blood Smear Microscopy"

    @property
    def domain(self) -> str:
        return "Malaria Parasitology"

    @property
    def task_type(self) -> TaskType:
        return TaskType.OBJECT_DETECTION

    @property
    def classes(self) -> List[str]:
        return ["Infected RBC", "Uninfected RBC"]

    @property
    def annotation_type(self) -> str:
        return "Polygon (converted to Bounding Box)"

    def get_dataset_root(self) -> Path:
        return _resolve_malaria_root()

    def _polygon_set_root(self) -> Path:
        return self.get_dataset_root() / _POLYGON_SET

    def _iter_patient_folders(self) -> List[Path]:
        ps_root = self._polygon_set_root()
        if not ps_root.exists():
            return []
        return sorted([d for d in ps_root.iterdir() if d.is_dir()])

    def validate(self) -> ValidationResult:
        root = self.get_dataset_root()
        checks: Dict[str, bool] = {}
        errors: List[str] = []

        checks["root_exists"] = root.exists()
        if not checks["root_exists"]:
            errors.append(f"Malaria root not found: {root}")
            return ValidationResult(is_valid=False, dataset_id=self.dataset_id, checks=checks, errors=errors)

        ps = self._polygon_set_root()
        checks["polygon_set_exists"] = ps.exists()
        if not checks["polygon_set_exists"]:
            errors.append(f"Polygon Set directory not found: {ps}")

        patient_folders = self._iter_patient_folders()
        checks["patient_folders_found"] = len(patient_folders) > 0

        # Quick check: can we find images and GT files?
        img_count = 0
        gt_count = 0
        for pf in patient_folders[:5]:  # check first 5 only
            img_dir = pf / "Img"
            gt_dir = pf / "GT"
            if img_dir.exists():
                img_count += sum(1 for f in img_dir.iterdir() if f.suffix.lower() in _IMAGE_EXTS)
            if gt_dir.exists():
                gt_count += sum(1 for f in gt_dir.iterdir() if f.suffix == ".txt")

        checks["images_found"] = img_count > 0
        checks["gt_files_found"] = gt_count > 0

        if not checks["images_found"]:
            errors.append("No image files found in Malaria/Polygon Set")
        if not checks["gt_files_found"]:
            errors.append("No GT annotation files found in Malaria/Polygon Set")

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
        records: List[ImageRecord] = []
        for pf in self._iter_patient_folders():
            img_dir = pf / "Img"
            if not img_dir.exists():
                continue
            for f in sorted(img_dir.iterdir()):
                if f.suffix.lower() not in _IMAGE_EXTS:
                    continue
                records.append(ImageRecord(
                    image_id=f"{pf.name}/{f.name}",
                    path=f,
                    class_label=None,  # mixed labels per GT
                    split=None,
                    extra={"patient_folder": pf.name},
                ))
                if limit and len(records) >= limit:
                    return records
        return records

    def load_annotations(self, image_id: str) -> AnnotationRecord:
        """
        image_id format: "<patient_folder>/<image_filename>"
        """
        parts = image_id.split("/", 1)
        if len(parts) != 2:
            return AnnotationRecord(image_id=image_id, task_type=self.task_type)

        patient_folder, img_fname = parts
        gt_dir = self._polygon_set_root() / patient_folder / "GT"
        stem = Path(img_fname).stem
        gt_file = gt_dir / f"{stem}.txt"

        if not gt_file.exists():
            return AnnotationRecord(image_id=image_id, task_type=self.task_type)

        annotations = _parse_gt_file(gt_file)
        return AnnotationRecord(
            image_id=image_id,
            task_type=self.task_type,
            annotations=annotations,
        )

    def get_support_examples(
        self,
        shots: int,
        seed_class: Optional[str] = None,
    ) -> List[SupportExample]:
        if shots == 0:
            return []

        by_class: Dict[str, List[SupportExample]] = {c: [] for c in self.classes}
        target_per_class = max(1, shots // len(self.classes))
        used_images: set = set()

        for pf in self._iter_patient_folders():
            img_dir = pf / "Img"
            gt_dir = pf / "GT"
            if not img_dir.exists() or not gt_dir.exists():
                continue

            for img_file in sorted(img_dir.iterdir()):
                if img_file.suffix.lower() not in _IMAGE_EXTS:
                    continue
                if img_file in used_images:
                    continue
                gt_file = gt_dir / f"{img_file.stem}.txt"
                if not gt_file.exists():
                    continue

                annotations = _parse_gt_file(gt_file)
                for ann in annotations:
                    lbl = ann["label"]
                    if lbl in by_class and len(by_class[lbl]) < target_per_class:
                        by_class[lbl].append(SupportExample(
                            example_id=f"{pf.name}_{img_file.stem}_{lbl}_{len(by_class[lbl])}",
                            class_label=lbl,
                            image_path=img_file,
                            bbox=ann["bbox"],
                            dataset_id=self.dataset_id,
                        ))
                        used_images.add(img_file)
                        break  # Take at most 1 exemplar per image

            if all(len(v) >= target_per_class for v in by_class.values()):
                break

        # Round-robin across classes
        selected: List[SupportExample] = []
        while len(selected) < shots:
            added = False
            for cls in self.classes:
                if by_class[cls]:
                    selected.append(by_class[cls].pop(0))
                    added = True
                    if len(selected) >= shots:
                        break
            if not added:
                break

        return selected[:shots]
