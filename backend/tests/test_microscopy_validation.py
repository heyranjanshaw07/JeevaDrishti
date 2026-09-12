import io
from pathlib import Path
from PIL import Image, ImageDraw
import numpy as np
import pytest

from tests.conftest import client
from app.services.inference.microscopy_validator import microscopy_validator
from app.services.inference.vlm_service import MockVLMProvider
from app.services.inference.prompt_service import normalize_class_label


def generate_id_card_bytes() -> bytes:
    """Generate a realistic mock ID card with card border, photo box, and text lines."""
    img = Image.new("RGB", (600, 380), color=(245, 247, 250))
    draw = ImageDraw.Draw(img)
    # Card outer border
    draw.rectangle([10, 10, 590, 370], outline=(40, 60, 100), width=3)
    # Header bar
    draw.rectangle([10, 10, 590, 70], fill=(24, 43, 73))
    # Photo box
    draw.rectangle([30, 90, 170, 260], fill=(200, 210, 220), outline=(100, 100, 100), width=2)
    # Text lines (represented as straight black/dark blue line bars like text rows)
    for y in [100, 125, 150, 175, 200, 225, 250, 290, 315, 340]:
        draw.rectangle([190, y, 550, y + 10], fill=(30, 30, 30))
    # Barcode-like stripes
    for x in range(30, 170, 8):
        draw.line([(x, 280), (x, 340)], fill=(20, 20, 20), width=4)
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


def generate_document_screenshot_bytes() -> bytes:
    """Generate a document/code screenshot with dense horizontal text lines and window borders."""
    img = Image.new("RGB", (700, 500), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)
    # Window header / toolbar
    draw.rectangle([0, 0, 700, 40], fill=(230, 235, 240))
    draw.line([(0, 40), (700, 40)], fill=(180, 190, 200), width=2)
    # Dense horizontal text lines
    for y in range(60, 480, 18):
        width = 500 if (y % 54 != 0) else 320
        draw.rectangle([40, y, 40 + width, y + 8], fill=(40, 40, 40))
        if y % 36 == 0:
            draw.rectangle([580, y, 660, y + 8], fill=(100, 120, 140))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def generate_normal_photo_bytes() -> bytes:
    """Generate a natural scene photograph with macroscopic illumination and landscape gradients."""
    arr = np.zeros((480, 640, 3), dtype=np.uint8)
    for r in range(240):
        arr[r, :, 0] = int(100 + 50 * (r / 240))
        arr[r, :, 1] = int(150 + 40 * (r / 240))
        arr[r, :, 2] = int(220 + 20 * (r / 240))
    for r in range(240, 480):
        arr[r, :, 0] = int(60 + 40 * ((r - 240) / 240))
        arr[r, :, 1] = int(120 - 30 * ((r - 240) / 240))
        arr[r, :, 2] = int(40 + 20 * ((r - 240) / 240))
    arr[200:350, 250:390, 0] = 140
    arr[200:350, 250:390, 1] = 80
    arr[200:350, 250:390, 2] = 50
    img = Image.fromarray(arr)
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


def get_auth_token(email: str = "validator_tester@jeevadrishti.ai") -> str:
    """Helper to create user and get JWT token."""
    client.post(
        "/api/v1/auth/register",
        json={"name": "Validation Tester", "email": email, "password": "Password123!"},
    )
    res = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "Password123!"},
    )
    return res.json()["access_token"]


# ─── 1. Unit Tests for MicroscopyValidator ───────────────────────────────────

def test_validator_accepts_real_microscopy():
    """Verify microscopy validator accepts genuine microscopy images from Micro-OD."""
    bccd_path = Path("f:/JeevaDrishti/datasets/Micro-OD/test/BCCD/images/BCCD_test_1.jpg")
    if bccd_path.exists():
        res = microscopy_validator.validate(bccd_path)
        assert res.is_valid is True
        assert res.reason is None

    bbbc_path = Path("f:/JeevaDrishti/datasets/Micro-OD/test/BBBC/images/BBBC_test_1.png")
    if bbbc_path.exists():
        res = microscopy_validator.validate(bbbc_path)
        assert res.is_valid is True
        assert res.reason is None

    livecell_path = Path("f:/JeevaDrishti/datasets/Micro-OD/test/LIVECell/images/LIVECell_test_1.png")
    if livecell_path.exists():
        res = microscopy_validator.validate(livecell_path)
        assert res.is_valid is True
        assert res.reason is None

    nih_path = Path("f:/JeevaDrishti/datasets/Micro-OD/test/NIH-3T3/images/NIH-3T3_test_1.png")
    if nih_path.exists():
        res = microscopy_validator.validate(nih_path)
        assert res.is_valid is True
        assert res.reason is None


