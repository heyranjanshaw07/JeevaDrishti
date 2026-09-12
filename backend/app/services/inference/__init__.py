"""Inference package integrating SAM object proposals and VLM classification."""
from app.services.inference.image_service import (
    load_image,
    crop_patch,
    image_to_base64,
    draw_detection_overlay,
    save_overlay,
)
from app.services.inference.prompt_service import (
    normalize_class_label,
    get_dataset_prompt,
    load_few_shot_examples,
    CANONICAL_CLASSES,
    SUPPORTED_SHOTS,
)
from app.services.inference.sam_service import sam_service, SAMService, AIModelUnavailableError
from app.services.inference.vlm_service import (
    VLMProvider,
    GeminiVLMProvider,
    OpenAIVLMProvider,
    MockVLMProvider,
    get_vlm_provider,
    VLMNotConfiguredError,
)
from app.services.inference.hybrid_engine import run_hybrid_inference, HybridInferenceError

__all__ = [
    "load_image",
    "crop_patch",
    "image_to_base64",
    "draw_detection_overlay",
    "save_overlay",
    "normalize_class_label",
    "get_dataset_prompt",
    "load_few_shot_examples",
    "CANONICAL_CLASSES",
    "SUPPORTED_SHOTS",
    "sam_service",
    "SAMService",
    "AIModelUnavailableError",
    "VLMProvider",
    "GeminiVLMProvider",
    "OpenAIVLMProvider",
    "MockVLMProvider",
    "get_vlm_provider",
    "VLMNotConfiguredError",
    "run_hybrid_inference",
    "HybridInferenceError",
]
