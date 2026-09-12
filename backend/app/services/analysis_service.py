from typing import List, Tuple
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.analysis import Analysis, UploadedFile
from app.schemas.analysis import AnalysisCreate, SUPPORTED_DATASETS, SUPPORTED_SHOTS
from app.services.storage_service import delete_uploaded_file


def get_uploaded_file_by_id(db: Session, file_id: str) -> UploadedFile | None:
    """Retrieve an UploadedFile record by its ID."""
    return db.scalars(select(UploadedFile).where(UploadedFile.id == file_id)).first()


def create_analysis(
    db: Session,
    user_id: int,
    analysis_in: AnalysisCreate,
) -> Analysis:
    """Create a new pending cell detection analysis record."""
    # 1. Validate dataset
    if analysis_in.dataset not in SUPPORTED_DATASETS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported dataset '{analysis_in.dataset}'. Allowed: {', '.join(SUPPORTED_DATASETS)}",
        )

    # 2. Validate shots
    if analysis_in.shots not in SUPPORTED_SHOTS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported shots configuration '{analysis_in.shots}'. Allowed: {', '.join(map(str, SUPPORTED_SHOTS))}",
        )

    # 3. Verify file exists and belongs to current user
    file_record = get_uploaded_file_by_id(db, analysis_in.file_id)
    if not file_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Referenced image file not found.",
        )

    if file_record.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: file belongs to another researcher.",
        )

    # 4. Create Analysis record
    analysis = Analysis(
        user_id=user_id,
        file_id=analysis_in.file_id,
        dataset=analysis_in.dataset,
        shots=analysis_in.shots,
        vlm_model=analysis_in.vlm_model,
        status="pending",
    )
    db.add(analysis)
    db.commit()
    db.refresh(analysis)
    return analysis


def get_analysis_by_id(
    db: Session,
    analysis_id: str,
    user_id: int,
) -> Analysis:
    """Retrieve an analysis record and enforce user ownership."""
    analysis = db.scalars(select(Analysis).where(Analysis.id == analysis_id)).first()
    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis not found.",
        )

    if analysis.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: analysis belongs to another researcher.",
        )

    return analysis


def list_user_analyses(
    db: Session,
    user_id: int,
    page: int = 1,
    page_size: int = 20,
) -> Tuple[List[Analysis], int]:
    """Retrieve paginated analysis history for a user, ordered newest first."""
    if page < 1:
        page = 1
    if page_size < 1 or page_size > 100:
        page_size = 20

    # Total count
    count_stmt = select(func.count()).select_from(Analysis).where(Analysis.user_id == user_id)
    total = db.scalar(count_stmt) or 0

    # Items
    items_stmt = (
        select(Analysis)
        .where(Analysis.user_id == user_id)
        .order_by(Analysis.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    items = list(db.scalars(items_stmt).all())
    return items, total


def delete_analysis(
    db: Session,
    analysis_id: str,
    user_id: int,
) -> None:
    """Delete an analysis record and its associated uploaded file from disk and DB."""
    analysis = get_analysis_by_id(db, analysis_id, user_id)
    file_record = get_uploaded_file_by_id(db, analysis.file_id)

    # Delete analysis record
    db.delete(analysis)
    db.commit()

    # Safely delete associated file if no other analyses reference it
    if file_record:
        remaining_analyses = db.scalar(
            select(func.count()).select_from(Analysis).where(Analysis.file_id == file_record.id)
        )
        if remaining_analyses == 0:
            delete_uploaded_file(file_record, db)


def execute_analysis(
    db: Session,
    analysis_id: str,
    user_id: int,
    vlm_override: Optional[Any] = None,
    sam_override: Optional[Any] = None,
) -> Analysis:
    """
    Execute hybrid SAM-VLM cell detection pipeline for a given analysis.
    Transitions status: pending -> processing -> completed / failed.
    """
    import json
    from datetime import datetime, timezone
    from app.core.config import settings
    from app.core.logging import logger
    from app.services.inference import (
        run_hybrid_inference,
        AIModelUnavailableError,
        VLMNotConfiguredError,
        HybridInferenceError,
    )

    analysis = get_analysis_by_id(db, analysis_id, user_id)
    file_record = get_uploaded_file_by_id(db, analysis.file_id)
    if not file_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Associated microscopy image record was not found.",
        )

    file_path = settings.upload_path / file_record.stored_filename
    if not file_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Microscopy image file is missing from storage.",
        )

    # Set status to processing
    analysis.status = "processing"
    analysis.error_message = None
    db.commit()
    db.refresh(analysis)

    # 1. Microscopy Validation Layer
    from app.services.inference.microscopy_validator import microscopy_validator
    validation = microscopy_validator.validate(file_path, vlm_provider=vlm_override)
    if not validation.is_valid:
        analysis.status = "rejected"
        analysis.error_message = validation.message
        analysis.completed_at = datetime.now(timezone.utc)
        result_payload = {
            "status": "rejected",
            "reason": validation.reason or "non_microscopy_image",
            "message": validation.message or "The uploaded image does not appear to be a microscopy image.",
            "detections": [],
            "boxes": [],
            "metrics": None,
            "prediction": "Non-Microscopy Image",
            "confidence": None,
            "indicators": [],
            "explanation": validation.message or "The uploaded image does not appear to be a microscopy image. Biological cell detection was not executed.",
            "metadata": validation.details,
        }
        analysis.result_data = json.dumps(result_payload)
        db.commit()
        db.refresh(analysis)
        return analysis

    try:
        sam_provider = sam_override
        if not sam_provider and analysis.vlm_model in ("optical", "optical-vlm", "mock"):
            from app.services.inference.sam_service import sam_service as default_sam
            class OpticalSAMProvider:
                def generate_proposals(self, image, max_candidates=15, padding=10):
                    return default_sam.generate_optical_proposals(image, max_candidates=max_candidates, padding=padding)
            sam_provider = OpticalSAMProvider()

        inference_output = run_hybrid_inference(
            image=file_path,
            dataset=analysis.dataset,
            shots=analysis.shots,
            model=analysis.vlm_model,
            sam_provider=sam_provider,
            vlm_provider=vlm_override,
            analysis_id=analysis.id,
        )
        analysis.status = "completed"
        analysis.completed_at = datetime.now(timezone.utc)
        analysis.overlay_filename = inference_output.get("overlay")
        analysis.result_data = json.dumps(inference_output)
        analysis.error_message = None
        db.commit()
        db.refresh(analysis)
    except (AIModelUnavailableError, VLMNotConfiguredError, HybridInferenceError) as exc:
        err_msg = getattr(exc, "message", str(exc))
        logger.warning("Controlled inference failure for analysis %s: %s", analysis.id, err_msg)
        analysis.status = "failed"
        analysis.error_message = err_msg
        analysis.completed_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(analysis)
    except Exception as exc:
        logger.error("Unexpected failure running inference for analysis %s: %s", analysis.id, str(exc))
        analysis.status = "failed"
        analysis.error_message = "Internal inference pipeline failure occurred."
        analysis.completed_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(analysis)

    return analysis


