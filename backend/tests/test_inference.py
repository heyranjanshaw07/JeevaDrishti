import json
import pytest
from io import BytesIO
from PIL import Image

from tests.conftest import client
from app.core.config import settings
from app.models.user import User
from app.models.analysis import UploadedFile, Analysis
from app.services.inference.prompt_service import (
    normalize_class_label,
    get_dataset_prompt,
    CANONICAL_CLASSES,
    SUPPORTED_SHOTS,
)
from app.services.inference.image_service import (
    load_image,
    validate_image_dimensions,
    crop_patch,
    image_to_base64,
    draw_detection_overlay,
    save_overlay,
)
from app.services.inference.sam_service import (
    SAMService,
    AIModelUnavailableError,
)
from app.services.inference.vlm_service import (
    GeminiVLMProvider,
    OpenAIVLMProvider,
    MockVLMProvider,
    VLMNotConfiguredError,
)
from app.services.inference.hybrid_engine import (
    run_hybrid_inference,
    HybridInferenceError,
)


def create_dummy_png_bytes(width=200, height=200, color="white"):
    buf = BytesIO()
    img = Image.new("RGB", (width, height), color=color)
    img.save(buf, format="PNG")
    return buf.getvalue()


# 1. shot validation
def test_shot_validation():
    img = Image.new("RGB", (100, 100))
    for valid_shot in [0, 1, 3, 6]:
        # Shot is accepted in validation (mocking SAM to avoid weights check)
        class MockSAM:
            def generate_proposals(self, image, max_candidates=15):
                return []

        res = run_hybrid_inference(
            image=img,
            dataset="Micro-OD",
            shots=valid_shot,
            sam_provider=MockSAM(),
            vlm_provider=MockVLMProvider(),
        )
        assert res["status"] == "completed"

    for invalid_shot in [-1, 2, 4, 5, 10]:
        with pytest.raises(HybridInferenceError) as exc_info:
            run_hybrid_inference(
                image=img,
                dataset="Micro-OD",
                shots=invalid_shot,
            )
        assert exc_info.value.code == "INVALID_SHOT_CONFIGURATION"


# 2. dataset validation
def test_dataset_validation():
    img = Image.new("RGB", (100, 100))
    for valid_ds in ["Micro-OD", "BBBC", "BCCD", "LIVECell", "NIH-3T3"]:
        class MockSAM:
            def generate_proposals(self, image, max_candidates=15):
                return []

        res = run_hybrid_inference(
            image=img,
            dataset=valid_ds,
            shots=0,
            sam_provider=MockSAM(),
            vlm_provider=MockVLMProvider(),
        )
        assert res["status"] == "completed"

    for invalid_ds in ["COCO", "PascalVOC", "UnknownDataset"]:
        with pytest.raises(HybridInferenceError) as exc_info:
            run_hybrid_inference(
                image=img,
                dataset=invalid_ds,
                shots=0,
            )
        assert exc_info.value.code == "UNSUPPORTED_DATASET"


# 3. class alias normalization
def test_class_alias_normalization():
    # Canonical classes
    for c in CANONICAL_CLASSES:
        assert normalize_class_label(c) == c
        assert normalize_class_label(c.lower()) == c

    # Blood smear aliases
    assert normalize_class_label("RBC") == "Red Blood Cells"
    assert normalize_class_label("red blood cell") == "Red Blood Cells"
    assert normalize_class_label("erythrocyte") == "Red Blood Cells"
    assert normalize_class_label("WBC") == "White Blood Cells"
    assert normalize_class_label("white blood cell") == "White Blood Cells"
    assert normalize_class_label("leukocyte") == "White Blood Cells"
    assert normalize_class_label("platelet") == "Platelets"
    assert normalize_class_label("thrombocytes") == "Platelets"

    # Malaria stage aliases
    assert normalize_class_label("ring") == "Ring Cells"
    assert normalize_class_label("ring cell") == "Ring Cells"
    assert normalize_class_label("trophozoite") == "Trophozoite Cells"
    assert normalize_class_label("gametocyte") == "Gametocyte Cells"
    assert normalize_class_label("schizont") == "Schizont Cells"

    # Morphology cell aliases
    assert normalize_class_label("spindle") == "Spindle Cells"
    assert normalize_class_label("polygonal") == "Polygonal Cells"
    assert normalize_class_label("round") == "Round Cells"

    # Background / Rejection cases
    assert normalize_class_label("None") is None
    assert normalize_class_label("background") is None
    assert normalize_class_label("unknown cell type xyz") is None
    assert normalize_class_label("ambiguous") is None
    assert normalize_class_label("") is None
    assert normalize_class_label(None) is None