def test_validator_accepts_root_cell_microscopy():
    """Verify root cell.jpg (eyepiece blood smear specimen) is accepted as authentic microscopy."""
    cell_path = Path("f:/JeevaDrishti/cell.jpg")
    if cell_path.exists():
        res = microscopy_validator.validate(cell_path)
        assert res.is_valid is True
        assert res.reason is None


def test_validator_rejects_religious_art():
    """Verify religious/art paintings (e.g. Rama & Hanuman artwork) are rejected as non-microscopy."""
    art_path = Path("f:/JeevaDrishti/backend/uploads/6d8c48da-0140-49d3-81d5-bc861d125884.png")
    if art_path.exists():
        res = microscopy_validator.validate(art_path)
        assert res.is_valid is False
        assert res.reason == "non_microscopy_image"
    else:
        art_bytes = generate_religious_art_bytes()
        res = microscopy_validator.validate(art_bytes)
        assert res.is_valid is False
        assert res.reason == "non_microscopy_image"


def test_validator_rejects_id_card():
    """Verify microscopy validator rejects ID cards."""
    id_bytes = generate_id_card_bytes()
    res = microscopy_validator.validate(id_bytes)
    assert res.is_valid is False
    assert res.reason == "non_microscopy_image"
    assert "not appear to be a microscopy image" in res.message


def test_validator_rejects_document_screenshot():
    """Verify microscopy validator rejects documents and screenshots."""
    doc_bytes = generate_document_screenshot_bytes()
    res = microscopy_validator.validate(doc_bytes)
    assert res.is_valid is False
    assert res.reason == "non_microscopy_image"
    assert "not appear to be a microscopy image" in res.message


def test_validator_rejects_normal_photograph():
    """Verify microscopy validator rejects normal scenery/object photographs."""
    photo_bytes = generate_normal_photo_bytes()
    res = microscopy_validator.validate(photo_bytes)
    assert res.is_valid is False
    assert res.reason == "non_microscopy_image"
    assert "not appear to be a microscopy image" in res.message


def test_validator_accepts_uniform_slide():
    """Verify uniform microscopy slide is valid (separate state from non-microscopy)."""
    blank = Image.new("RGB", (256, 256), color=(240, 240, 245))
    res = microscopy_validator.validate(blank)
    assert res.is_valid is True
    assert res.reason is None


# ─── 2. End-to-End API Pipeline Tests ────────────────────────────────────────

def test_pipeline_rejects_id_card(monkeypatch):
    """Verify end-to-end API cleanly transitions to 'rejected' for ID cards."""
    token = get_auth_token("id_card_test@jeevadrishti.ai")
    headers = {"Authorization": f"Bearer {token}"}

    # Upload ID card
    id_bytes = generate_id_card_bytes()
    upload_res = client.post(
        "/api/v1/analysis/upload",
        files={"file": ("my_id_card.jpg", id_bytes, "image/jpeg")},
        headers=headers,
    )
    assert upload_res.status_code == 201
    file_id = upload_res.json()["file_id"]

    # Create analysis
    create_res = client.post(
        "/api/v1/analysis",
        json={"file_id": file_id, "dataset": "BCCD", "shots": 0},
        headers=headers,
    )
    assert create_res.status_code == 201
    analysis_id = create_res.json()["analysis_id"]

    # Run analysis
    run_res = client.post(f"/api/v1/analysis/{analysis_id}/run", headers=headers)
    assert run_res.status_code == 200
    run_data = run_res.json()
    assert run_data["status"] == "rejected"

    # Get results
    results_res = client.get(f"/api/v1/analysis/{analysis_id}/results", headers=headers)
    assert results_res.status_code == 200
    data = results_res.json()
    assert data["status"] == "rejected"
    assert data["reason"] == "non_microscopy_image"
    assert "not appear to be a microscopy image" in data["message"]
    assert data["detections"] == []
    assert data["metrics"] is None


