"""
Folders API routes: sub-folder management within events.
Status: IMPLEMENTED (Task 1)
"""

import logging
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_photographer
from app.db.session import get_db
from app.models.event import Event
from app.models.folder import Folder, generate_folder_id
from app.models.photo import Photo
from app.models.photographer import Photographer
from app.schemas.folder import FolderCreate, FolderOut, FolderUpdate

logger = logging.getLogger("snapfind.folders")
router = APIRouter(tags=["folders"])


def _resolve_event(event_id_or_token: str, db: Session) -> Event:
    """Find an event by its database ID or its public token."""
    event = db.scalar(
        select(Event).where(
            or_(
                Event.id == event_id_or_token,
                Event.public_token == event_id_or_token,
            )
        )
    )
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Event '{event_id_or_token}' not found",
        )
    return event


@router.get(
    "/events/{event_id}/folders",
    response_model=list[FolderOut],
)
def list_event_folders(
    event_id: str,
    db: Annotated[Session, Depends(get_db)],
) -> list[FolderOut]:
    """
    List all sub-folders within an event, including photo count per folder.
    """
    event = _resolve_event(event_id, db)

    folders = db.scalars(
        select(Folder)
        .where(Folder.event_id == event.id)
        .order_by(Folder.created_at.asc())
    ).all()

    result: list[FolderOut] = []
    for f in folders:
        photo_count = db.scalar(
            select(func.count(Photo.id))
            .where(Photo.folder_id == f.id)
            .where(Photo.upload_status != "failed")
        ) or 0

        result.append(
            FolderOut(
                id=f.id,
                eventId=f.event_id,
                name=f.name,
                photoCount=photo_count,
                createdAt=f.created_at,
            )
        )

    return result


@router.post(
    "/events/{event_id}/folders",
    response_model=FolderOut,
    status_code=status.HTTP_201_CREATED,
)
def create_event_folder(
    event_id: str,
    payload: FolderCreate,
    photographer: Annotated[Photographer, Depends(get_current_photographer)],
    db: Annotated[Session, Depends(get_db)],
) -> FolderOut:
    """
    Create a new sub-folder inside an event (e.g. 'Ceremony', 'Reception').
    """
    event = _resolve_event(event_id, db)
    if event.photographer_id != photographer.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to manage folders for this event.",
        )
    clean_name = payload.name.strip()
    if not clean_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Folder name cannot be empty",
        )

    # Check for existing folder with same name in this event
    existing = db.scalar(
        select(Folder).where(
            Folder.event_id == event.id,
            func.lower(Folder.name) == clean_name.lower(),
        )
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Folder '{clean_name}' already exists in this event",
        )

    folder = Folder(
        id=generate_folder_id(),
        event_id=event.id,
        name=clean_name,
    )
    db.add(folder)
    db.commit()
    db.refresh(folder)

    return FolderOut(
        id=folder.id,
        eventId=folder.event_id,
        name=folder.name,
        photoCount=0,
        createdAt=folder.created_at,
    )


@router.delete(
    "/events/{event_id}/folders/{folder_id}",
    status_code=status.HTTP_200_OK,
)
def delete_event_folder(
    event_id: str,
    folder_id: str,
    photographer: Annotated[Photographer, Depends(get_current_photographer)],
    db: Annotated[Session, Depends(get_db)],
) -> dict[str, str]:
    """
    Delete a sub-folder. Photos inside this folder will have their folder_id
    set to null (moved to root) rather than being deleted.
    """
    event = _resolve_event(event_id, db)
    if event.photographer_id != photographer.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to manage folders for this event.",
        )

    folder = db.scalar(
        select(Folder).where(
            Folder.id == folder_id,
            Folder.event_id == event.id,
        )
    )
    if not folder:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Folder '{folder_id}' not found in this event",
        )

    # Detach photos from this folder
    photos_in_folder = db.scalars(
        select(Photo).where(Photo.folder_id == folder.id)
    ).all()
    for p in photos_in_folder:
        p.folder_id = None

    db.delete(folder)
    db.commit()

    return {"ok": "true", "message": f"Folder '{folder.name}' deleted successfully"}

