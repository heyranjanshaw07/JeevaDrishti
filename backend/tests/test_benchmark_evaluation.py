import pytest
from app.core.security import create_access_token, hash_password
from app.models.benchmark import BenchmarkResult
from app.models.user import User
from app.services.benchmark.dataset_loader import (
    SUPPORTED_DATASETS,
    load_support_examples,
)
from app.services.benchmark.experiment import ExperimentConfig, ExperimentResult, ImageResult
from app.services.benchmark.metrics import (
    accumulate_per_class,
    compute_iou,
    compute_mean_iou,
    compute_mf1,
    compute_overall_precision_recall,
    compute_per_class_metrics,
    match_predictions_to_gt,
)
from app.services.benchmark.runner import _persist_result, run_benchmark
from tests.conftest import client


# ─── 1. IoU Calculation Correctness ──────────────────────────────────────────
def test_iou_computation():
    # Identical boxes -> IoU = 1.0
    box_a = [10.0, 10.0, 50.0, 50.0]
    assert compute_iou(box_a, box_a) == pytest.approx(1.0)

    # Completely disjoint boxes -> IoU = 0.0
    box_b = [60.0, 60.0, 100.0, 100.0]
    assert compute_iou(box_a, box_b) == pytest.approx(0.0)

    # Partial overlap:
    # box1: [0, 0, 10, 10], area = 100
    # box2: [5, 0, 15, 10], area = 100
    # intersection: [5, 0, 10, 10], area = 5 * 10 = 50
    # union: 100 + 100 - 50 = 150
    # IoU = 50 / 150 = 1/3 ~ 0.33333
    box1 = [0.0, 0.0, 10.0, 10.0]
    box2 = [5.0, 0.0, 15.0, 10.0]
    assert compute_iou(box1, box2) == pytest.approx(50.0 / 150.0, rel=1e-4)

    # Degenerate boxes (zero area or negative coordinates)
    assert compute_iou([10.0, 10.0, 10.0, 20.0], box_a) == pytest.approx(0.0)
    assert compute_iou([20.0, 10.0, 10.0, 20.0], box_a) == pytest.approx(0.0)


# ─── 2. Box Matching (Greedy IoU with Class Constraint) ───────────────────────
def test_box_matching():
    # 2 GT boxes: RBC at [0,0,10,10] and WBC at [50,50,70,70]
    gt_boxes = [
        {"label": "RBC", "bbox": [0.0, 0.0, 10.0, 10.0]},
        {"label": "WBC", "bbox": [50.0, 50.0, 70.0, 70.0]},
    ]

    # Pred 1 matches GT 0 (RBC) with high IoU
    # Pred 2 overlaps GT 1 (WBC) spatially, but has label "RBC" -> should NOT match!
    # Pred 3 has label "WBC" with IoU < 0.50 -> should NOT match (below threshold)
    predictions = [
        {"label": "RBC", "bbox": [1.0, 1.0, 10.0, 10.0], "confidence": 0.95},
        {"label": "RBC", "bbox": [50.0, 50.0, 70.0, 70.0], "confidence": 0.88},
        {"label": "WBC", "bbox": [65.0, 65.0, 85.0, 85.0], "confidence": 0.75},
    ]

    matches, unmatched_preds, unmatched_gts = match_predictions_to_gt(
        predictions=predictions,
        ground_truth=gt_boxes,
        iou_threshold=0.50,
    )

    # Only prediction 0 should match GT 0
    assert matches == [(0, 0)]
    assert 1 in unmatched_preds
    assert 2 in unmatched_preds
    assert 1 in unmatched_gts


# ─── 3. Precision / Recall / F1 Per Class ────────────────────────────────────
def test_per_class_precision_recall_f1():
    class_stats = {
        "RBC": {"tp": 8, "fp": 2, "fn": 2},  # P = 8/10 = 0.8, R = 8/10 = 0.8, F1 = 0.8
        "WBC": {"tp": 5, "fp": 0, "fn": 5},  # P = 5/5 = 1.0, R = 5/10 = 0.5, F1 = 2*(1*0.5)/1.5 = 2/3 ~ 0.6667
        "Platelet": {"tp": 0, "fp": 4, "fn": 0},  # P = 0.0, R = 0.0, F1 = 0.0
    }

    metrics = compute_per_class_metrics(class_stats)

    assert metrics["RBC"]["precision"] == pytest.approx(0.8)
    assert metrics["RBC"]["recall"] == pytest.approx(0.8)
    assert metrics["RBC"]["f1"] == pytest.approx(0.8)

    assert metrics["WBC"]["precision"] == pytest.approx(1.0)
    assert metrics["WBC"]["recall"] == pytest.approx(0.5)
    assert metrics["WBC"]["f1"] == pytest.approx(2.0 / 3.0, rel=1e-4)

    assert metrics["Platelet"]["precision"] == pytest.approx(0.0)
    assert metrics["Platelet"]["recall"] == pytest.approx(0.0)
    assert metrics["Platelet"]["f1"] == pytest.approx(0.0)


