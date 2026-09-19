"""
Events API routes: CRUD, filtering, pagination, and token resolution.
Status: IMPLEMENTED (Phase 4)
"""

from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_photographer_or_default
from app.db.session import get_db
from app.models.event import Event, generate_public_token
from app.models.photo import Photo
from app.models.photographer import Photographer
from app.schemas.event import EventCreate, EventOut, EventSettingsSchema, EventUpdate

router = APIRouter(prefix="/events", tags=["events"])


def _to_event_out(event: Event, photo_count: int) -> EventOut:
    settings = EventSettingsSchema(
        galleryVisibility=event.face_search_enabled,  # maps to settings
        faceSearch=event.face_search_enabled,
        downloads=event.downloads_enabled,
        originalDownloads=event.original_downloads_enabled,
        watermark=event.watermark_enabled,
        eventExpiry=event.expiry_enabled,
        expiryDate=event.expiry_date,
    )

    return EventOut(
        id=event.id,
        token=event.public_token,
        public_token=event.public_token,
        name=event.name,
        eventType=event.event_type,
        date=event.event_date,
        eventDate=event.event_date,
        location=event.location,
        description=event.description,
        coverImage=event.cover_image_reference,
        cover_photo_url=event.cover_image_reference,
        status=event.status,
        photoCount=photo_count,
        photos=photo_count,
        galleryViews=event.gallery_views,
        searches=event.total_searches,
        total_searches=event.total_searches,
        downloads=event.total_downloads,
        total_downloads=event.total_downloads,
        createdAt=event.created_at,
        created_at=event.created_at,
        settings=settings,
    )


@router.get("", response_model=list[EventOut])
def list_events(
    photographer: Annotated[Photographer, Depends(get_current_photographer_or_default)],
    db: Annotated[Session, Depends(get_db)],
    status_filter: Annotated[str | None, Query(alias="status")] = None,
    event_type: Annotated[str | None, Query(alias="eventType")] = None,
    search: Annotated[str | None, Query()] = None,
    sort_by: Annotated[str | None, Query(alias="sortBy")] = "date-desc",
) -> list[EventOut]:
    """List all events belonging to the current photographer with optional filters and sorting."""
    query = (
        select(Event, func.count(Photo.id).label("photo_count"))
        .outerjoin(Photo, Photo.event_id == Event.id)
        .where(Event.photographer_id == photographer.id)
        .group_by(Event.id)
    )

    if status_filter and status_filter.lower() != "all":
        query = query.where(Event.status.ilike(status_filter))

    if event_type and event_type.lower() != "all":
        query = query.where(Event.event_type.ilike(event_type))

    if search:
        search_term = f"%{search.strip()}%"
        query = query.where(
            or_(
                Event.name.ilike(search_term),
                Event.location.ilike(search_term),
                Event.public_token.ilike(search_term),
            )
        )

    # Sorting
    if sort_by == "date-asc":
        query = query.order_by(Event.event_date.asc(), Event.created_at.asc())
    elif sort_by == "photos-desc":
        query = query.order_by(func.count(Photo.id).desc(), Event.created_at.desc())
    elif sort_by == "name-asc":
        query = query.order_by(Event.name.asc())
    else:  # date-desc default
        query = query.order_by(Event.event_date.desc(), Event.created_at.desc())

    results = db.execute(query).all()
    return [_to_event_out(event, count) for event, count in results]


