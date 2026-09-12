from pathlib import Path
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings backed by environment variables."""

    APP_NAME: str = "JeevaDrishti API"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    LOG_LEVEL: str = "INFO"
    API_V1_PREFIX: str = "/api/v1"


    # Database
    DATABASE_URL: str = "sqlite:///./jeevadrishti.db"

    # CORS
    CORS_ORIGINS: str = "http://localhost:5173"

    # Storage
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_SIZE_MB: int = 20

    # JWT Authentication
    JWT_SECRET_KEY: str = "jeevadrishti-insecure-dev-secret-key-replace-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # AI / SAM & VLM Configuration
    SAM_MODEL_PATH: str | None = None
    SAM_MODEL_TYPE: str = "vit_h"
    VLM_PROVIDER: str = "gemini"
    VLM_MODEL: str = "gemini-2.5-flash"
    VLM_API_KEY: str | None = None
    GOOGLE_API_KEY: str | None = None
    OPENAI_API_KEY: str | None = None
    MAX_LIVE_CANDIDATES: int = 15

    # Benchmark / Research Evaluation
    MICRO_OD_PATH: str | None = None  # Defaults to <repo-root>/datasets/Micro-OD
    MAX_BENCHMARK_CANDIDATES: int = 200  # No live-demo cap during research evaluation
    BENCHMARK_IOU_THRESHOLD: float = 0.50  # Fixed IoU matching threshold (COCO standard)


    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    @property
    def cors_origins_list(self) -> List[str]:
        """Return parsed list of allowed CORS origins."""
        if not self.CORS_ORIGINS:
            return ["http://localhost:5173"]
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    @property
    def upload_path(self) -> Path:
        """Resolve upload directory path and ensure existence."""
        base_dir = Path(__file__).resolve().parent.parent.parent
        path = base_dir / self.UPLOAD_DIR
        path.mkdir(parents=True, exist_ok=True)
        return path


settings = Settings()