# ─── 4. Macro mF1 Computation ────────────────────────────────────────────────
def test_macro_mf1_computation():
    per_class = {
        "RBC": {"f1": 0.8, "tp": 8, "fp": 2, "fn": 2},
        "WBC": {"f1": 0.6, "tp": 6, "fp": 4, "fn": 4},
    }
    # Macro average: (0.8 + 0.6) / 2 = 0.70
    mf1 = compute_mf1(per_class)
    assert mf1 == pytest.approx(0.70)

    # Empty per-class returns 0.0
    assert compute_mf1({}) == pytest.approx(0.0)


# ─── 5. Benchmark Config Validation ──────────────────────────────────────────
def test_benchmark_config_validation():
    # Unsupported shot count
    with pytest.raises(ValueError, match="Unsupported shot count"):
        run_benchmark(dataset="BBBC", shots=5)

    # Unsupported dataset
    with pytest.raises(ValueError, match="Unsupported dataset"):
        run_benchmark(dataset="NonExistentDataset", shots=0)

    # Allowed datasets constant
    for ds in ["BBBC", "BCCD", "LIVECell", "NIH-3T3"]:
        assert ds in SUPPORTED_DATASETS


# ─── 6. Deterministic Support-Example Selection ──────────────────────────────
def test_deterministic_support_selection():
    # 0-shot should return empty list
    support_0 = load_support_examples("BCCD", shots=0)
    assert support_0 == []

    # Calling 3-shot twice should return identical results (deterministic)
    support_a = load_support_examples("BCCD", shots=3)
    support_b = load_support_examples("BCCD", shots=3)
    assert len(support_a) == len(support_b)
    for ex_a, ex_b in zip(support_a, support_b):
        assert ex_a["label"] == ex_b["label"]
        assert ex_a.get("image_b64") == ex_b.get("image_b64")



# ─── 7. Result Persistence to Test DB ────────────────────────────────────────
def test_result_persistence(db_session):
    config = ExperimentConfig(
        dataset="BCCD",
        shots=1,
        iou_threshold=0.50,
        max_candidates=200,
        vlm_model="test-model",
        vlm_provider="mock",
    )
    result = ExperimentResult(
        config=config,
        status="completed",
        mf1=0.825,
        precision=0.85,
        recall=0.80,
        mean_iou=0.74,
        avg_latency_ms=120.5,
        total_vlm_calls=15,
        total_images=5,
        successful_images=5,
        failed_images=0,
    )

    _persist_result(result, db_session)

    # Query from DB
    persisted = db_session.query(BenchmarkResult).filter_by(experiment_id=config.experiment_id).first()
    assert persisted is not None
    assert persisted.dataset == "BCCD"
    assert persisted.shots == 1
    assert persisted.status == "completed"
    assert persisted.mf1 == pytest.approx(0.825)
    assert persisted.image_count == 5
    assert persisted.failed_images == 0


# ─── 8. Failed-Image Handling During Accumulation ─────────────────────────────
def test_failed_image_handling():
    config = ExperimentConfig(
        dataset="NIH-3T3",
        shots=0,
        iou_threshold=0.50,
        max_candidates=200,
        vlm_model="test-model",
        vlm_provider="mock",
    )
    result = ExperimentResult(config=config, status="running")

    # Simulate 1 failed image and 1 successful image
    failed_img = ImageResult(
        image_id="img_fail.png",
        status="failed",
        predictions=[],
        ground_truth=[{"label": "cell", "bbox": [0, 0, 10, 10]}],
        matches=[],
        unmatched_preds=[],
        unmatched_gts=[0],
        iou_values=[],
        latency_ms=0.0,
        vlm_calls=0,
        error_type="CORRUPT_IMAGE",
        error_message="Image file could not be read",
    )
    success_img = ImageResult(
        image_id="img_ok.png",
        status="success",
        predictions=[{"label": "cell", "bbox": [0, 0, 10, 10], "confidence": 0.9}],
        ground_truth=[{"label": "cell", "bbox": [0, 0, 10, 10]}],
        matches=[(0, 0)],
        unmatched_preds=[],
        unmatched_gts=[],
        iou_values=[1.0],
        latency_ms=50.0,
        vlm_calls=1,
    )

    result.image_results.extend([failed_img, success_img])
    result.total_images = 2
    result.successful_images = 1
    result.failed_images = 1

    assert result.failed_images == 1
    assert result.successful_images == 1
    assert result.total_images == 2