# 4. prompt generation
def test_prompt_generation():
    prompt_bccd = get_dataset_prompt("BCCD")
    assert "optical microscopy image analyzer" in prompt_bccd
    assert "Red Blood Cells" in prompt_bccd
    assert "White Blood Cells" in prompt_bccd
    assert "Platelets" in prompt_bccd
    assert "None" in prompt_bccd

    prompt_bbbc = get_dataset_prompt("BBBC")
    assert "Trophozoite Cells" in prompt_bbbc
    assert "Ring Cells" in prompt_bbbc


# 5. image preprocessing
def test_image_preprocessing():
    # Load from bytes
    png_bytes = create_dummy_png_bytes(150, 100)
    img = load_image(png_bytes)
    assert img.mode == "RGB"
    assert img.size == (150, 100)

    # Validate dimensions
    w, h = validate_image_dimensions(img)
    assert w == 150 and h == 100

    # Crop patch
    patch = crop_patch(img, [10, 20, 50, 60], target_size=(128, 128))
    assert patch.size == (128, 128)

    # Base64 encoding
    b64_str = image_to_base64(patch)
    assert isinstance(b64_str, str)
    assert len(b64_str) > 0


# 6. overlay generation
def test_overlay_generation(tmp_path):
    img = Image.new("RGB", (300, 300), color="white")
    detections = [
        {"label": "Red Blood Cells", "bbox": [10, 10, 60, 60], "confidence": 0.94},
        {"label": "White Blood Cells", "bbox": [100, 100, 180, 180], "confidence": 0.88},
    ]
    overlay = draw_detection_overlay(img, detections)
    assert overlay.size == (300, 300)

    # Test saving overlay
    rel_path = save_overlay(overlay, "test_analysis_123", tmp_path)
    assert "overlays/test_analysis_123_overlay.png" in rel_path
    saved_file = tmp_path / rel_path
    assert saved_file.exists()


# 7. missing SAM model
def test_missing_sam_model(monkeypatch):
    # Ensure SAM_MODEL_PATH points to non-existent file
    monkeypatch.setattr(settings, "SAM_MODEL_PATH", "models/non_existent_sam.pth")
    sam = SAMService()
    img = Image.new("RGB", (100, 100))

    with pytest.raises(AIModelUnavailableError) as exc_info:
        sam.generate_proposals(img)
    assert exc_info.value.code == "AI_MODEL_UNAVAILABLE"


# 8. missing VLM configuration
def test_missing_vlm_configuration(monkeypatch):
    # Unset keys for Gemini and OpenAI providers
    monkeypatch.setattr(settings, "VLM_API_KEY", None)
    monkeypatch.setattr(settings, "GOOGLE_API_KEY", None)
    monkeypatch.setattr(settings, "OPENAI_API_KEY", None)
    monkeypatch.delenv("GOOGLE_API_KEY", raising=False)
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)

    gemini_provider = GeminiVLMProvider()
    with pytest.raises(VLMNotConfiguredError) as exc_info:
        gemini_provider.classify_patch("fakeb64", "prompt")
    assert exc_info.value.code == "VLM_NOT_CONFIGURED"

    openai_provider = OpenAIVLMProvider()
    with pytest.raises(VLMNotConfiguredError) as exc_info_oa:
        openai_provider.classify_patch("fakeb64", "prompt")
    assert exc_info_oa.value.code == "VLM_NOT_CONFIGURED"


# Helper for creating registered user and token
def get_auth_token(email="tester@jeevadrishti.ai"):
    client.post("/api/v1/auth/register", json={
        "name": "Test User",
        "email": email,
        "password": "ValidPassword123!",
        "role": "researcher",
    })
    res = client.post("/api/v1/auth/login", json={
        "email": email,
        "password": "ValidPassword123!",
    })
    return res.json()["access_token"]


