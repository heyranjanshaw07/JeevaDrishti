from pydantic import BaseModel, Field


class RootResponse(BaseModel):
    """Root endpoint response model."""

    name: str = Field(..., description="API service name")
    version: str = Field(..., description="Semantic version string")
    status: str = Field("running", description="Current runtime status")


class HealthResponse(BaseModel):
    """Health check response model."""

    status: str = Field("healthy", description="Health status of the service")
    service: str = Field(
        "jeevadrishti-backend", description="Unique service identifier"
    )
    version: str = Field(..., description="Service version")


class SystemStatusResponse(BaseModel):
    """Detailed system readiness status model."""

    backend: str = Field("ready", description="Backend service readiness")
    database: str = Field("configured", description="Database connection status")
    ai_engine: str = Field(
        "pending",
        description="AI engine integration status (pending SAM/VLM in later phases)",
    )
    storage: str = Field("configured", description="File storage readiness")


class ErrorResponse(BaseModel):
    """Standard error response model."""

    detail: str = Field(..., description="Readable error detail")
    error_type: str = Field(..., description="Category or code of error")
