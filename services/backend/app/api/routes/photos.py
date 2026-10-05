"""
Photos API routes: photo upload pipeline, storage management, metadata, and URLs.
Status: IMPLEMENTED (Phase 6)
"""

import io
import logging
import os
from typing import Annotated, Any
import zipfile
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, Request, status
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_photographer
from app.core.config import get_settings
from app.db.session import get_db
from app.models.audit_log import AuditLog
from app.models.billing import GuestPurchase
from app.models.download_log import DownloadLog
from app.models.event import Event
from app.models.photo import Photo, generate_photo_id
from app.models.photographer import Photographer
from app.models.processing_job import ProcessingJob
from app.schemas.photo import (
    BulkGalleryVisibilityUpdate,
    GalleryVisibilityUpdate,
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
from app.workers.tasks.photo_tasks import process_photo_sync, process_single_photo_task


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


def _client_reachable_url(url: str | None, request: Request | None = None) -> str | None:
    """Replace local loopback URLs with the origin used by the requesting client, ensuring HTTPS on public hosts."""
    if not url:
        return url

    res = url
    render_url = os.getenv("RENDER_EXTERNAL_URL")
    if request:
        base = str(request.base_url).rstrip('/')
        proto = request.headers.get("x-forwarded-proto", "")
        # Force HTTPS if client accessed via HTTPS or running on cloud platforms (Render, Vercel)
        if proto == "https" or "onrender.com" in base or "vercel.app" in base:
            if base.startswith("http://"):
                base = "https://" + base[len("http://"):]

        for local_origin in ("http://127.0.0.1:8000", "http://localhost:8000"):
            if res.startswith(local_origin):
                res = f"{base}{res[len(local_origin):]}"
                break
        if res.startswith("/"):
            res = f"{base}{res}"
    elif render_url:
        render_base = render_url.rstrip("/")
        if render_base.startswith("http://"):
            render_base = "https://" + render_base[len("http://"):]
        for local_origin in ("http://127.0.0.1:8000", "http://localhost:8000"):
            if res.startswith(local_origin):
                res = f"{render_base}{res[len(local_origin):]}"
                break
        if res.startswith("/"):
            res = f"{render_base}{res}"

    # If URL still has insecure http on render or vercel, force https
    if res.startswith("http://") and ("onrender.com" in res or "vercel.app" in res):
        res = "https://" + res[len("http://"):]

    return res


def _enrich_photo_urls(
    photo: Photo,
    storage: StorageService,
    request: Request | None = None,
) -> PhotoOut:
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
        url=_client_reachable_url(web_url, request),
        thumbnailUrl=_client_reachable_url(thumb_url, request),
        storageKey=photo.storage_key,
        originalStorageKey=photo.original_storage_key,
        webStorageKey=photo.web_storage_key,
        thumbnailStorageKey=photo.thumbnail_storage_key,
        folderId=photo.folder_id,
        folderName=photo.folder.name if getattr(photo, "folder", None) else None,
        width=photo.width or 1600,
        height=photo.height or 1067,
        fileSize=photo.file_size,
        mimeType=photo.mime_type or "image/jpeg",
        checksum=photo.checksum,
        uploadStatus=photo.upload_status,
        processingStatus=photo.processing_status,
        is_public_gallery=getattr(photo, "is_public_gallery", False),
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
    photographer: Annotated[Photographer, Depends(get_current_photographer)],
    db: Annotated[Session, Depends(get_db)],
    request: Request = None,
) -> UploadInitResponse:
    """
    Step 1 of binary upload pipeline:
    Validates metadata, reserves a Photo record in 'pending' status,
    and returns a short-lived presigned PUT URL for direct-to-storage upload.
    """
    event = _resolve_event(event_id, db)
    if event.photographer_id != photographer.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to upload photos to this event.",
        )

    # Enforce 9.0 GB hard storage limit
    current_storage_bytes = db.scalar(
        select(func.coalesce(func.sum(Photo.file_size), 0))
        .join(Event, Event.id == Photo.event_id)
        .where(Event.photographer_id == photographer.id)
    ) or 0
    max_storage_limit = settings.TRIAL_STORAGE_LIMIT_BYTES if settings.TRIAL_EDITION_MODE else 50 * 1024 * 1024 * 1024
    if current_storage_bytes + payload.file_size > max_storage_limit:
        used_gb = round(current_storage_bytes / (1024 ** 3), 2)
        limit_gb = round(max_storage_limit / (1024 ** 3), 1)
        raise HTTPException(
            status_code=status.HTTP_413_CONTENT_TOO_LARGE,
            detail=f"Trial storage limit reached ({limit_gb} GB): You have used {used_gb} GB. Upload stopped to prevent cloud overage charges on Cloudflare R2.",
        )

    # Enforce photographer subscription photo limit (bypassed in trial edition mode)
    if not settings.TRIAL_EDITION_MODE:
        current_photos = db.scalar(
            select(func.count(Photo.id)).where(Photo.event_id == event.id)
        ) or 0
        max_photos = getattr(photographer, "max_photos_per_event", 5000)
        if current_photos >= max_photos:
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail=f"Photo upload limit ({max_photos} photos) reached for this event under your {getattr(photographer, 'subscription_tier', 'free').upper()} plan. Please upgrade to Pro for higher limits.",
            )

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
        folder_id=payload.folder_id,
        upload_status="pending",
        processing_status="pending",
    )
    db.add(photo)
    db.commit()

    return UploadInitResponse(
        photoId=photo_id,
        uploadUrl=_client_reachable_url(presigned["upload_url"], request) or presigned["upload_url"],
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
    photographer: Annotated[Photographer, Depends(get_current_photographer)],
    db: Annotated[Session, Depends(get_db)],
    background_tasks: BackgroundTasks = None,
    request: Request = None,
) -> PhotoOut:
    """
    Step 2 of binary upload pipeline:
    Signals that client finished uploading the binary to storage.
    Verifies object existence, transitions photo to 'uploaded' and 'queued',
    creates a ProcessingJob, and dispatches asynchronous background processing.
    Returns immediately (< 50ms) without blocking the HTTP client.
    """
    from app.workers.celery_app import is_celery_broker_reachable

    photo = db.get(Photo, photo_id)
    if not photo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Photo '{photo_id}' not found",
        )

    event = db.get(Event, photo.event_id)
    if not event or event.photographer_id != photographer.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to modify photos for this event.",
        )

    storage = StorageService()
    storage_key = photo.original_storage_key or photo.storage_key
    exists = False
    if storage_key:
        exists = storage.provider.object_exists(storage_key)
        if not exists:
            # Check local storage fallback and sync to remote provider if found
            from app.services.storage.local import LocalStorageProvider
            local_provider = LocalStorageProvider()
            if local_provider.object_exists(storage_key):
                try:
                    data = local_provider.get_object_bytes(storage_key)
                    storage.provider.put_object_bytes(
                        storage_key,
                        data,
                        content_type=photo.mime_type or "image/jpeg",
                    )
                    exists = True
                except Exception as sync_err:
                    logger.warning(f"Could not sync local binary to storage provider: {sync_err}")
                    exists = True

    if not storage_key or not exists:
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
        # Commit now so the record exists for background tasks
        db.commit()
        db.refresh(photo)

        def _run_processing(p_id: str, j_id: str):
            try:
                if is_celery_broker_reachable():
                    task = process_single_photo_task.delay(photo_id=p_id, job_id=j_id)
                    logger.info(f"Enqueued Celery task {task.id} for photo {p_id}")
                else:
                    logger.info(f"Celery broker offline. Processing photo {p_id} directly.")
                    process_photo_sync(photo_id=p_id, job_id=j_id)
            except Exception as run_err:
                logger.warning(f"Error during photo task dispatch for {p_id}: {run_err}. Falling back to sync processing.")
                try:
                    process_photo_sync(photo_id=p_id, job_id=j_id)
                except Exception as sync_err:
                    logger.error(f"Background processing failed for {p_id}: {sync_err}", exc_info=True)

        if background_tasks is not None:
            background_tasks.add_task(_run_processing, photo.id, job.id)
        else:
            _run_processing(photo.id, job.id)

        return _enrich_photo_urls(photo, storage, request)

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
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    variant: Annotated[str, Query(pattern="^(original|web|thumbnail)$")] = "web",
    download: Annotated[bool, Query()] = False,
    download_token: Annotated[str | None, Query(alias="downloadToken")] = None,
) -> PhotoUrlResponse:
    """
    Generate short-lived presigned URL for viewing or downloading a specific variant.
    Enforces event policies (downloads_enabled, original_downloads_enabled, paywall)
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

        # Enforce Paywall on original high-res download
        if variant == "original" and getattr(event, "paywall_enabled", False):
            # Verify if valid download token exists for this photo or whole event
            has_purchase = False
            if download_token:
                purchase = db.scalar(
                    select(GuestPurchase).where(
                        GuestPurchase.download_token == download_token,
                        GuestPurchase.event_id == event.id,
                        GuestPurchase.status == "completed",
                        or_(
                            GuestPurchase.photo_id == photo.id,
                            GuestPurchase.purchase_type == "gallery",
                        ),
                    )
                )
                if purchase:
                    has_purchase = True

            if not has_purchase:
                raise HTTPException(
                    status_code=status.HTTP_402_PAYMENT_REQUIRED,
                    detail=f"Paywall enabled: This photo requires purchase ({event.currency} {event.photo_price:.2f}) before downloading full resolution.",
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
        url=_client_reachable_url(url, request) or "",
        variant=variant,
        expiresIn=settings.PRESIGNED_URL_EXPIRE_SECONDS,
        filename=filename,
    )


# --- Standard Photo CRUD & Listing ---


@router.get("/events/{event_id}/photos", response_model=PhotoListOut)
def list_event_photos(
    event_id: str,
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    page: Annotated[int, Query(ge=1)] = 1,
    limit: Annotated[int, Query(ge=1, le=2000)] = 500,
    folder_id: Annotated[str | None, Query(alias="folderId")] = None,
) -> PhotoListOut:
    """
    Retrieve photo metadata for a given event ID or public token.
    Populates presigned web & thumbnail URLs dynamically.
    Supports filtering by sub-folder ID.
    """
    event = _resolve_event(event_id, db)
    storage = StorageService()

    base_filter = [Photo.event_id == event.id, Photo.upload_status != "failed"]

    if folder_id and folder_id.lower() not in ("all", ""):
        if folder_id.lower() in ("unassigned", "root", "none"):
            base_filter.append(Photo.folder_id.is_(None))
        else:
            base_filter.append(Photo.folder_id == folder_id)

    total = db.scalar(
        select(func.count(Photo.id)).where(*base_filter)
    ) or 0

    offset = (page - 1) * limit
    photos = db.scalars(
        select(Photo)
        .where(*base_filter)
        .order_by(Photo.created_at.desc())
        .offset(offset)
        .limit(limit)
    ).all()

    enriched = [_enrich_photo_urls(p, storage, request) for p in photos]

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
    photographer: Annotated[Photographer, Depends(get_current_photographer)],
    db: Annotated[Session, Depends(get_db)],
    request: Request = None,
) -> PhotoOut:
    """Create metadata record for a photo in the specified event (Phase 4 compatibility)."""
    event = _resolve_event(event_id, db)
    if event.photographer_id != photographer.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to create photos in this event.",
        )
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
        folder_id=photo_in.folder_id,
        upload_status="uploaded",
        processing_status="completed",
    )
    db.add(photo)
    db.commit()
    db.refresh(photo)

    return _enrich_photo_urls(photo, storage, request)


@router.get("/photos/{photo_id}", response_model=PhotoOut)
def get_photo(
    photo_id: str,
    db: Annotated[Session, Depends(get_db)],
    request: Request = None,
) -> PhotoOut:
    """Retrieve metadata for a single photo by ID."""
    photo = db.get(Photo, photo_id)
    if not photo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Photo '{photo_id}' not found",
        )
    storage = StorageService()
    return _enrich_photo_urls(photo, storage, request)


@router.delete("/photos/{photo_id}")
def delete_photo(
    photo_id: str,
    photographer: Annotated[Photographer, Depends(get_current_photographer)],
    db: Annotated[Session, Depends(get_db)],
) -> dict[str, bool | str]:
    """Delete photo objects from storage and remove record from PostgreSQL."""
    photo = db.get(Photo, photo_id)
    if not photo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Photo '{photo_id}' not found",
        )

    event = db.get(Event, photo.event_id)
    if not event or event.photographer_id != photographer.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to delete this photo.",
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


class BulkDeletePhotosRequest(BaseModel):
    photo_ids: list[str]


@router.post("/photos/bulk-delete")
def bulk_delete_photos(
    payload: BulkDeletePhotosRequest,
    photographer: Annotated[Photographer, Depends(get_current_photographer)],
    db: Annotated[Session, Depends(get_db)],
) -> dict[str, Any]:
    """Delete multiple photos and their storage objects in one batch."""
    if not payload.photo_ids:
        return {"ok": True, "deleted_count": 0, "deleted_ids": []}

    photos = db.scalars(
        select(Photo)
        .join(Event, Event.id == Photo.event_id)
        .where(
            Photo.id.in_(payload.photo_ids),
            Event.photographer_id == photographer.id,
        )
    ).all()

    storage = StorageService()
    deleted_ids = []
    for photo in photos:
        try:
            storage.delete_photo_objects(photo)
        except Exception as e:
            logger.warning(f"Error cleaning storage for photo {photo.id}: {e}")

        audit = AuditLog(
            user_id=photographer.user_id,
            action="photo_deleted_bulk",
            entity_type="photo",
            entity_id=photo.id,
            metadata_json=f'{{"event_id": "{photo.event_id}", "filename": "{photo.filename}"}}',
        )
        db.add(audit)
        db.delete(photo)
        deleted_ids.append(photo.id)

    db.commit()
    return {"ok": True, "deleted_count": len(deleted_ids), "deleted_ids": deleted_ids}


# --- ZIP Archive Downloads (Guest Experience & Bulk Export) ---


class DownloadZipRequest(BaseModel):
    photo_ids: list[str]
    variant: str = "web"  # "web" or "original"


@router.post("/photos/download-zip")
def download_photos_zip(
    payload: DownloadZipRequest,
    db: Annotated[Session, Depends(get_db)],
):
    """
    Package selected photos into a streaming ZIP file on the fly.
    Respects event download policies and watermarks previews if enabled.
    """
    if not payload.photo_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No photo IDs provided",
        )

    photos = db.scalars(
        select(Photo).where(Photo.id.in_(payload.photo_ids))
    ).all()

    if not photos:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No valid photos found for the specified IDs",
        )

    # Check event download permissions
    event_ids = list(set(p.event_id for p in photos))
    events = {e.id: e for e in db.scalars(select(Event).where(Event.id.in_(event_ids))).all()}

    for eid, ev in events.items():
        if not ev.downloads_enabled:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Downloads are disabled for event '{ev.name}'",
            )
        if payload.variant == "original" and not ev.original_downloads_enabled:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Original resolution downloads are disabled for event '{ev.name}'",
            )

    storage = StorageService()
    zip_buffer = io.BytesIO()

    with zipfile.ZipFile(zip_buffer, mode="w", compression=zipfile.ZIP_DEFLATED) as zf:
        used_names = set()
        for idx, photo in enumerate(photos):
            ev = events.get(photo.event_id)
            apply_wm = ev.watermark_enabled if ev and payload.variant != "original" else False
            wm_text = ev.name if ev else "SNAPFIND AI"

            data = storage.get_photo_bytes(photo, variant=payload.variant, apply_watermark=apply_wm, watermark_text=wm_text)
            if not data:
                continue

            base_name = photo.original_filename or photo.filename or f"photo_{photo.id}.jpg"
            if not base_name.lower().endswith((".jpg", ".jpeg", ".png", ".webp")):
                base_name += ".jpg"

            entry_name = base_name
            count = 1
            while entry_name in used_names:
                name_part, ext = os.path.splitext(base_name)
                entry_name = f"{name_part}_{count}{ext}"
                count += 1
            used_names.add(entry_name)

            zf.writestr(entry_name, data)

            log_entry = DownloadLog(
                event_id=photo.event_id,
                photo_id=photo.id,
                download_type=f"zip_{payload.variant}",
            )
            db.add(log_entry)

    for ev in events.values():
        ev.total_downloads += len([p for p in photos if p.event_id == ev.id])
    db.commit()

    zip_buffer.seek(0)
    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={"Content-Disposition": 'attachment; filename="snapfind-photos.zip"'},
    )


@router.get("/events/{event_id_or_token}/download-zip")
def download_event_photos_zip(
    event_id_or_token: str,
    db: Annotated[Session, Depends(get_db)],
    variant: Annotated[str, Query(pattern="^(original|web)$")] = "web",
):
    """
    Download all active photos for an event or token as a ZIP archive.
    """
    event = _resolve_event(event_id_or_token, db)

    if not event.downloads_enabled:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Downloads are disabled for this event",
        )
    if variant == "original" and not event.original_downloads_enabled:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Original resolution downloads are disabled for this event",
        )

    query = (
        select(Photo)
        .where(Photo.event_id == event.id)
        .where(Photo.upload_status != "failed")
    )
    if event_id_or_token == event.public_token:
        query = query.where(Photo.is_public_gallery == True)

    photos = db.scalars(query.order_by(Photo.created_at.asc())).all()

    if not photos:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No photos available to download in this event",
        )

    storage = StorageService()
    zip_buffer = io.BytesIO()

    with zipfile.ZipFile(zip_buffer, mode="w", compression=zipfile.ZIP_DEFLATED) as zf:
        used_names = set()
        for idx, photo in enumerate(photos):
            apply_wm = event.watermark_enabled if variant != "original" else False
            data = storage.get_photo_bytes(photo, variant=variant, apply_watermark=apply_wm, watermark_text=event.name)
            if not data:
                continue

            base_name = photo.original_filename or photo.filename or f"photo_{idx + 1}.jpg"
            if not base_name.lower().endswith((".jpg", ".jpeg", ".png", ".webp")):
                base_name += ".jpg"

            entry_name = base_name
            count = 1
            while entry_name in used_names:
                name_part, ext = os.path.splitext(base_name)
                entry_name = f"{name_part}_{count}{ext}"
                count += 1
            used_names.add(entry_name)

            zf.writestr(entry_name, data)

            log_entry = DownloadLog(
                event_id=event.id,
                photo_id=photo.id,
                download_type=f"zip_{variant}",
            )
            db.add(log_entry)

    event.total_downloads += len(photos)
    db.commit()

    safe_event_name = "".join(c for c in event.name if c.isalnum() or c in ("-", "_")).strip() or "event"
    zip_buffer.seek(0)
    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="{safe_event_name}-photos.zip"'},
    )


@router.put("/storage/upload")
async def handle_storage_upload(
    request: Request,
    key: str = Query(...),
):
    """
    Direct binary upload handler for storage fallback & proxying.
    Receives raw binary payload stream, saves it to local storage key path,
    and syncs to the active storage provider (R2/S3/MinIO) so object_exists succeeds.
    """
    from app.services.storage.local import LocalStorageProvider

    clean_key = str(key).lstrip("/\\")
    local_provider = LocalStorageProvider()
    file_path = local_provider._get_path(clean_key)
    file_path.parent.mkdir(parents=True, exist_ok=True)
    bytes_written = 0
    with open(file_path, "wb") as f:
        async for chunk in request.stream():
            f.write(chunk)
            bytes_written += len(chunk)

    # Sync to active storage provider if S3/R2/MinIO is configured
    try:
        storage = StorageService()
        if storage.provider and not isinstance(storage.provider, LocalStorageProvider):
            content_type = request.headers.get("content-type", "image/jpeg")
            with open(file_path, "rb") as f:
                data = f.read()
            storage.provider.put_object_bytes(clean_key, data, content_type=content_type)
    except Exception as exc:
        logger.warning(f"Could not sync uploaded file '{clean_key}' to active storage provider: {exc}")

    return {"status": "ok", "key": clean_key, "bytes_written": bytes_written}


@router.get("/storage/file/{key:path}")
def handle_storage_file(key: str):
    """
    Serves stored photos from local storage fallback with variant fallback and caching headers.
    """
    from app.services.storage.local import LocalStorageProvider

    local_provider = LocalStorageProvider()
    clean_key = key.lstrip("/\\")
    file_path = local_provider._get_path(clean_key)

    if not file_path.is_file():
        # Fallback between variants (thumbnails <-> web <-> originals)
        fallbacks = [
            clean_key.replace("/thumbnails/", "/web/"),
            clean_key.replace("/thumbnails/", "/originals/"),
            clean_key.replace("/web/", "/originals/"),
            clean_key.replace("/web/", "/thumbnails/"),
            clean_key.replace("/originals/", "/web/"),
            clean_key.replace("/originals/", "/thumbnails/"),
        ]
        found = False
        for alt_key in fallbacks:
            alt_path = local_provider._get_path(alt_key)
            if alt_path.is_file():
                file_path = alt_path
                found = True
                break

        if not found:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Storage object '{key}' not found",
            )

    ext = file_path.suffix.lower()
    media_type = "image/jpeg"
    if ext == ".png":
        media_type = "image/png"
    elif ext == ".webp":
        media_type = "image/webp"

    return FileResponse(
        file_path,
        media_type=media_type,
        headers={
            "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
            "Access-Control-Allow-Origin": "*",
        },
    )


@router.patch("/photos/{photo_id}/gallery-visibility")
def update_photo_gallery_visibility(
    photo_id: str,
    payload: GalleryVisibilityUpdate,
    db: Annotated[Session, Depends(get_db)],
):
    """Toggle or set whether an individual photo appears in the public customer gallery."""
    photo = db.get(Photo, photo_id)
    if not photo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Photo '{photo_id}' not found",
        )
    photo.is_public_gallery = payload.is_public_gallery
    db.commit()
    return {"success": True, "photo_id": photo.id, "is_public_gallery": photo.is_public_gallery}


@router.post("/events/{event_id}/photos/gallery-visibility")
def bulk_update_gallery_visibility(
    event_id: str,
    payload: BulkGalleryVisibilityUpdate,
    db: Annotated[Session, Depends(get_db)],
):
    """Bulk update public customer gallery visibility for a list of photos under an event."""
    event = _resolve_event(event_id, db)
    updated_count = 0
    if payload.photo_ids:
        photos = db.scalars(
            select(Photo)
            .where(Photo.event_id == event.id)
            .where(Photo.id.in_(payload.photo_ids))
        ).all()
        for p in photos:
            p.is_public_gallery = payload.is_public_gallery
            updated_count += 1
        db.commit()
    return {"success": True, "count": updated_count, "is_public_gallery": payload.is_public_gallery}

