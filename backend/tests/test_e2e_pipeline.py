import io
from PIL import Image
import pytest

from tests.conftest import client
from app.services.inference.vlm_service import VLMProvider


class MockSuccessVLM(VLMProvider):
    """Mock VLM that returns realistic cell classifications."""
    def classify_patch(
        self,
        patch_b64: str,
        prompt: str,
        few_shot_examples=None,
    ):
        return ("Red Blood Cells", 0.94)



class MockSAMService:
    """Mock SAM that returns realistic bounding box proposals."""
    def generate_proposals(self, image: Image.Image, max_candidates: int = 15, cache_key: str = None):
        return [
            (20, 20, 60, 60),
            (80, 80, 120, 120),
            (140, 140, 180, 180),
        ][:max_candidates]

    def is_model_available(self) -> bool:
        return True


def create_synthetic_microscopy_png(width=256, height=256) -> bytes:
    """Generate a valid test image in PNG format in memory."""
    img = Image.new("RGB", (width, height), color=(30, 45, 60))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


# ─── 1. Complete E2E Lifecycle with Mocked Inference (0-shot) ────────────────
def test_e2e_full_lifecycle_with_mocked_ai(monkeypatch):
    """
    Test complete user flow:
    Register -> Login -> Upload -> Create Analysis -> Run Hybrid Inference ->
    Check Results -> Verify Overlay -> Verify History -> Logout.
    """
    # 1. Register
    reg_res = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Dr. Sarah Jenkins",
            "email": "sarah.jenkins@microscopy.org",
            "password": "SecurePassword2026!",
        },
    )
    assert reg_res.status_code == 201
    user_data = reg_res.json()
    assert user_data["email"] == "sarah.jenkins@microscopy.org"

    # 2. Login
    login_res = client.post(
        "/api/v1/auth/login",
        json={
            "email": "sarah.jenkins@microscopy.org",
            "password": "SecurePassword2026!",
        },
    )
    assert login_res.status_code == 200
    token_data = login_res.json()
    token = token_data["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Verify Profile
    me_res = client.get("/api/v1/auth/me", headers=headers)
    assert me_res.status_code == 200
    assert me_res.json()["name"] == "Dr. Sarah Jenkins"

    # 3. Upload Microscopy Image
    img_bytes = create_synthetic_microscopy_png()
    upload_res = client.post(
        "/api/v1/analysis/upload",
        headers=headers,
        files={"file": ("specimen_001.png", img_bytes, "image/png")},
    )
    assert upload_res.status_code == 201
    file_info = upload_res.json()
    file_id = file_info["file_id"]
    assert file_info["status"] == "uploaded"

    # 4. Create Analysis Record (BCCD, 0-shot)
    create_res = client.post(
        "/api/v1/analysis",
        headers=headers,
        json={
            "file_id": file_id,
            "dataset": "BCCD",
            "shots": 0,
        },
    )
    assert create_res.status_code == 201
    analysis_info = create_res.json()
    analysis_id = analysis_info["analysis_id"]
    assert analysis_info["status"] == "pending"

    # 5. Patch inference engine to use MockSAM and MockVLM
    mock_sam = MockSAMService()
    mock_vlm = MockSuccessVLM()
    monkeypatch.setattr("app.services.inference.hybrid_engine.sam_service", mock_sam)
    monkeypatch.setattr("app.services.inference.hybrid_engine.get_vlm_provider", lambda m: mock_vlm)

    # Run Analysis
    run_res = client.post(f"/api/v1/analysis/{analysis_id}/run", headers=headers)
    assert run_res.status_code == 200
    run_data = run_res.json()
    assert run_data["status"] == "completed"

    # 6. Retrieve Results
    results_res = client.get(f"/api/v1/analysis/{analysis_id}/results", headers=headers)
    assert results_res.status_code == 200
    results_data = results_res.json()
    assert results_data["status"] == "completed"
    assert len(results_data["detections"]) == 3
    assert len(results_data["boxes"]) == 3
    assert results_data["overlay_available"] is True

    # 7. Retrieve Visual Overlay
    overlay_res = client.get(f"/api/v1/analysis/{analysis_id}/overlay", headers=headers)
    assert overlay_res.status_code == 200
    assert overlay_res.headers["content-type"] == "image/png"
    assert len(overlay_res.content) > 0

    # 8. Check Analysis History
    history_res = client.get("/api/v1/analysis", headers=headers)
    assert history_res.status_code == 200
    hist_data = history_res.json()
    assert hist_data["total"] >= 1
    analysis_ids = [item["analysis_id"] for item in hist_data["items"]]
    assert analysis_id in analysis_ids

    # 9. Logout
    logout_res = client.post("/api/v1/auth/logout", headers=headers)
    assert logout_res.status_code == 200
    assert "logged out" in logout_res.json()["message"].lower()


# ─── 2. Few-Shot Configurations (0, 6 shots) ─────────────────────────────────
@pytest.mark.parametrize("shots", [0, 6])
def test_e2e_few_shot_variants(shots, monkeypatch):
    """Verify that 0-shot and 6-shot configurations execute properly."""
    # User setup
    email = f"fewshot_{shots}@microscopy.org"
    client.post(
        "/api/v1/auth/register",
        json={"name": f"Tester {shots}", "email": email, "password": "Password123!"},
    )
    login_res = client.post("/api/v1/auth/login", json={"email": email, "password": "Password123!"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Upload
    img_bytes = create_synthetic_microscopy_png()
    upload_res = client.post(
        "/api/v1/analysis/upload",
        headers=headers,
        files={"file": (f"test_{shots}.png", img_bytes, "image/png")},
    )
    file_id = upload_res.json()["file_id"]

    # Create Analysis
    create_res = client.post(
        "/api/v1/analysis",
        headers=headers,
        json={"file_id": file_id, "dataset": "BCCD", "shots": shots},
    )
    analysis_id = create_res.json()["analysis_id"]

    # Patch with Mock AI
    monkeypatch.setattr("app.services.inference.hybrid_engine.sam_service", MockSAMService())
    monkeypatch.setattr("app.services.inference.hybrid_engine.get_vlm_provider", lambda m: MockSuccessVLM())

    # Run
    run_res = client.post(f"/api/v1/analysis/{analysis_id}/run", headers=headers)
    assert run_res.status_code == 200
    assert run_res.json()["status"] == "completed"

    # Results
    res = client.get(f"/api/v1/analysis/{analysis_id}/results", headers=headers)
    assert res.status_code == 200
    assert res.json()["shots"] == shots


@pytest.mark.parametrize("bad_shots", [1, 3])
def test_e2e_rejected_shot_variants(bad_shots):
    """Verify that 1-shot and 3-shot requests are rejected by analysis creation API."""
    email = f"badshot_{bad_shots}@microscopy.org"
    client.post(
        "/api/v1/auth/register",
        json={"name": f"Tester Bad {bad_shots}", "email": email, "password": "Password123!"},
    )
    login_res = client.post("/api/v1/auth/login", json={"email": email, "password": "Password123!"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    img_bytes = create_synthetic_microscopy_png()
    upload_res = client.post(
        "/api/v1/analysis/upload",
        headers=headers,
        files={"file": (f"test_bad_{bad_shots}.png", img_bytes, "image/png")},
    )
    file_id = upload_res.json()["file_id"]

    create_res = client.post(
        "/api/v1/analysis",
        headers=headers,
        json={"file_id": file_id, "dataset": "BCCD", "shots": bad_shots},
    )
    assert create_res.status_code == 422


# ─── 3. Multi-Tenant Ownership Isolation ─────────────────────────────────────
def test_e2e_ownership_protection():
    """Verify that User B cannot view or delete analyses created by User A."""
    # User A
    client.post("/api/v1/auth/register", json={"name": "Alice", "email": "alice@lab.org", "password": "Password123!"})
    token_a = client.post("/api/v1/auth/login", json={"email": "alice@lab.org", "password": "Password123!"}).json()["access_token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    # User B
    client.post("/api/v1/auth/register", json={"name": "Bob", "email": "bob@lab.org", "password": "Password123!"})
    token_b = client.post("/api/v1/auth/login", json={"email": "bob@lab.org", "password": "Password123!"}).json()["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # Alice uploads and creates an analysis
    img_bytes = create_synthetic_microscopy_png()
    file_id = client.post(
        "/api/v1/analysis/upload",
        headers=headers_a,
        files={"file": ("alice_sample.png", img_bytes, "image/png")},
    ).json()["file_id"]

    analysis_id = client.post(
        "/api/v1/analysis",
        headers=headers_a,
        json={"file_id": file_id, "dataset": "BBBC", "shots": 0},
    ).json()["analysis_id"]

    # Bob attempts to view Alice's analysis -> must be 404 (or 403)
    res_bob_get = client.get(f"/api/v1/analysis/{analysis_id}", headers=headers_b)
    assert res_bob_get.status_code in (404, 403)

    # Bob attempts to run Alice's analysis -> must be 404 (or 403)
    res_bob_run = client.post(f"/api/v1/analysis/{analysis_id}/run", headers=headers_b)
    assert res_bob_run.status_code in (404, 403)

    # Bob attempts to delete Alice's analysis -> must be 404 (or 403)
    res_bob_del = client.delete(f"/api/v1/analysis/{analysis_id}", headers=headers_b)
    assert res_bob_del.status_code in (404, 403)


# ─── 4. Graceful Error Handling When Real AI Is Not Configured ───────────────
def test_e2e_unconfigured_ai_graceful_failure():
    """Verify that when SAM or VLM is unconfigured, the system marks analysis as failed clearly."""
    # Register & login
    client.post("/api/v1/auth/register", json={"name": "Dr. Unconfigured", "email": "unconfig@lab.org", "password": "Password123!"})
    token = client.post("/api/v1/auth/login", json={"email": "unconfig@lab.org", "password": "Password123!"}).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Upload
    img_bytes = create_synthetic_microscopy_png()
    file_id = client.post(
        "/api/v1/analysis/upload",
        headers=headers,
        files={"file": ("unconfig.png", img_bytes, "image/png")},
    ).json()["file_id"]

    analysis_id = client.post(
        "/api/v1/analysis",
        headers=headers,
        json={"file_id": file_id, "dataset": "BCCD", "shots": 0},
    ).json()["analysis_id"]

    # Run analysis with default unconfigured environment (no SAM weights in test)
    run_res = client.post(f"/api/v1/analysis/{analysis_id}/run", headers=headers)
    assert run_res.status_code == 200
    run_data = run_res.json()
    assert run_data["status"] == "failed"
    assert "unavailable" in run_data["message"].lower() or "not configured" in run_data["message"].lower()

    # Results endpoint reflects failed status with 0 detections (no fabricated numbers)
    results_res = client.get(f"/api/v1/analysis/{analysis_id}/results", headers=headers)
    assert results_res.status_code == 200
    results_data = results_res.json()
    assert results_data["status"] == "failed"
    assert len(results_data["detections"]) == 0
    assert results_data["overlay_available"] is False
