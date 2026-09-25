"""
Benchmark Runner
================
Orchestrates the full Micro-OD benchmark pipeline:

    For each (dataset, shots) configuration:
        1. Load test records (deterministic order)
        2. Load support examples (deterministic, for shots > 0)
        3. Initialize SAM singleton + VLM provider
        4. For each image: run evaluator, accumulate per-class TP/FP/FN
        5. Compute aggregate metrics (mF1, P, R, IoU, latency)
        6. Persist ExperimentResult to database

Usage — Python API:
    from app.services.benchmark.runner import run_benchmark, run_full_benchmark
    result = run_benchmark(dataset="BBBC", shots=0, db=session)

Usage — CLI:
    cd f:\\JeevaDrishti\\backend
    python -m app.services.benchmark.runner [--dataset BBBC] [--shots 0]
    python -m app.services.benchmark.runner --all   # 16 configurations

Design notes:
- SAM singleton is loaded ONCE and reused across all images (no repeated weight loads).
- When SAM or VLM is unavailable, the experiment records status="not_available"
  and NO metrics are written — never fake values.
- Per-image failures are recorded individually; the experiment continues.
- The IoU threshold is never modified between experiments; it comes from settings.
"""

import argparse
import sys
from datetime import datetime, timezone
from typing import List, Optional

from app.core.config import settings
from app.core.logging import logger
from app.services.benchmark.dataset_loader import (
    load_test_records,
    load_support_examples,
    SUPPORTED_DATASETS,
)
from app.services.benchmark.evaluator import evaluate_single_image
from app.services.benchmark.experiment import ExperimentConfig, ExperimentResult
from app.services.benchmark.metrics import (
    accumulate_per_class,
    compute_per_class_metrics,
    compute_mf1,
    compute_overall_precision_recall,
    compute_mean_iou,
    compute_classification_metrics,
)
from app.services.datasets.registry import DATASET_REGISTRY, get_adapter_safe
from app.services.datasets.base import TaskType
from app.services.inference.hybrid_engine import run_classification_inference
from app.services.inference.sam_service import sam_service, AIModelUnavailableError
from app.services.inference.vlm_service import (
    get_vlm_provider,
    VLMNotConfiguredError,
)


SUPPORTED_SHOTS = [0, 6]
CANONICAL_DATASETS = list(DATASET_REGISTRY.keys())
ALL_SUPPORTED_DATASETS = list(dict.fromkeys(SUPPORTED_DATASETS + CANONICAL_DATASETS + ["Micro-OD"]))


# ---------------------------------------------------------------------------
# Core runner
# ---------------------------------------------------------------------------

