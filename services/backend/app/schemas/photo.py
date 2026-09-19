"""
Photo Pydantic schemas: validation and response serialization.
Status: IMPLEMENTED (Phase 4)
"""

from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class PhotoCreate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    filename: str = Field(..., min_length=1, max_length=255)
    url: str | None = None
    thumbnail_url: str | None = Field(default=None, alias="thumbnailUrl")
    width: int | None = 1600
    height: int | None = 1067
    file_size: int | None = Field(default=None, alias="fileSize")
    mime_type: str | None = Field(default="image/jpeg", alias="mimeType")
    storage_key: str | None = Field(default=None, alias="storageKey")
    thumbnail_key: str | None = Field(default=None, alias="thumbnailKey")


class PhotoOut(BaseModel):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    id: str
    event_id: str = Field(..., alias="eventId")
    filename: str
    url: str | None = None
    thumbnail_url: str | None = Field(default=None, alias="thumbnailUrl")
    width: int | None = 1600
    height: int | None = 1067
    file_size: int | None = Field(default=None, alias="fileSize")
    mime_type: str | None = Field(default="image/jpeg", alias="mimeType")
    processing_status: str = Field(default="completed", alias="processingStatus")
    created_at: datetime = Field(..., alias="uploadedAt")


class PhotoListOut(BaseModel):
    items: list[PhotoOut]
    total: int
