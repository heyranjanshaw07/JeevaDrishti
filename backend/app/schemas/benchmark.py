from datetime import datetime
from typing import Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class BenchmarkConfigResponse(BaseModel):
    """Benchmark configuration outlining supported evaluation parameters."""

    datasets: List[str] = Field(..., description="Supported evaluation datasets")
    shot_configs: List[int] = Field(..., description="Available exemplar shot counts (0, 1, 3, 6)")
    metrics: List[str] = Field(..., description="Standard evaluation metrics")


class BenchmarkItem(BaseModel):
    """Individual benchmark experiment evaluation record (real values only)."""

    id: int
    experiment_id: Optional[str] = None
    dataset: str
    shots: int
    status: str = "not_available"

    # Metrics — null until a real evaluation run succeeds
    mf1: Optional[float] = None
    precision: Optional[float] = None
    recall: Optional[float] = None
    iou: Optional[float] = None
    latency: Optional[float] = None
    vlm_calls: Optional[int] = None

    # Classification-specific metric (null for OBJECT_DETECTION datasets)
    accuracy: Optional[float] = None

    # Task type for this benchmark record
    task_type: Optional[str] = None

    # Experiment statistics
    image_count: Optional[int] = None
    failed_images: Optional[int] = None

    # Reproducibility metadata
    iou_threshold: Optional[float] = None
    vlm_model: Optional[str] = None
    error_message: Optional[str] = None

    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class BenchmarkResultsResponse(BaseModel):
    """Real benchmark evaluation results query response."""

    items: List[BenchmarkItem] = Field(default_factory=list)
    total: int = Field(0, description="Total evaluated experiment records")
    status: str = Field("not_evaluated", description="Overall benchmark evaluation status")


class BenchmarkSummaryResponse(BaseModel):
    """Overview summary of benchmark availability."""

    status: str = Field("not_evaluated", description="Evaluation status")
    datasets: int = Field(4, description="Number of source datasets")
    shot_configs: List[int] = Field([0, 6], description="Supported shot configurations")


# ── Run endpoint ──────────────────────────────────────────────────────────────

class BenchmarkRunRequest(BaseModel):
    """Request body for POST /benchmark/run."""

    dataset: str = Field(
        ...,
        description="Dataset to evaluate: BBBC, BCCD, LIVECell, NIH-3T3, or Micro-OD (all four)",
        examples=["BBBC", "BCCD", "LIVECell", "NIH-3T3", "Micro-OD"],
    )
    shots: int = Field(
        ...,
        description="Few-shot support count: 0 or 6",
        examples=[0, 6],
    )


class BenchmarkRunResponse(BaseModel):
    """Response for POST /benchmark/run — returns experiment summary."""

    status: str
    experiment_id: Optional[str] = None
    dataset: str
    shots: int
    mf1: Optional[float] = None
    precision: Optional[float] = None
    recall: Optional[float] = None
    mean_iou: Optional[float] = None
    avg_latency_ms: Optional[float] = None
    total_vlm_calls: Optional[int] = None
    total_images: int = 0
    successful_images: int = 0
    failed_images: int = 0
    iou_threshold: float
    vlm_model: str
    per_class_metrics: Dict[str, Dict[str, float]] = Field(default_factory=dict)
    accuracy: Optional[float] = None
    task_type: Optional[str] = None
    error_message: Optional[str] = None


# ── Benchmark Matrix ─────────────────────────────────────────────────────────

class BenchmarkMatrixCell(BaseModel):
    """
    Single cell in the Dataset x Shot benchmark matrix.
    Metrics are task-aware: IoU is null for classification datasets;
    accuracy is null for detection datasets.
    """

    dataset: str
    dataset_display_name: str
    shots: int
    task_type: str = "object_detection"
    status: str = "not_evaluated"

    # Detection & Classification shared metrics
    mf1: Optional[float] = None          # mF1 for detection, macro F1 for classification
    precision: Optional[float] = None
    recall: Optional[float] = None

    # Detection-only metric (null for CELL_CLASSIFICATION datasets)
    iou: Optional[float] = None

    # Classification-only metric (null for OBJECT_DETECTION datasets)
    accuracy: Optional[float] = None

    # Shared
    latency: Optional[float] = None
    vlm_calls: Optional[int] = None
    error_message: Optional[str] = None


class BenchmarkMatrixResponse(BaseModel):
    """
    Full Dataset x Shot evaluation matrix.
    Returns one BenchmarkMatrixCell per (dataset, shots) combination.
    """

    cells: List[BenchmarkMatrixCell] = Field(default_factory=list)
    datasets: List[str] = Field(default_factory=list)
    shot_configs: List[int] = Field(default_factory=lambda: [0, 6])
    total_cells: int = 0
    evaluated_cells: int = 0
