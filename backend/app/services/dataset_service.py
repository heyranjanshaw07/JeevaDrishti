from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
from fastapi import HTTPException, status

from app.schemas.dataset import (
    DatasetSummary,
    DatasetClassList,
    DatasetImageItem,
    DatasetRegistryEntry,
    DatasetRegistryResponse,
    DatasetValidationResponse,
)

DATASET_CATALOG: Dict[str, dict] = {
    "Micro-OD": {
        "id": "Micro-OD",
        "name": "Micro-OD",
        "full_name": "Micro-OD Few-Shot Optical Microscopy Benchmark",
        "description": "Standardized benchmark corpus combining diverse optical microscopy domains for few-shot and zero-shot cell detection evaluation.",
        "modality": "Multi-Modal Optical (Fluorescence, Phase-Contrast, Brightfield)",
        "total_images": 252,
        "example_images": 40,
        "test_images": 212,
        "test_boxes": 5551,
        "classes_count": 10,
        "classes": [
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
        "source_information": "Aggregated benchmark corpus combining BBBC, BCCD, LIVECell, and NIH-3T3",
        "source_datasets": ["BBBC", "BCCD", "LIVECell", "NIH-3T3"],
        "source_datasets_count": 4,
        "status": "verified",
        "task_type": "object_detection",
        "annotation_type": "Bounding Box (JSONL)",
        "domain": "General Cell Detection",
        "dataset_status": "available",
        "supported_shots": [0, 6],
    },
    "BBBC": {
        "id": "BBBC",
        "name": "BBBC",
        "full_name": "Broad Bioimage Benchmark Collection",
        "description": "Microscopy images containing multiple blood-cell and malaria-related cell categories.",
        "modality": "Fluorescence Microscopy",
        "total_images": 63,
        "example_images": 10,
        "test_images": 53,
        "test_boxes": 4000,
        "classes_count": 6,
        "classes": [
            "Gametocyte Cells",
            "Red Blood Cells",
            "Ring Cells",
            "Schizont Cells",
            "Trophozoite Cells",
            "White Blood Cells",
        ],
        "source_information": "Broad Bioimage Benchmark Collection (BBBC041 malaria stage dataset)",
        "source_datasets": ["BBBC041"],
        "source_datasets_count": 1,
        "status": "verified",
    },
    "BCCD": {
        "id": "BCCD",
        "name": "BCCD",
        "full_name": "Blood Cell Count and Detection",
        "description": "Peripheral blood smear microscopy containing blood-cell categories.",
        "modality": "Peripheral Blood Smear",
        "total_images": 63,
        "example_images": 10,
        "test_images": 53,
        "test_boxes": 952,
        "classes_count": 3,
        "classes": [
            "Platelets",
            "Red Blood Cells",
            "White Blood Cells",
        ],
        "source_information": "Blood Cell Count and Detection dataset (peripheral blood smear)",
        "source_datasets": ["BCCD"],
        "source_datasets_count": 1,
        "status": "verified",
    },
    "LIVECell": {
        "id": "LIVECell",
        "name": "LIVECell",
        "full_name": "Large-scale Phase Contrast Cell Dataset",
        "description": "Phase-contrast microscopy images representing cellular morphology across distinct cell populations.",
        "modality": "Phase-Contrast Optical",
        "total_images": 63,
        "example_images": 10,
        "test_images": 53,
        "test_boxes": 223,
        "classes_count": 3,
        "classes": [
            "Polygonal Cells",
            "Round Cells",
            "Spindle Cells",
        ],
        "source_information": "LIVECell Phase-contrast live cell imaging benchmark (RatC6 cell line)",
        "source_datasets": ["LIVECell"],
        "source_datasets_count": 1,
        "status": "verified",
    },
    "NIH-3T3": {
        "id": "NIH-3T3",
        "name": "NIH-3T3",
        "full_name": "Mouse Embryonic Fibroblast Cell Line",
        "description": "Phase-contrast brightfield microscopy images used for cellular morphology detection.",
        "modality": "Phase-Contrast Brightfield",
        "total_images": 63,
        "example_images": 10,
        "test_images": 53,
        "test_boxes": 376,
        "classes_count": 3,
        "classes": [
            "Polygonal Cells",
            "Round Cells",
            "Spindle Cells",
        ],
        "source_information": "NIH-3T3 mouse embryonic fibroblast cell line microscopy collection",
        "source_datasets": ["NIH-3T3"],
        "source_datasets_count": 1,
        "status": "verified",
    },
}

from app.services.datasets.registry import DATASET_REGISTRY

# Case-insensitive map including both legacy catalog and adapter registry
KEY_MAP = {k.lower(): k for k in DATASET_CATALOG.keys()}
for reg_id in DATASET_REGISTRY.keys():
    KEY_MAP[reg_id.lower()] = reg_id
    KEY_MAP[reg_id.replace("_", "-").lower()] = reg_id
KEY_MAP["micro-od"] = "Micro-OD"
KEY_MAP["micro_od"] = "Micro-OD"


def _resolve_dataset_key(name: str) -> str:
    cleaned = name.lower().strip()
    key = KEY_MAP.get(cleaned)
    if not key:
        supported = list(DATASET_CATALOG.keys()) + list(DATASET_REGISTRY.keys())
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Dataset '{name}' not found. Supported: {', '.join(dict.fromkeys(supported))}",
        )
    return key


