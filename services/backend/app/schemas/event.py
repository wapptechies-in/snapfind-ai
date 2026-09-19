"""
Event Pydantic schemas: validation and response serialization.
Status: IMPLEMENTED (Phase 4)
"""

from datetime import datetime
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field

EventType = Literal[
    "Wedding",
    "Marriage",
    "Birthday",
    "Sports",
    "Family",
    "Corporate",
    "College/School",
    "Candid",
    "Nature",
    "Other",
]

EventStatus = Literal[
    "Draft",
    "Processing",
    "Active",
    "Expired",
    "Archived",
    "active",
    "processing",
    "completed",
]


class EventSettingsSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    gallery_visibility: bool = Field(default=True, alias="galleryVisibility")
    face_search: bool = Field(default=True, alias="faceSearch")
    downloads: bool = Field(default=True, alias="downloads")
    original_downloads: bool = Field(default=False, alias="originalDownloads")
    watermark: bool = Field(default=True, alias="watermark")
    event_expiry: bool = Field(default=False, alias="eventExpiry")
    expiry_date: str | None = Field(default=None, alias="expiryDate")


class EventCreate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    name: str = Field(..., min_length=1, max_length=255, description="Name of event")
    event_type: EventType = Field(default="Wedding", alias="eventType")
    date: str = Field(..., min_length=4, max_length=32, description="Event date YYYY-MM-DD")
    location: str = Field(default="Venue unspecified", max_length=255)
    description: str | None = Field(default=None, max_length=2000)
    cover_image: str | None = Field(
        default=None,
        alias="coverImage",
        description="Cover image URL or storage reference",
    )
    status: EventStatus = Field(default="Active")
    settings: EventSettingsSchema | None = Field(default=None)


class EventUpdate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    name: str | None = Field(default=None, min_length=1, max_length=255)
    event_type: EventType | None = Field(default=None, alias="eventType")
    date: str | None = Field(default=None, min_length=4, max_length=32)
    location: str | None = Field(default=None, max_length=255)
    description: str | None = Field(default=None, max_length=2000)
    cover_image: str | None = Field(default=None, alias="coverImage")
    status: EventStatus | None = Field(default=None)
    token: str | None = Field(default=None, alias="public_token")
    settings: EventSettingsSchema | None = Field(default=None)


class EventOut(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    token: str
    public_token: str
    name: str
    event_type: str = Field(..., alias="eventType")
    date: str
    event_date: str = Field(..., alias="eventDate")
    location: str
    description: str | None = None
    cover_image: str | None = Field(default=None, alias="coverImage")
    cover_photo_url: str | None = Field(default=None)
    status: str
    photo_count: int = Field(default=0, alias="photoCount")
    photos: int = 0
    gallery_views: int = Field(default=0, alias="galleryViews")
    searches: int = 0
    total_searches: int = Field(default=0, alias="total_searches")
    downloads: int = 0
    total_downloads: int = Field(default=0, alias="total_downloads")
    created_at: datetime = Field(..., alias="createdAt")
    settings: EventSettingsSchema


class DashboardSummaryOut(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    total_events: int = Field(default=0, alias="totalEvents")
    total_photos: int = Field(default=0, alias="totalPhotos")
    active_events: int = Field(default=0, alias="activeEvents")
    photo_searches: int = Field(default=0, alias="photoSearches")
    downloads: int = Field(default=0)
