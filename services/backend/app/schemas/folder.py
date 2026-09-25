"""
Folder Pydantic schemas: validation and response serialization.
Status: IMPLEMENTED (Task 1)
"""

from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class FolderCreate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    name: str = Field(..., min_length=1, max_length=255, description="Folder name (e.g. Ceremony)")


class FolderUpdate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    name: str = Field(..., min_length=1, max_length=255, description="New folder name")


class FolderOut(BaseModel):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    id: str
    event_id: str = Field(..., alias="eventId")
    name: str
    photo_count: int = Field(default=0, alias="photoCount")
    created_at: datetime = Field(..., alias="createdAt")

