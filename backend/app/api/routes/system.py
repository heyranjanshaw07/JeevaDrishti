from fastapi import APIRouter
from app.schemas.common import SystemStatusResponse

router = APIRouter(prefix="/system", tags=["System"])


@router.get(
    "/status",
    response_model=SystemStatusResponse,
    summary="System readiness status",
    description=(
        "Returns architectural component readiness. AI engine is explicitly "
        "'pending' prior to SAM and VLM integration."
    ),
)
async def get_system_status() -> SystemStatusResponse:
    """Return component readiness status."""
    return SystemStatusResponse(
        backend="ready",
        database="configured",
        ai_engine="pending",
        storage="configured",
    )
