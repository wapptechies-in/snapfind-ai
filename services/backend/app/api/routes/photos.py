"""
Photos API routes: photo metadata listing, lookup, and deletion.
Status: IMPLEMENTED (Phase 4)
"""

from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_photographer_or_default
from app.db.session import get_db
from app.models.event import Event
from app.models.photo import Photo
from app.models.photographer import Photographer
from app.schemas.photo import PhotoCreate, PhotoListOut, PhotoOut

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


@router.get("/events/{event_id}/photos", response_model=PhotoListOut)
def list_event_photos(
    event_id: str,
    db: Annotated[Session, Depends(get_db)],
    page: Annotated[int, Query(ge=1)] = 1,
    limit: Annotated[int, Query(ge=1, le=200)] = 50,
) -> PhotoListOut:
    """
    Retrieve photo metadata for a given event ID or public token.
    Supports pagination via page and limit query parameters.
    """
    event = _resolve_event(event_id, db)

    total = db.scalar(
        select(func.count(Photo.id)).where(Photo.event_id == event.id)
    ) or 0

    offset = (page - 1) * limit
    photos = db.scalars(
        select(Photo)
        .where(Photo.event_id == event.id)
        .order_by(Photo.created_at.desc())
        .offset(offset)
        .limit(limit)
    ).all()

    return PhotoListOut(
        items=list(photos),
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
    """Create metadata record for a photo in the specified event."""
    event = _resolve_event(event_id, db)

    photo = Photo(
        event_id=event.id,
        filename=photo_in.filename,
        url=photo_in.url,
        thumbnail_url=photo_in.thumbnail_url,
        width=photo_in.width or 1600,
        height=photo_in.height or 1067,
        file_size=photo_in.file_size,
        mime_type=photo_in.mime_type or "image/jpeg",
        storage_key=photo_in.storage_key,
        thumbnail_key=photo_in.thumbnail_key,
        processing_status="completed",
    )
    db.add(photo)
    db.commit()
    db.refresh(photo)

    return photo


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
    return photo


@router.delete("/photos/{photo_id}")
def delete_photo(
    photo_id: str,
    photographer: Annotated[Photographer, Depends(get_current_photographer_or_default)],
    db: Annotated[Session, Depends(get_db)],
) -> dict[str, bool | str]:
    """Delete photo metadata record from PostgreSQL."""
    photo = db.get(Photo, photo_id)
    if not photo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Photo '{photo_id}' not found",
        )

    db.delete(photo)
    db.commit()
    return {"ok": True, "id": photo_id}