def get_all_datasets() -> List[DatasetSummary]:
    """Return catalog metadata for all supported datasets."""
    return [DatasetSummary(**meta) for meta in DATASET_CATALOG.values()]


def get_dataset(name: str) -> DatasetSummary:
    """Retrieve catalog metadata for a specific dataset."""
    key = _resolve_dataset_key(name)
    if key in DATASET_CATALOG:
        return DatasetSummary(**DATASET_CATALOG[key])
    if key in DATASET_REGISTRY:
        adapter = DATASET_REGISTRY[key]
        return DatasetSummary(
            id=adapter.dataset_id,
            name=adapter.display_name,
            full_name=adapter.display_name,
            description=adapter.description,
            modality=adapter.modality,
            domain=adapter.domain,
            task_type=adapter.task_type.value,
            annotation_type=adapter.annotation_type,
            classes=adapter.classes,
            classes_count=len(adapter.classes),
            supported_shots=adapter.supported_shots,
            total_images=0,
            example_images=0,
            test_images=0,
            test_boxes=0,
            source_datasets=[adapter.dataset_id],
            source_datasets_count=1,
            status="verified",
            dataset_status="available",
        )
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Dataset '{name}' not found.")


def get_dataset_classes(name: str) -> DatasetClassList:
    """Retrieve verified cell class categories for a dataset."""
    key = _resolve_dataset_key(name)
    if key in DATASET_CATALOG:
        meta = DATASET_CATALOG[key]
        return DatasetClassList(
            dataset=meta["name"],
            classes=meta["classes"],
            total_classes=meta["classes_count"],
        )
    if key in DATASET_REGISTRY:
        adapter = DATASET_REGISTRY[key]
        return DatasetClassList(
            dataset=adapter.display_name,
            classes=adapter.classes,
            total_classes=len(adapter.classes),
        )
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Dataset '{name}' not found.")


