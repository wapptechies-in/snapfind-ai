"""
Upload Sessions API routes: desktop upload session management, batch-init, and tracking.
Status: IMPLEMENTED (Phase 8)
"""

import logging
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_photographer
from app.core.config import get_settings
from app.db.session import get_db
from app.models.event import Event
from app.models.photo import Photo, generate_photo_id
from app.models.photographer import Photographer
from app.models.upload_session import (
    UploadSession,
    UploadSessionItem,
    generate_upload_session_id,
    generate_upload_session_item_id,
)
from app.schemas.upload_session import (
    BatchUploadInitItemResponse,
    BatchUploadInitRequest,
    BatchUploadInitResponse,
    UploadSessionCreate,
    UploadSessionOut,
)
from app.services.storage import StorageService

logger = logging.getLogger("snapfind.upload_sessions")
settings = get_settings()
router = APIRouter(prefix="/upload-sessions", tags=["upload-sessions"])


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


@router.post(
    "",
    response_model=UploadSessionOut,
    status_code=status.HTTP_201_CREATED,
)
def create_upload_session(
    payload: UploadSessionCreate,
    photographer: Annotated[Photographer, Depends(get_current_photographer)],
    db: Annotated[Session, Depends(get_db)],
) -> UploadSession:
    """
    Creates a persistent batch upload session for an event.
    Verifies event existence and photographer ownership.
    """
    event = _resolve_event(payload.event_id, db)
    if event.photographer_id != photographer.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to upload to this event",
        )

    session = UploadSession(
        id=generate_upload_session_id(),
        event_id=event.id,
        photographer_id=photographer.id,
        name=payload.name,
        status="active",
        total_files=payload.total_files,
        uploaded_files=0,
        failed_files=0,
        total_bytes=payload.total_bytes,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


@router.get(
    "/{session_id}",
    response_model=UploadSessionOut,
)
def get_upload_session(
    session_id: str,
    photographer: Annotated[Photographer, Depends(get_current_photographer)],
    db: Annotated[Session, Depends(get_db)],
) -> UploadSession:
    """
    Returns upload session status, metrics, and items.
    """
    session = db.get(UploadSession, session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Upload session '{session_id}' not found",
        )

    if session.photographer_id != photographer.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view this upload session",
        )

    return session


