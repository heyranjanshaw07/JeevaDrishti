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
    r"^infected(\W*rbc|\W*red\W*blood\W*cell)?s?$|^parasitized(\W*rbc)?$": "Infected RBC",
    r"^uninfected(\W*rbc|\W*red\W*blood\W*cell)?s?$|^healthy(\W*rbc)?$": "Uninfected RBC",
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
    # ── Multi-domain extension datasets ────────────────────────────────────
    "nih_nlm_malaria": [
        "Infected RBC",
        "Uninfected RBC",
    ],
    "c_nmc_2019": [
        "ALL Blast",
        "Healthy Hematopoietic",
    ],
    "redtell_anemia": [
        "Healthy Control",
        "Sickle Cell Disease",
        "Thalassemia",
    ],
    "sipakmed": [
        "Dyskeratotic",
        "Koilocytotic",
        "Metaplastic",
        "Parabasal",
        "Superficial-Intermediate",
    ],
}

SUPPORTED_SHOTS = [0, 6]


ALL_DATASET_CLASSES = list(dict.fromkeys(
    CANONICAL_CLASSES + [cls for clist in DATASET_CLASSES.values() for cls in clist]
))


def normalize_class_label(raw_label: Optional[str], dataset: Optional[str] = None) -> Optional[str]:
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

    # Check dataset-specific classes first if dataset provided
    if dataset and dataset in DATASET_CLASSES:
        for c in DATASET_CLASSES[dataset]:
            if lower == c.lower():
                return c

    # Exact canonical & multi-dataset check
    for canon in ALL_DATASET_CLASSES:
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
4. Only if the patch genuinely displays authentic cellular morphology, classify it into EXACTLY ONE of the supported {dataset_name} categories:
{classes_str}
- **NOT_A_CELL** (None): If the patch is not a cell, is empty background, debris, artifact, or non-microscopy object.

Respond with ONLY the exact class name or NOT_A_CELL. No preamble, no explanation, no markdown styling."""


def get_classification_prompt(dataset_id: str, classes: Optional[List[str]] = None) -> str:
    """
    Generate a VLM prompt for whole-image CELL_CLASSIFICATION tasks.
    Used when task_type == TaskType.CELL_CLASSIFICATION (C-NMC, RedTell, SIPaKMeD).

    Unlike the detection prompt, this classifies the ENTIRE image (or cell crop)
    into one of the provided classes. No NOT_A_CELL rejection needed since these
    datasets contain only pre-cropped or slide-level images of actual cells.

    IMPORTANT: This function must NEVER be called for OBJECT_DETECTION datasets.
    """
    resolved_classes = classes or DATASET_CLASSES.get(dataset_id, [])
    if not resolved_classes:
        raise ValueError(
            f"No classes found for dataset '{dataset_id}'. "
            "Cannot build classification prompt without a class list."
        )

    classes_str = "\n".join(f"- **{c}**" for c in resolved_classes)
    dataset_context = {
        "c_nmc_2019": (
            "bone marrow microscopy image of a blood cell from the C-NMC 2019 Acute Lymphoblastic "
            "Leukemia dataset. The image contains a single Giemsa-stained blood cell."
        ),
        "redtell_anemia": (
            "peripheral blood smear microscopy image of a red blood cell from the RedTell "
            "hemoglobinopathy dataset. The image shows RBC morphology."
        ),
        "sipakmed": (
            "cervical cytology Pap smear microscopy image from the SIPaKMeD dataset. "
            "The image contains a single cervical epithelial cell."
        ),
    }.get(dataset_id, "microscopy image of a biological cell")

    return f"""You are an expert clinical cytologist analyzing a {dataset_context}

CRITICAL INSTRUCTIONS:
1. Examine the morphological features of the cell visible in this image.
2. Classify the cell into EXACTLY ONE of the following categories:
{classes_str}
3. Respond with ONLY the exact class name from the list above.
4. Do NOT add any explanation, confidence score, or preamble.
5. Do NOT use markdown formatting.

