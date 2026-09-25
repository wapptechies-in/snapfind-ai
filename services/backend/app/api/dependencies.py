"""
FastAPI dependencies for route protection and user resolution.
Status: IMPLEMENTED (Phase 4)
"""

from typing import Annotated
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.photographer import Photographer

security = HTTPBearer(auto_error=False)


def get_current_photographer(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security)],
    db: Annotated[Session, Depends(get_db)],
) -> Photographer:
    """Dependency that verifies Bearer token and retrieves current Photographer."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not credentials or not credentials.credentials:
        raise credentials_exception

    payload = decode_access_token(credentials.credentials)
    if not payload:
        raise credentials_exception

    photographer_id = payload.get("sub")
    if not photographer_id:
        raise credentials_exception

    photographer = db.get(Photographer, photographer_id)
    if not photographer:
        raise credentials_exception

    # Enforce access approval gate
    if photographer.approval_status == "pending":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="ACCOUNT_PENDING: Your account is pending admin approval. You will be able to log in once approved.",
        )
    if photographer.approval_status == "rejected":
        reason = f" Reason: {photographer.rejection_reason}" if photographer.rejection_reason else ""
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"ACCOUNT_REJECTED: Your application was rejected.{reason}",
        )
    if photographer.approval_status == "suspended":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="ACCOUNT_SUSPENDED: Your account has been suspended. Please contact support.",
        )

    return photographer


def get_current_admin(
    photographer: Annotated[Photographer, Depends(get_current_photographer)],
) -> Photographer:
    """Requires role to be 'admin' or 'super_admin'."""
    if photographer.role not in ("admin", "super_admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="ADMIN_REQUIRED: Administrative privileges required.",
        )
    return photographer


def get_current_super_admin(
    photographer: Annotated[Photographer, Depends(get_current_photographer)],
) -> Photographer:
    """Requires role to be 'super_admin'."""
    if photographer.role != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="SUPERADMIN_REQUIRED: Super administrator privileges required.",
        )
    return photographer


def get_current_photographer_or_default(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security)],
    db: Annotated[Session, Depends(get_db)],
) -> Photographer:
    """
    Retrieves authenticated photographer if Bearer token present,
    otherwise falls back to default demo photographer for Phase 4 dev flow.
    """
    if credentials and credentials.credentials:
        payload = decode_access_token(credentials.credentials)
        if payload and payload.get("sub"):
            photographer = db.get(Photographer, payload.get("sub"))
            if photographer:
                return photographer

    # Fallback to default demo photographer
    default_p = db.scalar(
        select(Photographer).order_by(Photographer.created_at.asc())
    )
    if default_p:
        return default_p

    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="No default photographer available in database",
    )