def test_pipeline_rejects_document_screenshot(monkeypatch):
    """Verify end-to-end API cleanly transitions to 'rejected' for document/screenshot."""
    token = get_auth_token("doc_test@jeevadrishti.ai")
    headers = {"Authorization": f"Bearer {token}"}

    doc_bytes = generate_document_screenshot_bytes()
    upload_res = client.post(
        "/api/v1/analysis/upload",
        files={"file": ("invoice.png", doc_bytes, "image/png")},
        headers=headers,
    )
    assert upload_res.status_code == 201
    file_id = upload_res.json()["file_id"]

    create_res = client.post(
        "/api/v1/analysis",
        json={"file_id": file_id, "dataset": "BCCD", "shots": 0},
        headers=headers,
    )
    analysis_id = create_res.json()["analysis_id"]

    run_res = client.post(f"/api/v1/analysis/{analysis_id}/run", headers=headers)
    assert run_res.status_code == 200
    assert run_res.json()["status"] == "rejected"

    results_res = client.get(f"/api/v1/analysis/{analysis_id}/results", headers=headers)
    assert results_res.status_code == 200
    data = results_res.json()
    assert data["status"] == "rejected"
    assert data["reason"] == "non_microscopy_image"
    assert data["detections"] == []
    assert data["metrics"] is None


def test_pipeline_rejects_normal_photo(monkeypatch):
    """Verify end-to-end API cleanly transitions to 'rejected' for normal photograph."""
    token = get_auth_token("photo_test@jeevadrishti.ai")
    headers = {"Authorization": f"Bearer {token}"}

    photo_bytes = generate_normal_photo_bytes()
    upload_res = client.post(
        "/api/v1/analysis/upload",
        files={"file": ("landscape.jpg", photo_bytes, "image/jpeg")},
        headers=headers,
    )
    assert upload_res.status_code == 201
    file_id = upload_res.json()["file_id"]

    create_res = client.post(
        "/api/v1/analysis",
        json={"file_id": file_id, "dataset": "BCCD", "shots": 0},
        headers=headers,
    )
    analysis_id = create_res.json()["analysis_id"]

    run_res = client.post(f"/api/v1/analysis/{analysis_id}/run", headers=headers)
    assert run_res.status_code == 200
    assert run_res.json()["status"] == "rejected"

    results_res = client.get(f"/api/v1/analysis/{analysis_id}/results", headers=headers)
    assert results_res.status_code == 200
    data = results_res.json()
    assert data["status"] == "rejected"
    assert data["reason"] == "non_microscopy_image"
    assert data["detections"] == []
    assert data["metrics"] is None


def test_pipeline_empty_slide_is_completed_not_rejected(monkeypatch):
    """Verify VALID MICROSCOPY + 0 DETECTIONS yields 'completed' with 'Unable to determine', NOT 'rejected'."""
    token = get_auth_token("empty_slide_test@jeevadrishti.ai")
    headers = {"Authorization": f"Bearer {token}"}

    # Clean empty slide
    buf = io.BytesIO()
    Image.new("RGB", (256, 256), color=(242, 242, 246)).save(buf, format="PNG")
    slide_bytes = buf.getvalue()

    upload_res = client.post(
        "/api/v1/analysis/upload",
        files={"file": ("empty_slide.png", slide_bytes, "image/png")},
        headers=headers,
    )
    assert upload_res.status_code == 201
    file_id = upload_res.json()["file_id"]

    create_res = client.post(
        "/api/v1/analysis",
        json={"file_id": file_id, "dataset": "BCCD", "shots": 0, "vlm_model": "optical"},
        headers=headers,
    )
    analysis_id = create_res.json()["analysis_id"]

    run_res = client.post(f"/api/v1/analysis/{analysis_id}/run", headers=headers)
    assert run_res.status_code == 200
    assert run_res.json()["status"] == "completed"

    results_res = client.get(f"/api/v1/analysis/{analysis_id}/results", headers=headers)
    assert results_res.status_code == 200
    data = results_res.json()
    # VALID MICROSCOPY + 0 DETECTIONS state:
    assert data["status"] == "completed"
    assert data["prediction"] == "Unable to determine"
    assert data["detections"] == []
    assert data["metrics"]["detected_count"] == 0


