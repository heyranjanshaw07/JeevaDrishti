"""
Per-Image Evaluator
===================
Runs hybrid SAM+VLM inference on a single microscopy image and evaluates
predictions against ground truth annotations using IoU-based matching.

This module contains NO metric aggregation logic — see metrics.py for that.
It focuses on executing inference, measuring timing, and producing ImageResult.
"""

import time
from pathlib import Path
from typing import Any, Dict, List, Optional

from PIL import Image

from app.core.logging import logger
from app.services.benchmark.experiment import ExperimentConfig, ImageResult
from app.services.benchmark.metrics import (
    match_predictions_to_gt,
    compute_iou,
)
from app.services.inference.sam_service import SAMService, AIModelUnavailableError
from app.services.inference.vlm_service import VLMProvider, VLMNotConfiguredError
from app.services.inference.prompt_service import (
    get_dataset_prompt,
    normalize_class_label,
)
from app.services.inference.image_service import (
    load_image,
    crop_patch,
    image_to_base64,
)


def evaluate_single_image(
    image_path: Path,
    ground_truth: List[Dict],
    config: ExperimentConfig,
    sam: SAMService,
    vlm: VLMProvider,
    support_examples: List[Dict],
) -> ImageResult:
    """
    Run inference on one image and match predictions to ground truth.

    Pipeline:
        Image → SAM proposals → candidate patches → VLM classification
        → canonical labels → match to GT via IoU → ImageResult

    Args:
        image_path    : Absolute path to the microscopy image.
        ground_truth  : List of {"label": str, "bbox": [x1,y1,x2,y2]}.
        config        : ExperimentConfig with all evaluation parameters.
        sam           : SAMService singleton (already initialized, reused).
        vlm           : VLMProvider instance.
        support_examples : Few-shot in-context examples (empty for 0-shot).

    Returns:
        ImageResult with status, predictions, matches, timing, and VLM call count.
    """
    image_id = image_path.name
    t_start = time.perf_counter()
    vlm_calls = 0

    # ── 1. Load image ────────────────────────────────────────────────────────
    try:
        pil_image = load_image(image_path)
    except Exception as exc:
        return ImageResult(
            image_id=image_id,
            status="failed",
            predictions=[],
            ground_truth=ground_truth,
            matches=[],
            unmatched_preds=[],
            unmatched_gts=list(range(len(ground_truth))),
            iou_values=[],
            latency_ms=_elapsed_ms(t_start),
            vlm_calls=0,
            error_type="IMAGE_LOAD_ERROR",
            error_message=str(exc),
        )

    # ── 2. SAM proposals ─────────────────────────────────────────────────────
    try:
        candidate_boxes = sam.generate_proposals(
            pil_image,
            max_candidates=config.max_candidates,
        )
    except AIModelUnavailableError as exc:
        return ImageResult(
            image_id=image_id,
            status="failed",
            predictions=[],
            ground_truth=ground_truth,
            matches=[],
            unmatched_preds=[],
            unmatched_gts=list(range(len(ground_truth))),
            iou_values=[],
            latency_ms=_elapsed_ms(t_start),
            vlm_calls=0,
            error_type="SAM_UNAVAILABLE",
            error_message=str(exc),
        )
    except Exception as exc:
        return ImageResult(
            image_id=image_id,
            status="failed",
            predictions=[],
            ground_truth=ground_truth,
            matches=[],
            unmatched_preds=[],
            unmatched_gts=list(range(len(ground_truth))),
            iou_values=[],
            latency_ms=_elapsed_ms(t_start),
            vlm_calls=0,
            error_type="SAM_ERROR",
            error_message=str(exc),
        )

    if not candidate_boxes:
        latency = _elapsed_ms(t_start)
        _, _, unmatched_gts = match_predictions_to_gt([], ground_truth, config.iou_threshold)
        return ImageResult(
            image_id=image_id,
            status="success",
            predictions=[],
            ground_truth=ground_truth,
            matches=[],
            unmatched_preds=[],
            unmatched_gts=unmatched_gts,
            iou_values=[],
            latency_ms=latency,
            vlm_calls=0,
        )

    # ── 3. VLM classification per candidate ──────────────────────────────────
    prompt = get_dataset_prompt(config.dataset)
    predictions: List[Dict] = []

    for box in candidate_boxes:
        x1, y1, x2, y2 = box
        try:
            patch = crop_patch(pil_image, [x1, y1, x2, y2], target_size=(128, 128))
            patch_b64 = image_to_base64(patch, format="JPEG")
            raw_label, confidence = vlm.classify_patch(
                patch_b64=patch_b64,
                prompt=prompt,
                few_shot_examples=support_examples,
            )
            vlm_calls += 1
            canonical = normalize_class_label(raw_label)
            if canonical is not None:
                predictions.append({
                    "label": canonical,
                    "bbox": [int(x1), int(y1), int(x2), int(y2)],
                    "confidence": float(confidence),
                })
        except (VLMNotConfiguredError, AIModelUnavailableError) as exc:
            # Non-recoverable — propagate immediately
            return ImageResult(
                image_id=image_id,
                status="failed",
                predictions=[],
                ground_truth=ground_truth,
                matches=[],
                unmatched_preds=[],
                unmatched_gts=list(range(len(ground_truth))),
                iou_values=[],
                latency_ms=_elapsed_ms(t_start),
                vlm_calls=vlm_calls,
                error_type=getattr(exc, "code", "VLM_ERROR"),
                error_message=str(exc),
            )
        except Exception as exc:
            # Per-patch failure — skip and continue
            logger.warning("VLM patch error on %s: %s", image_id, exc)
            continue

    # ── 4. Match predictions to GT ───────────────────────────────────────────
    matches, unmatched_preds, unmatched_gts = match_predictions_to_gt(
        predictions, ground_truth, config.iou_threshold
    )

    iou_values = [
        compute_iou(predictions[pi]["bbox"], ground_truth[gi]["bbox"])
        for pi, gi in matches
    ]

    return ImageResult(
        image_id=image_id,
        status="success",
        predictions=predictions,
        ground_truth=ground_truth,
        matches=matches,
        unmatched_preds=unmatched_preds,
        unmatched_gts=unmatched_gts,
        iou_values=iou_values,
        latency_ms=_elapsed_ms(t_start),
        vlm_calls=vlm_calls,
    )


def _elapsed_ms(start: float) -> float:
    return round((time.perf_counter() - start) * 1000, 2)
