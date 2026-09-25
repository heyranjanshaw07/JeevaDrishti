import json
from pathlib import Path
from typing import Any, Dict, List
import pytest
from fastapi import HTTPException
from pydantic import ValidationError

from app.models.benchmark import BenchmarkResult
from app.schemas.analysis import AnalysisCreate, SUPPORTED_SHOTS as SCHEMA_SUPPORTED_SHOTS
from app.schemas.benchmark import BenchmarkSummaryResponse, BenchmarkConfigResponse
from app.services.benchmark.dataset_loader import (
    SUPPORTED_DATASETS,
    load_support_examples,
    load_test_records,
)
from app.services.benchmark.evaluator import evaluate_single_image
from app.services.benchmark.experiment import ExperimentConfig, ExperimentResult
from app.services.benchmark.runner import (
    _persist_result,
    SUPPORTED_SHOTS as RUNNER_SUPPORTED_SHOTS,
)
from app.services.benchmark_service import (
    SUPPORTED_SHOT_CONFIGS,
    get_benchmark_config,
    get_benchmark_summary,
    get_benchmark_results,
)
from app.services.inference.hybrid_engine import run_hybrid_inference, HybridInferenceError
from app.services.inference.prompt_service import (
    SUPPORTED_SHOTS as PROMPT_SUPPORTED_SHOTS,
    compute_inference_cache_key,
    load_few_shot_examples,
)
from app.services.inference.sam_service import sam_service
from app.services.inference.vlm_service import (
    GeminiVLMProvider,
    MockVLMProvider,
    OpenAIVLMProvider,
)
from PIL import Image


# ─── 1. 0 Accepted & 6 Accepted ──────────────────────────────────────────────
def test_zero_and_six_shot_accepted():
    """Verify that shots=0 and shots=6 are valid and accepted across all configuration entry points."""
    assert list(SCHEMA_SUPPORTED_SHOTS) == [0, 6]
    assert PROMPT_SUPPORTED_SHOTS == [0, 6]
    assert RUNNER_SUPPORTED_SHOTS == [0, 6]
    assert SUPPORTED_SHOT_CONFIGS == [0, 6]

    # Verify Pydantic schema acceptance
    for s in [0, 6]:
        req = AnalysisCreate(file_id="dummy_file_id", dataset="Micro-OD", shots=s)
        assert req.shots == s

    # Verify hybrid inference acceptance
    img = Image.new("RGB", (100, 100))
    class MockSAM:
        def generate_proposals(self, image, max_candidates=15):
            return []

    for s in [0, 6]:
        res = run_hybrid_inference(
            image=img,
            dataset="Micro-OD",
            shots=s,
            sam_provider=MockSAM(),
            vlm_provider=MockVLMProvider(),
        )
        assert res["status"] == "completed"


# ─── 2. 1 Rejected & 3 Rejected ──────────────────────────────────────────────
def test_one_and_three_shot_rejected():
    """Verify that shots=1 and shots=3 are strictly rejected with validation errors without silent conversion."""
    # 1. Pydantic AnalysisCreate schema rejection
    for bad_shot in [1, 3]:
        with pytest.raises(ValidationError):
            AnalysisCreate(file_id="dummy_file_id", dataset="Micro-OD", shots=bad_shot)

    # 2. Hybrid inference engine rejection
    img = Image.new("RGB", (100, 100))
    for bad_shot in [1, 3]:
        with pytest.raises(HybridInferenceError) as exc_info:
            run_hybrid_inference(
                image=img,
                dataset="Micro-OD",
                shots=bad_shot,
            )
        assert exc_info.value.code == "INVALID_SHOT_CONFIGURATION"
        assert "Supported: [0, 6]" in str(exc_info.value)

    # 3. Prompt service loader rejection
    for bad_shot in [1, 3]:
        with pytest.raises(ValueError) as exc_info:
            load_few_shot_examples("BCCD", shots=bad_shot)
        assert "Allowed: [0, 6]" in str(exc_info.value)


