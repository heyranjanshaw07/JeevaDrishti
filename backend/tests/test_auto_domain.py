from pathlib import Path
from PIL import Image, ImageDraw
import numpy as np
import pytest
from app.services.inference.domain_classifier import determine_microscopy_domain
from app.services.datasets.base import TaskType


def test_determine_microscopy_domain_cervical(tmp_path):
    # Create image with Papanicolaou Pap smear teal/cyan cytoplasm
    im = Image.new("RGB", (200, 200), (140, 190, 205))
    draw = ImageDraw.Draw(im)
    # Draw cellular cytoplasm in teal / sea-green
    draw.ellipse([30, 30, 170, 170], fill=(80, 150, 165))
    # Nucleus in dark blue/purple
    draw.ellipse([80, 80, 120, 120], fill=(40, 50, 110))
    p = tmp_path / "cervical_sample.jpg"
    im.save(p)

    dataset, task_type, details = determine_microscopy_domain(p)
    assert dataset == "sipakmed"
    assert task_type == TaskType.CELL_CLASSIFICATION
    assert details["teal_cyan_pct"] > 0


def test_determine_microscopy_domain_leukemia_blast(tmp_path):
    # Create single segmented cell crop on dark background
    im = Image.new("RGB", (200, 200), (8, 4, 10))
    draw = ImageDraw.Draw(im)
    # Centered leukocyte with large purple nucleus
    draw.ellipse([40, 40, 160, 160], fill=(120, 50, 140))
    p = tmp_path / "blast_sample.bmp"
    im.save(p)

    dataset, task_type, details = determine_microscopy_domain(p)
    assert dataset == "c_nmc_2019"
    assert task_type == TaskType.CELL_CLASSIFICATION
    assert details["dark_bg_pct"] > 65.0


def test_determine_microscopy_domain_blood_smear(tmp_path):
    # Multi-lineage peripheral blood smear with salmon RBCs and purple WBCs
    im = Image.new("RGB", (400, 300), (220, 215, 210))
    draw = ImageDraw.Draw(im)
    # Multiple red blood cells
    for x, y in [(50, 50), (100, 80), (160, 50), (220, 100), (300, 70)]:
        draw.ellipse([x, y, x + 35, y + 35], fill=(210, 80, 95))
    # White blood cell with purple nucleus
    draw.ellipse([180, 160, 230, 210], fill=(110, 45, 130))
    p = tmp_path / "blood_smear.jpg"
    im.save(p)

    dataset, task_type, details = determine_microscopy_domain(p)
    assert dataset == "micro_od"
    assert task_type == TaskType.OBJECT_DETECTION


def test_api_create_analysis_with_auto(tmp_path, db_session):
    import io
    from tests.conftest import client
    from tests.test_analysis import create_authenticated_user

    user_id, token = create_authenticated_user(email="auto_tester@jeevadrishti.ai")

    # 1. Create cervical image
    im = Image.new("RGB", (200, 200), (140, 190, 205))
    draw = ImageDraw.Draw(im)
    draw.ellipse([30, 30, 170, 170], fill=(80, 150, 165))
    buf = io.BytesIO()
    im.save(buf, format="PNG")
    buf.seek(0)

    # 2. Upload image
    upload_res = client.post(
        "/api/v1/analysis/upload",
        files={"file": ("pap_specimen.png", buf.getvalue(), "image/png")},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert upload_res.status_code == 201
    file_id = upload_res.json()["file_id"]

    # 3. Create analysis with dataset="auto"
    create_res = client.post(
        "/api/v1/analysis",
        json={"file_id": file_id, "dataset": "auto"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert create_res.status_code == 201
    data = create_res.json()
    assert data["analysis_id"] is not None
    # Dataset should have been automatically resolved to sipakmed based on image
    assert data["dataset"] == "sipakmed"
