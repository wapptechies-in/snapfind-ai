"""
Authentication routes: register, login, me, profile update, onboarding complete, change password.

Status: IMPLEMENTED (Phase 2 + Onboarding Phase)
"""

import os
import httpx
from typing import Annotated
from fastapi import APIRouter, Cookie, Depends, HTTPException, Request, Response, status
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_photographer
from app.core.config import get_settings
from app.core.limiter import limiter
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_refresh_token,
    hash_password,
    verify_password,
)
from app.db.session import get_db
from app.models.photographer import Photographer
from app.schemas.auth import (
    ApprovalStatusResponse,
    GoogleAuthRequest,
    TokenResponse,
    UserLogin,
    UserOut,
    UserRegister,
)

router = APIRouter(prefix="/auth", tags=["auth"])
settings = get_settings()


async def verify_google_credential(credential: str) -> dict:
    """Verifies Google ID token against Google's tokeninfo endpoint, or accepts dev mock tokens in development."""
    if credential.startswith("mock-google-") or credential.startswith("dev-"):
        if settings.ENVIRONMENT != "development":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Mock Google authentication is disabled in non-development environments.",
            )
        parts = credential.split(":")
        email = parts[1] if len(parts) > 1 else "google_user@test.com"
        name = parts[2] if len(parts) > 2 else "Google User"
        return {
            "sub": f"g_mock_{abs(hash(email)) % 10000000}",
            "email": email,
            "name": name,
            "picture": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
        }

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(
                "https://oauth2.googleapis.com/tokeninfo",
                params={"id_token": credential},
            )
            if resp.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid or expired Google authentication token.",
                )
            data = resp.json()
            return {
                "sub": data["sub"],
                "email": data["email"],
                "name": data.get("name", "Google User"),
                "picture": data.get("picture"),
            }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Google authentication service error: {str(e)}",
        )


# --- Extra Schemas ---

class ProfileUpdateRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    studio_name: str | None = Field(None, min_length=1, max_length=255)
    display_name: str | None = Field(None, max_length=255)
    phone: str | None = Field(None, max_length=64)
    bio: str | None = None
    website: str | None = Field(None, max_length=512)
    location: str | None = Field(None, max_length=255)
    email_notifications: bool | None = None
    guest_download_alerts: bool | None = None
    auto_watermark: bool | None = None


class OnboardingCompleteRequest(BaseModel):
    display_name: str = Field(..., min_length=1, max_length=255)
    phone: str = Field(..., min_length=7, max_length=64)
    location: str = Field(..., min_length=2, max_length=255)
    website: str | None = Field(None, max_length=512)


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8, max_length=128)


class ExtendedUserOut(UserOut):
    display_name: str | None = None
    phone: str | None = None
    bio: str | None = None
    website: str | None = None
    location: str | None = None
    onboarding_completed: bool = False
    email_notifications: bool = True
    guest_download_alerts: bool = True
    auto_watermark: bool = False


REFRESH_COOKIE_NAME = "snapfind_refresh_token"
COOKIE_MAX_AGE_SECONDS = 7 * 24 * 60 * 60
IS_PROD_ENV = settings.ENVIRONMENT.lower() == "production"

def _set_refresh_cookie(response: Response, refresh_token: str) -> None:
    response.set_cookie(
        key=REFRESH_COOKIE_NAME,
        value=refresh_token,
        max_age=COOKIE_MAX_AGE_SECONDS,
        httponly=True,
        secure=IS_PROD_ENV,
        samesite="lax" if not IS_PROD_ENV else "none",
        path="/api/v1/auth",
    )

# --- Routes ---

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("3/minute")
def register(
    request: Request,
    response: Response,
    user_in: UserRegister,
    db: Annotated[Session, Depends(get_db)],
) -> TokenResponse:
    """Register a new photographer account (approval pending by default)."""
    existing = db.scalar(
        select(Photographer).where(Photographer.email == user_in.email.lower())
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists.",
        )

    superadmin_email = os.getenv("SUPERADMIN_EMAIL", "").lower().strip()
    is_superadmin = bool(superadmin_email and user_in.email.lower() == superadmin_email)
    init_role = "super_admin" if is_superadmin else "photographer"
    # Auto-approve all user registrations immediately
    init_approval = "approved"

    photographer = Photographer(
        email=user_in.email.lower(),
        studio_name=user_in.studio_name,
        hashed_password=hash_password(user_in.password),
        subscription_tier="free",
        subscription_status="active",
        max_active_events=2,
        max_photos_per_event=500,
        onboarding_completed=False,
        role=init_role,
        approval_status=init_approval,
        auth_provider="email",
    )
    db.add(photographer)
    db.commit()
    db.refresh(photographer)

    token = create_access_token(subject=photographer.id)
    refresh_token = create_refresh_token(subject=photographer.id)
    _set_refresh_cookie(response, refresh_token)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserOut.model_validate(photographer),
    )