@router.post(
    "/{session_id}/batch-init",
    response_model=BatchUploadInitResponse,
)
def batch_upload_init(
    session_id: str,
    payload: BatchUploadInitRequest,
    photographer: Annotated[Photographer, Depends(get_current_photographer)],
    db: Annotated[Session, Depends(get_db)],
) -> BatchUploadInitResponse:
    """
    Batch initialisation of presigned PUT upload URLs for up to 100 photos at once.
    Designed for desktop client high-throughput uploads.
    """
    session = db.get(UploadSession, session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Upload session '{session_id}' not found",
        )

    if session.photographer_id != photographer.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to manage this upload session",
        )

    if session.status != "active":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Upload session is not active (current status: {session.status})",
        )

    if len(payload.items) > 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum batch size is 100 items per request",
        )

    # Enforce 9.0 GB hard storage limit (protects Cloudflare R2 free tier from charges)
    current_storage_bytes = db.scalar(
        select(func.coalesce(func.sum(Photo.file_size), 0))
        .join(Event, Event.id == Photo.event_id)
        .where(Event.photographer_id == photographer.id)
    ) or 0
    batch_incoming_bytes = sum(item.file_size for item in payload.items)
    max_storage_limit = settings.TRIAL_STORAGE_LIMIT_BYTES if settings.TRIAL_EDITION_MODE else 50 * 1024 * 1024 * 1024

    if current_storage_bytes + batch_incoming_bytes > max_storage_limit:
        used_gb = round(current_storage_bytes / (1024 ** 3), 2)
        batch_gb = round(batch_incoming_bytes / (1024 ** 3), 2)
        limit_gb = round(max_storage_limit / (1024 ** 3), 1)
        raise HTTPException(
            status_code=status.HTTP_413_CONTENT_TOO_LARGE,
            detail=(
                f"Trial storage limit reached ({limit_gb} GB): You have used {used_gb} GB. "
                f"Adding this batch ({batch_gb} GB) would exceed the 9.0 GB ceiling. "
                f"Uploads blocked to ensure zero overage charges on Cloudflare R2."
            ),
        )

    storage = StorageService()
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    allowed_types = ["image/jpeg", "image/png", "image/webp"]

    result_items: list[BatchUploadInitItemResponse] = []

    for item in payload.items:
        if item.file_size > max_bytes:
            continue
        if item.mime_type.lower() not in allowed_types:
            continue

        photo_id = generate_photo_id()
        item_id = generate_upload_session_item_id()
        original_key = storage.build_original_key(session.event_id, photo_id, item.filename)

        presigned = storage.provider.generate_presigned_upload_url(
            key=original_key,
            content_type=item.mime_type,
            expires_in=settings.PRESIGNED_URL_EXPIRE_SECONDS,
        )

        photo = Photo(
            id=photo_id,
            event_id=session.event_id,
            filename=item.filename,
            original_filename=item.filename,
            original_storage_key=original_key,
            storage_key=original_key,
            file_size=item.file_size,
            mime_type=item.mime_type,
            checksum=item.checksum,
            folder_id=item.folder_id,
            upload_status="pending",
            processing_status="pending",
        )
        db.add(photo)

        session_item = UploadSessionItem(
            id=item_id,
            upload_session_id=session.id,
            photo_id=photo_id,
            filename=item.filename,
            file_size=item.file_size,
            checksum=item.checksum,
            status="pending",
        )
        db.add(session_item)

        result_items.append(
            BatchUploadInitItemResponse(
                photoId=photo_id,
                itemId=item_id,
                filename=item.filename,
                uploadUrl=presigned["upload_url"],
                storageKey=original_key,
                headers=presigned.get("headers", {}),
                expiresIn=presigned.get("expires_in", settings.PRESIGNED_URL_EXPIRE_SECONDS),
            )
        )

    db.commit()

    return BatchUploadInitResponse(
        uploadSessionId=session.id,
        items=result_items,
    )


@router.post(
    "/{session_id}/complete",
    response_model=UploadSessionOut,
)
def complete_upload_session(
    session_id: str,
    photographer: Annotated[Photographer, Depends(get_current_photographer)],
    db: Annotated[Session, Depends(get_db)],
) -> UploadSession:
    """
    Marks the upload session as completed.
    """
    session = db.get(UploadSession, session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Upload session '{session_id}' not found",
        )

    if session.photographer_id != photographer.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to complete this upload session",
        )

    # Calculate real-time counts from items
    total_items = db.scalar(
        select(func.count(UploadSessionItem.id)).where(UploadSessionItem.upload_session_id == session.id)
    ) or 0

    uploaded_items = db.scalar(
        select(func.count(UploadSessionItem.id)).where(
            UploadSessionItem.upload_session_id == session.id,
            UploadSessionItem.status == "uploaded",
        )
    ) or 0

    failed_items = db.scalar(
        select(func.count(UploadSessionItem.id)).where(
            UploadSessionItem.upload_session_id == session.id,
            UploadSessionItem.status == "failed",
        )
    ) or 0

    session.status = "completed"
    if total_items > 0:
        session.total_files = total_items
        session.uploaded_files = uploaded_items
        session.failed_files = failed_items

    db.commit()
    db.refresh(session)
    return session


@router.post(
    "/{session_id}/cancel",
    response_model=UploadSessionOut,
)
def cancel_upload_session(
    session_id: str,
    photographer: Annotated[Photographer, Depends(get_current_photographer)],
    db: Annotated[Session, Depends(get_db)],
) -> UploadSession:
    """
    Marks the upload session as cancelled.
    Completed files remain uploaded; pending files remain available locally.
    """
    session = db.get(UploadSession, session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Upload session '{session_id}' not found",
        )

    if session.photographer_id != photographer.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to cancel this upload session",
        )

    session.status = "cancelled"
    db.commit()
    db.refresh(session)
    return session
