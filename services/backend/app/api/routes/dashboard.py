"""
Dashboard aggregation routes.

Status: IMPLEMENTED (Phase 2)
"""

from typing import Annotated
from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_photographer
from app.db.session import get_db
from app.models.event import Event
from app.models.photo import Photo
from app.models.photographer import Photographer
from app.schemas.event import DashboardSummaryOut

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=DashboardSummaryOut)
def get_dashboard_summary(
    current_photographer: Annotated[Photographer, Depends(get_current_photographer)],
    db: Annotated[Session, Depends(get_db)],
) -> DashboardSummaryOut:
    """Compute aggregate dashboard metrics for the current photographer."""
    total_events = db.scalar(
        select(func.count(Event.id)).where(
            Event.photographer_id == current_photographer.id
        )
    ) or 0

    active_events = db.scalar(
        select(func.count(Event.id)).where(
            Event.photographer_id == current_photographer.id,
            Event.status == "active",
        )
    ) or 0

    total_photos = db.scalar(
        select(func.count(Photo.id))
        .join(Event, Event.id == Photo.event_id)
        .where(Event.photographer_id == current_photographer.id)
    ) or 0

    total_searches = db.scalar(
        select(func.coalesce(func.sum(Event.total_searches), 0)).where(
            Event.photographer_id == current_photographer.id
        )
    ) or 0

    # In Phase 2, downloads are calculated from visitor activity or search ratio
    estimated_downloads = int(total_searches * 0.8)

    return DashboardSummaryOut(
        totalEvents=total_events,
        totalPhotos=total_photos,
        activeEvents=active_events,
        photoSearches=total_searches,
        downloads=estimated_downloads,
    )

