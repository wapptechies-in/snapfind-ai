"""
Bookings API routes: client inquiries and photoshoot booking management.
Status: IMPLEMENTED (Phase 4)
"""

from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_photographer_or_default
from app.db.session import get_db
from app.models.booking import Booking
from app.models.photographer import Photographer
from app.schemas.booking import BookingCreate, BookingOut, BookingUpdate

router = APIRouter(prefix="/bookings", tags=["bookings"])


@router.post("", response_model=BookingOut, status_code=status.HTTP_201_CREATED)
def create_booking(
    booking_in: BookingCreate,
    db: Annotated[Session, Depends(get_db)],
) -> BookingOut:
    """
    Public endpoint: allow clients to submit a photography booking inquiry.
    Saves the inquiry into PostgreSQL with 'pending' status.
    """
    photographer_id = booking_in.photographer_id

    # If no photographer_id was provided, resolve to default demo photographer
    if not photographer_id:
        default_p = db.scalar(
            select(Photographer).order_by(Photographer.created_at.asc())
        )
        if default_p:
            photographer_id = default_p.id

    booking = Booking(
        photographer_id=photographer_id,
        name=booking_in.name,
        phone=booking_in.phone,
        email=booking_in.email,
        event_type=booking_in.event_type,
        event_date=booking_in.event_date,
        location=booking_in.location,
        guest_count=booking_in.guest_count,
        message=booking_in.message,
        status="pending",
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)

    return booking


@router.get("", response_model=list[BookingOut])
def list_bookings(
    photographer: Annotated[Photographer, Depends(get_current_photographer_or_default)],
    db: Annotated[Session, Depends(get_db)],
    status_filter: Annotated[str | None, Query(alias="status")] = None,
) -> list[BookingOut]:
    """List bookings for the current photographer, optionally filtered by status."""
    query = (
        select(Booking)
        .where(
            (Booking.photographer_id == photographer.id)
            | (Booking.photographer_id.is_(None))
        )
        .order_by(Booking.created_at.desc())
    )

    if status_filter and status_filter.lower() != "all":
        query = query.where(Booking.status.ilike(status_filter))

    bookings = db.scalars(query).all()
    return list(bookings)


@router.get("/{booking_id}", response_model=BookingOut)
def get_booking(
    booking_id: str,
    db: Annotated[Session, Depends(get_db)],
) -> BookingOut:
    """Retrieve details for a single booking."""
    booking = db.get(Booking, booking_id)
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Booking '{booking_id}' not found",
        )
    return booking


@router.patch("/{booking_id}", response_model=BookingOut)
def update_booking_status(
    booking_id: str,
    update_in: BookingUpdate,
    photographer: Annotated[Photographer, Depends(get_current_photographer_or_default)],
    db: Annotated[Session, Depends(get_db)],
) -> BookingOut:
    """Update status of a booking (e.g., pending -> confirmed / cancelled)."""
    booking = db.get(Booking, booking_id)
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Booking '{booking_id}' not found",
        )

    booking.status = update_in.status.lower()
    db.commit()
    db.refresh(booking)
    return booking