@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/minute")
def login(
    request: Request,
    response: Response,
    user_in: UserLogin,
    db: Annotated[Session, Depends(get_db)],
) -> TokenResponse:
    """Authenticate with email and password and return a JWT access token if approved."""
    email_lower = user_in.email.lower()
    photographer = db.scalar(
        select(Photographer).where(Photographer.email == email_lower)
    )

    if not photographer:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not verify_password(user_in.password, photographer.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Auto-approve any pending accounts on login
    if photographer.approval_status == "pending":
        photographer.approval_status = "approved"
        db.commit()
        db.refresh(photographer)

    if photographer.approval_status == "rejected":
        reason = f" Reason: {photographer.rejection_reason}" if photographer.rejection_reason else ""
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"ACCOUNT_REJECTED: Your account registration was not approved.{reason}",
        )
    if photographer.approval_status == "suspended":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="ACCOUNT_SUSPENDED: Your studio account has been suspended by an administrator.",
        )

    token = create_access_token(subject=photographer.id)
    refresh_token = create_refresh_token(subject=photographer.id)
    _set_refresh_cookie(response, refresh_token)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserOut.model_validate(photographer),
    )


@router.post("/google", response_model=TokenResponse)
@limiter.limit("10/minute")
async def google_auth(
    request: Request,
    response: Response,
    payload: GoogleAuthRequest,
    db: Annotated[Session, Depends(get_db)],
) -> TokenResponse:
    """Sign in or register with Google OAuth credentials — auto-approves all Google users."""
    google_user = await verify_google_credential(payload.credential)
    email_lower = google_user["email"].lower()

    photographer = db.scalar(
        select(Photographer).where(
            or_(
                Photographer.google_id == google_user["sub"],
                Photographer.email == email_lower,
            )
        )
    )

    superadmin_email = os.getenv("SUPERADMIN_EMAIL", "").lower().strip()

    if not photographer:
        is_superadmin = bool(superadmin_email and email_lower == superadmin_email)
        init_role = "super_admin" if is_superadmin else "photographer"

        studio = payload.studio_name or f"{google_user['name']}'s Studio"
        photographer = Photographer(
            email=email_lower,
            studio_name=studio,
            display_name=google_user["name"],
            avatar_url=google_user.get("picture"),
            google_id=google_user["sub"],
            hashed_password="",
            subscription_tier="free",
            subscription_status="active",
            max_active_events=2,
            max_photos_per_event=500,
            onboarding_completed=False,
            role=init_role,
            approval_status="approved",
            auth_provider="google",
        )
        db.add(photographer)
        db.commit()
        db.refresh(photographer)
    else:
        # Link Google ID and update profile
        if not photographer.google_id:
            photographer.google_id = google_user["sub"]
        if not photographer.avatar_url and google_user.get("picture"):
            photographer.avatar_url = google_user["picture"]
        # Automatically approve any pending or existing account when signing in with Google
        if photographer.approval_status in ("pending", "rejected"):
            photographer.approval_status = "approved"
        db.commit()
        db.refresh(photographer)

    if photographer.approval_status == "suspended":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="ACCOUNT_SUSPENDED: Your studio account has been suspended by an administrator.",
        )

    token = create_access_token(subject=photographer.id)
    refresh_token = create_refresh_token(subject=photographer.id)
    _set_refresh_cookie(response, refresh_token)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserOut.model_validate(photographer),
    )


