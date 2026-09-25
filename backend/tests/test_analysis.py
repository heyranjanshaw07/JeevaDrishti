import io
from pathlib import Path
import pytest
from PIL import Image

from app.models.user import User
from app.models.analysis import UploadedFile, Analysis
from app.core.config import settings
from app.core.security import hash_password, create_access_token
from tests.conftest import TestingSessionLocal, client



def create_test_image(img_format: str = "PNG", size=(128, 128), color="red") -> bytes:
    """Helper to generate valid in-memory microscopy test image bytes."""
    buf = io.BytesIO()
    image = Image.new("RGB", size, color=color)
    image.save(buf, format=img_format)
    return buf.getvalue()


def create_authenticated_user(email="researcher1@jeevadrishti.org", name="Dr. Researcher One") -> tuple[int, str]:
    """Helper to seed an active researcher and return (user_id, token)."""
    db = TestingSessionLocal()
    try:
        user = User(
            name=name,
            email=email,
            hashed_password=hash_password("SecurePassword123!"),
            role="researcher",
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        user_id = user.id
    finally:
        db.close()

    token = create_access_token({"sub": str(user_id), "email": email, "role": "researcher"})
    return user_id, token


# ─── 1. Upload Valid PNG ─────────────────────────────────────────────────────
def test_upload_valid_png():
    user_id, token = create_authenticated_user()
    png_bytes = create_test_image("PNG", (200, 150))

    response = client.post(
        "/api/v1/analysis/upload",
        files={"file": ("blood_cell_smear.png", png_bytes, "image/png")},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 201
    data = response.json()
    assert "file_id" in data
    assert data["filename"] == "blood_cell_smear.png"
    assert data["content_type"] == "image/png"
    assert data["status"] == "uploaded"
    assert data["size"] == len(png_bytes)


# ─── 2. Upload Valid JPG ─────────────────────────────────────────────────────
def test_upload_valid_jpg():
    user_id, token = create_authenticated_user()
    jpg_bytes = create_test_image("JPEG", (300, 300))

    response = client.post(
        "/api/v1/analysis/upload",
        files={"file": ("microscopy_sample.jpg", jpg_bytes, "image/jpeg")},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["filename"] == "microscopy_sample.jpg"
    assert data["content_type"] == "image/jpeg"
    assert data["status"] == "uploaded"


# ─── 3. Reject Unsupported File Extension / MIME ─────────────────────────────
def test_reject_unsupported_file():
    user_id, token = create_authenticated_user()
    fake_txt = b"This is a text document, not a microscopy image."

    response = client.post(
        "/api/v1/analysis/upload",
        files={"file": ("report.txt", fake_txt, "text/plain")},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 400
    assert "unsupported file extension" in response.json()["detail"].lower()


# ─── 4. Reject Corrupted / Invalid Image ──────────────────────────────────────
def test_reject_corrupted_image():
    user_id, token = create_authenticated_user()
    garbage_bytes = b"\x89PNG\r\n\x1a\n" + b"random corrupted non-image content 12345"

    response = client.post(
        "/api/v1/analysis/upload",
        files={"file": ("corrupted.png", garbage_bytes, "image/png")},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 400
    assert "corrupted or invalid image" in response.json()["detail"].lower()


# ─── 5. Reject Oversized File ────────────────────────────────────────────────
def test_reject_oversized_file(monkeypatch):
    user_id, token = create_authenticated_user()
    # Temporarily set max size to 1MB
    monkeypatch.setattr(settings, "MAX_UPLOAD_SIZE_MB", 1)

    # 1.5MB fake payload
    oversized_bytes = b"0" * (int(1.5 * 1024 * 1024))
    response = client.post(
        "/api/v1/analysis/upload",
        files={"file": ("huge_cell.png", oversized_bytes, "image/png")},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 400
    assert "exceeds limit" in response.json()["detail"].lower()


# ─── 6. Unauthenticated Upload ───────────────────────────────────────────────
def test_unauthenticated_upload():
    png_bytes = create_test_image("PNG")
    response = client.post(
        "/api/v1/analysis/upload",
        files={"file": ("test.png", png_bytes, "image/png")},
    )
    assert response.status_code == 401
    assert "token is missing" in response.json()["detail"].lower()


# ─── 7. Create Analysis ──────────────────────────────────────────────────────
def test_create_analysis():
    user_id, token = create_authenticated_user()
    png_bytes = create_test_image("PNG")

    upload_res = client.post(
        "/api/v1/analysis/upload",
        files={"file": ("specimen.png", png_bytes, "image/png")},
        headers={"Authorization": f"Bearer {token}"},
    )
    file_id = upload_res.json()["file_id"]

    response = client.post(
        "/api/v1/analysis",
        json={
            "file_id": file_id,
            "dataset": "Micro-OD",
            "shots": 6,
            "vlm_model": "default",
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 201
    data = response.json()
    assert "analysis_id" in data
    assert data["status"] == "pending"
    assert data["dataset"] == "Micro-OD"
    assert data["shots"] == 6


# ─── 8. Invalid Dataset Rejection ────────────────────────────────────────────
def test_invalid_dataset_rejection():
    user_id, token = create_authenticated_user()
    png_bytes = create_test_image("PNG")

    upload_res = client.post(
        "/api/v1/analysis/upload",
        files={"file": ("specimen.png", png_bytes, "image/png")},
        headers={"Authorization": f"Bearer {token}"},
    )
    file_id = upload_res.json()["file_id"]

    response = client.post(
        "/api/v1/analysis",
        json={
            "file_id": file_id,
            "dataset": "NonExistentDataset",
            "shots": 0,
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 422 or response.status_code == 400


# ─── 9. Invalid Shots Rejection ──────────────────────────────────────────────
def test_invalid_shots_rejection():
    user_id, token = create_authenticated_user()
    png_bytes = create_test_image("PNG")

    upload_res = client.post(
        "/api/v1/analysis/upload",
        files={"file": ("specimen.png", png_bytes, "image/png")},
        headers={"Authorization": f"Bearer {token}"},
    )
    file_id = upload_res.json()["file_id"]

    # Only 0 and 6 are supported; 1, 3, and 5 must be rejected
    for invalid_shot in [1, 3, 5]:
        response = client.post(
            "/api/v1/analysis",
            json={
                "file_id": file_id,
                "dataset": "BBBC",
                "shots": invalid_shot,
            },
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 422, f"Expected 422 for shots={invalid_shot}"


# ─── 10. Get Analysis Status ─────────────────────────────────────────────────
def test_get_analysis():
    user_id, token = create_authenticated_user()
    png_bytes = create_test_image("PNG")

    upload_res = client.post(
        "/api/v1/analysis/upload",
        files={"file": ("cell.png", png_bytes, "image/png")},
        headers={"Authorization": f"Bearer {token}"},
    )
    file_id = upload_res.json()["file_id"]

    create_res = client.post(
        "/api/v1/analysis",
        json={
            "file_id": file_id,
            "dataset": "BCCD",
            "shots": 0,
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    analysis_id = create_res.json()["analysis_id"]

    response = client.get(
        f"/api/v1/analysis/{analysis_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["analysis_id"] == analysis_id
    assert data["status"] == "pending"
    assert data["dataset"] == "BCCD"
    assert data["shots"] == 0
    assert data["completed_at"] is None


# ─── 11. Analysis Ownership Protection ───────────────────────────────────────
def test_analysis_ownership_protection():
    user1_id, token1 = create_authenticated_user("owner@jeevadrishti.org", "Dr. Owner")
    user2_id, token2 = create_authenticated_user("intruder@jeevadrishti.org", "Dr. Intruder")

    png_bytes = create_test_image("PNG")
    upload_res = client.post(
        "/api/v1/analysis/upload",
        files={"file": ("private_cell.png", png_bytes, "image/png")},
        headers={"Authorization": f"Bearer {token1}"},
    )
    file_id = upload_res.json()["file_id"]

    create_res = client.post(
        "/api/v1/analysis",
        json={"file_id": file_id, "dataset": "NIH-3T3", "shots": 0},
        headers={"Authorization": f"Bearer {token1}"},
    )
    analysis_id = create_res.json()["analysis_id"]

    # User 2 attempts to get User 1's analysis -> 403 Forbidden
    forbidden_res = client.get(
        f"/api/v1/analysis/{analysis_id}",
        headers={"Authorization": f"Bearer {token2}"},
    )
    assert forbidden_res.status_code == 403
    assert "forbidden" in forbidden_res.json()["detail"].lower()

    # User 2 attempts to delete User 1's analysis -> 403 Forbidden
    delete_forbidden = client.delete(
        f"/api/v1/analysis/{analysis_id}",
        headers={"Authorization": f"Bearer {token2}"},
    )
    assert delete_forbidden.status_code == 403


# ─── 12. List Analyses History & Pagination ──────────────────────────────────
def test_list_analyses():
    user_id, token = create_authenticated_user()
    png_bytes = create_test_image("PNG")

    upload_res = client.post(
        "/api/v1/analysis/upload",
        files={"file": ("cell.png", png_bytes, "image/png")},
        headers={"Authorization": f"Bearer {token}"},
    )
    file_id = upload_res.json()["file_id"]

    # Create 2 analyses
    client.post(
        "/api/v1/analysis",
        json={"file_id": file_id, "dataset": "Micro-OD", "shots": 0},
        headers={"Authorization": f"Bearer {token}"},
    )
    client.post(
        "/api/v1/analysis",
        json={"file_id": file_id, "dataset": "LIVECell", "shots": 6},
        headers={"Authorization": f"Bearer {token}"},
    )

    response = client.get(
        "/api/v1/analysis?page=1&page_size=10",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 2
    assert len(data["items"]) == 2
    assert data["page"] == 1
    # Newest first
    assert data["items"][0]["dataset"] == "LIVECell"
    assert data["items"][1]["dataset"] == "Micro-OD"


# ─── 13. Delete Analysis ─────────────────────────────────────────────────────
def test_delete_analysis():
    user_id, token = create_authenticated_user()
    png_bytes = create_test_image("PNG")

    upload_res = client.post(
        "/api/v1/analysis/upload",
        files={"file": ("cell.png", png_bytes, "image/png")},
        headers={"Authorization": f"Bearer {token}"},
    )
    file_id = upload_res.json()["file_id"]

    create_res = client.post(
        "/api/v1/analysis",
        json={"file_id": file_id, "dataset": "BCCD", "shots": 6},
        headers={"Authorization": f"Bearer {token}"},
    )
    analysis_id = create_res.json()["analysis_id"]

    delete_res = client.delete(
        f"/api/v1/analysis/{analysis_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert delete_res.status_code == 200

    # Ensure record is gone
    get_res = client.get(
        f"/api/v1/analysis/{analysis_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert get_res.status_code == 404


# ─── 14. Uploaded File Deletion on Analysis Deletion ─────────────────────────
def test_uploaded_file_physical_deletion():
    user_id, token = create_authenticated_user()
    png_bytes = create_test_image("PNG")

    upload_res = client.post(
        "/api/v1/analysis/upload",
        files={"file": ("ephemeral.png", png_bytes, "image/png")},
        headers={"Authorization": f"Bearer {token}"},
    )
    file_id = upload_res.json()["file_id"]

    # Verify physical file exists on disk
    db = TestingSessionLocal()
    try:
        file_rec = db.query(UploadedFile).filter(UploadedFile.id == file_id).first()
        assert file_rec is not None
        file_path = settings.upload_path / file_rec.stored_filename
        assert file_path.exists()
    finally:
        db.close()

    create_res = client.post(
        "/api/v1/analysis",
        json={"file_id": file_id, "dataset": "Micro-OD", "shots": 0},
        headers={"Authorization": f"Bearer {token}"},
    )
    analysis_id = create_res.json()["analysis_id"]

    # Delete analysis
    client.delete(
        f"/api/v1/analysis/{analysis_id}",
        headers={"Authorization": f"Bearer {token}"},
    )

    # Verify physical file was cleanly removed from disk
    assert not file_path.exists()
