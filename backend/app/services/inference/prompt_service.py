import json
import re
from pathlib import Path
from typing import Any, Dict, List, Optional, Sequence, Tuple
from PIL import Image

from app.services.inference.image_service import crop_patch, image_to_base64


CANONICAL_CLASSES = [
    "Red Blood Cells",
    "White Blood Cells",
    "Platelets",
    "Ring Cells",
    "Trophozoite Cells",
    "Gametocyte Cells",
    "Schizont Cells",
    "Spindle Cells",
    "Polygonal Cells",
    "Round Cells",
]

# Alias normalization rules mapping regex patterns to canonical names
ALIAS_RULES: Dict[str, str] = {
    r"^rbc$|^red\W*blood(\W*cell)?s?$|^erythrocyte(s)?$": "Red Blood Cells",
    r"^wbc$|^white\W*blood(\W*cell)?s?$|^leukocyte(s)?$": "White Blood Cells",
    r"^plate(let)?s?$|^thrombocyte(s)?$": "Platelets",
    r"^ring(\W*cell)?s?$": "Ring Cells",
    r"^trophozoite(\W*cell)?s?$": "Trophozoite Cells",
    r"^gametocyte(\W*cell)?s?$": "Gametocyte Cells",
    r"^schizont(\W*cell)?s?$": "Schizont Cells",
    r"^spindle(\W*cell)?s?$": "Spindle Cells",
    r"^polygonal(\W*cell)?s?$": "Polygonal Cells",
    r"^round(\W*cell)?s?$": "Round Cells",
}

DATASET_CLASSES: Dict[str, List[str]] = {
    "BBBC": [
        "Red Blood Cells",
        "Trophozoite Cells",
        "Ring Cells",
        "Gametocyte Cells",
        "Schizont Cells",
        "White Blood Cells",
    ],
    "BCCD": [
        "Platelets",
        "Red Blood Cells",
        "White Blood Cells",
    ],
    "LIVECell": [
        "Polygonal Cells",
        "Round Cells",
        "Spindle Cells",
    ],
    "NIH-3T3": [
        "Polygonal Cells",
        "Round Cells",
        "Spindle Cells",
    ],
    "Micro-OD": [
        "Gametocyte Cells",
        "Platelets",
        "Polygonal Cells",
        "Red Blood Cells",
        "Ring Cells",
        "Round Cells",
        "Schizont Cells",
        "Spindle Cells",
        "Trophozoite Cells",
        "White Blood Cells",
    ],
}

SUPPORTED_SHOTS = [0, 1, 3, 6]


def normalize_class_label(raw_label: Optional[str]) -> Optional[str]:
    """
    Normalize model output string to a canonical cell category label.
    Returns None if label indicates background / none or cannot be matched.
    """
    if not raw_label:
        return None

    cleaned = raw_label.strip()
    # Strip markdown bold, italics, quotes, code ticks, headers, and terminal punctuation
    cleaned = re.sub(r"^[\*`'\"_#\s]+|[\*`'\"_#\s\.]+$", "", cleaned).strip()
    lower = cleaned.lower()

    if lower in {
        "none", "background", "invalid", "unclear", "ambiguous", "multiple",
        "unknown", "other", "null", "no_cell", "non_cell", "non-cell",
        "not_a_cell", "not cell", "not_cell", "artifact", "debris", "text", "card", "line"
    } or lower.startswith("not ") or "not a cell" in lower or "not_a_cell" in lower:
        return None

    # Exact canonical check
    for canon in CANONICAL_CLASSES:
        if lower == canon.lower():
            return canon

    # Regex alias match
    for pattern, canonical_target in ALIAS_RULES.items():
        if re.search(pattern, lower):
            return canonical_target

    return None


