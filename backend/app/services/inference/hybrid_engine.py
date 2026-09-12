from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union
from PIL import Image

from app.core.config import settings
from app.core.logging import logger
from app.services.inference.image_service import (
    load_image,
    validate_image_dimensions,
    crop_patch,
    image_to_base64,
    draw_detection_overlay,
    save_overlay,
)
from app.services.inference.prompt_service import (
    normalize_class_label,
    get_dataset_prompt,
    load_few_shot_examples,
    SUPPORTED_SHOTS,
    DATASET_CLASSES,
)
from app.services.inference.sam_service import sam_service, AIModelUnavailableError
from app.services.inference.vlm_service import (
    get_vlm_provider,
    VLMProvider,
    VLMNotConfiguredError,
)

SUPPORTED_DATASETS = list(DATASET_CLASSES.keys())


class HybridInferenceError(Exception):
    """General error during hybrid inference processing."""

    def __init__(self, message: str, code: str = "INFERENCE_ERROR"):
        super().__init__(message)
        self.code = code
        self.message = message


def run_hybrid_inference(
    image: Union[Path, str, bytes, Image.Image],
    dataset: str,
    shots: int = 0,
    model: Optional[str] = None,
    sam_provider: Optional[Any] = None,
    vlm_provider: Optional[VLMProvider] = None,
    analysis_id: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Execute the hybrid cell detection pipeline:
    Microscopy Image -> SAM Proposals -> Candidate Patches -> VLM Classification -> Canonical Mapping -> Overlay.
    """
    # 1. Validate dataset and shots
    if dataset not in SUPPORTED_DATASETS:
        raise HybridInferenceError(
            f"Unsupported dataset '{dataset}'. Supported: {SUPPORTED_DATASETS}",
            code="UNSUPPORTED_DATASET",
        )

    if shots not in SUPPORTED_SHOTS:
        raise HybridInferenceError(
            f"Invalid shot configuration '{shots}'. Supported: {SUPPORTED_SHOTS}",
            code="INVALID_SHOT_CONFIGURATION",
        )

    # 2. Image loading and validation
    try:
        pil_image = load_image(image)
        w, h = validate_image_dimensions(pil_image)
    except Exception as e:
        logger.error("Image loading/preprocessing failure: %s", str(e))
        raise HybridInferenceError(f"Image processing failure: {str(e)}", code="INVALID_IMAGE")

    import time
    start_time = time.perf_counter()

    # 3. Microscopy Domain Validation Layer
    from app.services.inference.microscopy_validator import microscopy_validator
    validation = microscopy_validator.validate(pil_image)
    if not validation.is_valid:
        elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
        return {
            "status": "rejected",
            "reason": validation.reason or "non_microscopy_image",
            "message": validation.message or "The uploaded image does not appear to be a microscopy image.",
            "detections": [],
            "boxes": [],
            "metrics": None,
            "prediction": "Non-Microscopy Image",
            "confidence": None,
            "indicators": [],
            "explanation": validation.message or "The uploaded image does not appear to be a microscopy image. Biological cell detection was not executed.",
            "overlay": None,
            "metadata": {
                "dataset": dataset,
                "shots": shots,
                "proposals_evaluated": 0,
                "vlm_calls": 0,
                "inference_time_ms": elapsed_ms,
                "detections_count": 0,
                "avg_confidence": None,
                "precision": None,
                "recall": None,
                "mAP50": None,
                "image_dimensions": [w, h],
                "validation": validation.details,
            },
        }

    # 4. Object proposal generation via SAM
    sam = sam_provider or sam_service
    max_candidates = settings.MAX_LIVE_CANDIDATES or 15

    try:
        candidate_boxes = sam.generate_proposals(pil_image, max_candidates=max_candidates)
    except AIModelUnavailableError:
        raise
    except Exception as e:
        logger.error("SAM proposal generation failure: %s", str(e))
        raise HybridInferenceError(f"SAM proposal failure: {str(e)}", code="SAM_FAILURE")

    if not candidate_boxes:
        elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
        return {
            "status": "completed",
            "prediction": "Unable to determine",
            "confidence": None,
            "indicators": [],
            "explanation": "Unable to determine: the AI detection model found no distinguishable cellular morphology or optical contrast in the provided input.",
            "boxes": [],
            "detections": [],
            "overlay": None,
            "metadata": {
                "dataset": dataset,
                "shots": shots,
                "proposals_evaluated": 0,
                "vlm_calls": 0,
                "inference_time_ms": elapsed_ms,
                "detections_count": 0,
                "avg_confidence": None,
                "precision": None,
                "recall": None,
                "mAP50": None,
                "image_dimensions": [w, h],
            },
        }

    # 5. Prompt generation and exemplar loading
    prompt = get_dataset_prompt(dataset)
    few_shot_examples = load_few_shot_examples(dataset, shots) if shots > 0 else []

    # 6. VLM Classification with Candidate Validation
    vlm = vlm_provider or get_vlm_provider(model)

    detections: List[Dict[str, Any]] = []
    final_boxes: List[List[int]] = []
    vlm_calls_count = 0

    for box in candidate_boxes:
        x1, y1, x2, y2 = box
        bw = x2 - x1
        bh = y2 - y1

        # Geometric candidate validation (reject disproportionate proposals or stripes)
        if bw < 5 or bh < 5 or bw > (w * 0.45) or bh > (h * 0.45):
            continue
        c_aspect = float(bw) / float(max(1, bh))
        if c_aspect < 0.22 or c_aspect > 4.5:
            continue

        try:
            patch = crop_patch(pil_image, [x1, y1, x2, y2], target_size=(128, 128))
            patch_b64 = image_to_base64(patch, format="JPEG")
            vlm_calls_count += 1
            raw_label, confidence = vlm.classify_patch(
                patch_b64=patch_b64,
                prompt=prompt,
                few_shot_examples=few_shot_examples,
            )
            canonical_label = normalize_class_label(raw_label)
            if canonical_label is not None and canonical_label != "NOT_A_CELL":
                box_list = [int(x1), int(y1), int(x2), int(y2)]
                detections.append({
                    "label": canonical_label,
                    "bbox": box_list,
                    "confidence": float(confidence),
                })
                final_boxes.append(box_list)
        except (VLMNotConfiguredError, AIModelUnavailableError):
            raise
        except Exception as e:
            logger.warning("VLM evaluation error on candidate patch: %s", str(e))
            continue

    if not candidate_boxes or not detections:
        elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
        return {
            "status": "completed",
            "prediction": "No Cells Detected",
            "confidence": None,
            "indicators": [],
            "explanation": "No cells were confidently detected by the current inference pipeline.",
            "boxes": [],
            "detections": [],
            "overlay": None,
            "metadata": {
                "dataset": dataset,
                "shots": shots,
                "vlm_model": getattr(vlm, "model_name", model or "default") if 'vlm' in locals() else (model or "default"),
                "proposals_evaluated": len(candidate_boxes) if candidate_boxes else 0,
                "vlm_calls": vlm_calls_count,
                "inference_time_ms": elapsed_ms,
                "detections_count": 0,
                "avg_confidence": None,
                "precision": None,
                "recall": None,
                "mAP50": None,
                "image_dimensions": [w, h],
            },
        }

    # 6. Dynamic indicators & prediction derived from actual detections
    from collections import Counter
    counts = Counter(d["label"] for d in detections)
    avg_conf = round(sum(d["confidence"] for d in detections) / len(detections), 4)

    indicators: List[str] = []
    for label, count in sorted(counts.items(), key=lambda x: -x[1]):
        cls_conf = round(sum(d["confidence"] for d in detections if d["label"] == label) / count * 100, 1)
        indicators.append(f"{count} {label} instances detected (mean confidence: {cls_conf}%)")

    # Dynamic prediction classification based on actual detected phenotypes
    parasitic = [k for k in ["Ring Cells", "Trophozoite Cells", "Schizont Cells", "Gametocyte Cells"] if k in counts]
    if parasitic:
        prediction = f"Parasitic Infection Detected ({', '.join(parasitic)})"
        explanation = (
            f"Model identified {len(detections)} total cellular targets with {sum(counts[p] for p in parasitic)} "
            f"parasitic stage markers ({', '.join(parasitic)}). Morphological indicators: {'; '.join(indicators)}."
        )
    elif "White Blood Cells" in counts and "Red Blood Cells" in counts and "Platelets" in counts:
        prediction = "Tri-Lineage Hematologic Smear"
        explanation = (
            f"Complete peripheral blood smear cytology verified across erythrocyte, leukocyte, and thrombocyte lineages. "
            f"Model localized {len(detections)} instances with {round(avg_conf * 100, 1)}% average confidence. "
            f"Morphological indicators: {'; '.join(indicators)}."
        )
    elif "White Blood Cells" in counts and counts["White Blood Cells"] > counts.get("Red Blood Cells", 0):
        prediction = "Leukocyte-Predominant Cytology"
        explanation = (
            f"Leukocyte-dominant morphology detected with {counts['White Blood Cells']} localized white blood cell nuclei. "
            f"Morphological indicators: {'; '.join(indicators)}."
        )
    elif any(k in counts for k in ["Polygonal Cells", "Round Cells", "Spindle Cells"]):
        culture_types = [k for k in ["Polygonal Cells", "Round Cells", "Spindle Cells"] if k in counts]
        prediction = f"Cell Line Culture Morphology ({', '.join(culture_types)})"
        explanation = (
            f"Instance segmentation resolved {len(detections)} adherent/culture cell bodies. "
            f"Morphological indicators: {'; '.join(indicators)}."
        )
    else:
        dominant_label = counts.most_common(1)[0][0]
        prediction = f"{dominant_label} Specimen"
        explanation = (
            f"Model segmented {len(detections)} cellular instances dominated by {dominant_label} ({counts[dominant_label]} instances, {round(avg_conf * 100, 1)}% confidence). "
            f"Morphological indicators: {'; '.join(indicators)}."
        )

    # 7. Overlay generation
    overlay_rel_path: Optional[str] = None
    if analysis_id:
        try:
            overlay_img = draw_detection_overlay(pil_image, detections)
            overlay_rel_path = save_overlay(overlay_img, analysis_id, settings.upload_path)
        except Exception as e:
            logger.warning("Overlay generation failed for analysis %s: %s", analysis_id, str(e))

    elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)

    return {
        "status": "completed",
        "prediction": prediction,
        "confidence": avg_conf,
        "indicators": indicators,
        "explanation": explanation,
        "boxes": final_boxes,
        "detections": detections,
        "overlay": overlay_rel_path,
        "metadata": {
            "dataset": dataset,
            "shots": shots,
            "vlm_model": getattr(vlm, "model_name", model or "default"),
            "proposals_evaluated": len(candidate_boxes),
            "vlm_calls": vlm_calls_count,
            "inference_time_ms": elapsed_ms,
            "detections_count": len(detections),
            "avg_confidence": avg_conf,
            "precision": None,
            "recall": None,
            "mAP50": None,
            "image_dimensions": [w, h],
        },
    }