def test_vlm_rejects_non_cell_patches():
    """Verify MockVLMProvider rejects straight-line / non-cell patches as None."""
    vlm = MockVLMProvider()

    # Create a patch with a sharp black text stripe
    img = Image.new("RGB", (128, 128), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)
    draw.rectangle([10, 50, 118, 70], fill=(0, 0, 0))  # straight horizontal text line
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    import base64
    b64 = base64.b64encode(buf.getvalue()).decode("utf-8")

    label, conf = vlm.classify_patch(b64, prompt="Classify cell")
    assert label in ("NOT_A_CELL", "None")
    assert conf == 0.0
    assert normalize_class_label(label) is None


def generate_human_portrait_bytes() -> bytes:
    """Generate a realistic human portrait with skin tones, facial features, hair, and clothing."""
    img = Image.new("RGB", (600, 800), color=(140, 150, 160))
    draw = ImageDraw.Draw(img)
    # Clothing / shirt
    draw.rectangle([100, 520, 500, 800], fill=(40, 60, 120))
    # Head / face (skin tone: R=210, G=160, B=130)
    draw.ellipse([200, 180, 400, 460], fill=(210, 160, 130))
    # Neck
    draw.rectangle([270, 440, 330, 540], fill=(205, 155, 125))
    # Hair
    draw.ellipse([180, 130, 420, 260], fill=(35, 25, 20))
    # Eyes
    draw.ellipse([240, 290, 275, 315], fill=(255, 255, 255))
    draw.ellipse([252, 296, 268, 312], fill=(20, 20, 20))
    draw.ellipse([325, 290, 360, 315], fill=(255, 255, 255))
    draw.ellipse([337, 296, 353, 312], fill=(20, 20, 20))
    # Mouth / Lips
    draw.ellipse([275, 380, 325, 405], fill=(185, 75, 75))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


def generate_religious_art_bytes() -> bytes:
    """Generate a multi-chromatic painting with diverse vibrant hues across the color spectrum."""
    arr = np.zeros((600, 600, 3), dtype=np.uint8)
    arr[:180, :] = [30, 80, 220]     # Blue sky
    arr[180:320, :] = [240, 200, 30] # Gold halo / luminous ring
    arr[320:460, :] = [190, 35, 45]  # Crimson red robe
    arr[460:, :] = [30, 140, 60]     # Emerald green foreground
    img = Image.fromarray(arr)
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


# ─── SPECIFICATION TEST 1 to TEST 8 ──────────────────────────────────────────

def test_spec_test1_valid_microscopy_accepted():
    """TEST 1: Valid Micro-OD microscopy image -> accepted -> real detections."""
    from app.services.inference.hybrid_engine import run_hybrid_inference
    from app.services.inference.sam_service import sam_service as default_sam
    bccd_path = Path("f:/JeevaDrishti/datasets/Micro-OD/test/BCCD/images/BCCD_test_1.jpg")
    if not bccd_path.exists():
        pytest.skip("BCCD_test_1.jpg not present in workspace")

    class OpticalSAMProvider:
        def generate_proposals(self, image, max_candidates=15, padding=10):
            return default_sam.generate_optical_proposals(image, max_candidates=max_candidates, padding=padding)

    res = run_hybrid_inference(
        image=bccd_path,
        dataset="BCCD",
        shots=0,
        model="mock",
        sam_provider=OpticalSAMProvider(),
    )
    assert res["status"] == "completed"
    assert len(res["detections"]) > 0
    assert res["confidence"] is not None
    # Real confidence values must be between 0.50 and 0.99
    for d in res["detections"]:
        assert 0.50 <= d["confidence"] <= 0.99
        assert d["label"] in ["Red Blood Cells", "White Blood Cells", "Platelets"]


