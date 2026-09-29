"""
Guest Registration, Consent Management, WhatsApp dispatch, and Right to be Forgotten.
"""

from datetime import datetime, timezone
import logging
from typing import Annotated, Any
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_photographer
from app.core.config import get_settings
from app.db.session import get_db
from app.models.event import Event
from app.models.guest import Guest, MarketingLead, generate_guest_id
from app.models.photographer import Photographer
from app.schemas.guest import GuestOut, GuestRegisterRequest, MarketingLeadOut
from app.schemas.whatsapp import WhatsAppSendRequest, WhatsAppSendResponse
from app.services.rate_limit import check_rate_limit
from app.services.whatsapp.base import normalize_e164_phone
from app.services.whatsapp.service import WhatsAppService

logger = logging.getLogger("snapfind.guests")
settings = get_settings()
router = APIRouter(prefix="/guests", tags=["guests"])


def _resolve_event(id_or_token: str, db: Session) -> Event:
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
            detail=f"Event '{id_or_token}' not found.",
        )
    if not getattr(event, "is_active", True) or event.status.lower() in ("inactive", "draft"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This event is currently unavailable.",
        )
    return event


@router.post("/register", response_model=GuestOut, status_code=status.HTTP_201_CREATED)
def register_guest(
    payload: GuestRegisterRequest,
    request: Request,
    db: Annotated[Session, Depends(get_db)],
) -> GuestOut:
    """
    Registers an event attendee with explicit consent tracking.
    Enforces phone normalization (E.164) and deduplication per event.
    """
    # Rate limit public guest registrations
    check_rate_limit(request, "guest_register", max_requests=10, window_seconds=60)

    # 1. Resolve event
    event = _resolve_event(payload.event_id_or_token, db)

    # 2. Normalize phone
    try:
        clean_phone = normalize_e164_phone(payload.whatsapp_number)
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err),
        )

    # 3. Enforce mandatory selfie processing consent
    if not payload.consent_selfie_processing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Selfie processing consent is required to find your photos.",
        )

    now = datetime.now(timezone.utc)

    # 4. Check for existing guest registration under this event (deduplication)
    guest = db.scalar(
        select(Guest).where(
            Guest.event_id == event.id,
            Guest.whatsapp_number == clean_phone,
        )
    )

    if guest:
        # Update existing record
        guest.name = payload.name.strip()
        if payload.email:
            guest.email = payload.email.strip()
        guest.consent_selfie_processing = True
        guest.consent_selfie_at = guest.consent_selfie_at or now

        if payload.consent_whatsapp_transactional:
            guest.consent_whatsapp_transactional = True
            guest.consent_whatsapp_at = guest.consent_whatsapp_at or now

        if payload.consent_marketing:
            guest.consent_marketing = True
            guest.consent_marketing_at = guest.consent_marketing_at or now
    else:
        # Create new guest
        guest = Guest(
            id=generate_guest_id(),
            event_id=event.id,
            name=payload.name.strip(),
            whatsapp_number=clean_phone,
            email=payload.email.strip() if payload.email else None,
            consent_selfie_processing=True,
            consent_selfie_at=now,
            consent_whatsapp_transactional=payload.consent_whatsapp_transactional,
            consent_whatsapp_at=now if payload.consent_whatsapp_transactional else None,
            consent_marketing=payload.consent_marketing,
            consent_marketing_at=now if payload.consent_marketing else None,
        )
        db.add(guest)
        event.total_registrations += 1

    db.flush()

    # 5. Handle Marketing Lead creation on explicit opt-in only
    if payload.consent_marketing:
        existing_lead = db.scalar(
            select(MarketingLead).where(
                MarketingLead.event_id == event.id,
                MarketingLead.phone == clean_phone,
            )
        )
        if not existing_lead:
            lead = MarketingLead(
                event_id=event.id,
                photographer_id=event.photographer_id,
                guest_id=guest.id,
                name=payload.name.strip(),
                phone=clean_phone,
                email=payload.email.strip() if payload.email else None,
                source="event_qr_registration",
                opted_in_at=now,
            )
            db.add(lead)
            event.total_marketing_consents += 1

    db.commit()
    db.refresh(guest)

    return GuestOut(
        id=guest.id,
        eventId=guest.event_id,
        name=guest.name,
        full_name=guest.name,
        whatsappNumber=guest.whatsapp_number,
        whatsapp_number=guest.whatsapp_number,
        email=guest.email,
        consentSelfieProcessing=guest.consent_selfie_processing,
        consent_selfie_processing=guest.consent_selfie_processing,
        consentWhatsappTransactional=guest.consent_whatsapp_transactional,
        consent_whatsapp_transactional=guest.consent_whatsapp_transactional,
        consentMarketing=guest.consent_marketing,
        consent_marketing=guest.consent_marketing,
        createdAt=guest.created_at.isoformat(),
        created_at=guest.created_at.isoformat(),
    )


@router.get("/{guest_id}", response_model=GuestOut)
def get_guest(
    guest_id: str,
    db: Annotated[Session, Depends(get_db)],
) -> GuestOut:
    """Retrieve registered guest details."""
    guest = db.get(Guest, guest_id)
    if not guest:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Guest '{guest_id}' not found.",
        )
    return GuestOut(
        id=guest.id,
        eventId=guest.event_id,
        name=guest.name,
        full_name=guest.name,
        whatsappNumber=guest.whatsapp_number,
        whatsapp_number=guest.whatsapp_number,
        email=guest.email,
        consentSelfieProcessing=guest.consent_selfie_processing,
        consent_selfie_processing=guest.consent_selfie_processing,
        consentWhatsappTransactional=guest.consent_whatsapp_transactional,
        consent_whatsapp_transactional=guest.consent_whatsapp_transactional,
        consentMarketing=guest.consent_marketing,
        consent_marketing=guest.consent_marketing,
        createdAt=guest.created_at.isoformat(),
        created_at=guest.created_at.isoformat(),
    )