def run_benchmark(
    dataset: str,
    shots: int,
    db=None,  # sqlalchemy Session — optional, only needed for DB persistence
) -> ExperimentResult:
    """
    Execute a single benchmark experiment: dataset × shots.

    Args:
        dataset : One of ALL_SUPPORTED_DATASETS.
        shots   : 0 or 6.
        db      : SQLAlchemy Session for result persistence (optional).

    Returns:
        ExperimentResult with real metrics or status="not_available".
    """
    if shots not in SUPPORTED_SHOTS:
        raise ValueError(f"Unsupported shot count {shots}. Allowed: {SUPPORTED_SHOTS}")

    dataset_clean = dataset.strip()

    # Expand "Micro-OD" or "micro_od" to all four sub-datasets
    if dataset_clean.lower() in ("micro-od", "micro_od"):
        sub_results = [
            run_benchmark(ds, shots, db=None)  # don't persist sub-results individually
            for ds in SUPPORTED_DATASETS
        ]
        combined = _combine_results(sub_results, shots)
        combined.config.dataset = dataset_clean
        combined.task_type = "object_detection"
        combined.accuracy = None
        if db is not None:
            _persist_result(combined, db)
        return combined

    # Check for registered unified adapter
    adapter = get_adapter_safe(dataset_clean)
    if adapter is not None and adapter.task_type == TaskType.CELL_CLASSIFICATION:
        vlm_model_name = settings.VLM_MODEL or "gemini-2.5-flash"
        vlm_provider_name = settings.VLM_PROVIDER or "gemini"
        config = ExperimentConfig(
            dataset=dataset_clean,
            shots=shots,
            iou_threshold=settings.BENCHMARK_IOU_THRESHOLD,
            max_candidates=settings.MAX_BENCHMARK_CANDIDATES,
            vlm_model=vlm_model_name,
            vlm_provider=vlm_provider_name,
        )
        return _run_classification_benchmark(adapter=adapter, shots=shots, config=config, db=db)

    if adapter is not None and adapter.task_type == TaskType.OBJECT_DETECTION and dataset_clean not in SUPPORTED_DATASETS:
        return _run_adapter_detection_benchmark(adapter=adapter, shots=shots, db=db)

    if dataset_clean not in ALL_SUPPORTED_DATASETS:
        raise ValueError(f"Unsupported dataset '{dataset_clean}'. Allowed: {ALL_SUPPORTED_DATASETS}")

    # ── Build config ──────────────────────────────────────────────────────────
    vlm_model_name = settings.VLM_MODEL or "gemini-2.5-flash"
    vlm_provider_name = settings.VLM_PROVIDER or "gemini"
    config = ExperimentConfig(
        dataset=dataset,
        shots=shots,
        iou_threshold=settings.BENCHMARK_IOU_THRESHOLD,
        max_candidates=settings.MAX_BENCHMARK_CANDIDATES,
        vlm_model=vlm_model_name,
        vlm_provider=vlm_provider_name,
    )

    result = ExperimentResult(config=config, status="running")

    # ── Check model availability before loading images ────────────────────────
    if not sam_service.is_model_available():
        result.status = "not_available"
        result.error_message = (
            "SAM model weights unavailable. Set SAM_MODEL_PATH in backend/.env "
            "to a valid SAM checkpoint file."
        )
        logger.warning("Benchmark skipped — SAM unavailable: %s", result.error_message)
        if db is not None:
            _persist_result(result, db)
        return result

    try:
        vlm = get_vlm_provider(vlm_provider_name)
    except VLMNotConfiguredError as exc:
        result.status = "not_available"
        result.error_message = str(exc)
        logger.warning("Benchmark skipped — VLM unavailable: %s", exc)
        if db is not None:
            _persist_result(result, db)
        return result

    # ── Load test records ─────────────────────────────────────────────────────
    try:
        test_records = load_test_records(dataset)
    except FileNotFoundError as exc:
        result.status = "failed"
        result.error_message = str(exc)
        if db is not None:
            _persist_result(result, db)
        return result

    if not test_records:
        result.status = "failed"
        result.error_message = f"No test records found for dataset '{dataset}'"
        if db is not None:
            _persist_result(result, db)
        return result

    result.total_images = len(test_records)

    # ── Load support examples (deterministic) ────────────────────────────────
    support_examples = load_support_examples(dataset, shots)

    # ── Per-image evaluation loop ─────────────────────────────────────────────
    class_stats: dict = {}

    for image_path, ground_truth in test_records:
        logger.info("Evaluating [%s/%d-shot]: %s", dataset, shots, image_path.name)
        try:
            img_result = evaluate_single_image(
                image_path=image_path,
                ground_truth=ground_truth,
                config=config,
                sam=sam_service,
                vlm=vlm,
                support_examples=support_examples,
            )
        except Exception as exc:
            # Defensive: evaluate_single_image should never raise, but just in case
            logger.error("Unhandled error on %s: %s", image_path.name, exc)
            from app.services.benchmark.experiment import ImageResult
            img_result = ImageResult(
                image_id=image_path.name,
                status="failed",
                predictions=[],
                ground_truth=ground_truth,
                matches=[],
                unmatched_preds=[],
                unmatched_gts=list(range(len(ground_truth))),
                iou_values=[],
                latency_ms=0.0,
                vlm_calls=0,
                error_type="RUNNER_ERROR",
                error_message=str(exc),
            )

        result.image_results.append(img_result)

        if img_result.status == "success":
            result.successful_images += 1
            accumulate_per_class(
                predictions=img_result.predictions,
                ground_truth=img_result.ground_truth,
                matches=img_result.matches,
                unmatched_preds=img_result.unmatched_preds,
                unmatched_gts=img_result.unmatched_gts,
                class_stats=class_stats,
            )

            # Detect non-recoverable model errors on first image
            if img_result.error_type in {"SAM_UNAVAILABLE", "VLM_NOT_CONFIGURED"}:
                result.status = "not_available"
                result.error_message = img_result.error_message
                if db is not None:
                    _persist_result(result, db)
                return result
        else:
            result.failed_images += 1

    # ── Aggregate metrics ─────────────────────────────────────────────────────
    if result.successful_images > 0:
        per_class = compute_per_class_metrics(class_stats)
        result.per_class_metrics = per_class
        result.mf1 = compute_mf1(per_class)
        result.precision, result.recall = compute_overall_precision_recall(per_class)

        # Mean IoU across all matched pairs in the experiment
        all_preds = [p for ir in result.image_results if ir.status == "success" for p in ir.predictions]
        all_gt = [g for ir in result.image_results if ir.status == "success" for g in ir.ground_truth]
        all_matches = []
        offset_p, offset_g = 0, 0
        for ir in result.image_results:
            if ir.status != "success":
                continue
            all_matches += [(pi + offset_p, gi + offset_g) for pi, gi in ir.matches]
            offset_p += len(ir.predictions)
            offset_g += len(ir.ground_truth)
        result.mean_iou = compute_mean_iou(all_preds, all_gt, all_matches, config.iou_threshold)

        # Latency
        latencies = [ir.latency_ms for ir in result.image_results if ir.status == "success"]
        result.total_latency_ms = round(sum(latencies), 2)
        result.avg_latency_ms = round(result.total_latency_ms / len(latencies), 2) if latencies else 0.0

        result.total_vlm_calls = sum(ir.vlm_calls for ir in result.image_results)
        result.status = "completed"
    else:
        result.status = "failed"
        result.error_message = "All images failed during inference."

    logger.info(
        "Benchmark completed: %s/%d-shot | mF1=%.4f | P=%.4f | R=%.4f | "
        "success=%d failed=%d total=%d",
        dataset, shots,
        result.mf1 or 0,
        result.precision or 0,
        result.recall or 0,
        result.successful_images,
        result.failed_images,
        result.total_images,
    )

    if db is not None:
        _persist_result(result, db)

    return result


