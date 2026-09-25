"""
Admin management routes: review pending applicants, approve, reject, suspend, and manage roles.
Status: IMPLEMENTED (Access Approval Architecture)
"""

from datetime import datetime, timezone
from typing import Annotated, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_admin, get_current_super_admin
from app.db.session import get_db
from app.models.photographer import Photographer
from app.schemas.auth import AdminRoleChangeRequest, AdminUserActionRequest, UserOut

router = APIRouter(prefix="/admin", tags=["admin"])


class AdminSummaryResponse(BaseModel):
    total_users: int
    pending_approvals: int
    approved_users: int
    rejected_users: int
    suspended_users: int


class AdminUserListResponse(BaseModel):
    total: int
    items: list[UserOut]
    summary: AdminSummaryResponse


@router.get("/summary", response_model=AdminSummaryResponse)
def get_admin_summary(
    current_admin: Annotated[Photographer, Depends(get_current_admin)],
    db: Annotated[Session, Depends(get_db)],
) -> AdminSummaryResponse:
    """Retrieve high-level access statistics across all studio accounts."""
    total = db.scalar(select(func.count(Photographer.id))) or 0
    pending = db.scalar(select(func.count(Photographer.id)).where(Photographer.approval_status == "pending")) or 0
    approved = db.scalar(select(func.count(Photographer.id)).where(Photographer.approval_status == "approved")) or 0
    rejected = db.scalar(select(func.count(Photographer.id)).where(Photographer.approval_status == "rejected")) or 0
    suspended = db.scalar(select(func.count(Photographer.id)).where(Photographer.approval_status == "suspended")) or 0

    return AdminSummaryResponse(
        total_users=total,
        pending_approvals=pending,
        approved_users=approved,
        rejected_users=rejected,
        suspended_users=suspended,
    )


@router.get("/users", response_model=AdminUserListResponse)
def list_users(
    current_admin: Annotated[Photographer, Depends(get_current_admin)],
    db: Annotated[Session, Depends(get_db)],
    approval_status: Annotated[str | None, Query(alias="status")] = None,
    role: Annotated[str | None, Query()] = None,
    search: Annotated[str | None, Query()] = None,
    page: Annotated[int, Query(ge=1)] = 1,
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
) -> AdminUserListResponse:
    """List studio accounts with approval status filter and keyword search."""
    query = select(Photographer)

    if approval_status and approval_status.lower() != "all":
        query = query.where(Photographer.approval_status == approval_status.lower())

    if role and role.lower() != "all":
        query = query.where(Photographer.role == role.lower())

    if search:
        search_term = f"%{search.strip().lower()}%"
        query = query.where(
            or_(
                Photographer.email.ilike(search_term),
                Photographer.studio_name.ilike(search_term),
                Photographer.display_name.ilike(search_term),
            )
        )

    # Summary counts
    total = db.scalar(select(func.count(Photographer.id))) or 0
    pending = db.scalar(select(func.count(Photographer.id)).where(Photographer.approval_status == "pending")) or 0
    approved = db.scalar(select(func.count(Photographer.id)).where(Photographer.approval_status == "approved")) or 0
    rejected = db.scalar(select(func.count(Photographer.id)).where(Photographer.approval_status == "rejected")) or 0
    suspended = db.scalar(select(func.count(Photographer.id)).where(Photographer.approval_status == "suspended")) or 0

    # Count matching items
    count_stmt = select(func.count()).select_from(query.subquery())
    filtered_total = db.scalar(count_stmt) or 0

    # Pagination & sorting: pending first, then by creation date
    offset = (page - 1) * limit
    results = db.scalars(
        query.order_by(
            Photographer.approval_status == "pending",
            Photographer.created_at.desc(),
        )
        .offset(offset)
        .limit(limit)
    ).all()

    return AdminUserListResponse(
        total=filtered_total,
        items=[UserOut.model_validate(p) for p in results],
        summary=AdminSummaryResponse(
            total_users=total,
            pending_approvals=pending,
            approved_users=approved,
            rejected_users=rejected,
            suspended_users=suspended,
        ),
    )


@router.post("/users/{photographer_id}/approve", response_model=UserOut)
def approve_user(
    photographer_id: str,
    current_admin: Annotated[Photographer, Depends(get_current_admin)],
    db: Annotated[Session, Depends(get_db)],
) -> UserOut:
    """Approve a studio registration, enabling login and platform access."""
    p = db.get(Photographer, photographer_id)
    if not p:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    p.approval_status = "approved"
    p.approved_by = current_admin.id
    p.approved_at = datetime.now(timezone.utc)
    p.rejection_reason = None
    db.commit()
    db.refresh(p)

    return UserOut.model_validate(p)


@router.post("/users/{photographer_id}/reject", response_model=UserOut)
def reject_user(
    photographer_id: str,
    body: AdminUserActionRequest,
    current_admin: Annotated[Photographer, Depends(get_current_admin)],
    db: Annotated[Session, Depends(get_db)],
) -> UserOut:
    """Reject a studio registration request with an optional reason."""
    p = db.get(Photographer, photographer_id)
    if not p:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Protect super_admins from accidental rejection
    if p.role == "super_admin":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Super administrator accounts cannot be rejected.",
        )

    p.approval_status = "rejected"
    p.rejection_reason = body.rejection_reason
    db.commit()
    db.refresh(p)

    return UserOut.model_validate(p)


@router.post("/users/{photographer_id}/suspend", response_model=UserOut)
def suspend_user(
    photographer_id: str,
    current_admin: Annotated[Photographer, Depends(get_current_admin)],
    db: Annotated[Session, Depends(get_db)],
) -> UserOut:
    """Suspend an active studio account, immediately revoking access."""
    p = db.get(Photographer, photographer_id)
    if not p:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Protect super_admins from accidental suspension
    if p.role == "super_admin":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Super administrator accounts cannot be suspended.",
        )

    p.approval_status = "suspended"
    db.commit()
    db.refresh(p)

    return UserOut.model_validate(p)


@router.post("/users/{photographer_id}/role", response_model=UserOut)
def update_user_role(
    photographer_id: str,
    body: AdminRoleChangeRequest,
    current_super_admin: Annotated[Photographer, Depends(get_current_super_admin)],
    db: Annotated[Session, Depends(get_db)],
) -> UserOut:
    """Change user role (super_admin only)."""
    p = db.get(Photographer, photographer_id)
    if not p:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    p.role = body.role
    db.commit()
    db.refresh(p)

    return UserOut.model_validate(p)
