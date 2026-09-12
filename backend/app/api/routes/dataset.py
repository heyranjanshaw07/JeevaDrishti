from typing import List, Optional
from fastapi import APIRouter, Query, status

from app.schemas.dataset import (
    DatasetSummary,
    DatasetClassList,
    DatasetImageListResponse,
)
from app.services.dataset_service import (
    get_all_datasets,
    get_dataset,
    get_dataset_classes,
    get_dataset_images,
)

router = APIRouter(prefix="/datasets", tags=["Dataset Explorer"])


@router.get(
    "",
    response_model=List[DatasetSummary],
    status_code=status.HTTP_200_OK,
    summary="List all supported microscopy datasets",
    description="Returns verified metadata for all supported benchmark datasets in the catalog.",
)
def list_datasets() -> List[DatasetSummary]:
    return get_all_datasets()


@router.get(
    "/{dataset_name}",
    response_model=DatasetSummary,
    status_code=status.HTTP_200_OK,
    summary="Get dataset details",
    description="Returns detailed metadata, splits, modalities, and verified stats for a specific dataset.",
)
def retrieve_dataset(dataset_name: str) -> DatasetSummary:
    return get_dataset(dataset_name)


@router.get(
    "/{dataset_name}/classes",
    response_model=DatasetClassList,
    status_code=status.HTTP_200_OK,
    summary="Get supported cell classes for dataset",
    description="Returns the verified target cell classes and counts for zero-shot cell detection evaluation.",
)
def retrieve_dataset_classes(dataset_name: str) -> DatasetClassList:
    return get_dataset_classes(dataset_name)


@router.get(
    "/{dataset_name}/images",
    response_model=DatasetImageListResponse,
    status_code=status.HTTP_200_OK,
    summary="List dataset images metadata",
    description="Returns paginated image metadata without exposing underlying filesystem paths.",
)
def retrieve_dataset_images(
    dataset_name: str,
    split: str = Query("test", description="Dataset split ('example' or 'test')"),
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    search: Optional[str] = Query(None, description="Optional filename search filter"),
) -> DatasetImageListResponse:
    items, total = get_dataset_images(
        name=dataset_name,
        split=split,
        page=page,
        page_size=page_size,
        search=search,
    )
    return DatasetImageListResponse(
        items=items,
        page=page,
        page_size=page_size,
        total=total,
    )
