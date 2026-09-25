"""
Experiment Configuration and Result Dataclasses
================================================
All fields required for full reproducibility of a benchmark experiment.
"""

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import uuid


@dataclass
class ExperimentConfig:
    """
    Fully specifies a single benchmark experiment configuration.
    Every field that affects results is recorded here for reproducibility.
    """
    dataset: str
    shots: int
    iou_threshold: float
    max_candidates: int
    vlm_model: str
    vlm_provider: str
    support_selection: str = "deterministic_sorted"  # How support examples are chosen
    timestamp: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    experiment_id: str = field(default_factory=lambda: str(uuid.uuid4())[:16])

    def to_dict(self) -> Dict[str, Any]:
        return {
            "experiment_id": self.experiment_id,
            "dataset": self.dataset,
            "shots": self.shots,
            "iou_threshold": self.iou_threshold,
            "max_candidates": self.max_candidates,
            "vlm_model": self.vlm_model,
            "vlm_provider": self.vlm_provider,
            "support_selection": self.support_selection,
            "timestamp": self.timestamp.isoformat(),
        }


@dataclass
class ImageResult:
    """Result for a single image in the benchmark."""
    image_id: str                    # Relative path used as unique ID
    status: str                      # "success" | "failed"
    predictions: List[Dict]          # [{"label": str, "bbox": [x1,y1,x2,y2], "confidence": float}]
    ground_truth: List[Dict]         # [{"label": str, "bbox": [x1,y1,x2,y2]}]
    matches: List                    # [(pred_idx, gt_idx)]
    unmatched_preds: List[int]
    unmatched_gts: List[int]
    iou_values: List[float]          # IoU for each match
    latency_ms: float                # Inference wall-clock time in milliseconds
    vlm_calls: int                   # Number of VLM API calls made
    error_type: Optional[str] = None
    error_message: Optional[str] = None


@dataclass
class ExperimentResult:
    """
    Aggregated result of a complete benchmark experiment.
    Contains per-image results + aggregate metrics.
    """
    config: ExperimentConfig
    status: str                      # "completed" | "failed" | "not_available"

    # Image-level results
    image_results: List[ImageResult] = field(default_factory=list)

    # Aggregate metrics (null until computed)
    mf1: Optional[float] = None
    precision: Optional[float] = None
    recall: Optional[float] = None
    mean_iou: Optional[float] = None
    avg_latency_ms: Optional[float] = None
    total_latency_ms: Optional[float] = None
    total_vlm_calls: Optional[int] = None

    # Per-class metrics
    per_class_metrics: Dict[str, Dict[str, float]] = field(default_factory=dict)

    # Classification-specific metric (null for OBJECT_DETECTION datasets)
    accuracy: Optional[float] = None

    # Task type: 'object_detection' | 'cell_classification'
    task_type: Optional[str] = None

    # Counts
    total_images: int = 0
    successful_images: int = 0
    failed_images: int = 0

    # Top-level failure reason (if status != "completed")
    error_message: Optional[str] = None

    def summary(self) -> Dict[str, Any]:
        return {
            "experiment_id": self.config.experiment_id,
            "dataset": self.config.dataset,
            "shots": self.config.shots,
            "status": self.status,
            "task_type": self.task_type,
            "accuracy": self.accuracy,
            "mf1": self.mf1,
            "precision": self.precision,
            "recall": self.recall,
            "mean_iou": self.mean_iou,
            "avg_latency_ms": self.avg_latency_ms,
            "total_vlm_calls": self.total_vlm_calls,
            "total_images": self.total_images,
            "successful_images": self.successful_images,
            "failed_images": self.failed_images,
            "iou_threshold": self.config.iou_threshold,
            "vlm_model": self.config.vlm_model,
            "per_class_metrics": self.per_class_metrics,
        }
