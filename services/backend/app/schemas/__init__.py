"""
Schemas module.
Status: IMPLEMENTED (Phase 4)
"""

from app.schemas.ai import (
    FaceMatchOut,
    FaceSearchResponse,
    ModelInfoOut,
    PhotoProcessResponse,
)
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserOut
from app.schemas.booking import BookingCreate, BookingOut, BookingUpdate
from app.schemas.common import MessageResponse, PaginatedResponse
from app.schemas.event import EventCreate, EventOut, EventSettingsSchema, EventUpdate
from app.schemas.health import HealthOut
from app.schemas.photo import PhotoCreate, PhotoListOut, PhotoOut
from app.schemas.processing import (
    ProcessingActionResponse,
    ProcessingJobOut,
    ProcessingStageOut,
    ProcessingStatusResponse,
)

from app.schemas.upload_session import (
    BatchUploadInitItem,
    BatchUploadInitItemResponse,
    BatchUploadInitRequest,
    BatchUploadInitResponse,
    UploadSessionCreate,
    UploadSessionItemOut,
    UploadSessionOut,
)

__all__ = [
    "LoginRequest",
    "RegisterRequest",
    "TokenResponse",
    "UserOut",
    "BookingCreate",
    "BookingOut",
    "BookingUpdate",
    "MessageResponse",
    "PaginatedResponse",
    "EventCreate",
    "EventOut",
    "EventSettingsSchema",
    "EventUpdate",
    "HealthOut",
    "PhotoCreate",
    "PhotoOut",
    "PhotoListOut",
    "FaceMatchOut",
    "FaceSearchResponse",
    "ModelInfoOut",
    "PhotoProcessResponse",
    "ProcessingActionResponse",
    "ProcessingJobOut",
    "ProcessingStageOut",
    "ProcessingStatusResponse",
    "UploadSessionCreate",
    "UploadSessionItemOut",
    "UploadSessionOut",
    "BatchUploadInitItem",
    "BatchUploadInitRequest",
    "BatchUploadInitItemResponse",
    "BatchUploadInitResponse",
]