def test_spec_test2_human_portrait_rejected():
    """TEST 2: Human portrait (both color and grayscale) -> rejected -> 0 detections."""
    from app.services.inference.hybrid_engine import run_hybrid_inference

    # 1. Color portrait
    portrait_bytes = generate_human_portrait_bytes()
    val = microscopy_validator.validate(portrait_bytes)
    assert val.is_valid is False
    assert val.reason == "non_microscopy_image"

    res = run_hybrid_inference(
        image=portrait_bytes,
        dataset="Micro-OD",
        shots=0,
        model="mock",
    )
    assert res["status"] == "rejected"
    assert res["reason"] == "non_microscopy_image"
    assert res["detections"] == []
    assert res["metrics"] is None

    # 2. Real-world / grayscale portrait (actual elderly man photo from bug report)
    portrait_path = Path("f:/JeevaDrishti/backend/uploads/e94fa483-cebd-49b3-afce-558b9deb4325.jpg")
    if portrait_path.exists():
        val_real = microscopy_validator.validate(portrait_path)
        assert val_real.is_valid is False
        assert val_real.reason == "non_microscopy_image"

        res_real = run_hybrid_inference(
            image=portrait_path,
            dataset="Micro-OD",
            shots=0,
            model="mock",
        )
        assert res_real["status"] == "rejected"
        assert res_real["reason"] == "non_microscopy_image"
        assert res_real["detections"] == []
        assert res_real["metrics"] is None


def test_spec_test3_religious_art_rejected():
    """TEST 3: Religious/art image (synthetic and Ram/Hanuman painting) -> rejected -> 0 detections."""
    from app.services.inference.hybrid_engine import run_hybrid_inference

    # 1. Synthetic multi-hue artwork
    art_bytes = generate_religious_art_bytes()
    val = microscopy_validator.validate(art_bytes)
    assert val.is_valid is False
    assert val.reason == "non_microscopy_image"

    res = run_hybrid_inference(
        image=art_bytes,
        dataset="Micro-OD",
        shots=0,
        model="mock",
    )
    assert res["status"] == "rejected"
    assert res["reason"] == "non_microscopy_image"
    assert res["detections"] == []
    assert res["metrics"] is None

    # 2. Real-world religious art (actual Rama & Hanuman artwork from bug report)
    art_path = Path("f:/JeevaDrishti/backend/uploads/6d8c48da-0140-49d3-81d5-bc861d125884.png")
    if art_path.exists():
        val_real = microscopy_validator.validate(art_path)
        assert val_real.is_valid is False
        assert val_real.reason == "non_microscopy_image"

        res_real = run_hybrid_inference(
            image=art_path,
            dataset="Micro-OD",
            shots=0,
            model="mock",
        )
        assert res_real["status"] == "rejected"
        assert res_real["reason"] == "non_microscopy_image"
        assert res_real["detections"] == []
        assert res_real["metrics"] is None


def test_spec_test4_id_card_rejected():
    """TEST 4: ID card/document -> rejected -> 0 detections."""
    from app.services.inference.hybrid_engine import run_hybrid_inference
    id_bytes = generate_id_card_bytes()

    val = microscopy_validator.validate(id_bytes)
    assert val.is_valid is False
    assert val.reason == "non_microscopy_image"

    res = run_hybrid_inference(
        image=id_bytes,
        dataset="BCCD",
        shots=0,
        model="mock",
    )
    assert res["status"] == "rejected"
    assert res["reason"] == "non_microscopy_image"
    assert res["detections"] == []
    assert res["metrics"] is None


def test_spec_test5_normal_photograph_rejected():
    """TEST 5: Normal photograph -> rejected -> 0 detections."""
    from app.services.inference.hybrid_engine import run_hybrid_inference
    photo_bytes = generate_normal_photo_bytes()

    val = microscopy_validator.validate(photo_bytes)
    assert val.is_valid is False
    assert val.reason == "non_microscopy_image"

    res = run_hybrid_inference(
        image=photo_bytes,
        dataset="Micro-OD",
        shots=0,
        model="mock",
    )
    assert res["status"] == "rejected"
    assert res["reason"] == "non_microscopy_image"
    assert res["detections"] == []
    assert res["metrics"] is None


def test_spec_test6_screenshot_document_rejected():
    """TEST 6: Screenshot/document image -> rejected -> 0 detections."""
    from app.services.inference.hybrid_engine import run_hybrid_inference
    doc_bytes = generate_document_screenshot_bytes()

    val = microscopy_validator.validate(doc_bytes)
    assert val.is_valid is False
    assert val.reason == "non_microscopy_image"

    res = run_hybrid_inference(
        image=doc_bytes,
        dataset="Micro-OD",
        shots=0,
        model="mock",
    )
    assert res["status"] == "rejected"
    assert res["reason"] == "non_microscopy_image"
    assert res["detections"] == []
    assert res["metrics"] is None