def run_full_benchmark(db=None) -> List[ExperimentResult]:
    """
    Execute all 4 datasets × 4 shot configurations = 16 experiments.

    Loads SAM once, reuses across all runs.
    Returns list of ExperimentResult objects.
    Does NOT automatically persist unless db is provided.
    """
    results = []
    for dataset in SUPPORTED_DATASETS:
        for shots in SUPPORTED_SHOTS:
            logger.info("=== Starting benchmark: %s / %d-shot ===", dataset, shots)
            try:
                result = run_benchmark(dataset=dataset, shots=shots, db=db)
                results.append(result)
                logger.info(
                    "=== Finished: %s/%d-shot — status=%s mF1=%s ===",
                    dataset, shots, result.status, result.mf1
                )
            except Exception as exc:
                logger.error("Unexpected failure for %s/%d-shot: %s", dataset, shots, exc)
    return results


# ---------------------------------------------------------------------------
# Classification & Unified Adapter Benchmark Runners
# ---------------------------------------------------------------------------

def _run_classification_benchmark(
    adapter,
    shots: int,
    config: ExperimentConfig,
    db=None,
) -> ExperimentResult:
    """Execute evaluation for a CELL_CLASSIFICATION dataset (whole-image inference, no SAM)."""
    result = ExperimentResult(
        config=config,
        status="running",
        task_type=TaskType.CELL_CLASSIFICATION.value,
        accuracy=None,
        mean_iou=None,  # NEVER compute IoU for classification datasets!
    )

    try:
        vlm = get_vlm_provider(config.vlm_provider)
    except VLMNotConfiguredError as exc:
        result.status = "not_available"
        result.error_message = str(exc)
        if db is not None:
            _persist_result(result, db)
        return result

    # 1. Load support examples to exclude them from evaluation images
    support_examples = adapter.get_support_examples(shots) if shots > 0 else []
    support_paths = {str(ex.image_path) for ex in support_examples}

    # 2. Collect test images (balanced across classes, up to 10 per class)
    all_images = adapter.list_images(limit=100)
    images_by_class: dict = {c: [] for c in adapter.classes}
    for img in all_images:
        if str(img.path) in support_paths:
            continue
        cls = img.class_label
        if cls in images_by_class and len(images_by_class[cls]) < 10:
            images_by_class[cls].append(img)

    test_images = []
    for cls in adapter.classes:
        test_images.extend(images_by_class[cls])

    if not test_images:
        result.status = "failed"
        result.error_message = f"No valid evaluation images found for {adapter.dataset_id}."
        if db is not None:
            _persist_result(result, db)
        return result

    result.total_images = len(test_images)

    predictions = []
    ground_truth = []
    latencies = []
    vlm_calls = 0

    for img_record in test_images:
        try:
            inference_res = run_classification_inference(
                image=img_record.path,
                dataset=adapter.dataset_id,
                shots=shots,
                vlm_provider=vlm,
            )
            pred_label = inference_res.get("prediction") or "Unknown"
            true_label = img_record.class_label
            predictions.append(pred_label)
            ground_truth.append(true_label)
            lat_ms = inference_res.get("metadata", {}).get("inference_time_ms", 0.0)
            latencies.append(lat_ms)
            vlm_calls += inference_res.get("metadata", {}).get("vlm_calls", 1)
            result.successful_images += 1
        except Exception as exc:
            logger.warning("Classification inference error on %s: %s", img_record.path.name, exc)
            result.failed_images += 1

    if result.successful_images > 0:
        metrics = compute_classification_metrics(predictions, ground_truth, adapter.classes)
        result.accuracy = metrics["accuracy"]
        result.precision = metrics["precision"]
        result.recall = metrics["recall"]
        result.mf1 = metrics["f1"]
        result.per_class_metrics = metrics["per_class"]
        result.mean_iou = None  # Strictly null for classification
        result.total_latency_ms = round(sum(latencies), 2)
        result.avg_latency_ms = round(result.total_latency_ms / len(latencies), 2) if latencies else 0.0
        result.total_vlm_calls = vlm_calls
        result.status = "completed"
    else:
        result.status = "failed"
        result.error_message = "All evaluation images failed during classification inference."

    if db is not None:
        _persist_result(result, db)

    return result


