from fastapi import APIRouter
from app.api.routes.health import router as health_router
from app.api.routes.system import router as system_router
from app.api.routes.auth import router as auth_router
from app.api.routes.analysis import router as analysis_router
from app.api.routes.dataset import router as dataset_router
from app.api.routes.benchmark import router as benchmark_router

api_router = APIRouter()

api_router.include_router(health_router)
api_router.include_router(system_router)
api_router.include_router(auth_router)
api_router.include_router(analysis_router)
api_router.include_router(dataset_router)
api_router.include_router(benchmark_router)

__all__ = ["api_router"]