IMPORTANT SAFETY NOTE:
JeevaDrishti is a research assistance tool. This classification is for expert review only —
not a clinical diagnosis. Always validate results with a qualified pathologist.

Your response must be one of: {', '.join(resolved_classes)}"""


def compute_inference_cache_key(
    dataset: str,
    image_id: str,
    shots: int,
    model: str,
    support_examples: Optional[List[Dict[str, Any]]] = None,
    patch_b64: Optional[str] = None,
) -> str:
    """
    Generate a deterministic collision-resistant cache key for VLM inference.
    Guarantees that 0-shot, 1-shot, 3-shot, and 6-shot configurations never share cache entries.
    Key components: dataset, image_id, shots, model, support example identifiers.
    """
    import hashlib

    exemplar_ids = []
    if support_examples:
        for idx, ex in enumerate(support_examples):
            eid = ex.get("id") or f"{ex.get('label')}_{idx}"
            exemplar_ids.append(eid)

    key_str = f"ds:{dataset}|img:{image_id}|shots:{shots}|model:{model}|exemplars:{','.join(exemplar_ids)}"
    if patch_b64:
        h = hashlib.sha256(patch_b64[:200].encode("utf-8")).hexdigest()[:12]
        key_str += f"|patch:{h}"
    return hashlib.sha256(key_str.encode("utf-8")).hexdigest()


def load_few_shot_examples(
    dataset_name: str,
    shots: int,
    base_datasets_dir: Optional[Path] = None,
) -> List[Dict[str, Any]]:
    """
    Load verified exemplar crops from datasets/Micro-OD/example split for in-context demonstration.
    
    RESEARCH FEW-SHOT SPECIFICATION:
    - 0-shot: exactly 0 reference examples ([])
    - 1-shot: exactly 1 reference example
    - 3-shot: exactly 3 reference examples
    - 6-shot: exactly 6 reference examples
    
    Uses deterministic round-robin sampling across canonical dataset classes to ensure
    reproducibility and nested exemplar hierarchy (1-shot ⊂ 3-shot ⊂ 6-shot).
    
    Returns list of dicts:
        {"id": str, "label": str, "image_b64": str, "dataset": str, "bbox": [x1, y1, x2, y2]}
    """
    if shots not in SUPPORTED_SHOTS:
        raise ValueError(f"Unsupported shot count {shots}. Allowed: {SUPPORTED_SHOTS}")

    if shots == 0:
        return []

    # If the dataset is backed by a registered adapter (e.g. nih_nlm_malaria), load from the adapter
    from app.services.datasets.registry import get_adapter_safe
    adapter = get_adapter_safe(dataset_name)
    if adapter is not None and dataset_name not in ("Micro-OD", "BBBC", "BCCD", "LIVECell", "NIH-3T3"):
        support_examples = adapter.get_support_examples(shots)
        exemplars: List[Dict[str, Any]] = []
        image_cache: Dict[Path, Image.Image] = {}

        for ex in support_examples[:shots]:
            img_p = ex.image_path
            if img_p not in image_cache:
                try:
                    image_cache[img_p] = Image.open(img_p).convert("RGB")
                except Exception:
                    continue

            source_img = image_cache[img_p]
            try:
                if ex.bbox and len(ex.bbox) == 4:
                    patch = crop_patch(source_img, ex.bbox, target_size=(128, 128))
                else:
                    patch = source_img.resize((128, 128))
                b64_str = image_to_base64(patch, format="JPEG")
                exemplars.append({
                    "id": ex.example_id,
                    "label": ex.class_label,
                    "image_b64": b64_str,
                    "dataset": dataset_name,
                    "bbox": ex.bbox or [0, 0, source_img.width, source_img.height],
                })
            except Exception:
                continue

        return exemplars

    if base_datasets_dir is None:
        p = Path(__file__).resolve()
        for parent in p.parents:
            candidate = parent / "datasets" / "Micro-OD" / "example"
            if candidate.exists():
                base_datasets_dir = candidate
                break
        else:
            base_datasets_dir = p.parents[4] / "datasets" / "Micro-OD" / "example"

    sub_datasets = ["BBBC", "BCCD", "LIVECell", "NIH-3T3"] if dataset_name == "Micro-OD" else [dataset_name]
    target_classes = DATASET_CLASSES.get(dataset_name, CANONICAL_CLASSES)

    # 1. Deterministically collect all valid exemplar candidates across sub_datasets
    all_candidates: List[Dict[str, Any]] = []

    for sub_ds in sub_datasets:
        example_dir = base_datasets_dir / sub_ds
        annot_file = example_dir / "annotation.jsonl"
        if not annot_file.exists():
            continue

        try:
            with open(annot_file, "r", encoding="utf-8") as f:
                records = [json.loads(line) for line in f if line.strip()]
        except Exception:
            continue

        # Sort records by image_path for reproducibility
        records.sort(key=lambda r: r.get("image_path", ""))

        for record in records:
            rel_img_path = record.get("image_path", "")
            img_file = example_dir / rel_img_path
            if not img_file.exists():
                continue

            bboxes_by_class = record.get("bbox", {})
            for raw_label, box_list in bboxes_by_class.items():
                canonical_label = normalize_class_label(raw_label) or raw_label
                for box in box_list:
                    if len(box) == 2 and isinstance(box[0], list):
                        x1, y1, x2, y2 = int(box[0][0]), int(box[0][1]), int(box[1][0]), int(box[1][1])
                    elif len(box) == 4:
                        x1, y1, x2, y2 = int(box[0]), int(box[1]), int(box[2]), int(box[3])
                    else:
                        continue

                    if x2 <= x1 or y2 <= y1:
                        continue

                    clean_label = canonical_label.replace(" ", "_")
                    stem = Path(rel_img_path).stem
                    cand_id = f"{sub_ds}_{stem}_{clean_label}_{x1}_{y1}_{x2}_{y2}"

                    all_candidates.append({
                        "id": cand_id,
                        "label": canonical_label,
                        "dataset": sub_ds,
                        "bbox": [x1, y1, x2, y2],
                        "img_file": img_file,
                    })

    # 2. Group candidates by canonical class
    class_candidates: Dict[str, List[Dict[str, Any]]] = {c: [] for c in target_classes}
    for cand in all_candidates:
        lbl = cand["label"]
        if lbl in class_candidates:
            class_candidates[lbl].append(cand)

    # 3. Round-robin deterministic selection across classes until exactly `shots` exemplars
    selected_candidates: List[Dict[str, Any]] = []
    while len(selected_candidates) < shots:
        added_in_round = False
        for c in target_classes:
            if class_candidates[c]:
                selected_candidates.append(class_candidates[c].pop(0))
                added_in_round = True
                if len(selected_candidates) >= shots:
                    break
        if not added_in_round:
            # Fallback to any remaining candidate if target classes are exhausted
            for cand in all_candidates:
                if cand not in selected_candidates:
                    selected_candidates.append(cand)
                    if len(selected_candidates) >= shots:
                        break
            break

    # 4. Crop patches and encode to base64
    exemplars: List[Dict[str, Any]] = []
    image_cache: Dict[Path, Image.Image] = {}

    for cand in selected_candidates[:shots]:
        img_p = cand["img_file"]
        if img_p not in image_cache:
            try:
                image_cache[img_p] = Image.open(img_p).convert("RGB")
            except Exception:
                continue

        source_img = image_cache[img_p]
        try:
            patch = crop_patch(source_img, cand["bbox"], target_size=(128, 128))
            b64_str = image_to_base64(patch, format="JPEG")
            exemplars.append({
                "id": cand["id"],
                "label": cand["label"],
                "image_b64": b64_str,
                "dataset": cand["dataset"],
                "bbox": cand["bbox"],
            })
        except Exception:
            continue

    return exemplars