def _run_adapter_detection_benchmark(
    adapter,
    shots: int,
    db=None,
) -> ExperimentResult:
    """Execute evaluation for an OBJECT_DETECTION dataset with a registered adapter (e.g. Malaria)."""
    vlm_model_name = settings.VLM_MODEL or "gemini-2.5-flash"
    vlm_provider_name = settings.VLM_PROVIDER or "gemini"
    config = ExperimentConfig(
        dataset=adapter.dataset_id,
        shots=shots,
        iou_threshold=settings.BENCHMARK_IOU_THRESHOLD,
        max_candidates=settings.MAX_BENCHMARK_CANDIDATES,
        vlm_model=vlm_model_name,
        vlm_provider=vlm_provider_name,
    )
    result = ExperimentResult(
        config=config,
        status="running",
        task_type=TaskType.OBJECT_DETECTION.value,
        accuracy=None,
    )

    if not sam_service.is_model_available():
        result.status = "not_available"
        result.error_message = (
            "SAM model weights unavailable. Set SAM_MODEL_PATH in backend/.env "
            "to a valid SAM checkpoint file."
        )
        logger.warning("Benchmark skipped — SAM unavailable: %s", result.error_message)
        if db is not None:
            _persist_result(result, db)
        return result

    try:
        vlm = get_vlm_provider(vlm_provider_name)
    except VLMNotConfiguredError as exc:
        result.status = "not_available"
        result.error_message = str(exc)
        if db is not None:
            _persist_result(result, db)
        return result

    # Load support examples
    support_examples = adapter.get_support_examples(shots) if shots > 0 else []
    support_paths = {str(ex.image_path) for ex in support_examples}

    # Load test images and annotations
    all_images = adapter.list_images(limit=30)
    test_records = []
    for img in all_images:
        if str(img.path) in support_paths:
            continue
        ann_record = adapter.load_annotations(img.image_id)
        gt_boxes = [
            {"label": a["label"], "bbox": a["bbox"]}
            for a in ann_record.annotations
            if "bbox" in a and "label" in a
        ]
        if gt_boxes:
            test_records.append((img.path, gt_boxes))
        if len(test_records) >= 10:
            break

    if not test_records:
        result.status = "failed"
        result.error_message = f"No test records with annotations found for {adapter.dataset_id}."
        if db is not None:
            _persist_result(result, db)
        return result

    result.total_images = len(test_records)
    class_stats: dict = {}

    for image_path, ground_truth in test_records:
        img_result = evaluate_single_image(
            image_path=image_path,
            ground_truth=ground_truth,
            config=config,
            sam=sam_service,
            vlm=vlm,
            support_examples=support_examples,
        )
        result.image_results.append(img_result)
        if img_result.status == "success":
            result.successful_images += 1
            accumulate_per_class(
                predictions=img_result.predictions,
                ground_truth=img_result.ground_truth,
                matches=img_result.matches,
                unmatched_preds=img_result.unmatched_preds,
                unmatched_gts=img_result.unmatched_gts,
                class_stats=class_stats,
            )
        else:
            result.failed_images += 1

    if result.successful_images > 0:
        per_class = compute_per_class_metrics(class_stats)
        result.per_class_metrics = per_class
        result.mf1 = compute_mf1(per_class)
        result.precision, result.recall = compute_overall_precision_recall(per_class)

        all_preds = [p for ir in result.image_results if ir.status == "success" for p in ir.predictions]
        all_gt = [g for ir in result.image_results if ir.status == "success" for g in ir.ground_truth]
        all_matches = []
        offset_p, offset_g = 0, 0
        for ir in result.image_results:
            if ir.status != "success":
                continue
            all_matches += [(pi + offset_p, gi + offset_g) for pi, gi in ir.matches]
            offset_p += len(ir.predictions)
            offset_g += len(ir.ground_truth)
        result.mean_iou = compute_mean_iou(all_preds, all_gt, all_matches, config.iou_threshold)

        latencies = [ir.latency_ms for ir in result.image_results if ir.status == "success"]
        result.total_latency_ms = round(sum(latencies), 2)
        result.avg_latency_ms = round(result.total_latency_ms / len(latencies), 2) if latencies else 0.0
        result.total_vlm_calls = sum(ir.vlm_calls for ir in result.image_results)
        result.status = "completed"
    else:
        result.status = "failed"
        result.error_message = "All images failed during inference."

    if db is not None:
        _persist_result(result, db)

    return result


