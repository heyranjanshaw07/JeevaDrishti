from pathlib import Path
from typing import Optional
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from fastapi.responses import FileResponse, Response
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy.orm import Session


from app.core.config import settings
from app.db.session import get_db
from app.models.user import User
from app.api.deps import get_current_active_user, security_bearer
from app.schemas.analysis import (
    UploadResponse,
    AnalysisCreate,
    AnalysisCreateResponse,
    AnalysisResponse,
    AnalysisListResponse,
    AnalysisRunResponse,
    AnalysisResultsResponse,
)
from app.services.storage_service import validate_and_save_image
from app.services.analysis_service import (
    create_analysis,
    get_analysis_by_id,
    list_user_analyses,
    delete_analysis,
    execute_analysis,
    get_analysis_results,
)

router = APIRouter(prefix="/analysis", tags=["Microscopy Analysis"])


@router.post(
    "/upload",
    response_model=UploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload and validate a microscopy image",
    description=(
        "Accepts PNG or JPEG microscopy images up to MAX_UPLOAD_SIZE_MB. "
        "Verifies image integrity using Pillow, extracts dimensions, and stores "
        "the file with a unique server-generated ID without exposing filesystem paths."
    ),
)
async def upload_image(
    file: UploadFile = File(..., description="Microscopy image file (PNG/JPG/JPEG)"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> UploadResponse:
    """Upload and validate microscopy image."""
    uploaded_file = validate_and_save_image(file=file, user_id=current_user.id, db=db)
    return UploadResponse(
        file_id=uploaded_file.id,
        filename=uploaded_file.original_filename,
        content_type=uploaded_file.content_type,
        size=uploaded_file.size,
        status="uploaded",
    )


@router.post(
    "",
    response_model=AnalysisCreateResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Initiate a microscopy analysis record",
    description=(
        "Registers a cell detection analysis execution with configured few-shot count (0, 1, 3, 6) "
        "and dataset benchmark profile. AI inference status is initialized as 'pending'."
    ),
)
async def create_analysis_record(
    analysis_in: AnalysisCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> AnalysisCreateResponse:
    """Create a new analysis record linked to an uploaded file."""
    analysis = create_analysis(db=db, user_id=current_user.id, analysis_in=analysis_in)
    return AnalysisCreateResponse(
        analysis_id=analysis.id,
        status=analysis.status,
        dataset=analysis.dataset,
        shots=analysis.shots,
    )


@router.get(
    "/{analysis_id}",
    response_model=AnalysisResponse,
    summary="Retrieve analysis status and metadata",
    description="Returns execution status, timestamps, and parameters for the specified analysis.",
)
async def get_analysis_status(
    analysis_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> AnalysisResponse:
    """Get status and details of an analysis owned by the current user."""
    analysis = get_analysis_by_id(db=db, analysis_id=analysis_id, user_id=current_user.id)
    return AnalysisResponse(
        analysis_id=analysis.id,
        status=analysis.status,
        dataset=analysis.dataset,
        shots=analysis.shots,
        vlm_model=analysis.vlm_model,
        created_at=analysis.created_at,
        completed_at=analysis.completed_at,
    )


@router.get(
    "",
    response_model=AnalysisListResponse,
    summary="List analysis history",
    description="Returns a paginated list of analyses performed by the authenticated user, newest first.",
)
async def list_analyses(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> AnalysisListResponse:
    """List paginated analysis history for the current user."""
    items, total = list_user_analyses(
        db=db, user_id=current_user.id, page=page, page_size=page_size
    )
    formatted_items = [
        AnalysisResponse(
            analysis_id=a.id,
            status=a.status,
            dataset=a.dataset,
            shots=a.shots,
            vlm_model=a.vlm_model,
            created_at=a.created_at,
            completed_at=a.completed_at,
        )
        for a in items
    ]
    return AnalysisListResponse(
        items=formatted_items,
        page=page,
        page_size=page_size,
        total=total,
    )


@router.delete(
    "/{analysis_id}",
    summary="Delete an analysis and associated image",
    description="Deletes an analysis record and cleans up the associated uploaded image from storage.",
)
async def delete_analysis_record(
    analysis_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> dict:
    """Delete an analysis owned by the current user."""
    delete_analysis(db=db, analysis_id=analysis_id, user_id=current_user.id)
    return {
        "message": "Analysis and associated file successfully deleted.",
        "analysis_id": analysis_id,
    }


@router.post(
    "/{analysis_id}/run",
    response_model=AnalysisRunResponse,
    status_code=status.HTTP_200_OK,
    summary="Execute hybrid SAM-VLM cell detection",
    description="Runs the hybrid inference engine (SAM proposals -> candidate regions -> VLM classification -> overlay).",
)
def run_analysis_execution(
    analysis_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> AnalysisRunResponse:
    """Trigger synchronous execution of the hybrid cell detection pipeline."""
    analysis = execute_analysis(db=db, analysis_id=analysis_id, user_id=current_user.id)
    msg = (
        analysis.error_message
        if analysis.status in ("failed", "rejected")
        else f"Analysis execution status: {analysis.status}."
    )
    return AnalysisRunResponse(
        analysis_id=analysis.id,
        status=analysis.status,
        message=msg,
    )


@router.get(
    "/{analysis_id}/results",
    response_model=AnalysisResultsResponse,
    status_code=status.HTTP_200_OK,
    summary="Get analysis detection results",
    description="Retrieves detection bounding boxes, classifications, model confidence, and overlay status.",
)
def retrieve_analysis_results(
    analysis_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> AnalysisResultsResponse:
    """Retrieve full cell detection results for an analysis."""
    return get_analysis_results(db=db, analysis_id=analysis_id, user_id=current_user.id)


@router.get(
    "/{analysis_id}/overlay",
    summary="Retrieve visual detection overlay image",
    description="Returns the visual PNG overlay with detected bounding boxes and class labels rendered.",
)
def retrieve_analysis_overlay(
    analysis_id: str,
    token: Optional[str] = Query(None, description="Access token query parameter for <img> tags"),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
    db: Session = Depends(get_db),
) -> FileResponse:
    """Serve the generated visual detection overlay PNG."""
    from app.core.security import decode_access_token
    from app.services.auth import get_user_by_id

    raw_token = credentials.credentials if credentials else token
    if not raw_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token is missing.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    payload = decode_access_token(raw_token)
    if not payload or not payload.get("sub"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token.",
        )
    try:
        user_id = int(payload["sub"])
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed token subject identifier.",
        )
    user = get_user_by_id(db, user_id)
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive.",
        )

    analysis = get_analysis_by_id(db, analysis_id, user.id)
    if not analysis.overlay_filename:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Visual overlay has not been generated for this analysis.",
        )

    overlay_rel = Path(analysis.overlay_filename)
    # Prevent traversal above upload directory
    overlay_path = (settings.upload_path / overlay_rel).resolve()
    base_upload_dir = settings.upload_path.resolve()

    if not str(overlay_path).startswith(str(base_upload_dir)) or not overlay_path.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Overlay file is missing from storage.",
        )

    return FileResponse(overlay_path, media_type="image/png")


@router.get(
    "/{analysis_id}/report",
    summary="Download or view research analysis report as PDF",
    description="Generates and streams a verified PDF report containing strictly real analysis and detection data.",
)
def download_analysis_report(
    analysis_id: str,
    token: Optional[str] = Query(None, description="Access token query parameter for direct browser tab viewing"),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
    db: Session = Depends(get_db),
) -> Response:
    """Generate and return publication-grade PDF analysis report."""
    from app.core.security import decode_access_token
    from app.services.auth import get_user_by_id
    from app.services.report_service import generate_analysis_pdf_bytes

    raw_token = credentials.credentials if credentials else token
    if not raw_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token is missing.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    payload = decode_access_token(raw_token)
    if not payload or not payload.get("sub"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token.",
        )
    try:
        user_id = int(payload["sub"])
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed token subject identifier.",
        )
    user = get_user_by_id(db, user_id)
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive.",
        )

    # Enforce ownership and generate PDF bytes
    analysis = get_analysis_by_id(db, analysis_id, user.id)
    pdf_bytes = generate_analysis_pdf_bytes(
        analysis_id=analysis.id,
        user_id=user.id,
        db=db,
    )

    filename = f"jeevadrishti_report_{analysis.id[:8]}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'inline; filename="{filename}"',
            "Cache-Control": "no-cache, no-store, must-revalidate",
        },
    )
