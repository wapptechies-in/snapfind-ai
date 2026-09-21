"""
Upload session schemas: Pydantic models for desktop batch upload sessions and batch-init.
Status: IMPLEMENTED (Phase 8)
"""

from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class UploadSessionCreate(BaseModel):
    event_id: str = Field(alias="eventId")
    name: str = "Desktop Upload Session"
    total_files: int = Field(default=0, alias="totalFiles")
    total_bytes: int = Field(default=0, alias="totalBytes")

    model_config = ConfigDict(populate_by_name=True)


class UploadSessionItemOut(BaseModel):
    id: str
    upload_session_id: str = Field(alias="uploadSessionId")
    photo_id: str | None = Field(default=None, alias="photoId")
    filename: str
    file_size: int = Field(alias="fileSize")
    checksum: str | None = None
    status: str
    error_message: str | None = Field(default=None, alias="errorMessage")
    retry_count: int = Field(default=0, alias="retryCount")
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class UploadSessionOut(BaseModel):
    id: str
    event_id: str = Field(alias="eventId")
    photographer_id: str = Field(alias="photographerId")
    name: str
    status: str
    total_files: int = Field(default=0, alias="totalFiles")
    uploaded_files: int = Field(default=0, alias="uploadedFiles")
    failed_files: int = Field(default=0, alias="failedFiles")
    total_bytes: int = Field(default=0, alias="totalBytes")
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")
    items: list[UploadSessionItemOut] = []

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class BatchUploadInitItem(BaseModel):
    filename: str
    file_size: int = Field(alias="fileSize")
    mime_type: str = Field(default="image/jpeg", alias="mimeType")
    checksum: str | None = None

    model_config = ConfigDict(populate_by_name=True)


class BatchUploadInitRequest(BaseModel):
    items: list[BatchUploadInitItem]

    model_config = ConfigDict(populate_by_name=True)


class BatchUploadInitItemResponse(BaseModel):
    photo_id: str = Field(alias="photoId")
    item_id: str = Field(alias="itemId")
    filename: str
    upload_url: str = Field(alias="uploadUrl")
    storage_key: str = Field(alias="storageKey")
    headers: dict[str, str] = {}
    expires_in: int = Field(default=3600, alias="expiresIn")

    model_config = ConfigDict(populate_by_name=True)


class BatchUploadInitResponse(BaseModel):
    upload_session_id: str = Field(alias="uploadSessionId")
    items: list[BatchUploadInitItemResponse]

    model_config = ConfigDict(populate_by_name=True)
