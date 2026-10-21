"""
Photo Pydantic schemas: validation and response serialization.
Status: IMPLEMENTED (Phase 6)
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
    folder_id: str | None = Field(default=None, alias="folderId")
    is_public_gallery: bool | None = Field(default=None, alias="isPublicGallery")


class UploadInitRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    filename: str = Field(..., min_length=1, max_length=255)
    file_size: int = Field(..., ge=1, alias="fileSize")
    mime_type: str = Field(default="image/jpeg", alias="mimeType")
    checksum: str | None = None
    folder_id: str | None = Field(default=None, alias="folderId")
    is_public_gallery: bool | None = Field(default=None, alias="isPublicGallery")


class UploadInitResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    photo_id: str = Field(..., alias="photoId")
    upload_url: str = Field(..., alias="uploadUrl")
    storage_key: str = Field(..., alias="storageKey")
    headers: dict[str, str] = Field(default_factory=dict)
    expires_in: int = Field(default=3600, alias="expiresIn")


class UploadCompleteRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    photo_id: str = Field(..., alias="photoId")
    width: int | None = None
    height: int | None = None
    checksum: str | None = None


class PhotoUrlResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    photo_id: str = Field(..., alias="photoId")
    url: str
    variant: str
    expires_in: int = Field(default=3600, alias="expiresIn")
    filename: str


class PhotoOut(BaseModel):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    id: str
    event_id: str = Field(..., alias="eventId")
    filename: str
    original_filename: str | None = Field(default=None, alias="originalFilename")
    url: str | None = None
    thumbnail_url: str | None = Field(default=None, alias="thumbnailUrl")
    storage_key: str | None = Field(default=None, alias="storageKey")
    original_storage_key: str | None = Field(default=None, alias="originalStorageKey")
    web_storage_key: str | None = Field(default=None, alias="webStorageKey")
    thumbnail_storage_key: str | None = Field(default=None, alias="thumbnailStorageKey")
    folder_id: str | None = Field(default=None, alias="folderId")
    folder_name: str | None = Field(default=None, alias="folderName")
    width: int | None = 1600
    height: int | None = 1067
    file_size: int | None = Field(default=None, alias="fileSize")
    mime_type: str | None = Field(default="image/jpeg", alias="mimeType")
    checksum: str | None = None
    upload_status: str = Field(default="uploaded", alias="uploadStatus")
    processing_status: str = Field(default="completed", alias="processingStatus")
    is_public_gallery: bool = Field(default=True, alias="isPublicGallery")
    created_at: datetime = Field(..., alias="uploadedAt")


class PhotoListOut(BaseModel):
    items: list[PhotoOut]
    total: int


class GalleryVisibilityUpdate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    is_public_gallery: bool = Field(..., alias="isPublicGallery")


class BulkGalleryVisibilityUpdate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    photo_ids: list[str] = Field(..., alias="photoIds")
    is_public_gallery: bool = Field(..., alias="isPublicGallery")