# ---------------------------------------------------------------------------
# Result persistence
# ---------------------------------------------------------------------------

def _persist_result(result: ExperimentResult, db) -> None:
    """Save ExperimentResult to the benchmark_results database table."""
    from app.models.benchmark import BenchmarkResult
    try:
        db_record = BenchmarkResult(
            experiment_id=result.config.experiment_id,
            dataset=result.config.dataset,
            shots=result.config.shots,
            status=result.status,
            task_type=result.task_type or ("cell_classification" if result.accuracy is not None else "object_detection"),
            accuracy=result.accuracy,
            mf1=result.mf1,
            precision=result.precision,
            recall=result.recall,
            iou=result.mean_iou,
            latency=result.avg_latency_ms,
            vlm_calls=result.total_vlm_calls,
            image_count=result.total_images,
            failed_images=result.failed_images,
            iou_threshold=result.config.iou_threshold,
            vlm_model=result.config.vlm_model,
            error_message=result.error_message,
        )
        db.add(db_record)
        db.commit()
        db.refresh(db_record)
        logger.info("Persisted benchmark result id=%d for %s/%d-shot", db_record.id, result.config.dataset, result.config.shots)
    except Exception as exc:
        logger.error("Failed to persist benchmark result: %s", exc)
        db.rollback()


# ---------------------------------------------------------------------------
# Combine sub-results for Micro-OD overall
# ---------------------------------------------------------------------------

def _combine_results(sub_results: List[ExperimentResult], shots: int) -> ExperimentResult:
    """Merge 4 sub-dataset results into one Micro-OD aggregate result."""
    from app.services.benchmark.experiment import ExperimentConfig
    combined_config = ExperimentConfig(
        dataset="Micro-OD",
        shots=shots,
        iou_threshold=settings.BENCHMARK_IOU_THRESHOLD,
        max_candidates=settings.MAX_BENCHMARK_CANDIDATES,
        vlm_model=settings.VLM_MODEL or "gemini-2.5-flash",
        vlm_provider=settings.VLM_PROVIDER or "gemini",
    )
    combined = ExperimentResult(config=combined_config, status="not_available")

    for sub in sub_results:
        combined.total_images += sub.total_images
        combined.successful_images += sub.successful_images
        combined.failed_images += sub.failed_images
        combined.image_results.extend(sub.image_results)
        if sub.per_class_metrics:
            for cls, m in sub.per_class_metrics.items():
                combined.per_class_metrics[cls] = m  # last dataset wins per class

    completed = [s for s in sub_results if s.status == "completed"]
    if completed:
        combined.status = "completed"
        mf1_vals = [s.mf1 for s in completed if s.mf1 is not None]
        p_vals = [s.precision for s in completed if s.precision is not None]
        r_vals = [s.recall for s in completed if s.recall is not None]
        iou_vals = [s.mean_iou for s in completed if s.mean_iou is not None]
        lat_vals = [s.avg_latency_ms for s in completed if s.avg_latency_ms is not None]
        vlm_vals = [s.total_vlm_calls for s in completed if s.total_vlm_calls is not None]

        combined.mf1 = round(sum(mf1_vals) / len(mf1_vals), 6) if mf1_vals else None
        combined.precision = round(sum(p_vals) / len(p_vals), 6) if p_vals else None
        combined.recall = round(sum(r_vals) / len(r_vals), 6) if r_vals else None
        combined.mean_iou = round(sum(iou_vals) / len(iou_vals), 6) if iou_vals else None
        combined.avg_latency_ms = round(sum(lat_vals) / len(lat_vals), 6) if lat_vals else None
        combined.total_vlm_calls = sum(vlm_vals) if vlm_vals else None
    elif any(s.status == "not_available" for s in sub_results):
        combined.status = "not_available"
        combined.error_message = "One or more sub-datasets had unavailable models."
    else:
        combined.status = "failed"
        combined.error_message = "All sub-datasets failed."

    return combined


