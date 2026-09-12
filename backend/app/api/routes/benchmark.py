from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.deps import require_role
from app.db.session import get_db
from app.models.user import User
from app.schemas.benchmark import (
    BenchmarkConfigResponse,
    BenchmarkResultsResponse,
    BenchmarkRunRequest,
    BenchmarkRunResponse,
    BenchmarkSummaryResponse,
)
from app.services.benchmark_service import (
    get_benchmark_config,
    get_benchmark_summary,
    get_benchmark_results,
    run_benchmark_experiment,
)

router = APIRouter(prefix="/benchmark", tags=["Benchmark & Evaluation"])


@router.get(
    "/config",
    response_model=BenchmarkConfigResponse,
    status_code=status.HTTP_200_OK,
    summary="Get benchmark configuration",
    description="Returns supported benchmark datasets, zero/few-shot configurations (0, 1, 3, 6), and evaluation metrics.",
)
def retrieve_benchmark_config() -> BenchmarkConfigResponse:
    return get_benchmark_config()


@router.get(
    "/results",
    response_model=BenchmarkResultsResponse,
    status_code=status.HTTP_200_OK,
    summary="Get stored benchmark results",
    description="Returns real evaluated benchmark results filtered by dataset and shots. Returns status 'not_evaluated' if no real experiments have been run.",
)
def retrieve_benchmark_results(
    dataset: Optional[str] = Query(None, description="Optional dataset filter (e.g. Micro-OD, BBBC)"),
    shots: Optional[int] = Query(None, description="Optional shot count filter (0, 1, 3, 6)"),
    db: Session = Depends(get_db),
) -> BenchmarkResultsResponse:
    return get_benchmark_results(db=db, dataset=dataset, shots=shots)


@router.get(
    "/summary",
    response_model=BenchmarkSummaryResponse,
    status_code=status.HTTP_200_OK,
    summary="Get benchmark execution summary",
    description="Returns current evaluation status and configuration overview. Metrics remain not_evaluated until real evaluation is executed.",
)
def retrieve_benchmark_summary() -> BenchmarkSummaryResponse:
    return get_benchmark_summary()


@router.post(
    "/run",
    response_model=BenchmarkRunResponse,
    status_code=status.HTTP_200_OK,
    summary="Run benchmark experiment",
    description="Executes a real Micro-OD benchmark evaluation for the specified dataset and shot configuration. Requires authentication.",
)
def execute_benchmark_experiment(
    payload: BenchmarkRunRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "researcher"])),
) -> BenchmarkRunResponse:
    return run_benchmark_experiment(db=db, dataset=payload.dataset, shots=payload.shots)