def get_dataset_prompt(dataset_name: str, target_classes: Optional[List[str]] = None) -> str:
    """
    Generate the system / instruction prompt for candidate patch classification
    grounded in the specific biological domain and allowed classes.
    """
    classes = target_classes or DATASET_CLASSES.get(dataset_name, CANONICAL_CLASSES)
    classes_str = "\n".join(f"- **{c}**" for c in classes)

    return f"""You are an expert cytologist and optical microscopy image analyzer.
You will be provided with a candidate image crop from an automated slide analysis.

CRITICAL INSTRUCTIONS:
1. FIRST, inspect whether this candidate patch depicts an authentic microscopic biological cell.
2. If the crop depicts a non-cell object — such as a human face, facial feature, eye, nose, skin, hair, person, clothing, furniture, room, outdoor scenery, text, document, digital graphic, artifact, microscope debris, or empty background — you MUST respond with:
   NOT_A_CELL
3. NEVER force a non-cell candidate into a cell class. A human face, nose, eye, or real-world object is NEVER a biological cell. Do NOT classify arbitrary image features merely because they were proposed by an automated segmenter.
4. Only if the patch genuinely displays authentic cellular morphology, classify it into EXACTLY ONE of the supported Micro-OD categories:
{classes_str}
- **NOT_A_CELL** (None): If the patch is not a cell, is empty background, debris, artifact, or non-microscopy object.

Respond with ONLY the exact class name or NOT_A_CELL. No preamble, no explanation, no markdown styling."""


def load_few_shot_examples(
    dataset_name: str,
    shots: int,
    base_datasets_dir: Optional[Path] = None,
) -> List[Dict[str, Any]]:
    """
    Load verified exemplar crops from datasets/Micro-OD/example split for in-context demonstration.
    Returns list of dicts: {"label": str, "image_b64": str}.
    """
    if shots not in SUPPORTED_SHOTS:
        raise ValueError(f"Unsupported shot count {shots}. Allowed: {SUPPORTED_SHOTS}")

    if shots == 0:
        return []

    if base_datasets_dir is None:
        p = Path(__file__).resolve()
        for parent in p.parents:
            candidate = parent / "datasets" / "Micro-OD" / "example"
            if candidate.exists():
                base_datasets_dir = candidate
                break
        else:
            base_datasets_dir = p.parents[4] / "datasets" / "Micro-OD" / "example"

    # Map Micro-OD to sub-datasets or handle specific dataset
    sub_datasets = ["BBBC", "BCCD", "LIVECell", "NIH-3T3"] if dataset_name == "Micro-OD" else [dataset_name]

    exemplars: List[Dict[str, Any]] = []
    class_counts: Dict[str, int] = {}

    for sub_ds in sub_datasets:
        example_dir = base_datasets_dir / sub_ds
        annot_file = example_dir / "annotation.jsonl"
        if not annot_file.exists():
            continue

        try:
            with open(annot_file, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if not line:
                        continue
                    record = json.loads(line)
                    rel_img_path = record.get("image_path", "")
                    img_file = example_dir / rel_img_path
                    if not img_file.exists():
                        continue

                    # Open image once for this record
                    try:
                        source_img = Image.open(img_file).convert("RGB")
                    except Exception:
                        continue

                    bboxes_by_class = record.get("bbox", {})
                    for raw_label, box_list in bboxes_by_class.items():
                        canonical_label = normalize_class_label(raw_label) or raw_label
                        current_count = class_counts.get(canonical_label, 0)
                        if current_count >= shots:
                            continue

                        for box in box_list:
                            if class_counts.get(canonical_label, 0) >= shots:
                                break
                            # Normalize box format: [[x1, y1], [x2, y2]] or [x1, y1, x2, y2]
                            if len(box) == 2 and isinstance(box[0], list):
                                x1, y1 = box[0]
                                x2, y2 = box[1]
                            elif len(box) == 4:
                                x1, y1, x2, y2 = box
                            else:
                                continue

                            try:
                                patch = crop_patch(source_img, [x1, y1, x2, y2], target_size=(128, 128))
                                b64_str = image_to_base64(patch, format="JPEG")
                                exemplars.append({
                                    "label": canonical_label,
                                    "image_b64": b64_str,
                                })
                                class_counts[canonical_label] = class_counts.get(canonical_label, 0) + 1
                            except Exception:
                                continue
        except Exception:
            continue

    return exemplars
