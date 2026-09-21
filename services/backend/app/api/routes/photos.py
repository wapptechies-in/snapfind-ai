"""
Photos API routes: photo upload pipeline, storage management, metadata, and URLs.
Status: IMPLEMENTED (Phase 6)
"""

import logging
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_photographer_or_default
from app.core.config import get_settings
from app.db.session import get_db
from app.models.audit_log import AuditLog
from app.models.download_log import DownloadLog
from app.models.event import Event
from app.models.photo import Photo, generate_photo_id
from app.models.photographer import Photographer
from app.models.processing_job import ProcessingJob
from app.schemas.photo import (
    PhotoCreate,
    PhotoListOut,
    PhotoOut,
    PhotoUrlResponse,
    UploadCompleteRequest,
    UploadInitRequest,
    UploadInitResponse,
)
from app.services.ai.service import process_photo_for_faces
from app.services.storage import StorageService
from app.workers.tasks.photo_tasks import process_single_photo_task


logger = logging.getLogger("snapfind.photos")
settings = get_settings()
router = APIRouter(tags=["photos"])


def _resolve_event(event_id_or_token: str, db: Session) -> Event:
    """Find an event by its database ID or its public token."""
    event = db.scalar(
        select(Event).where(
            or_(
                Event.id == event_id_or_token,
                Event.public_token == event_id_or_token,
            )
        )
    )
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Event '{event_id_or_token}' not found",
        )
    return event


def _enrich_photo_urls(photo: Photo, storage: StorageService) -> PhotoOut:
    """Enrich a Photo model with dynamically generated presigned URLs if not hardcoded."""
    web_url = photo.url
    thumb_url = photo.thumbnail_url

    # If photo has storage keys, generate presigned URLs on the fly
    if (photo.web_storage_key or photo.original_storage_key or photo.storage_key) and not (
        photo.url and photo.url.startswith("http") and not photo.web_storage_key
    ):
        try:
            web_url = storage.get_photo_url(photo, variant="web", download=False)
            thumb_url = storage.get_photo_url(photo, variant="thumbnail", download=False)
        except Exception as e:
            logger.debug(f"Could not generate presigned URLs for photo {photo.id}: {e}")

    return PhotoOut(
        id=photo.id,
        eventId=photo.event_id,
        filename=photo.filename,
        originalFilename=photo.original_filename or photo.filename,
        url=web_url,
        thumbnailUrl=thumb_url,
        storageKey=photo.storage_key,
        originalStorageKey=photo.original_storage_key,
        webStorageKey=photo.web_storage_key,
        thumbnailStorageKey=photo.thumbnail_storage_key,
        width=photo.width or 1600,
        height=photo.height or 1067,
        fileSize=photo.file_size,
        mimeType=photo.mime_type or "image/jpeg",
        checksum=photo.checksum,
        uploadStatus=photo.upload_status,
        processingStatus=photo.processing_status,
        uploadedAt=photo.created_at,
    )


# --- Phase 6 Direct Upload Pipeline ---


@router.post(
    "/events/{event_id}/photos/upload-init",
    response_model=UploadInitResponse,
    status_code=status.HTTP_201_CREATED,
)
def upload_init(
    event_id: str,
    payload: UploadInitRequest,
    photographer: Annotated[Photographer, Depends(get_current_photographer_or_default)],
    db: Annotated[Session, Depends(get_db)],
) -> UploadInitResponse:
    """
    Step 1 of binary upload pipeline:
    Validates metadata, reserves a Photo record in 'pending' status,
    and returns a short-lived presigned PUT URL for direct-to-storage upload.
    """
    event = _resolve_event(event_id, db)

    # Validate file size (max configured MB)
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if payload.file_size > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_MB}MB",
        )

    # Validate MIME type
    allowed_types = ["image/jpeg", "image/png", "image/webp"]
    if payload.mime_type.lower() not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type '{payload.mime_type}'. Allowed: {', '.join(allowed_types)}",
        )

    storage = StorageService()
    photo_id = generate_photo_id()
    original_key = storage.build_original_key(event.id, photo_id, payload.filename)

    # Generate presigned PUT URL
    presigned = storage.provider.generate_presigned_upload_url(
        key=original_key,
        content_type=payload.mime_type,
        expires_in=settings.PRESIGNED_URL_EXPIRE_SECONDS,
    )

    # Create pending photo record
    photo = Photo(
        id=photo_id,
        event_id=event.id,
        filename=payload.filename,
        original_filename=payload.filename,
        original_storage_key=original_key,
        storage_key=original_key,
        file_size=payload.file_size,
        mime_type=payload.mime_type,
        checksum=payload.checksum,
        upload_status="pending",
        processing_status="pending",
    )
    db.add(photo)
    db.commit()

    return UploadInitResponse(
        photoId=photo_id,
        uploadUrl=presigned["upload_url"],
        storageKey=original_key,
        headers=presigned.get("headers", {}),
        expiresIn=presigned.get("expires_in", settings.PRESIGNED_URL_EXPIRE_SECONDS),
    )


