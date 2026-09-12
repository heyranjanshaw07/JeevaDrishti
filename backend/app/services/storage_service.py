import io
import uuid
from pathlib import Path
from typing import Set
from PIL import Image
from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.logging import logger
from app.models.analysis import UploadedFile

ALLOWED_EXTENSIONS: Set[str] = {".png", ".jpg", ".jpeg"}
ALLOWED_MIME_TYPES: Set[str] = {"image/png", "image/jpeg", "image/jpg"}


def validate_and_save_image(
    file: UploadFile,
    user_id: int,
    db: Session,
) -> UploadedFile:
    """Validate, securely store, and record a microscopy image upload."""
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Filename must be provided.",
        )

    # 1. Validate file extension
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file extension '{file_ext}'. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
        )

    # 2. Validate MIME type
    content_type = file.content_type or ""
    if content_type.lower() not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported content type '{content_type}'. Allowed: image/png, image/jpeg",
        )

    # 3. Read file stream
    content = file.file.read()
    file_size = len(content)

    if file_size == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty.",
        )

    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if file_size > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File size exceeds limit of {settings.MAX_UPLOAD_SIZE_MB}MB.",
        )

    # 4. Pillow Image Validation & Dimension Extraction
    try:
        image = Image.open(io.BytesIO(content))
        image.verify()
        # Re-open after verify to safely inspect metadata
        image = Image.open(io.BytesIO(content))
        width, height = image.size
        img_format = image.format or "UNKNOWN"
        if img_format not in {"PNG", "JPEG", "MPO"}:
            raise ValueError(f"Unacceptable PIL format: {img_format}")
    except Exception as exc:
        logger.warning("Corrupted or invalid image upload attempt: %s", str(exc))
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Corrupted or invalid image file. Must be a valid optical microscopy image.",
        )

    # 5. Generate secure, unique server-side filename (never trust client filename)
    file_id = str(uuid.uuid4())
    stored_ext = ".png" if img_format == "PNG" else ".jpg"
    stored_filename = f"{file_id}{stored_ext}"
    destination_path = settings.upload_path / stored_filename

    # 6. Persist to disk
    with open(destination_path, "wb") as f:
        f.write(content)

    # 7. Record in database
    uploaded_file = UploadedFile(
        id=file_id,
        user_id=user_id,
        original_filename=Path(file.filename).name,
        stored_filename=stored_filename,
        content_type=content_type,
        size=file_size,
        width=width,
        height=height,
        format=img_format,
    )
    db.add(uploaded_file)
    db.commit()
    db.refresh(uploaded_file)

    logger.info(
        "Successfully stored file %s (%dx%d, %d bytes) for user %d",
        file_id, width, height, file_size, user_id,
    )
    return uploaded_file


def delete_uploaded_file(file_record: UploadedFile, db: Session) -> None:
    """Safely remove uploaded image from filesystem and database."""
    file_path = settings.upload_path / file_record.stored_filename
    if file_path.exists():
        try:
            file_path.unlink()
            logger.info("Deleted physical file %s", file_path.name)
        except OSError as e:
            logger.error("Failed to delete physical file %s: %s", file_path.name, str(e))

    db.delete(file_record)
    db.commit()