def get_analysis_results(
    db: Session,
    analysis_id: str,
    user_id: int,
) -> "AnalysisResultsResponse":
    """Retrieve full analysis detection results and overlay references."""
    import json
    from app.schemas.analysis import AnalysisResultsResponse, DetectionItem

    analysis = get_analysis_by_id(db, analysis_id, user_id)

    boxes = []
    detections = []
    metadata = {}
    prediction = None
    confidence = None
    explanation = None
    indicators = []
    overlay_available = bool(analysis.overlay_filename)

    if analysis.status == "rejected":
        data = {}
        if analysis.result_data:
            try:
                data = json.loads(analysis.result_data)
            except Exception:
                pass
        return AnalysisResultsResponse(
            analysis_id=analysis.id,
            status="rejected",
            reason=data.get("reason", "non_microscopy_image"),
            message=data.get("message", "The uploaded image does not appear to be a microscopy image."),
            dataset=analysis.dataset,
            shots=analysis.shots,
            vlm_model=analysis.vlm_model,
            boxes=[],
            detections=[],
            overlay_available=False,
            overlay_url=None,
            error_message=analysis.error_message,
            created_at=analysis.created_at,
            completed_at=analysis.completed_at,
            metadata=data.get("metadata", {}),
            metrics=None,
            prediction="Non-Microscopy Image",
            confidence=None,
            explanation=data.get("explanation", data.get("message", "The uploaded image does not appear to be a microscopy image.")),
            indicators=[],
        )

    if analysis.status == "completed" and analysis.result_data:
        try:
            data = json.loads(analysis.result_data)
            boxes = data.get("boxes", [])
            raw_dets = data.get("detections", [])
            detections = [
                DetectionItem(
                    label=d["label"],
                    bbox=d["bbox"],
                    confidence=float(d.get("confidence", 0.0)),
                )
                for d in raw_dets
            ]
            metadata = data.get("metadata", {})
            prediction = data.get("prediction")
            confidence = data.get("confidence")
            explanation = data.get("explanation")
            indicators = data.get("indicators", [])
        except Exception:
            pass

    avg_conf = None
    if detections:
        avg_conf = round(sum(d.confidence for d in detections) / len(detections), 4)

    if confidence is None and detections:
        confidence = avg_conf

    if analysis.status == "completed" and not prediction:
        if len(detections) == 0:
            prediction = "Unable to determine"
            explanation = "Unable to determine: no distinctive cell structures were recognized by the model."
        else:
            dominant = detections[0].label if detections else "Cellular"
            prediction = f"{dominant} Specimen"
            explanation = f"Detected {len(detections)} cellular instances with {round((avg_conf or 0.0) * 100, 1)}% mean confidence."

    overlay_url = f"/api/v1/analysis/{analysis.id}/overlay" if overlay_available else None

    metrics = {
        "detected_count": len(detections),
        "avg_confidence": avg_conf if avg_conf is not None else metadata.get("avg_confidence"),
        "precision": metadata.get("precision"),
        "recall": metadata.get("recall"),
        "mAP50": metadata.get("mAP50"),
        "inference_time_ms": metadata.get("inference_time_ms"),
        "vlm_calls": metadata.get("vlm_calls", len(boxes) if boxes else 0),
    }

    return AnalysisResultsResponse(
        analysis_id=analysis.id,
        status=analysis.status,
        dataset=analysis.dataset,
        shots=analysis.shots,
        vlm_model=analysis.vlm_model,
        boxes=boxes,
        detections=detections,
        overlay_available=overlay_available,
        overlay_url=overlay_url,
        error_message=analysis.error_message,
        created_at=analysis.created_at,
        completed_at=analysis.completed_at,
        metadata=metadata,
        metrics=metrics,
        prediction=prediction,
        confidence=confidence,
        explanation=explanation,
        indicators=indicators,
        reason=None,
        message=None,
    )

