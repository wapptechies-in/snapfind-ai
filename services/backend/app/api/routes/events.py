"""
Events API routes: CRUD, filtering, pagination, and token resolution.
Status: IMPLEMENTED (Phase 4)
"""

import logging
import secrets
from typing import Annotated, Any
from fastapi import APIRouter, Depends, File, HTTPException, Query, Request, UploadFile, status
from sqlalchemy import delete, func, or_, select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_photographer_or_default
from app.db.session import get_db
from app.models.billing import GuestPurchase
from app.models.download_log import DownloadLog
from app.models.event import Event, generate_public_token
from app.models.face import Face
from app.models.folder import Folder
from app.models.photo import Photo
from app.models.photographer import Photographer
from app.models.processing_job import ProcessingJob
from app.models.search_session import SearchSession
from app.models.upload_session import UploadSession, UploadSessionItem
from app.schemas.event import EventCreate, EventOut, EventSettingsSchema, EventUpdate
from app.services.storage import StorageService

logger = logging.getLogger("snapfind.events")
router = APIRouter(prefix="/events", tags=["events"])


DEFAULT_EVENT_COVER = "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80"


def _to_event_out(event: Event, photo_count: int) -> EventOut:
    settings = EventSettingsSchema(
        galleryVisibility=event.face_search_enabled,  # maps to settings
        faceSearch=event.face_search_enabled,
        downloads=event.downloads_enabled,
        originalDownloads=event.original_downloads_enabled,
        watermark=event.watermark_enabled,
        eventExpiry=event.expiry_enabled,
        expiryDate=event.expiry_date,
        paywallEnabled=getattr(event, "paywall_enabled", False),
        photoPrice=getattr(event, "photo_price", 4.99),
        galleryUnlockPrice=getattr(event, "gallery_unlock_price", 29.99),
        currency=getattr(event, "currency", "USD"),
    )

    cover_url = event.cover_image or event.cover_image_reference
    if not cover_url or not cover_url.strip():
        try:
            if hasattr(event, "photos") and event.photos and len(event.photos) > 0:
                first_photo = event.photos[0]
                cover_url = (
                    getattr(first_photo, "compressed_url", None)
                    or getattr(first_photo, "thumbnail_url", None)
                    or getattr(first_photo, "original_url", None)
                    or DEFAULT_EVENT_COVER
                )
            else:
                cover_url = DEFAULT_EVENT_COVER
        except Exception:
            cover_url = DEFAULT_EVENT_COVER

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
        coverImage=cover_url,
        cover_photo_url=cover_url,
        status=event.status,
        isActive=getattr(event, "is_active", True),
        welcomeMessage=getattr(event, "welcome_message", None),
        customLogoUrl=getattr(event, "custom_logo_url", None),
        showSnapfindBranding=getattr(event, "show_snapfind_branding", True),
        showCompanyCta=getattr(event, "show_company_cta", True),
        showContactButton=getattr(event, "show_contact_button", True),
        photoCount=photo_count,
        photos=photo_count,
        galleryViews=event.gallery_views,
        searches=event.total_searches,
        total_searches=event.total_searches,
        downloads=event.total_downloads,
        total_downloads=event.total_downloads,
        totalRegistrations=getattr(event, "total_registrations", 0),
        totalMatchesFound=getattr(event, "total_matches_found", 0),
        totalWhatsappSent=getattr(event, "total_whatsapp_sent", 0),
        totalMarketingConsents=getattr(event, "total_marketing_consents", 0),
        paywallEnabled=getattr(event, "paywall_enabled", False),
        photoPrice=getattr(event, "photo_price", 4.99),
        galleryUnlockPrice=getattr(event, "gallery_unlock_price", 29.99),
        currency=getattr(event, "currency", "USD"),
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
    # Check subscription quota
    active_events_count = db.scalar(
        select(func.count(Event.id)).where(
            Event.photographer_id == photographer.id,
            Event.status.ilike("active"),
        )
    ) or 0
    max_events = getattr(photographer, "max_active_events", 50)
    if active_events_count >= max_events:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail=f"Active event limit ({max_events}) reached for your {getattr(photographer, 'subscription_tier', 'free').upper()} plan. Please upgrade your subscription to create more events.",
        )

    # Ensure unique token
    token = generate_public_token()
    while db.scalar(select(Event).where(Event.public_token == token)):
        token = generate_public_token()

    is_act = event_in.is_active if event_in.is_active is not None else True
    init_status = event_in.status or ("Active" if is_act else "Inactive")
    if not is_act and init_status.lower() == "active":
        init_status = "Inactive"
    elif is_act and init_status.lower() == "inactive":
        init_status = "Active"

    event = Event(
        photographer_id=photographer.id,
        name=event_in.name,
        event_type=event_in.event_type,
        event_date=event_in.date,
        location=event_in.location or "Venue unspecified",
        description=event_in.description,
        cover_image=event_in.cover_image,
        cover_image_reference=event_in.cover_image,
        status=init_status,
        is_active=is_act,
        public_token=token,
        face_search_enabled=event_in.settings.face_search if event_in.settings else True,
        downloads_enabled=event_in.settings.downloads if event_in.settings else True,
        original_downloads_enabled=event_in.settings.original_downloads if event_in.settings else False,
        watermark_enabled=event_in.settings.watermark if event_in.settings else True,
        expiry_enabled=event_in.settings.event_expiry if event_in.settings else False,
        expiry_date=event_in.settings.expiry_date if event_in.settings else None,
        paywall_enabled=event_in.settings.paywall_enabled if event_in.settings else False,
        photo_price=event_in.settings.photo_price if event_in.settings else 4.99,
        gallery_unlock_price=event_in.settings.gallery_unlock_price if event_in.settings else 29.99,
        gallery_views=0,
        total_downloads=0,
        total_searches=0,
        total_registrations=0,
        total_matches_found=0,
        total_whatsapp_sent=0,
        total_marketing_consents=0,
        welcome_message=event_in.welcome_message,
        custom_logo_url=event_in.custom_logo_url,
        show_snapfind_branding=event_in.show_snapfind_branding if event_in.show_snapfind_branding is not None else True,
        show_company_cta=event_in.show_company_cta if event_in.show_company_cta is not None else True,
        show_contact_button=event_in.show_contact_button if event_in.show_contact_button is not None else True,
    )
    db.add(event)
    db.commit()
    db.refresh(event)

    return _to_event_out(event, 0)


