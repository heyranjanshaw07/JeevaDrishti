from datetime import datetime
from typing import List, Literal, Optional
from pydantic import BaseModel, ConfigDict, Field

SUPPORTED_DATASETS = ("Micro-OD", "BBBC", "BCCD", "LIVECell", "NIH-3T3")
SUPPORTED_SHOTS = (0, 1, 3, 6)

DatasetType = Literal["Micro-OD", "BBBC", "BCCD", "LIVECell", "NIH-3T3"]
ShotType = Literal[0, 1, 3, 6]


class UploadResponse(BaseModel):
    """Response returned upon successful microscopy image upload."""

    file_id: str = Field(..., description="Unique server-assigned file identifier")
    filename: str = Field(..., description="Original filename without path")
    content_type: str = Field(..., description="Verified image MIME type")
    size: int = Field(..., description="File size in bytes")
    status: str = Field("uploaded", description="Upload status")


class AnalysisCreate(BaseModel):
    """Request schema for creating a new cell detection analysis."""

    file_id: str = Field(..., description="ID of previously uploaded image file")
    dataset: DatasetType = Field(
        ...,
        description="Supported dataset profile: Micro-OD, BBBC, BCCD, LIVECell, NIH-3T3",
    )
    shots: ShotType = Field(
        0,
        description="Few-shot exemplar configuration: 0, 1, 3, or 6 shots",
    )
    vlm_model: str = Field(
        "default",
        description="Vision-Language model configuration identifier",
    )


class AnalysisCreateResponse(BaseModel):
    """Response returned upon initiating a new analysis."""

    analysis_id: str = Field(..., description="Unique analysis record identifier")
    status: str = Field("pending", description="Initial execution state")
    dataset: str = Field(..., description="Dataset configuration")
    shots: int = Field(..., description="Few-shot exemplar count")


class AnalysisResponse(BaseModel):
    """Detailed response model for microscopy analysis status and details."""

    analysis_id: str
    status: str
    dataset: str
    shots: int
    vlm_model: str
    created_at: datetime
    completed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class AnalysisListResponse(BaseModel):
    """Paginated list of user analysis executions."""

    items: List[AnalysisResponse]
    page: int
    page_size: int
    total: int


class DetectionItem(BaseModel):
    """Individual cell detection box and classification."""

    label: str = Field(..., description="Canonical cell category label")
    bbox: List[int] = Field(..., min_length=4, max_length=4, description="Bounding box [x1, y1, x2, y2]")
    confidence: float = Field(..., description="Confidence score from model")


class AnalysisRunResponse(BaseModel):
    """Response returned when execution of an analysis is triggered."""

    analysis_id: str = Field(..., description="Analysis ID")
    status: str = Field(..., description="Execution status: processing, completed, failed, or rejected")
    message: Optional[str] = Field(None, description="Informational message or error notice")


class AnalysisResultsResponse(BaseModel):
    """Full results schema for an executed microscopy analysis."""

    analysis_id: str = Field(..., description="Analysis unique ID")
    status: str = Field(..., description="Processing status: pending, processing, completed, failed, rejected")
    dataset: str = Field(..., description="Benchmark dataset used")
    shots: int = Field(..., description="Few-shot exemplar count")
    vlm_model: str = Field(..., description="VLM model identifier")
    boxes: List[List[int]] = Field(default_factory=list, description="All detected bounding boxes [x1, y1, x2, y2]")
    detections: List[DetectionItem] = Field(default_factory=list, description="Detailed detections with labels and confidence")
    overlay_available: bool = Field(False, description="Whether visual overlay has been generated")
    overlay_url: Optional[str] = Field(None, description="Endpoint URL to retrieve overlay image if available")
    error_message: Optional[str] = Field(None, description="Controlled failure message if failed")
    created_at: datetime
    completed_at: Optional[datetime] = None
    metadata: dict = Field(default_factory=dict, description="Inference runtime details and proposal metrics")
    metrics: Optional[dict] = Field(None, description="Calculated detection metrics and performance statistics")
    prediction: Optional[str] = Field(None, description="Actual dynamic model prediction result")
    confidence: Optional[float] = Field(None, description="Overall confidence score from model")
    explanation: Optional[str] = Field(None, description="Clinical or morphological explanation returned by model")
    indicators: List[str] = Field(default_factory=list, description="Specific morphological indicators detected by model")
    reason: Optional[str] = Field(None, description="Rejection reason code (e.g. non_microscopy_image)")
    message: Optional[str] = Field(None, description="Descriptive rejection message")

