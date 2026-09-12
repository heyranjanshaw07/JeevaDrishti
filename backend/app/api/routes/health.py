from fastapi import APIRouter
from app.core.config import settings
from app.schemas.common import HealthResponse

router = APIRouter(tags=["Health"])


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Health check endpoint",
    description="Returns the current operational health of the JeevaDrishti backend service.",
)
async def get_health() -> HealthResponse:
    """Return health status of the JeevaDrishti backend."""
    return HealthResponse(
        status="healthy",
        service="jeevadrishti-backend",
        version=settings.APP_VERSION,
    )