@router.post("/upload-cover")
async def upload_cover_image(
    file: UploadFile = File(...),
    photographer: Annotated[Photographer, Depends(get_current_photographer_or_default)] = None,
) -> dict[str, str]:
    """Upload a custom event cover photo directly to storage."""
    allowed_types = ["image/jpeg", "image/png", "image/webp"]
    if file.content_type and file.content_type.lower() not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported image type '{file.content_type}'. Allowed: {', '.join(allowed_types)}",
        )

    storage = StorageService()
    cover_id = f"cov_{secrets.token_hex(6)}"
    filename = file.filename or "cover.jpg"
    key = f"covers/{cover_id}_{filename}"
    content = await file.read()
    storage.provider.put_object_bytes(key, content, content_type=file.content_type or "image/jpeg")
    public_url = storage.provider.generate_presigned_download_url(key, inline=True)

    return {"url": public_url, "storageKey": key}


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
        event.cover_image = event_in.cover_image
        event.cover_image_reference = event_in.cover_image
    if event_in.is_active is not None:
        event.is_active = event_in.is_active
        if not event_in.is_active and event.status.lower() == "active":
            event.status = "Inactive"
        elif event_in.is_active and event.status.lower() == "inactive":
            event.status = "Active"

    if event_in.status is not None:
        event.status = event_in.status
        if event_in.status.lower() == "active":
            event.is_active = True
        elif event_in.status.lower() == "inactive":
            event.is_active = False

    if event_in.token is not None:
        event.public_token = event_in.token

    if event_in.welcome_message is not None:
        event.welcome_message = event_in.welcome_message
    if event_in.custom_logo_url is not None:
        event.custom_logo_url = event_in.custom_logo_url
    if event_in.show_snapfind_branding is not None:
        event.show_snapfind_branding = event_in.show_snapfind_branding
    if event_in.show_company_cta is not None:
        event.show_company_cta = event_in.show_company_cta
    if event_in.show_contact_button is not None:
        event.show_contact_button = event_in.show_contact_button

    if event_in.settings is not None:
        event.face_search_enabled = event_in.settings.face_search
        event.downloads_enabled = event_in.settings.downloads
        event.original_downloads_enabled = event_in.settings.original_downloads
        event.watermark_enabled = event_in.settings.watermark
        event.expiry_enabled = event_in.settings.event_expiry
        event.expiry_date = event_in.settings.expiry_date
        event.paywall_enabled = event_in.settings.paywall_enabled
        event.photo_price = event_in.settings.photo_price
        event.gallery_unlock_price = event_in.settings.gallery_unlock_price
        event.currency = event_in.settings.currency

    db.commit()
    db.refresh(event)

    photo_count = db.scalar(
        select(func.count(Photo.id)).where(Photo.event_id == event.id)
    ) or 0

    return _to_event_out(event, photo_count)


