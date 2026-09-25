from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.benchmark import BenchmarkResult
from app.schemas.benchmark import (
    BenchmarkConfigResponse,
    BenchmarkItem,
    BenchmarkMatrixCell,
    BenchmarkMatrixResponse,
    BenchmarkResultsResponse,
    BenchmarkRunRequest,
    BenchmarkRunResponse,
    BenchmarkSummaryResponse,
)
from app.services.benchmark.runner import run_benchmark
from app.services.datasets.registry import DATASET_REGISTRY

# Canonical datasets in the adapter registry (for 5×2 evaluation matrix)
CANONICAL_BENCHMARK_DATASETS: List[str] = list(DATASET_REGISTRY.keys())

# All supported benchmark datasets including canonical IDs, legacy aliases, and Micro-OD sub-datasets
SUPPORTED_BENCHMARK_DATASETS: List[str] = [
    "micro_od",
    "Micro-OD",
    "nih_nlm_malaria",
    "c_nmc_2019",
    "redtell_anemia",
    "sipakmed",
    "BBBC",
    "BCCD",
    "LIVECell",
    "NIH-3T3",
]
SUPPORTED_SHOT_CONFIGS: List[int] = [0, 6]
# Standard metrics vary by task type — shown here as the superset
STANDARD_METRICS: List[str] = ["mF1", "Accuracy", "Precision", "Recall", "IoU", "Latency", "VLM Calls"]


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
        datasets=len(CANONICAL_BENCHMARK_DATASETS),
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
        from sqlalchemy import or_
        dataset_normalized = dataset.strip()
        matched = next((d for d in SUPPORTED_BENCHMARK_DATASETS if d.lower() == dataset_normalized.lower()), None)
        if not matched:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported dataset filter '{dataset}'. Allowed: {', '.join(SUPPORTED_BENCHMARK_DATASETS)}",
            )
        ds_filters = [
            BenchmarkResult.dataset == matched,
            BenchmarkResult.dataset.ilike(dataset_normalized),
        ]
        if dataset_normalized.lower() in ("micro_od", "micro-od"):
            ds_filters.extend([
                BenchmarkResult.dataset.ilike("micro_od"),
                BenchmarkResult.dataset.ilike("Micro-OD"),
            ])
        statement = statement.where(or_(*ds_filters))

    if shots is not None:
        if shots not in SUPPORTED_SHOT_CONFIGS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported shots filter '{shots}'. Allowed: {', '.join(map(str, SUPPORTED_SHOT_CONFIGS))}",
            )
        statement = statement.where(BenchmarkResult.shots == shots)
    else:
        # Only active configurations (0 and 6) appear as active benchmark results
        statement = statement.where(BenchmarkResult.shots.in_(SUPPORTED_SHOT_CONFIGS))

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


def get_benchmark_matrix(db: Session) -> BenchmarkMatrixResponse:
    """
    Build the 5×2 Dataset × Shot evaluation matrix.

    Each cell represents one (dataset, shots) combination.
    Metrics are task-aware:
    - OBJECT_DETECTION cells: iou, mf1, precision, recall populated; accuracy = null.
    - CELL_CLASSIFICATION cells: accuracy populated; iou = null.

    Only real evaluated results are shown. Unevaluated cells have status='not_evaluated'
    with all metrics set to null.
    """
    from app.services.datasets.base import TaskType

    # Load all stored results from DB
    statement = select(BenchmarkResult).where(
        BenchmarkResult.shots.in_(SUPPORTED_SHOT_CONFIGS)
    )
    db_results = {}
    for r in db.scalars(statement).all():
        db_results[(r.dataset, r.shots)] = r
        db_results[(r.dataset.lower(), r.shots)] = r
        if r.dataset.lower() == "micro-od":
            db_results[("micro_od", r.shots)] = r
        elif r.dataset.lower() == "micro_od":
            db_results[("Micro-OD", r.shots)] = r

    cells: List[BenchmarkMatrixCell] = []
    for dataset_id in CANONICAL_BENCHMARK_DATASETS:
        adapter = DATASET_REGISTRY.get(dataset_id)
        task_type = adapter.task_type.value if adapter else "object_detection"
        display_name = adapter.display_name if adapter else dataset_id

        for shots in SUPPORTED_SHOT_CONFIGS:
            db_row = db_results.get((dataset_id, shots)) or db_results.get((dataset_id.lower(), shots))
            if db_row and db_row.status == "completed":
                # Enforce task-type metric constraints
                if task_type == TaskType.OBJECT_DETECTION.value:
                    cell = BenchmarkMatrixCell(
                        dataset=dataset_id,
                        dataset_display_name=display_name,
                        shots=shots,
                        task_type=task_type,
                        status="evaluated",
                        mf1=db_row.mf1,
                        precision=db_row.precision,
                        recall=db_row.recall,
                        iou=db_row.iou,
                        accuracy=None,       # null for detection
                        latency=db_row.latency,
                        vlm_calls=db_row.vlm_calls,
                    )
                else:
                    cell = BenchmarkMatrixCell(
                        dataset=dataset_id,
                        dataset_display_name=display_name,
                        shots=shots,
                        task_type=task_type,
                        status="evaluated",
                        mf1=db_row.mf1,            # Macro F1
                        iou=None,            # NEVER calculate IoU for classification
                        precision=db_row.precision,
                        recall=db_row.recall,
                        accuracy=db_row.accuracy,
                        latency=db_row.latency,
                        vlm_calls=db_row.vlm_calls,
                    )
            elif db_row and db_row.status == "not_available":
                cell = BenchmarkMatrixCell(
                    dataset=dataset_id,
                    dataset_display_name=display_name,
                    shots=shots,
                    task_type=task_type,
                    status="not_available",
                    error_message=db_row.error_message,
                )
            else:
                cell = BenchmarkMatrixCell(
                    dataset=dataset_id,
                    dataset_display_name=display_name,
                    shots=shots,
                    task_type=task_type,
                    status="not_evaluated",
                )
            cells.append(cell)

    evaluated = sum(1 for c in cells if c.status == "evaluated")
    return BenchmarkMatrixResponse(
        cells=cells,
        datasets=CANONICAL_BENCHMARK_DATASETS,
        shot_configs=SUPPORTED_SHOT_CONFIGS,
        total_cells=len(cells),
        evaluated_cells=evaluated,
    )