# 9. analysis ownership
def test_analysis_ownership(db_session):
    token1 = get_auth_token("user1@jeevadrishti.ai")
    token2 = get_auth_token("user2@jeevadrishti.ai")

    # User 1 uploads an image
    file_bytes = create_dummy_png_bytes()
    upload_res = client.post(
        "/api/v1/analysis/upload",
        files={"file": ("sample.png", file_bytes, "image/png")},
        headers={"Authorization": f"Bearer {token1}"},
    )
    file_id = upload_res.json()["file_id"]

    # User 1 creates an analysis
    create_res = client.post(
        "/api/v1/analysis",
        json={"file_id": file_id, "dataset": "Micro-OD", "shots": 0},
        headers={"Authorization": f"Bearer {token1}"},
    )
    analysis_id = create_res.json()["analysis_id"]

    # User 2 tries to run User 1's analysis -> 403 Forbidden
    run_res = client.post(
        f"/api/v1/analysis/{analysis_id}/run",
        headers={"Authorization": f"Bearer {token2}"},
    )
    assert run_res.status_code == 403

    # User 2 tries to read results of User 1's analysis -> 403 Forbidden
    res_res = client.get(
        f"/api/v1/analysis/{analysis_id}/results",
        headers={"Authorization": f"Bearer {token2}"},
    )
    assert res_res.status_code == 403


# 10. analysis run and results endpoint (handling unconfigured AI and successful mocked flow)
def test_analysis_run_and_results_flow(monkeypatch, db_session):
    token = get_auth_token("researcher_flow@jeevadrishti.ai")

    # Upload image
    file_bytes = create_dummy_png_bytes()
    upload_res = client.post(
        "/api/v1/analysis/upload",
        files={"file": ("cell.png", file_bytes, "image/png")},
        headers={"Authorization": f"Bearer {token}"},
    )
    file_id = upload_res.json()["file_id"]

    # Create analysis
    create_res = client.post(
        "/api/v1/analysis",
        json={"file_id": file_id, "dataset": "BCCD", "shots": 0},
        headers={"Authorization": f"Bearer {token}"},
    )
    analysis_id = create_res.json()["analysis_id"]

    # Check results before running -> status pending, no detections
    initial_results = client.get(
        f"/api/v1/analysis/{analysis_id}/results",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert initial_results.status_code == 200
    assert initial_results.json()["status"] == "pending"
    assert initial_results.json()["detections"] == []

    # 10a. Test controlled failure when SAM weights are unavailable
    monkeypatch.setattr(settings, "SAM_MODEL_PATH", None)
    run_res_fail = client.post(
        f"/api/v1/analysis/{analysis_id}/run",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert run_res_fail.status_code == 200
    data_fail = run_res_fail.json()
    assert data_fail["status"] == "failed"
    assert "AI_MODEL_UNAVAILABLE" in data_fail["message"] or "unavailable" in data_fail["message"].lower()

    # Verify results endpoint reports status failed with error message
    results_after_fail = client.get(
        f"/api/v1/analysis/{analysis_id}/results",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert results_after_fail.status_code == 200
    assert results_after_fail.json()["status"] == "failed"
    assert results_after_fail.json()["error_message"] is not None

    # 10b. Test valid mocked inference execution flow
    class MockSAMSuccess:
        def generate_proposals(self, image, max_candidates=15):
            return [(10, 10, 60, 60), (70, 70, 120, 120)]

    mock_vlm = MockVLMProvider(canned_label="Red Blood Cells", canned_confidence=0.95)

    from app.services import analysis_service
    import app.api.routes.analysis as analysis_routes

    # Monkeypatch the inference call in execute_analysis to use our mock components
    orig_execute = analysis_service.execute_analysis

    def mock_execute(db, analysis_id, user_id):
        return orig_execute(
            db=db,
            analysis_id=analysis_id,
            user_id=user_id,
            vlm_override=mock_vlm,
            sam_override=MockSAMSuccess(),
        )

    monkeypatch.setattr(analysis_routes, "execute_analysis", mock_execute)


    run_res_success = client.post(
        f"/api/v1/analysis/{analysis_id}/run",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert run_res_success.status_code == 200
    assert run_res_success.json()["status"] == "completed"

    # Verify results endpoint has detections and overlay
    final_results = client.get(
        f"/api/v1/analysis/{analysis_id}/results",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert final_results.status_code == 200
    res_data = final_results.json()
    assert res_data["status"] == "completed"
    assert len(res_data["detections"]) == 2
    assert res_data["detections"][0]["label"] == "Red Blood Cells"
    assert res_data["detections"][0]["confidence"] == 0.95
    assert res_data["overlay_available"] is True
    assert res_data["overlay_url"] is not None

    # Verify overlay retrieval
    overlay_res = client.get(
        f"/api/v1/analysis/{analysis_id}/overlay",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert overlay_res.status_code == 200
    assert overlay_res.headers["content-type"] == "image/png"
    assert len(overlay_res.content) > 0