@router.post("", response_model=EventOut, status_code=status.HTTP_201_CREATED)
def create_event(
    event_in: EventCreate,
    photographer: Annotated[Photographer, Depends(get_current_photographer_or_default)],
    db: Annotated[Session, Depends(get_db)],
) -> EventOut:
    """Create a new event, generate secure random public token, and store in PostgreSQL."""
    # Ensure unique token
    token = generate_public_token()
    while db.scalar(select(Event).where(Event.public_token == token)):
        token = generate_public_token()

    event = Event(
        photographer_id=photographer.id,
        name=event_in.name,
        event_type=event_in.event_type,
        event_date=event_in.date,
        location=event_in.location or "Venue unspecified",
        description=event_in.description,
        cover_image_reference=event_in.cover_image,
        status=event_in.status or "Active",
        public_token=token,
        face_search_enabled=event_in.settings.face_search if event_in.settings else True,
        downloads_enabled=event_in.settings.downloads if event_in.settings else True,
        original_downloads_enabled=event_in.settings.original_downloads if event_in.settings else False,
        watermark_enabled=event_in.settings.watermark if event_in.settings else True,
        expiry_enabled=event_in.settings.event_expiry if event_in.settings else False,
        expiry_date=event_in.settings.expiry_date if event_in.settings else None,
        gallery_views=0,
        total_downloads=0,
        total_searches=0,
    )
    db.add(event)
    db.commit()
    db.refresh(event)

    return _to_event_out(event, 0)


@router.get("/{id_or_token}", response_model=EventOut)
def get_event(
    id_or_token: str,
    db: Annotated[Session, Depends(get_db)],
) -> EventOut:
    """Retrieve an event by database ID or by public token (allows customer gallery access)."""
    result = db.execute(
        select(Event, func.count(Photo.id).label("photo_count"))
        .outerjoin(Photo, Photo.event_id == Event.id)
        .where(
            or_(
                Event.id == id_or_token,
                Event.public_token == id_or_token,
            )
        )
        .group_by(Event.id)
    ).first()

    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Event '{id_or_token}' not found",
        )

    event, photo_count = result
    return _to_event_out(event, photo_count)


@router.patch("/{event_id}", response_model=EventOut)
def patch_event(
    event_id: str,
    event_in: EventUpdate,
    photographer: Annotated[Photographer, Depends(get_current_photographer_or_default)],
    db: Annotated[Session, Depends(get_db)],
) -> EventOut:
    """Partially update event fields or policy toggles."""
    event = db.scalar(
        select(Event).where(
            Event.id == event_id,
            Event.photographer_id == photographer.id,
        )
    )
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found",
        )

    if event_in.name is not None:
        event.name = event_in.name
    if event_in.event_type is not None:
        event.event_type = event_in.event_type
    if event_in.date is not None:
        event.event_date = event_in.date
    if event_in.location is not None:
        event.location = event_in.location
    if event_in.description is not None:
        event.description = event_in.description
    if event_in.cover_image is not None:
        event.cover_image_reference = event_in.cover_image
    if event_in.status is not None:
        event.status = event_in.status
    if event_in.token is not None:
        event.public_token = event_in.token

    if event_in.settings is not None:
        event.face_search_enabled = event_in.settings.face_search
        event.downloads_enabled = event_in.settings.downloads
        event.original_downloads_enabled = event_in.settings.original_downloads
        event.watermark_enabled = event_in.settings.watermark
        event.expiry_enabled = event_in.settings.event_expiry
        event.expiry_date = event_in.settings.expiry_date

    db.commit()
    db.refresh(event)

    photo_count = db.scalar(
        select(func.count(Photo.id)).where(Photo.event_id == event.id)
    ) or 0

    return _to_event_out(event, photo_count)


@router.put("/{event_id}", response_model=EventOut)
def update_event(
    event_id: str,
    event_in: EventUpdate,
    photographer: Annotated[Photographer, Depends(get_current_photographer_or_default)],
    db: Annotated[Session, Depends(get_db)],
) -> EventOut:
    """Full update for backward compatibility."""
    return patch_event(
        event_id=event_id,
        event_in=event_in,
        photographer=photographer,
        db=db,
    )


@router.delete("/{event_id}", status_code=status.HTTP_200_OK)
def delete_event(
    event_id: str,
    photographer: Annotated[Photographer, Depends(get_current_photographer_or_default)],
    db: Annotated[Session, Depends(get_db)],
) -> dict[str, bool]:
    """Delete an event and cascade delete its photo metadata from PostgreSQL."""
    event = db.scalar(
        select(Event).where(
            Event.id == event_id,
            Event.photographer_id == photographer.id,
        )
    )
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found",
        )

    db.delete(event)
    db.commit()
    return {"ok": True}
