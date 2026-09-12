import json
import uuid
from datetime import datetime, timezone
from pathlib import Path
from PIL import Image

from app.models.user import User
from app.models.analysis import UploadedFile, Analysis
from app.core.config import settings
from tests.conftest import TestingSessionLocal, client
from tests.test_analysis import create_authenticated_user, create_test_image


def create_analysis_record(
    user_id: int,
    status: str = "completed",
    detections: list = None,
    error_message: str = None,
    with_overlay: bool = True,
) -> tuple[str, str]:
    """Helper to seed an UploadedFile and Analysis record."""
    db = TestingSessionLocal()
    try:
        # Create physical test image file
        file_id = str(uuid.uuid4())
        filename = f"{file_id}.png"
        file_path = settings.upload_path / filename
        img = Image.new("RGB", (256, 256), color="blue")
        img.save(file_path, "PNG")

        uploaded_file = UploadedFile(
            id=file_id,
            user_id=user_id,
            original_filename="specimen_sample.png",
            stored_filename=filename,
            content_type="image/png",
            size=len(file_path.read_bytes()),
            width=256,
            height=256,
            format="PNG",
        )
        db.add(uploaded_file)

        overlay_rel = None
        if with_overlay and status == "completed":
            overlay_rel = f"overlay_{file_id}.png"
            overlay_path = settings.upload_path / overlay_rel
            img.save(overlay_path, "PNG")

        result_payload = None
        if status == "completed":
            dets = detections if detections is not None else [
                {"label": "WBC", "bbox": [10, 20, 80, 90], "confidence": 0.942},
                {"label": "RBC", "bbox": [100, 110, 150, 160], "confidence": 0.885},
            ]
            result_payload = json.dumps({
                "boxes": [d["bbox"] for d in dets],
                "detections": dets,
                "prediction": "WBC Specimen",
                "confidence": 0.9135,
                "explanation": "Detected 2 cellular instances with 91.4% mean confidence.",
                "indicators": ["Granular cytoplasm", "Polymorphic nucleus"],
                "metadata": {
                    "precision": 0.92,
                    "recall": 0.89,
                    "mAP50": 0.915,
                    "inference_time_ms": 142.5,
                    "vlm_calls": 2,
                },
                "overlay": overlay_rel,
            })
        elif status == "rejected":
            result_payload = json.dumps({
                "status": "rejected",
                "reason": "non_microscopy_image",
                "message": "The uploaded image does not appear to be a microscopy image.",
                "detections": [],
                "boxes": [],
                "metrics": None,
                "prediction": "Non-Microscopy Image",
                "indicators": [],
                "explanation": "The uploaded image does not appear to be a microscopy image.",
            })

        analysis = Analysis(
            id=str(uuid.uuid4()),
            user_id=user_id,
            file_id=file_id,
            dataset="Micro-OD",
            shots=6,
            vlm_model="optical",
            status=status,
            error_message=error_message,
            overlay_filename=overlay_rel,
            result_data=result_payload,
            created_at=datetime.now(timezone.utc),
            completed_at=datetime.now(timezone.utc) if status in ("completed", "failed", "rejected") else None,
        )
        db.add(analysis)
        db.commit()
        db.refresh(analysis)
        return analysis.id, file_id
    finally:
        db.close()


def test_download_report_completed_analysis():
    user_id, token = create_authenticated_user(email="report_user1@test.org")
    analysis_id, _ = create_analysis_record(user_id=user_id, status="completed")

    response = client.get(
        f"/api/v1/analysis/{analysis_id}/report",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert "inline" in response.headers["content-disposition"]
    assert response.headers["content-disposition"].endswith('.pdf"')
    assert response.content.startswith(b"%PDF-")


def test_download_report_via_token_query_param():
    user_id, token = create_authenticated_user(email="report_user2@test.org")
    analysis_id, _ = create_analysis_record(user_id=user_id, status="completed")

    # Access without Authorization header, using ?token= query param (browser tab pattern)
    response = client.get(f"/api/v1/analysis/{analysis_id}/report?token={token}")
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert response.content.startswith(b"%PDF-")


def test_download_report_failed_analysis():
    user_id, token = create_authenticated_user(email="report_user3@test.org")
    analysis_id, _ = create_analysis_record(
        user_id=user_id,
        status="failed",
        error_message="Model inference server timed out",
    )

    response = client.get(
        f"/api/v1/analysis/{analysis_id}/report",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert response.content.startswith(b"%PDF-")


def test_download_report_rejected_analysis():
    user_id, token = create_authenticated_user(email="report_user4@test.org")
    analysis_id, _ = create_analysis_record(
        user_id=user_id,
        status="rejected",
    )

    response = client.get(
        f"/api/v1/analysis/{analysis_id}/report",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert response.content.startswith(b"%PDF-")


def test_download_report_unauthorized_and_forbidden():
    user1_id, token1 = create_authenticated_user(email="report_owner@test.org")
    user2_id, token2 = create_authenticated_user(email="report_intruder@test.org")
    analysis_id, _ = create_analysis_record(user_id=user1_id, status="completed")

    # 1. No token at all -> 401
    resp_no_auth = client.get(f"/api/v1/analysis/{analysis_id}/report")
    assert resp_no_auth.status_code == 401

    # 2. Access with another user's token -> 403 Forbidden
    resp_forbidden = client.get(
        f"/api/v1/analysis/{analysis_id}/report",
        headers={"Authorization": f"Bearer {token2}"},
    )
    assert resp_forbidden.status_code == 403
