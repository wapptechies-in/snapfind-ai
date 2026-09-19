"""
Booking Pydantic schemas: validation and response serialization.
Status: IMPLEMENTED (Phase 4)
"""

from datetime import datetime
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class BookingCreate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    name: str = Field(..., min_length=2, max_length=255, description="Client full name")
    phone: str = Field(..., min_length=7, max_length=64, description="Contact phone number")
    email: EmailStr = Field(..., description="Client email address")
    event_type: str = Field(..., max_length=64, alias="eventType", description="e.g. Wedding, Birthday, Corporate")
    event_date: str = Field(..., min_length=4, max_length=32, alias="eventDate", description="Target date YYYY-MM-DD")
    location: str = Field(..., max_length=255, description="Event venue or city")
    guest_count: int = Field(default=50, ge=1, le=50000, alias="guestCount")
    message: str | None = Field(default=None, max_length=3000)
    photographer_id: str | None = Field(default=None, alias="photographerId")


class BookingUpdate(BaseModel):
    status: str = Field(..., description="pending, confirmed, or cancelled")


class BookingOut(BaseModel):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    id: str
    photographer_id: str | None = Field(default=None, alias="photographerId")
    name: str
    phone: str
    email: str
    event_type: str = Field(..., alias="eventType")
    event_date: str = Field(..., alias="eventDate")
    location: str
    guest_count: int = Field(..., alias="guestCount")
    message: str | None = None
    status: str
    created_at: datetime = Field(..., alias="createdAt")
    updated_at: datetime = Field(..., alias="updatedAt")