@router.post(
    "/photos/{photo_id}/upload-complete",
    response_model=PhotoOut,
)
def upload_complete(
    photo_id: str,
    payload: UploadCompleteRequest,
    photographer: Annotated[Photographer, Depends(get_current_photographer_or_default)],
    db: Annotated[Session, Depends(get_db)],
) -> PhotoOut:
    """
    Step 2 of binary upload pipeline:
    Signals that client finished uploading the binary to storage.
    Verifies object existence, transitions photo to 'uploaded' and 'queued',
    creates a ProcessingJob, and dispatches asynchronous background Celery task.
    Returns immediately (< 50ms) without blocking the HTTP client.
    """
    photo = db.get(Photo, photo_id)
    if not photo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Photo '{photo_id}' not found",
        )

    storage = StorageService()
    storage_key = photo.original_storage_key or photo.storage_key
    if not storage_key or not storage.provider.object_exists(storage_key):
        photo.upload_status = "failed"
        photo.processing_status = "failed"
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Uploaded binary for photo '{photo_id}' not found in storage",
        )

    try:
        photo.upload_status = "uploaded"
        photo.processing_status = "queued"

        # Create processing job record
        job = ProcessingJob(
            event_id=photo.event_id,
            photo_id=photo.id,
            job_type="photo_processing",
            status="queued",
            total_items=1,
            processed_items=0,
            failed_items=0,
        )
        db.add(job)
        db.flush()

        # Dispatch async Celery background task
        try:
            task = process_single_photo_task.delay(photo_id=photo.id, job_id=job.id)
            job.celery_task_id = task.id
        except Exception as celery_err:
            logger.warning(
                f"Could not enqueue Celery task for photo {photo.id}: {celery_err}. Falling back to sync processing."
            )
            try:
                # Direct task execution fallback if broker unreachable
                process_single_photo_task(photo_id=photo.id, job_id=job.id)
            except Exception as sync_err:
                logger.error(f"Fallback processing failed for {photo.id}: {sync_err}")

        db.commit()
        db.refresh(photo)

        return _enrich_photo_urls(photo, storage)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error completing upload for photo {photo_id}: {e}", exc_info=True)
        photo.upload_status = "failed"
        photo.processing_status = "failed"
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process uploaded photo: {e}",
        )


@router.get("/photos/{photo_id}/url", response_model=PhotoUrlResponse)
def get_photo_url(
    photo_id: str,
    db: Annotated[Session, Depends(get_db)],
    variant: Annotated[str, Query(pattern="^(original|web|thumbnail)$")] = "web",
    download: Annotated[bool, Query()] = False,
) -> PhotoUrlResponse:
    """
    Generate short-lived presigned URL for viewing or downloading a specific variant.
    Enforces event policies (downloads_enabled, original_downloads_enabled)
    and tracks download activity in download_logs.
    """
    photo = db.get(Photo, photo_id)
    if not photo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Photo '{photo_id}' not found",
        )

    event = db.get(Event, photo.event_id)
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Associated event not found",
        )

    # Enforce download policies if download requested
    if download:
        if not event.downloads_enabled:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Downloads are disabled for this event",
            )
        if variant == "original" and not event.original_downloads_enabled:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Original high-resolution downloads are disabled for this event",
            )

        # Log download and increment count
        log_entry = DownloadLog(
            event_id=event.id,
            photo_id=photo.id,
            download_type=variant,
        )
        event.total_downloads += 1
        db.add(log_entry)
        db.commit()

    storage = StorageService()
    url = storage.get_photo_url(
        photo,
        variant=variant,
        download=download,
        expires_in=settings.PRESIGNED_URL_EXPIRE_SECONDS,
    )

    filename = photo.original_filename or photo.filename
    if variant == "thumbnail":
        filename = f"thumb_{filename}"
    elif variant == "web":
        filename = f"web_{filename}"

    return PhotoUrlResponse(
        photoId=photo.id,
        url=url,
        variant=variant,
        expiresIn=settings.PRESIGNED_URL_EXPIRE_SECONDS,
        filename=filename,
    )