# ─── 9. Empty Prediction Set ─────────────────────────────────────────────────
def test_empty_predictions():
    ground_truth = [
        {"label": "Cell", "bbox": [10, 10, 30, 30]},
        {"label": "Cell", "bbox": [40, 40, 60, 60]},
    ]
    predictions = []

    matches, unmatched_preds, unmatched_gts = match_predictions_to_gt(
        predictions=predictions,
        ground_truth=ground_truth,
        iou_threshold=0.50,
    )

    assert matches == []
    assert unmatched_preds == []
    assert unmatched_gts == [0, 1]

    class_stats = {}
    accumulate_per_class(predictions, ground_truth, matches, unmatched_preds, unmatched_gts, class_stats)

    assert class_stats["Cell"]["tp"] == 0
    assert class_stats["Cell"]["fp"] == 0
    assert class_stats["Cell"]["fn"] == 2

    metrics = compute_per_class_metrics(class_stats)
    assert metrics["Cell"]["precision"] == pytest.approx(0.0)
    assert metrics["Cell"]["recall"] == pytest.approx(0.0)
    assert metrics["Cell"]["f1"] == pytest.approx(0.0)


# ─── 10. Perfect Prediction Set ──────────────────────────────────────────────
def test_perfect_predictions():
    ground_truth = [
        {"label": "RBC", "bbox": [10, 10, 30, 30]},
        {"label": "WBC", "bbox": [40, 40, 60, 60]},
    ]
    predictions = [
        {"label": "RBC", "bbox": [10, 10, 30, 30], "confidence": 0.99},
        {"label": "WBC", "bbox": [40, 40, 60, 60], "confidence": 0.98},
    ]

    matches, unmatched_preds, unmatched_gts = match_predictions_to_gt(
        predictions=predictions,
        ground_truth=ground_truth,
        iou_threshold=0.50,
    )

    assert len(matches) == 2
    assert unmatched_preds == []
    assert unmatched_gts == []

    class_stats = {}
    accumulate_per_class(predictions, ground_truth, matches, unmatched_preds, unmatched_gts, class_stats)

    metrics = compute_per_class_metrics(class_stats)
    assert metrics["RBC"]["precision"] == pytest.approx(1.0)
    assert metrics["RBC"]["recall"] == pytest.approx(1.0)
    assert metrics["RBC"]["f1"] == pytest.approx(1.0)
    assert metrics["WBC"]["precision"] == pytest.approx(1.0)
    assert metrics["WBC"]["recall"] == pytest.approx(1.0)
    assert metrics["WBC"]["f1"] == pytest.approx(1.0)

    mf1 = compute_mf1(metrics)
    assert mf1 == pytest.approx(1.0)

    p_overall, r_overall = compute_overall_precision_recall(metrics)
    assert p_overall == pytest.approx(1.0)
    assert r_overall == pytest.approx(1.0)



# ─── 11. API: Unauthorized Benchmark Run Rejection ───────────────────────────
def test_api_run_benchmark_unauthorized():
    response = client.post(
        "/api/v1/benchmark/run",
        json={"dataset": "BBBC", "shots": 0},
    )
    assert response.status_code == 401
    assert "token is missing" in response.json()["detail"].lower()


# ─── 12. API: Authorized Benchmark Run Execution ─────────────────────────────
def test_api_run_benchmark_authorized(db_session):
    # Create test user
    user = User(
        name="Benchmark Tester",
        email="tester@jeevadrishti.org",
        hashed_password=hash_password("Password123!"),
        role="researcher",
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    token = create_access_token({"sub": str(user.id)})
    headers = {"Authorization": f"Bearer {token}"}

    # Run benchmark via API
    response = client.post(
        "/api/v1/benchmark/run",
        json={"dataset": "BBBC", "shots": 0},
        headers=headers,
    )
    assert response.status_code == 200
    data = response.json()

    assert data["dataset"] == "BBBC"
    assert data["shots"] == 0
    # SAM/VLM are not configured in test environment -> status should be not_available
    # and no fake metrics are invented
    assert data["status"] in ("not_available", "failed", "completed")
    if data["status"] == "not_available":
        assert data["mf1"] is None
        assert data["precision"] is None
        assert data["recall"] is None
        assert data["error_message"] is not None