def get_dataset_images(
    name: str,
    split: str = "test",
    page: int = 1,
    page_size: int = 20,
    search: Optional[str] = None,
) -> Tuple[List[DatasetImageItem], int]:
    """Retrieve paginated metadata for actual dataset images without exposing filesystem paths."""
    key = _resolve_dataset_key(name)
    split_normalized = split.lower().strip()
    if split_normalized not in {"test", "example"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Split must be either 'test' or 'example'.",
        )

    if key in DATASET_REGISTRY and key not in DATASET_CATALOG:
        adapter = DATASET_REGISTRY[key]
        records = adapter.list_images(split=split_normalized)
        if search:
            search_lower = search.lower().strip()
            records = [r for r in records if search_lower in r.path.name.lower()]
        total = len(records)
        if page < 1:
            page = 1
        if page_size < 1 or page_size > 100:
            page_size = 20
        start = (page - 1) * page_size
        end = start + page_size
        page_slice = records[start:end]
        items = [
            DatasetImageItem(
                image_id=rec.image_id,
                dataset=adapter.display_name,
                split=split_normalized,
                filename=rec.path.name,
                size_bytes=rec.path.stat().st_size if rec.path.exists() else 0,
            )
            for rec in page_slice
        ]
        return items, total

    # Locate datasets directory relative to project root
    base_repo_dir = Path(__file__).resolve().parent.parent.parent.parent
    dataset_root = base_repo_dir / "datasets" / "Micro-OD" / split_normalized

    image_files: List[Tuple[Path, str]] = []

    if dataset_root.exists():
        if key == "Micro-OD":
            # Micro-OD aggregates BBBC, BCCD, LIVECell, NIH-3T3
            for sub_name in ["BBBC", "BCCD", "LIVECell", "NIH-3T3"]:
                img_dir = dataset_root / sub_name / "images"
                if img_dir.exists():
                    for f in img_dir.iterdir():
                        if f.is_file() and f.suffix.lower() in {".png", ".jpg", ".jpeg"}:
                            image_files.append((f, sub_name))
        else:
            img_dir = dataset_root / key / "images"
            if img_dir.exists():
                for f in img_dir.iterdir():
                    if f.is_file() and f.suffix.lower() in {".png", ".jpg", ".jpeg"}:
                        image_files.append((f, key))

    # Sort deterministically
    image_files.sort(key=lambda x: x[0].name)

    # Apply search filter if provided
    if search:
        search_lower = search.lower().strip()
        image_files = [x for x in image_files if search_lower in x[0].name.lower()]

    total = len(image_files)

    # Paginate
    if page < 1:
        page = 1
    if page_size < 1 or page_size > 100:
        page_size = 20

    start = (page - 1) * page_size
    end = start + page_size
    page_slice = image_files[start:end]

    items = [
        DatasetImageItem(
            image_id=path.name,
            dataset=ds_name,
            split=split_normalized,
            filename=path.name,
            size_bytes=path.stat().st_size,
        )
        for path, ds_name in page_slice
    ]

    return items, total


# ─────────────────────────────────────────────────────────────────────────
# Multi-Dataset Registry Functions
# ─────────────────────────────────────────────────────────────────────────

def get_dataset_registry() -> DatasetRegistryResponse:
    """
    Return UI-ready metadata for all 5 registered datasets from the adapter registry.
    This is the primary endpoint used by the frontend dataset selector.
    """
    from app.services.datasets.registry import list_datasets

    raw_entries = list_datasets()
    entries = [
        DatasetRegistryEntry(
            id=e["id"],
            display_name=e["display_name"],
            description=e["description"],
            modality=e["modality"],
            domain=e["domain"],
            task_type=e["task_type"],
            annotation_type=e["annotation_type"],
            classes=e["classes"],
            class_count=e["class_count"],
            supported_shots=e["supported_shots"],
        )
        for e in raw_entries
    ]
    return DatasetRegistryResponse(datasets=entries, total=len(entries))


def validate_dataset_adapter(dataset_id: str) -> DatasetValidationResponse:
    """
    Validate a specific dataset by its canonical ID using its adapter.
    Returns disk validation result without scanning the full dataset.
    """
    from app.services.datasets.registry import get_adapter

    adapter = get_adapter(dataset_id)  # raises 404 if not found
    result = adapter.validate()
    return DatasetValidationResponse(
        dataset_id=result.dataset_id,
        is_valid=result.is_valid,
        checks=result.checks,
        errors=result.errors,
        image_count_estimate=result.image_count_estimate,
    )
