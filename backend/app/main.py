from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.logging import setup_logging, logger
from app.db.base import Base
from app.db.session import engine
from app.db.init_db import init_db
import app.models  # noqa: F401
from app.api.routes import api_router
from app.schemas.common import RootResponse, ErrorResponse


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle management."""
    # Startup
    setup_logging(debug=settings.DEBUG, level_name=settings.LOG_LEVEL)
    logger.info("Initializing %s v%s in %s mode...", settings.APP_NAME, settings.APP_VERSION, settings.ENVIRONMENT)


    # Ensure upload directory exists
    upload_path = settings.upload_path
    logger.info("Configured storage directory: %s", upload_path)

    # Initialize database tables and synchronize schema
    init_db(target_engine=engine)
    logger.info("Database foundation initialized and synchronized: %s", settings.DATABASE_URL)

    yield


    # Shutdown
    logger.info("Shutting down %s...", settings.APP_NAME)


app = FastAPI(
    title=settings.APP_NAME,
    description=(
        "Backend API for intelligent microscopy analysis, research benchmarking, "
        "dataset exploration, and adaptive vision-language cell detection."
    ),
    version=settings.APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
    lifespan=lifespan,
)

# ─── CORS Middleware ─────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Global Error Handler ────────────────────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle unexpected backend exceptions cleanly without exposing sensitive traces."""
    logger.error("Unhandled server exception at %s: %s", request.url.path, str(exc), exc_info=settings.DEBUG)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=ErrorResponse(
            detail="An internal server error occurred. Please try again later.",
            error_type="internal_server_error",
        ).model_dump(),
    )


# ─── Root Endpoint ───────────────────────────────────────────────────────────
@app.get(
    "/",
    response_model=RootResponse,
    tags=["Root"],
    summary="Root API welcome endpoint",
)
async def root() -> RootResponse:
    """Root metadata endpoint verifying API availability."""
    return RootResponse(
        name=settings.APP_NAME,
        version=settings.APP_VERSION,
        status="running",
    )


# ─── Register Versioned API Routes (/api/v1) ─────────────────────────────────
app.include_router(api_router, prefix=settings.API_V1_PREFIX)