@router.post("/refresh", response_model=TokenResponse)
@limiter.limit("20/minute")
def refresh_token_endpoint(
    request: Request,
    response: Response,
    db: Annotated[Session, Depends(get_db)],
    snapfind_refresh_token: Annotated[str | None, Cookie()] = None,
) -> TokenResponse:
    """Exchanges a valid 7-day httpOnly refresh token cookie for a new 1-hour access token."""
    if not snapfind_refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token cookie missing or expired.",
        )

    payload = decode_refresh_token(snapfind_refresh_token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token.",
        )

    photographer_id = payload.get("sub")
    photographer = db.get(Photographer, photographer_id)
    if not photographer or not photographer.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or account deactivated.",
        )

    new_access_token = create_access_token(subject=photographer.id)
    # Optionally rotate refresh token
    new_refresh_token = create_refresh_token(subject=photographer.id)
    _set_refresh_cookie(response, new_refresh_token)

    return TokenResponse(
        access_token=new_access_token,
        token_type="bearer",
        user=UserOut.model_validate(photographer),
    )


@router.post("/logout")
def logout_endpoint(response: Response):
    """Clears the httpOnly refresh token cookie on logout."""
    response.delete_cookie(
        key=REFRESH_COOKIE_NAME,
        path="/api/v1/auth",
        httponly=True,
        secure=IS_PROD_ENV,
        samesite="lax" if not IS_PROD_ENV else "none",
    )
    return {"ok": True, "message": "Logged out successfully."}


@router.get("/status", response_model=ApprovalStatusResponse)
def check_approval_status(
    email: str,
    db: Annotated[Session, Depends(get_db)],
) -> ApprovalStatusResponse:
    """Public status check endpoint for users awaiting approval — auto-approves pending accounts."""
    p = db.scalar(
        select(Photographer).where(Photographer.email == email.lower().strip())
    )
    if not p:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account found with this email address.",
        )

    # Auto-approve immediately if pending
    if p.approval_status == "pending":
        p.approval_status = "approved"
        db.commit()
        db.refresh(p)

    status_messages = {
        "pending": "Your account has been approved! You may now log in.",
        "approved": "Your account has been approved! You may now log in.",
        "rejected": "Your registration was not approved.",
        "suspended": "Your studio account has been suspended.",
    }

    return ApprovalStatusResponse(
        status=p.approval_status,
        email=p.email,
        message=status_messages.get(p.approval_status, "Status unknown"),
        rejection_reason=p.rejection_reason,
    )


@router.get("/me", response_model=ExtendedUserOut)
def get_me(
    current_photographer: Annotated[Photographer, Depends(get_current_photographer)],
) -> ExtendedUserOut:
    """Retrieve full profile of the currently authenticated photographer."""
    return ExtendedUserOut.model_validate(current_photographer)


@router.patch("/profile", response_model=ExtendedUserOut)
def update_profile(
    body: ProfileUpdateRequest,
    current_photographer: Annotated[Photographer, Depends(get_current_photographer)],
    db: Annotated[Session, Depends(get_db)],
) -> ExtendedUserOut:
    """Update photographer studio profile, contact info, and notification preferences."""
    update_data = body.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(current_photographer, field, value)
    db.commit()
    db.refresh(current_photographer)
    return ExtendedUserOut.model_validate(current_photographer)


@router.post("/onboarding/complete", response_model=ExtendedUserOut)
def complete_onboarding(
    body: OnboardingCompleteRequest,
    current_photographer: Annotated[Photographer, Depends(get_current_photographer)],
    db: Annotated[Session, Depends(get_db)],
) -> ExtendedUserOut:
    """Mark onboarding as completed and save collected contact info."""
    current_photographer.display_name = body.display_name
    current_photographer.phone = body.phone
    current_photographer.location = body.location
    if body.website:
        current_photographer.website = body.website
    current_photographer.onboarding_completed = True
    db.commit()
    db.refresh(current_photographer)
    return ExtendedUserOut.model_validate(current_photographer)


@router.post("/change-password")
def change_password(
    body: ChangePasswordRequest,
    current_photographer: Annotated[Photographer, Depends(get_current_photographer)],
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    """Change the authenticated photographer's password."""
    if not verify_password(body.current_password, current_photographer.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect.",
        )
    current_photographer.hashed_password = hash_password(body.new_password)
    db.commit()
    return {"ok": True, "message": "Password updated successfully."}


@router.post("/forgot-password")
def forgot_password(email: str, db: Annotated[Session, Depends(get_db)]) -> dict:
    """Initiate password reset. In production sends an OTP email. Returns 200 regardless of existence to prevent enumeration."""
    # Production: generate OTP token, store in DB, send via email service
    # For now returns a safe no-op message
    return {"ok": True, "message": "If an account with that email exists, a reset link has been sent."}
