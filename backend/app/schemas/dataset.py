from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class DatasetSummary(BaseModel):
    """Catalog metadata for a supported microscopy dataset."""

    id: str = Field(..., description="Unique dataset identifier")
    name: str = Field(..., description="Short name (e.g. BBBC, BCCD, Micro-OD)")
    full_name: str = Field(..., description="Formal dataset name")
    description: str = Field(..., description="Overview and research purpose")
    modality: str = Field(..., description="Microscopy imaging modality")
    total_images: int = Field(..., description="Total verified images in benchmark")
    example_images: int = Field(..., description="Example/exemplar split image count")
    test_images: int = Field(..., description="Test evaluation split image count")
    test_boxes: int = Field(..., description="Ground-truth annotated test bounding boxes")
    classes_count: int = Field(..., description="Number of distinct cell categories")
    classes: List[str] = Field(..., description="List of cell class labels")
    source_information: Optional[str] = Field(None, description="Original data source reference")
    source_datasets: Optional[List[str]] = Field(None, description="Component sub-datasets if aggregated")
    source_datasets_count: Optional[int] = Field(None, description="Number of source datasets")
    status: str = Field("verified", description="Benchmark verification status")

    # Multi-dataset extension fields (optional, backward-compatible)
    task_type: str = Field(
        "object_detection",
        description="Primary evaluation task: 'object_detection' or 'cell_classification'",
    )
    annotation_type: str = Field(
        "bounding_box",
        description="Annotation format, e.g. 'Bounding Box', 'Folder Label', 'Polygon'",
    )
    domain: Optional[str] = Field(None, description="Medical/biological domain")
    dataset_status: str = Field(
        "available",
        description="Dataset availability status: 'available' or 'unavailable'",
    )
    supported_shots: List[int] = Field(
        default_factory=lambda: [0, 6],
        description="Valid few-shot experiment counts for this dataset",
    )



class DatasetClassList(BaseModel):
    """List of cell categories for a specific dataset."""

    dataset: str = Field(..., description="Dataset name")
    classes: List[str] = Field(..., description="Supported cell class labels")
    total_classes: int = Field(..., description="Total class count")


class DatasetImageItem(BaseModel):
    """Metadata for an individual microscopy dataset image."""

    image_id: str = Field(..., description="Unique image identifier (filename)")
    dataset: str = Field(..., description="Parent dataset name")
    split: str = Field(..., description="Dataset split (example or test)")
    filename: str = Field(..., description="Safe filename without filesystem path")
    size_bytes: int = Field(..., description="File size in bytes")


class DatasetImageListResponse(BaseModel):
    """Paginated metadata list of dataset images."""

    items: List[DatasetImageItem] = Field(default_factory=list)
    page: int = Field(1, description="Current page number")
    page_size: int = Field(20, description="Items per page")
    total: int = Field(0, description="Total images in split")


class DatasetValidationResponse(BaseModel):
    """Result of validating a dataset adapter on disk."""

    dataset_id: str
    is_valid: bool
    checks: Dict[str, bool] = Field(default_factory=dict)
    errors: List[str] = Field(default_factory=list)
    image_count_estimate: Optional[int] = None


class DatasetRegistryEntry(BaseModel):
    """Lightweight registry entry for a single dataset (used by UI dataset selector)."""

    id: str
    display_name: str
    description: str
    modality: str
    domain: str
    task_type: str
    annotation_type: str
    classes: List[str]
    class_count: int
    supported_shots: List[int]


class DatasetRegistryResponse(BaseModel):
    """Full registry of all datasets available in this JeevaDrishti installation."""

    datasets: List[DatasetRegistryEntry] = Field(default_factory=list)
    total: int = 0