# ─── 3. 0-Shot Support Count = 0 ─────────────────────────────────────────────
def test_zero_shot_support_count():
    """Verify that shots=0 returns exactly 0 support examples across all datasets."""
    for ds in SUPPORTED_DATASETS + ["Micro-OD"]:
        examples = load_support_examples(ds, shots=0)
        assert isinstance(examples, list)
        assert len(examples) == 0, f"Expected 0 support examples for {ds}, got {len(examples)}"


# ─── 4. 6-Shot Support Count = 6 ─────────────────────────────────────────────
def test_six_shot_support_count():
    """Verify that shots=6 returns exactly 6 real support examples from the correct dataset."""
    for ds in SUPPORTED_DATASETS:
        examples = load_support_examples(ds, shots=6)
        assert len(examples) == 6, f"Expected exactly 6 support examples for {ds}, got {len(examples)}"
        for ex in examples:
            assert ex["dataset"] == ds, f"Support example must belong to {ds}, got {ex['dataset']}"
            assert len(ex["image_b64"]) > 50, "Exemplar must include real base64 image data"
            assert len(ex["bbox"]) == 4, "Exemplar must have [x1, y1, x2, y2] bounding box"
            assert "id" in ex and len(ex["id"]) > 0


# ─── 5. 6-Shot Support Images Actually Included in VLM Request ───────────────
def test_six_shot_support_images_included_in_vlm_request(monkeypatch):
    """
    Verify that 6-shot sends exactly 6 real support images plus 1 query image (7 images total)
    to the multimodal VLM provider (Gemini and OpenAI), while 0-shot sends exactly 1 image.
    """
    captured_gemini_payloads = []
    captured_openai_payloads = []

    class DummyResponse:
        status_code = 200
        def json(self):
            return {
                "candidates": [{"content": {"parts": [{"text": "Red Blood Cells"}]}}],
                "choices": [{"message": {"content": "Red Blood Cells"}}],
            }

    def dummy_post_gemini(self, url, json=None, **kwargs):
        captured_gemini_payloads.append(json)
        return DummyResponse()

    def dummy_post_openai(self, url, headers=None, json=None, **kwargs):
        captured_openai_payloads.append(json)
        return DummyResponse()

    # Test Gemini provider
    monkeypatch.setattr("httpx.Client.post", dummy_post_gemini)
    gemini = GeminiVLMProvider(api_key="mock-key-for-payload-test")

    dummy_patch_b64 = "dGVzdF9wYXRjaF9pbWFnZV9kYXRh"
    prompt = "Classify this biological cell."

    for s in [0, 6]:
        exs = load_support_examples("BBBC", shots=s)
        gemini.classify_patch(patch_b64=dummy_patch_b64, prompt=prompt, few_shot_examples=exs)

    assert len(captured_gemini_payloads) == 2
    parts_0 = captured_gemini_payloads[0]["contents"][0]["parts"]
    parts_6 = captured_gemini_payloads[1]["contents"][0]["parts"]

    images_0 = [p for p in parts_0 if "inline_data" in p]
    images_6 = [p for p in parts_6 if "inline_data" in p]

    assert len(images_0) == 1, "0-shot must send exactly 1 image (target patch)"
    assert len(images_6) == 7, "6-shot must send exactly 7 images (6 reference crops + 1 target patch)"

    # Test OpenAI provider
    monkeypatch.setattr("httpx.Client.post", dummy_post_openai)
    openai = OpenAIVLMProvider(api_key="mock-key-for-payload-test")

    for s in [0, 6]:
        exs = load_support_examples("BCCD", shots=s)
        openai.classify_patch(patch_b64=dummy_patch_b64, prompt=prompt, few_shot_examples=exs)

    assert len(captured_openai_payloads) == 2
    msg_0 = captured_openai_payloads[0]["messages"][1]["content"]
    msg_6 = captured_openai_payloads[1]["messages"][1]["content"]

    oa_imgs_0 = [p for p in msg_0 if p.get("type") == "image_url"]
    oa_imgs_6 = [p for p in msg_6 if p.get("type") == "image_url"]

    assert len(oa_imgs_0) == 1, "0-shot must send exactly 1 image"
    assert len(oa_imgs_6) == 7, "6-shot must send exactly 7 images"


