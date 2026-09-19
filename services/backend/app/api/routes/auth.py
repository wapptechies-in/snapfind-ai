"""
Authentication routes: register, login, me.

Status: IMPLEMENTED (Phase 2)
"""

from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_photographer
from app.core.security import create_access_token, hash_password, verify_password
from app.db.session import get_db
from app.models.photographer import Photographer
from app.schemas.auth import TokenResponse, UserLogin, UserOut, UserRegister

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(
    user_in: UserRegister,
    db: Annotated[Session, Depends(get_db)],
) -> TokenResponse:
    """Register a new photographer account."""
    existing = db.scalar(
        select(Photographer).where(Photographer.email == user_in.email.lower())
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists.",
        )

    photographer = Photographer(
        email=user_in.email.lower(),
        studio_name=user_in.studio_name,
        hashed_password=hash_password(user_in.password),
    )
    db.add(photographer)
    db.commit()
    db.refresh(photographer)

    token = create_access_token(subject=photographer.id)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserOut.model_validate(photographer),
    )


@router.post("/login", response_model=TokenResponse)
def login(
    user_in: UserLogin,
    db: Annotated[Session, Depends(get_db)],
) -> TokenResponse:
    """Authenticate with email and password and return a JWT access token."""
    photographer = db.scalar(
        select(Photographer).where(Photographer.email == user_in.email.lower())
    )
    if not photographer or not verify_password(user_in.password, photographer.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = create_access_token(subject=photographer.id)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserOut.model_validate(photographer),
    )


@router.get("/me", response_model=UserOut)
def get_me(
    current_photographer: Annotated[Photographer, Depends(get_current_photographer)],
) -> UserOut:
    """Retrieve profile of the currently authenticated photographer."""
    return UserOut.model_validate(current_photographer)