def test_spec_test7_valid_microscopy_multiple_cell_classes():
    """TEST 7: Valid microscopy image containing multiple cell classes -> correct candidate classification."""
    from app.services.inference.hybrid_engine import run_hybrid_inference
    from app.services.inference.sam_service import sam_service as default_sam
    bccd_path = Path("f:/JeevaDrishti/datasets/Micro-OD/test/BCCD/images/BCCD_test_1.jpg")
    if not bccd_path.exists():
        pytest.skip("BCCD_test_1.jpg not present in workspace")

    class OpticalSAMProvider:
        def generate_proposals(self, image, max_candidates=15, padding=10):
            return default_sam.generate_optical_proposals(image, max_candidates=max_candidates, padding=padding)

    res = run_hybrid_inference(
        image=bccd_path,
        dataset="BCCD",
        shots=0,
        model="mock",
        sam_provider=OpticalSAMProvider(),
    )
    assert res["status"] == "completed"
    detected_labels = {d["label"] for d in res["detections"]}
    # Verify that valid cell classes are assigned
    assert any(label in ["Red Blood Cells", "White Blood Cells", "Platelets"] for label in detected_labels)
    # Ensure no non-cell labels exist
    for d in res["detections"]:
        assert d["label"] != "NOT_A_CELL"
        assert d["label"] != "None"


def test_spec_test8_sam_proposes_non_cell_regions_rejected():
    """TEST 8: Valid microscopy image where SAM proposes non-cell regions -> non-cell candidates rejected."""
    from app.services.inference.hybrid_engine import run_hybrid_inference
    bccd_path = Path("f:/JeevaDrishti/datasets/Micro-OD/test/BCCD/images/BCCD_test_1.jpg")
    if not bccd_path.exists():
        pytest.skip("BCCD_test_1.jpg not present in workspace")

    class MockSAMWithBadProposals:
        def generate_proposals(self, image, max_candidates=15, padding=10):
            # Propose an empty background region (corner) and an extreme aspect ratio region
            w, h = image.size
            return [
                [0, 0, 30, 30], # empty corner glass
                [5, 5, 200, 10], # extreme thin stripe
                [50, 50, 90, 90], # real potential cell area
            ]

    res = run_hybrid_inference(
        image=bccd_path,
        dataset="BCCD",
        shots=0,
        model="mock",
        sam_provider=MockSAMWithBadProposals(),
    )
    # Status should be completed (it is a valid microscopy slide)
    assert res["status"] == "completed"
    # The extreme stripe and empty glass proposals must NOT be forced into cell classes
    for d in res["detections"]:
        assert d["label"] != "NOT_A_CELL"
        assert d["label"] != "None"
        assert d["label"] in ["Red Blood Cells", "White Blood Cells", "Platelets"]


def test_spec_micro_od_rbc_blood_smear_inference():
    """Verify authentic RBC blood smear with Micro-OD prompt reaches SAM/VLM and returns real detections."""
    from app.services.inference.hybrid_engine import run_hybrid_inference
    from app.services.inference.sam_service import sam_service as default_sam

    rbc_paths = [
        Path("uploads/302d4a2f-554f-4680-958e-980dd61a07bb.jpg"),
        Path("f:/JeevaDrishti/datasets/Micro-OD/test/BCCD/images/BCCD_test_1.jpg"),
    ]
    test_path = next((p for p in rbc_paths if p.exists()), None)
    if not test_path:
        pytest.skip("No RBC microscopy test image available")

    # 1. Validation must pass
    val = microscopy_validator.validate(test_path)
    assert val.is_valid is True

    class OpticalSAM:
        def generate_proposals(self, image, max_candidates=15, padding=10):
            return default_sam.generate_optical_proposals(image, max_candidates=max_candidates, padding=padding)

    # 2. Run hybrid inference with Micro-OD prompt
    res = run_hybrid_inference(
        image=test_path,
        dataset="Micro-OD",
        shots=6,
        model="optical",
        sam_provider=OpticalSAM(),
    )

    assert res["status"] == "completed"
    assert res["prediction"] != "Unable to determine"
    assert len(res["detections"]) > 0
    assert any(d["label"] == "Red Blood Cells" for d in res["detections"])
    for d in res["detections"]:
        assert d["label"] != "NOT_A_CELL"
        assert 0.0 < d["confidence"] <= 1.0
        assert len(d["bbox"]) == 4
