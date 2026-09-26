from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import Integer, String, Float, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class BenchmarkResult(Base):
    """
    Database model for storing real experimental benchmark evaluations.

    Fields are explicitly nullable until a real benchmark evaluation populates them.
    No fake/simulated values are ever stored — only metrics computed from actual
    SAM+VLM inference against real ground-truth annotations.

    task_type distinguishes detection vs. classification experiments:
    - 'object_detection': iou, mf1, precision, recall are valid; accuracy must be null.
    - 'cell_classification': accuracy, precision, recall, f1 are valid; iou must be null.
    """

    __tablename__ = "benchmark_results"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    # Experiment identity
    experiment_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True, index=True)
    dataset: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    shots: Mapped[int] = mapped_column(Integer, nullable=False, index=True)

    # Experiment status: "completed" | "failed" | "not_available"
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="not_available")

    # Metrics — null until a successful evaluation run
    mf1: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    precision: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    recall: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    iou: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    latency: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    vlm_calls: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Classification-specific metric (null for OBJECT_DETECTION experiments)
    accuracy: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Task type: 'object_detection' | 'cell_classification'
    task_type: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)

    # Experiment statistics
    image_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    failed_images: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Reproducibility metadata
    iou_threshold: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    vlm_model: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    # Failure details (populated when status != "completed")
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    def __repr__(self) -> str:
        return (
            f"<BenchmarkResult id={self.id} dataset='{self.dataset}' "
            f"shots={self.shots} task='{self.task_type}' mF1={self.mf1} acc={self.accuracy} status='{self.status}'>"
        )