# ---------------------------------------------------------------------------
# CLI entrypoint
# ---------------------------------------------------------------------------

def _cli_main() -> None:
    parser = argparse.ArgumentParser(
        description="JeevaDrishti Micro-OD Benchmark Runner",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Single configuration
  python -m app.services.benchmark.runner --dataset BBBC --shots 0

  # All 16 configurations
  python -m app.services.benchmark.runner --all

  # Persist results to the database
  python -m app.services.benchmark.runner --dataset BCCD --shots 3 --persist
""",
    )
    parser.add_argument(
        "--dataset",
        choices=SUPPORTED_DATASETS + ["Micro-OD"],
        default=None,
        help="Dataset to evaluate (default: BBBC for single run)",
    )
    parser.add_argument(
        "--shots",
        type=int,
        choices=SUPPORTED_SHOTS,
        default=0,
        help="Number of few-shot support examples (default: 0)",
    )
    parser.add_argument(
        "--all",
        action="store_true",
        help="Run all 4 × 2 = 8 configurations",
    )
    parser.add_argument(
        "--persist",
        action="store_true",
        help="Persist results to the database (requires --persist flag for safety)",
    )
    args = parser.parse_args()

    db_session = None
    if args.persist:
        from app.db.init_db import init_db
        from app.db.session import SessionLocal
        init_db()
        db_session = SessionLocal()


    try:
        if args.all:
            results = run_full_benchmark(db=db_session)
            print("\n" + "=" * 60)
            print(f"FULL BENCHMARK — {len(results)} experiments")
            print("=" * 60)
            for r in results:
                _print_result(r)
        else:
            dataset = args.dataset or "BBBC"
            result = run_benchmark(dataset=dataset, shots=args.shots, db=db_session)
            print("\n" + "=" * 60)
            print("BENCHMARK RESULT")
            print("=" * 60)
            _print_result(result)
    finally:
        if db_session is not None:
            db_session.close()


def _print_result(result: ExperimentResult) -> None:
    cfg = result.config
    print(f"  Dataset       : {cfg.dataset}")
    print(f"  Shots         : {cfg.shots}")
    print(f"  Status        : {result.status}")
    print(f"  mF1           : {result.mf1}")
    print(f"  Precision     : {result.precision}")
    print(f"  Recall        : {result.recall}")
    print(f"  Mean IoU      : {result.mean_iou}")
    print(f"  Avg Latency   : {result.avg_latency_ms} ms")
    print(f"  VLM Calls     : {result.total_vlm_calls}")
    print(f"  Images        : {result.successful_images}/{result.total_images} ok, {result.failed_images} failed")
    print(f"  IoU Threshold : {cfg.iou_threshold}")
    print(f"  VLM Model     : {cfg.vlm_model}")
    print(f"  Experiment ID : {cfg.experiment_id}")
    if result.error_message:
        print(f"  Error         : {result.error_message}")
    if result.per_class_metrics:
        print("  Per-class metrics:")
        for cls, m in sorted(result.per_class_metrics.items()):
            print(f"    {cls:<25} P={m['precision']:.4f} R={m['recall']:.4f} F1={m['f1']:.4f}")
    print()


if __name__ == "__main__":
    _cli_main()
