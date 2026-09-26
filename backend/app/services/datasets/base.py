"""
Dataset Adapter Base Classes
============================
Abstract interface and shared data structures for all dataset adapters.
Each adapter declares its task type so inference and benchmark pipelines
can route to the correct logic without hardcoding dataset names.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
from typing import Any, Dict, List, Optional


# ---------------------------------------------------------------------------
# Task Type
# ---------------------------------------------------------------------------

class TaskType(str, Enum):
    """
    The primary evaluation task for a dataset.

    OBJECT_DETECTION:
        Images contain multiple objects to localize.
        Pipeline: Image -> SAM proposals -> candidate patches -> VLM classification.
        Valid metrics: IoU, Precision, Recall, mF1, Latency.
        Invalid metrics: accuracy (return null).

    CELL_CLASSIFICATION:
        Each image (or pre-cropped cell patch) belongs to one class.
        Pipeline: Image -> VLM whole-image classification.
        Valid metrics: Accuracy, Precision, Recall, F1, Latency.
        Invalid metrics: IoU (return null).
    """
    OBJECT_DETECTION = "object_detection"
    CELL_CLASSIFICATION = "cell_classification"


# ---------------------------------------------------------------------------
# Data Records
# ---------------------------------------------------------------------------

@dataclass
class ImageRecord:
    """Metadata for a single discoverable image in a dataset."""
    image_id: str                   # Unique ID within this dataset
    path: Path                      # Absolute path on disk
    class_label: Optional[str]      # Known label (for classification datasets)
    split: Optional[str] = None     # "train" | "val" | "test" | None
    extra: Dict[str, Any] = field(default_factory=dict)


@dataclass
class AnnotationRecord:
    """Ground-truth annotation for a single image."""
    image_id: str
    task_type: TaskType
    # For OBJECT_DETECTION: list of {label, bbox: [x1,y1,x2,y2]}
    # For CELL_CLASSIFICATION: list of {label} (single item)
    annotations: List[Dict[str, Any]] = field(default_factory=list)


@dataclass
class SupportExample:
    """A single few-shot support example."""
    example_id: str
    class_label: str
    image_path: Path                # Absolute path to source image
    bbox: Optional[List[int]]       # [x1,y1,x2,y2] crop region (None = whole image)
    dataset_id: str


@dataclass
class ValidationResult:
    """Result of adapter.validate()."""
    is_valid: bool
    dataset_id: str
    checks: Dict[str, bool] = field(default_factory=dict)
    errors: List[str] = field(default_factory=list)
    image_count_estimate: Optional[int] = None


@dataclass
class PromptContext:
    """Context passed to the prompt service for building VLM prompts."""
    dataset_id: str
    task_type: TaskType
    classes: List[str]
    domain_description: str
    support_examples: List[SupportExample] = field(default_factory=list)


# ---------------------------------------------------------------------------
# Abstract Base Adapter
# ---------------------------------------------------------------------------

class DatasetAdapter(ABC):
    """
    Abstract base class for all JeevaDrishti dataset adapters.

    Each adapter is responsible for:
      - Resolving dataset paths from a configurable root.
      - Validating that the dataset is present and well-formed.
      - Listing discoverable images without scanning the full dataset on
        every API request (use lightweight discovery / caching).
      - Loading ground-truth annotations for evaluation.
      - Providing few-shot support examples for 0-shot and 6-shot experiments.
      - Returning a PromptContext for the inference pipeline.

    Subclasses MUST NOT:
      - Fabricate annotations, class labels, or metrics.
      - Support shot counts other than [0, 6].
      - Return IoU for CELL_CLASSIFICATION tasks or Accuracy for OBJECT_DETECTION.
    """

    # ── Required class attributes (set on each subclass) ───────────────────

    @property
    @abstractmethod
    def dataset_id(self) -> str:
        """Canonical internal identifier, e.g. 'micro_od'."""

    @property
    @abstractmethod
    def display_name(self) -> str:
        """Human-readable display name shown in the UI."""

    @property
    @abstractmethod
    def description(self) -> str:
        """One-sentence description of the dataset's domain and purpose."""

    @property
    @abstractmethod
    def modality(self) -> str:
        """Microscopy modality, e.g. 'Thin Blood Smear'."""

    @property
    @abstractmethod
    def domain(self) -> str:
        """Medical/biological domain, e.g. 'Malaria Parasitology'."""

    @property
    @abstractmethod
    def task_type(self) -> TaskType:
        """Primary evaluation task (OBJECT_DETECTION or CELL_CLASSIFICATION)."""

    @property
    @abstractmethod
    def classes(self) -> List[str]:
        """List of canonical class label strings for this dataset."""

    @property
    @abstractmethod
    def annotation_type(self) -> str:
        """Description of annotation format, e.g. 'Bounding Box' or 'Folder Label'."""

    @property
    def supported_shots(self) -> List[int]:
        """Active experiment shot counts. Always [0, 6]."""
        return [0, 6]

    # ── Path resolution ─────────────────────────────────────────────────────

    @abstractmethod
    def get_dataset_root(self) -> Path:
        """Return the absolute root path for this dataset."""

    # ── Core interface ───────────────────────────────────────────────────────

    @abstractmethod
    def validate(self) -> ValidationResult:
        """
        Validate that the dataset is present and usable.
        Must be lightweight — do not scan gigabytes of data.
        Check: root exists, expected subdirs exist, at least a few images can be found.
        """

    @abstractmethod
    def list_images(
        self,
        split: Optional[str] = None,
        limit: Optional[int] = None,
    ) -> List[ImageRecord]:
        """
        Return a list of ImageRecord objects for discoverable images.
        Use caching or limit scans to avoid slow full-dataset traversals.
        """

    @abstractmethod
    def load_annotations(self, image_id: str) -> AnnotationRecord:
        """
        Load ground-truth annotations for a specific image by its image_id.
        Returns an AnnotationRecord with task_type set correctly.
        If annotations are not available, return an AnnotationRecord with empty list.
        """

    @abstractmethod
    def get_support_examples(
        self,
        shots: int,
        seed_class: Optional[str] = None,
    ) -> List[SupportExample]:
        """
        Return deterministic few-shot support examples.
        shots == 0: return []
        shots == 6: return up to 6 real examples (one per class when possible).
        Never fabricate examples. If fewer real examples exist, return what is available.
        """

    def get_prompt_context(self, shots: int = 0) -> PromptContext:
        """
        Build a PromptContext for the inference pipeline.
        Default implementation — adapters may override for custom domain descriptions.
        """
        support = self.get_support_examples(shots) if shots > 0 else []
        return PromptContext(
            dataset_id=self.dataset_id,
            task_type=self.task_type,
            classes=self.classes,
            domain_description=self.description,
            support_examples=support,
        )

    def get_classes(self) -> List[str]:
        """Return canonical class labels (convenience wrapper)."""
        return self.classes

    def get_valid_metrics(self) -> List[str]:
        """Return metric names valid for this dataset's task type."""
        if self.task_type == TaskType.OBJECT_DETECTION:
            return ["mf1", "precision", "recall", "iou", "latency", "vlm_calls"]
        return ["accuracy", "precision", "recall", "f1", "latency"]

    def get_null_metrics(self) -> List[str]:
        """Return metric names that must be null for this dataset's task type."""
        if self.task_type == TaskType.OBJECT_DETECTION:
            return ["accuracy"]
        return ["iou", "mf1"]

    def __repr__(self) -> str:
        return (
            f"<{self.__class__.__name__} id={self.dataset_id!r} "
            f"task={self.task_type.value} classes={len(self.classes)}>"
        )