# --- Standard Photo CRUD & Listing ---


@router.get("/events/{event_id}/photos", response_model=PhotoListOut)
def list_event_photos(
    event_id: str,
    db: Annotated[Session, Depends(get_db)],
    page: Annotated[int, Query(ge=1)] = 1,
    limit: Annotated[int, Query(ge=1, le=200)] = 50,
) -> PhotoListOut:
    """
    Retrieve photo metadata for a given event ID or public token.
    Populates presigned web & thumbnail URLs dynamically.
    """
    event = _resolve_event(event_id, db)
    storage = StorageService()

    total = db.scalar(
        select(func.count(Photo.id))
        .where(Photo.event_id == event.id)
        .where(Photo.upload_status != "failed")
    ) or 0

    offset = (page - 1) * limit
    photos = db.scalars(
        select(Photo)
        .where(Photo.event_id == event.id)
        .where(Photo.upload_status != "failed")
        .order_by(Photo.created_at.desc())
        .offset(offset)
        .limit(limit)
    ).all()

    enriched = [_enrich_photo_urls(p, storage) for p in photos]

    return PhotoListOut(
        items=enriched,
        total=total,
    )


@router.post(
    "/events/{event_id}/photos",
    response_model=PhotoOut,
    status_code=status.HTTP_201_CREATED,
)
def create_event_photo(
    event_id: str,
    photo_in: PhotoCreate,
    photographer: Annotated[Photographer, Depends(get_current_photographer_or_default)],
    db: Annotated[Session, Depends(get_db)],
) -> PhotoOut:
    """Create metadata record for a photo in the specified event (Phase 4 compatibility)."""
    event = _resolve_event(event_id, db)
    storage = StorageService()

    photo = Photo(
        event_id=event.id,
        filename=photo_in.filename,
        original_filename=photo_in.filename,
        url=photo_in.url,
        thumbnail_url=photo_in.thumbnail_url,
        width=photo_in.width or 1600,
        height=photo_in.height or 1067,
        file_size=photo_in.file_size,
        mime_type=photo_in.mime_type or "image/jpeg",
        storage_key=photo_in.storage_key,
        thumbnail_key=photo_in.thumbnail_key,
        upload_status="uploaded",
        processing_status="completed",
    )
    db.add(photo)
    db.commit()
    db.refresh(photo)

    return _enrich_photo_urls(photo, storage)


@router.get("/photos/{photo_id}", response_model=PhotoOut)
def get_photo(
    photo_id: str,
    db: Annotated[Session, Depends(get_db)],
) -> PhotoOut:
    """Retrieve metadata for a single photo by ID."""
    photo = db.get(Photo, photo_id)
    if not photo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Photo '{photo_id}' not found",
        )
    storage = StorageService()
    return _enrich_photo_urls(photo, storage)


@router.delete("/photos/{photo_id}")
def delete_photo(
    photo_id: str,
    photographer: Annotated[Photographer, Depends(get_current_photographer_or_default)],
    db: Annotated[Session, Depends(get_db)],
) -> dict[str, bool | str]:
    """Delete photo objects from storage and remove record from PostgreSQL."""
    photo = db.get(Photo, photo_id)
    if not photo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Photo '{photo_id}' not found",
        )

    storage = StorageService()
    storage.delete_photo_objects(photo)

    # Record in audit logs
    audit = AuditLog(
        user_id=photographer.user_id,
        action="photo_deleted",
        entity_type="photo",
        entity_id=photo_id,
        metadata_json=f'{{"event_id": "{photo.event_id}", "filename": "{photo.filename}"}}',
    )
    db.add(audit)
    db.delete(photo)
    db.commit()

    return {"ok": True, "id": photo_id}
