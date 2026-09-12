from pathlib import Path
from typing import Dict, List, Optional, Tuple
from fastapi import HTTPException, status

from app.schemas.dataset import DatasetSummary, DatasetClassList, DatasetImageItem

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

# Case-insensitive map
KEY_MAP = {k.lower(): k for k in DATASET_CATALOG.keys()}


def _resolve_dataset_key(name: str) -> str:
    key = KEY_MAP.get(name.lower().strip())
    if not key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Dataset '{name}' not found. Supported: {', '.join(DATASET_CATALOG.keys())}",
        )
    return key


def get_all_datasets() -> List[DatasetSummary]:
    """Return catalog metadata for all supported datasets."""
    return [DatasetSummary(**meta) for meta in DATASET_CATALOG.values()]


def get_dataset(name: str) -> DatasetSummary:
    """Retrieve catalog metadata for a specific dataset."""
    key = _resolve_dataset_key(name)
    return DatasetSummary(**DATASET_CATALOG[key])


def get_dataset_classes(name: str) -> DatasetClassList:
    """Retrieve verified cell class categories for a dataset."""
    key = _resolve_dataset_key(name)
    meta = DATASET_CATALOG[key]
    return DatasetClassList(
        dataset=meta["name"],
        classes=meta["classes"],
        total_classes=meta["classes_count"],
    )


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
