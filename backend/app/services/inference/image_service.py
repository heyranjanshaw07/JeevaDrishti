import base64
from io import BytesIO
from pathlib import Path
from typing import Any, Dict, List, Optional, Sequence, Tuple
from PIL import Image, ImageDraw, ImageFont


CLASS_COLORS: Dict[str, Tuple[int, int, int]] = {
    "Red Blood Cells": (230, 57, 70),       # Bright Crimson
    "White Blood Cells": (69, 123, 157),    # Deep Slate Blue
    "Platelets": (244, 162, 97),            # Amber Orange
    "Ring Cells": (231, 111, 81),           # Coral Red
    "Trophozoite Cells": (42, 157, 143),    # Teal
    "Gametocyte Cells": (155, 93, 229),     # Violet Purple
    "Schizont Cells": (241, 91, 181),       # Rose Pink
    "Spindle Cells": (0, 187, 249),         # Cerulean
    "Polygonal Cells": (0, 245, 212),       # Mint Green
    "Round Cells": (254, 228, 64),          # Canary Yellow
    "Unknown": (180, 180, 180),             # Gray
}
DEFAULT_COLOR = (255, 75, 75)


def load_image(source: Path | str | bytes | Image.Image) -> Image.Image:
    """Load an image from various sources and ensure standard RGB mode."""
    if isinstance(source, Image.Image):
        img = source
    elif isinstance(source, bytes):
        img = Image.open(BytesIO(source))
    elif isinstance(source, (str, Path)):
        img = Image.open(source)
    else:
        raise ValueError(f"Unsupported image source type: {type(source)}")

    if img.mode != "RGB":
        img = img.convert("RGB")
    return img


def validate_image_dimensions(image: Image.Image) -> Tuple[int, int]:
    """Validate image has non-zero positive dimensions."""
    width, height = image.size
    if width <= 0 or height <= 0:
        raise ValueError(f"Invalid image dimensions: {width}x{height}")
    return width, height


def crop_patch(
    image: Image.Image,
    bbox: Sequence[int],
    target_size: Optional[Tuple[int, int]] = (128, 128),
) -> Image.Image:
    """
    Crop candidate bounding box [x1, y1, x2, y2] from image.
    Clamps coordinates to image boundaries and resizes to target_size if specified.
    """
    w, h = image.size
    x1, y1, x2, y2 = [int(v) for v in bbox]

    # Boundary clamping
    x1 = max(0, min(w - 1, x1))
    y1 = max(0, min(h - 1, y1))
    x2 = max(x1 + 1, min(w, x2))
    y2 = max(y1 + 1, min(h, y2))

    cropped = image.crop((x1, y1, x2, y2))
    if target_size:
        cropped = cropped.resize(target_size, Image.Resampling.BILINEAR)
    return cropped


def image_to_base64(image: Image.Image, format: str = "JPEG") -> str:
    """Encode PIL image as base64 string for VLM API requests."""
    buffer = BytesIO()
    image.save(buffer, format=format)
    return base64.b64encode(buffer.getvalue()).decode("utf-8")


def draw_detection_overlay(
    image: Image.Image,
    detections: List[Dict[str, Any]],
    box_width: int = 3,
) -> Image.Image:
    """
    Render visual detection overlay with bounding boxes, canonical labels,
    and confidence scores on a copy of the source image.
    """
    overlay = image.copy()
    draw = ImageDraw.Draw(overlay)

    font = ImageFont.load_default()

    for det in detections:
        bbox = det.get("bbox", [])
        if len(bbox) != 4:
            continue

        x1, y1, x2, y2 = bbox
        label = det.get("label", "Cell")
        conf = det.get("confidence")

        color = CLASS_COLORS.get(label, DEFAULT_COLOR)

        # Draw bounding box
        draw.rectangle([x1, y1, x2, y2], outline=color, width=box_width)

        # Form label text
        if conf is not None:
            text = f"{label} ({conf:.2f})"
        else:
            text = label

        # Text banner background
        try:
            bbox_text = draw.textbbox((x1, max(0, y1 - 16)), text, font=font)
            draw.rectangle(bbox_text, fill=color)
            draw.text((x1 + 2, max(0, y1 - 16)), text, fill=(0, 0, 0), font=font)
        except Exception:
            # Fallback for simpler Pillow versions
            draw.text((x1 + 2, max(0, y1 - 14)), text, fill=color, font=font)

    return overlay


def save_overlay(
    overlay_image: Image.Image,
    analysis_id: str,
    upload_path: Path,
) -> str:
    """
    Save overlay image to <upload_path>/overlays/<analysis_id>_overlay.png.
    Returns relative filename suitable for external lookup.
    """
    overlay_dir = upload_path / "overlays"
    overlay_dir.mkdir(parents=True, exist_ok=True)
    filename = f"{analysis_id}_overlay.png"
    target_path = overlay_dir / filename
    overlay_image.save(target_path, format="PNG")
    return f"overlays/{filename}"