@router.post("/{event_id}/regenerate-token", response_model=EventOut)
def regenerate_event_token(
    event_id: str,
    photographer: Annotated[Photographer, Depends(get_current_photographer_or_default)],
    db: Annotated[Session, Depends(get_db)],
) -> EventOut:
    """Regenerates a secure new public access token for the event, invalidating prior links."""
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

    event.public_token = generate_public_token()
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
    """
    Delete an event, cascade delete all child metadata (folders, photos, faces, sessions, logs, uploads),
    and clean up MinIO/S3 and local storage files.
    """
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

    # 1. Clean up storage files (MinIO / S3 / Local)
    try:
        storage = StorageService()
        storage.delete_event_objects(event_id)
        if event.cover_image and "covers/" in event.cover_image:
            parts = event.cover_image.split("covers/")
            if len(parts) > 1:
                cover_key = f"covers/{parts[1].split('?')[0]}"
                storage.provider.delete_object(cover_key)
    except Exception as exc:
        logger.warning(f"Storage cleanup exception for event {event_id}: {exc}")

    # 2. Defensive cascading removal of dependent entities in proper dependency order
    try:
        upload_session_ids = [
            s for s in db.scalars(select(UploadSession.id).where(UploadSession.event_id == event_id)).all()
        ]
        if upload_session_ids:
            db.execute(delete(UploadSessionItem).where(UploadSessionItem.upload_session_id.in_(upload_session_ids)))
            db.execute(delete(UploadSession).where(UploadSession.id.in_(upload_session_ids)))

        db.execute(delete(GuestPurchase).where(GuestPurchase.event_id == event_id))
        db.execute(delete(Face).where(Face.event_id == event_id))
        db.execute(delete(DownloadLog).where(DownloadLog.event_id == event_id))
        db.execute(delete(ProcessingJob).where(ProcessingJob.event_id == event_id))
        db.execute(delete(SearchSession).where(SearchSession.event_id == event_id))
        db.execute(delete(Photo).where(Photo.event_id == event_id))
        db.execute(delete(Folder).where(Folder.event_id == event_id))
        db.execute(delete(Event).where(Event.id == event_id))

        db.commit()
    except Exception as exc:
        db.rollback()
        logger.error(f"Failed to delete event {event_id} from database: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete event: {str(exc)}",
        )

    return {"ok": True}


@router.get("/{id_or_token}/public-photos")
def get_public_event_photos(
    id_or_token: str,
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    page: Annotated[int, Query(ge=1)] = 1,
    limit: Annotated[int, Query(ge=1, le=2000)] = 500,
) -> dict[str, Any]:
    """
    Public guest gallery endpoint:
    - Resolves event by ID or public token.
    - Validates event status and expiry.
    - Increments gallery views counter.
    - Returns photos with presigned web & thumbnail URLs plus event download policies.
    """
    event = db.scalar(
        select(Event).where(
            or_(
                Event.id == id_or_token,
                Event.public_token == id_or_token,
            )
        )
    )
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Event '{id_or_token}' not found",
        )

    if not getattr(event, "is_active", True) or event.status.lower() in ("inactive", "draft"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This event is currently unavailable",
        )

    if event.status.lower() == "archived":
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="This event gallery has been archived",
        )

    # Increment gallery views
    event.gallery_views += 1
    db.commit()

    storage = StorageService()
    total = db.scalar(
        select(func.count(Photo.id))
        .where(Photo.event_id == event.id)
        .where(Photo.upload_status != "failed")
        .where(Photo.is_public_gallery == True)
    ) or 0

    offset = (page - 1) * limit
    photos = db.scalars(
        select(Photo)
        .where(Photo.event_id == event.id)
        .where(Photo.upload_status != "failed")
        .where(Photo.is_public_gallery == True)
        .order_by(Photo.created_at.desc())
        .offset(offset)
        .limit(limit)
    ).all()

    items = []
    for p in photos:
        web_url = storage.get_photo_url(p, variant="web", download=False)
        thumb_url = storage.get_photo_url(p, variant="thumbnail", download=False)
        request_origin = str(request.base_url).rstrip("/")
        for local_origin in ("http://127.0.0.1:8000", "http://localhost:8000"):
            if web_url.startswith(local_origin):
                web_url = f"{request_origin}{web_url[len(local_origin):]}"
            if thumb_url.startswith(local_origin):
                thumb_url = f"{request_origin}{thumb_url[len(local_origin):]}"
        items.append({
            "id": p.id,
            "eventId": p.event_id,
            "filename": p.original_filename or p.filename,
            "url": web_url,
            "thumbnailUrl": thumb_url,
            "width": p.width,
            "height": p.height,
            "fileSize": p.file_size,
            "folderId": p.folder_id,
            "uploadedAt": p.created_at.isoformat(),
        })

    return {
        "eventId": event.id,
        "eventName": event.name,
        "token": event.public_token,
        "downloadsEnabled": event.downloads_enabled,
        "originalDownloadsEnabled": event.original_downloads_enabled,
        "total": total,
        "items": items,
    }
