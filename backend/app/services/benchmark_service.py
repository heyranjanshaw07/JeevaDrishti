from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.benchmark import BenchmarkResult
from app.schemas.benchmark import (
    BenchmarkConfigResponse,
    BenchmarkItem,
    BenchmarkResultsResponse,
    BenchmarkRunResponse,
    BenchmarkSummaryResponse,
)
from app.services.benchmark.runner import run_benchmark

SUPPORTED_BENCHMARK_DATASETS: List[str] = ["Micro-OD", "BBBC", "BCCD", "LIVECell", "NIH-3T3"]
SUPPORTED_SHOT_CONFIGS: List[int] = [0, 1, 3, 6]
STANDARD_METRICS: List[str] = ["mF1", "Precision", "Recall", "IoU", "Latency", "VLM Calls"]


def get_benchmark_config() -> BenchmarkConfigResponse:
    """Return benchmark configuration describing evaluation parameters."""
    return BenchmarkConfigResponse(
        datasets=SUPPORTED_BENCHMARK_DATASETS,
        shot_configs=SUPPORTED_SHOT_CONFIGS,
        metrics=STANDARD_METRICS,
    )


def get_benchmark_summary() -> BenchmarkSummaryResponse:
    """Return current benchmark execution summary and availability status."""
    return BenchmarkSummaryResponse(
        status="not_evaluated",
        datasets=4,
        shot_configs=SUPPORTED_SHOT_CONFIGS,
    )


def get_benchmark_results(
    db: Session,
    dataset: Optional[str] = None,
    shots: Optional[int] = None,
) -> BenchmarkResultsResponse:
    """Query stored real benchmark experiment results with validation."""
    statement = select(BenchmarkResult)

    if dataset is not None:
        dataset_normalized = dataset.strip()
        matched = next((d for d in SUPPORTED_BENCHMARK_DATASETS if d.lower() == dataset_normalized.lower()), None)
        if not matched:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported dataset filter '{dataset}'. Allowed: {', '.join(SUPPORTED_BENCHMARK_DATASETS)}",
            )
        statement = statement.where(BenchmarkResult.dataset == matched)

    if shots is not None:
        if shots not in SUPPORTED_SHOT_CONFIGS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported shots filter '{shots}'. Allowed: {', '.join(map(str, SUPPORTED_SHOT_CONFIGS))}",
            )
        statement = statement.where(BenchmarkResult.shots == shots)

    statement = statement.order_by(BenchmarkResult.created_at.desc())
    results = list(db.scalars(statement).all())

    items = [BenchmarkItem.model_validate(r) for r in results]
    evaluation_status = "evaluated" if items else "not_evaluated"

    return BenchmarkResultsResponse(
        items=items,
        total=len(items),
        status=evaluation_status,
    )


def run_benchmark_experiment(
    db: Session,
    dataset: str,
    shots: int,
) -> BenchmarkRunResponse:
    """Execute a single benchmark experiment and persist results."""
    dataset_clean = dataset.strip()
    matched = next((d for d in SUPPORTED_BENCHMARK_DATASETS if d.lower() == dataset_clean.lower()), None)
    if not matched:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported dataset '{dataset}'. Allowed: {', '.join(SUPPORTED_BENCHMARK_DATASETS)}",
        )

    if shots not in SUPPORTED_SHOT_CONFIGS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported shots count '{shots}'. Allowed: {', '.join(map(str, SUPPORTED_SHOT_CONFIGS))}",
        )

    result = run_benchmark(dataset=matched, shots=shots, db=db)
    summary = result.summary()
    summary["error_message"] = result.error_message
    return BenchmarkRunResponse(**summary)

