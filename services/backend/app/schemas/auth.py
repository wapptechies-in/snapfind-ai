"""
Authentication schemas.

Status: IMPLEMENTED (Phase 2 + Onboarding Phase)
"""

from datetime import datetime
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    studio_name: str = Field(min_length=1, max_length=255)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    email: EmailStr
    studio_name: str
    display_name: str | None = None
    phone: str | None = None
    bio: str | None = None
    website: str | None = None
    location: str | None = None
    created_at: datetime
    subscription_tier: str = "free"
    subscription_status: str = "active"
    max_active_events: int = 2
    max_photos_per_event: int = 500
    onboarding_completed: bool = False
    email_notifications: bool = True
    guest_download_alerts: bool = True
    auto_watermark: bool = False

    # Role & Approval Architecture
    role: str = "photographer"
    approval_status: str = "pending"
    auth_provider: str = "email"
    avatar_url: str | None = None
    rejection_reason: str | None = None

    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class GoogleAuthRequest(BaseModel):
    credential: str = Field(..., description="Google ID Token or code from GIS")
    studio_name: str | None = Field(None, max_length=255)


class ApprovalStatusResponse(BaseModel):
    status: str
    email: str
    message: str
    rejection_reason: str | None = None


class AdminUserActionRequest(BaseModel):
    rejection_reason: str | None = None


class AdminRoleChangeRequest(BaseModel):
    role: str = Field(..., pattern="^(photographer|admin|super_admin)$")


# Aliases for consistent naming
LoginRequest = UserLogin
RegisterRequest = UserRegister
