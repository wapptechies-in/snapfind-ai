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