@router.delete("/{guest_id}", status_code=status.HTTP_200_OK)
def delete_guest(
    guest_id: str,
    db: Annotated[Session, Depends(get_db)],
) -> dict[str, Any]:
    """
    Right to be Forgotten: Permanently deletes guest metadata, consents,
    marketing leads, and transmission logs.
    """
    guest = db.get(Guest, guest_id)
    if not guest:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Guest '{guest_id}' not found.",
        )

    db.delete(guest)
    db.commit()
    return {"ok": True, "status": "deleted", "guest_id": guest_id}


@router.post("/{guest_id}/send-whatsapp", response_model=WhatsAppSendResponse)
def send_whatsapp_to_guest(
    guest_id: str,
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    payload: WhatsAppSendRequest | None = None,
) -> WhatsAppSendResponse:
    """
    Sends transactional photo gallery results link to guest via WhatsApp.
    Strictly verifies guest.consent_whatsapp_transactional.
    """
    check_rate_limit(request, "send_whatsapp", max_requests=5, window_seconds=60)

    guest = db.get(Guest, guest_id)
    if not guest:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Guest not found.",
        )

    event = db.get(Event, guest.event_id)
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Associated event not found.",
        )

    service = WhatsAppService()
    try:
        results_url = payload.results_url if payload else None
        if payload and payload.message_type == "marketing":
            msg_text = payload.custom_message or f"Updates from {event.name}"
            res = service.send_marketing_message(guest, event, message_text=msg_text, db=db)
        else:
            res = service.send_results_link(guest, event, results_url=results_url, db=db)

        clean_num = guest.whatsapp_number.lstrip("+")
        final_url = results_url or f"{settings.FRONTEND_BASE_URL.rstrip('/')}/event/{event.public_token}/results?guest={guest.id}"
        msg_preview = f"Hi {guest.name}! 📸 Your photos from {event.name} are ready: {final_url}"
        import urllib.parse
        direct_url = f"https://wa.me/{clean_num}?text={urllib.parse.quote(msg_preview)}"

        return WhatsAppSendResponse(
            success=res.success,
            providerMessageId=res.provider_message_id,
            provider=res.provider,
            status="delivered" if res.success else "failed",
            message="Message queued/sent via WhatsApp." if res.success else res.error,
            direct_share_url=direct_url,
            directShareUrl=direct_url,
        )
    except PermissionError as p_err:
        return WhatsAppSendResponse(
            success=False,
            providerMessageId=None,
            provider="service",
            status="consent_denied",
            message=str(p_err),
        )


@router.get("/events/{id_or_token}/list", response_model=list[GuestOut])
def list_event_guests(
    id_or_token: str,
    photographer: Annotated[Photographer, Depends(get_current_photographer)],
    db: Annotated[Session, Depends(get_db)],
) -> list[GuestOut]:
    """Photographer admin endpoint: Lists all attendees registered for this event."""
    event = _resolve_event(id_or_token, db)
    if event.photographer_id != photographer.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view guests for this event.",
        )

    guests = db.scalars(
        select(Guest).where(Guest.event_id == event.id).order_by(Guest.created_at.desc())
    ).all()

    return [
        GuestOut(
            id=g.id,
            eventId=g.event_id,
            name=g.name,
            full_name=g.name,
            whatsappNumber=g.whatsapp_number,
            whatsapp_number=g.whatsapp_number,
            email=g.email,
            consentSelfieProcessing=g.consent_selfie_processing,
            consent_selfie_processing=g.consent_selfie_processing,
            consentWhatsappTransactional=g.consent_whatsapp_transactional,
            consent_whatsapp_transactional=g.consent_whatsapp_transactional,
            consentMarketing=g.consent_marketing,
            consent_marketing=g.consent_marketing,
            createdAt=g.created_at.isoformat(),
            created_at=g.created_at.isoformat(),
        )
        for g in guests
    ]


@router.get("/events/{id_or_token}/leads", response_model=list[MarketingLeadOut])
def list_event_leads(
    id_or_token: str,
    photographer: Annotated[Photographer, Depends(get_current_photographer)],
    db: Annotated[Session, Depends(get_db)],
) -> list[MarketingLeadOut]:
    """Photographer admin endpoint: Lists explicit marketing opt-in leads for this event."""
    event = _resolve_event(id_or_token, db)
    if event.photographer_id != photographer.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view leads for this event.",
        )

    leads = db.scalars(
        select(MarketingLead)
        .where(MarketingLead.event_id == event.id)
        .order_by(MarketingLead.created_at.desc())
    ).all()

    return [
        MarketingLeadOut(
            id=l.id,
            eventId=l.event_id,
            photographerId=l.photographer_id,
            guestId=l.guest_id,
            name=l.name,
            full_name=l.name,
            phone=l.phone,
            whatsapp_number=l.phone,
            email=l.email,
            source=l.source,
            optedInAt=l.opted_in_at.isoformat(),
            opted_in_at=l.opted_in_at.isoformat(),
            createdAt=l.created_at.isoformat(),
            created_at=l.created_at.isoformat(),
        )
        for l in leads
    ]