# ─── 6. Test Image Excluded from Support Examples ────────────────────────────
def test_test_image_excluded_from_support_examples():
    """
    Verify strict isolation between test images and support examples:
    Support examples must come exclusively from example/ split, never from test/ split.
    """
    for ds in SUPPORTED_DATASETS:
        test_records = load_test_records(ds)
        test_filenames = {img_path.name for img_path, _ in test_records}

        support_6 = load_support_examples(ds, shots=6)
        for ex in support_6:
            # Exemplar ID format is {dataset}_{image_file}_{class}_{y1}_{x1}...
            ex_id = ex["id"]
            for test_name in test_filenames:
                assert test_name not in ex_id, f"Test image '{test_name}' contaminated support set '{ex_id}'"


# ─── 7. Benchmark Uses Only 0 and 6 ──────────────────────────────────────────
def test_benchmark_uses_only_zero_and_six():
    """Verify that benchmark configuration, summary, and runner expose and execute only [0, 6]."""
    cfg = get_benchmark_config()
    assert cfg.shot_configs == [0, 6]

    summ = get_benchmark_summary()
    assert summ.shot_configs == [0, 6]

    assert RUNNER_SUPPORTED_SHOTS == [0, 6]


# ─── 8. Cache Key Changes With Shots ─────────────────────────────────────────
def test_cache_key_changes_with_shots():
    """Verify that inference cache keys for 0-shot and 6-shot are strictly distinct."""
    support_0 = load_support_examples("BBBC", shots=0)
    key_0 = compute_inference_cache_key(
        dataset="BBBC",
        image_id="BBBC_test_1.png",
        shots=0,
        model="gemini-2.5-flash",
        support_examples=support_0,
        patch_b64="sample_patch_base64_data",
    )

    support_6 = load_support_examples("BBBC", shots=6)
    key_6 = compute_inference_cache_key(
        dataset="BBBC",
        image_id="BBBC_test_1.png",
        shots=6,
        model="gemini-2.5-flash",
        support_examples=support_6,
        patch_b64="sample_patch_base64_data",
    )

    assert key_0 != key_6, f"Cache keys must be distinct between 0 and 6 shots: {key_0} vs {key_6}"


# ─── 9. Results Are Stored Separately by Shots ───────────────────────────────
def test_results_are_stored_separately_by_shots(db_session):
    """
    Verify that BenchmarkResult records for shots 0 and 6 are persisted independently,
    and querying active results retrieves only [0, 6] active configurations even if
    historical 1/3-shot records exist in the database.
    """
    dataset_name = "BBBC"
    persisted_configs = []

    # Insert 0, 1, 3, 6 (simulating historical records for 1 and 3)
    for s, mf1_val in [(0, 0.742), (1, 0.784), (3, 0.779), (6, 0.811)]:
        config = ExperimentConfig(
            dataset=dataset_name,
            shots=s,
            iou_threshold=0.50,
            max_candidates=15,
            vlm_model="optical",
            vlm_provider="mock",
        )
        exp_res = ExperimentResult(
            config=config,
            status="completed",
            mf1=mf1_val,
            precision=mf1_val + 0.01,
            recall=mf1_val - 0.01,
            mean_iou=0.68,
            avg_latency_ms=150.0,
            total_vlm_calls=15,
            total_images=1,
            successful_images=1,
            failed_images=0,
        )
        _persist_result(exp_res, db_session)
        persisted_configs.append(config.experiment_id)

    # Query active results via get_benchmark_results service
    res_response = get_benchmark_results(db=db_session, dataset=dataset_name)
    active_shots = {item.shots for item in res_response.items}

    # Only active configurations (0 and 6) should appear
    assert active_shots == {0, 6}, f"Active benchmark queries must only return shots {{0, 6}}, got {active_shots}"

    # Historical records (1 and 3) still exist in DB table but are rejected if explicitly queried
    with pytest.raises(HTTPException) as exc_info:
        get_benchmark_results(db=db_session, dataset=dataset_name, shots=1)
    assert exc_info.value.status_code == 400
    assert "Unsupported shots filter" in exc_info.value.detail

    with pytest.raises(HTTPException) as exc_info:
        get_benchmark_results(db=db_session, dataset=dataset_name, shots=3)
    assert exc_info.value.status_code == 400
    assert "Unsupported shots filter" in exc_info.value.detail
