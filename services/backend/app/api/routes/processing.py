"""
Processing API routes: event-level processing controls, status polling, and job management.
Status: IMPLEMENTED (Phase 7)
"""

from datetime import datetime, timezone
import logging
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_photographer_or_default
from app.db.session import get_db
from app.models.event import Event
from app.models.photo import Photo
from app.models.photographer import Photographer
from app.models.processing_job import ProcessingJob
from app.schemas.processing import (
    ProcessingActionResponse,
    ProcessingJobOut,
    ProcessingStageOut,
    ProcessingStatusResponse,
)
from app.workers.celery_app import celery_app, is_celery_broker_reachable
from app.workers.tasks.photo_tasks import (
    process_event_photos_task,
    retry_failed_photos_task,
)

logger = logging.getLogger("snapfind.processing")
router = APIRouter(tags=["processing"])


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
    "/events/{event_id}/processing",
    response_model=ProcessingStatusResponse,
)
def get_event_processing_status(
    event_id: str,
    photographer: Annotated[Photographer, Depends(get_current_photographer_or_default)],
    db: Annotated[Session, Depends(get_db)],
) -> ProcessingStatusResponse:
    """
    Returns live processing statistics, stage breakdown, and recent jobs for an event.
    Designed for 2.5s polling from the frontend.
    """
    event = _resolve_event(event_id, db)

    # 1. Photo status counts
    total_photos = db.scalar(
        select(func.count(Photo.id)).where(Photo.event_id == event.id)
    ) or 0

    completed_photos = db.scalar(
        select(func.count(Photo.id)).where(
            Photo.event_id == event.id,
            Photo.processing_status == "completed",
        )
    ) or 0

    failed_photos = db.scalar(
        select(func.count(Photo.id)).where(
            Photo.event_id == event.id,
            Photo.processing_status == "failed",
        )
    ) or 0

    queued_or_processing = db.scalar(
        select(func.count(Photo.id)).where(
            Photo.event_id == event.id,
            Photo.processing_status.in_(["queued", "processing"]),
        )
    ) or 0

    remaining = total_photos - completed_photos
    if remaining < 0:
        remaining = 0

    progress_percent = (
        int((completed_photos / total_photos) * 100) if total_photos > 0 else 100
    )

    # 2. Check active or latest job
    recent_jobs = db.scalars(
        select(ProcessingJob)
        .where(ProcessingJob.event_id == event.id)
        .order_by(ProcessingJob.created_at.desc())
        .limit(10)
    ).all()

    active_job = next(
        (j for j in recent_jobs if j.status in ("queued", "processing", "retrying")),
        None,
    )

    # 3. Derive overall status
    if active_job or queued_or_processing > 0:
        overall_status = "processing"
    elif total_photos == 0:
        overall_status = "idle"
    elif completed_photos == total_photos:
        overall_status = "completed"
    elif failed_photos > 0 and remaining == failed_photos:
        overall_status = "failed"
    else:
        overall_status = "idle"

    # 4. Determine stage states
    is_active = overall_status == "processing"
    is_done = overall_status == "completed"
    is_err = overall_status == "failed"

    if is_done:
        stages = [
            ProcessingStageOut(name="Derivative Generation", status="Completed", detail="Web & thumbnail resized"),
            ProcessingStageOut(name="Face Detection & Alignment", status="Completed", detail="InsightFace buffalo_s"),
            ProcessingStageOut(name="512-d Face Embedding", status="Completed", detail="ArcFace vector extraction"),
            ProcessingStageOut(name="pgvector Search Indexing", status="Completed", detail="PostgreSQL HNSW index updated"),
        ]
        current_stage = "Completed"
    elif is_active:
        stages = [
            ProcessingStageOut(name="Derivative Generation", status="Completed" if completed_photos > 0 else "Processing", detail="Creating web & thumbnail variants"),
            ProcessingStageOut(name="Face Detection & Alignment", status="Processing", detail="Extracting landmarks and bounding boxes"),
            ProcessingStageOut(name="512-d Face Embedding", status="Processing", detail="Computing normalized face vectors"),
            ProcessingStageOut(name="pgvector Search Indexing", status="Waiting", detail="Committing to PostgreSQL vector store"),
        ]
        current_stage = "AI Face Detection & Embedding"
    elif is_err:
        stages = [
            ProcessingStageOut(name="Derivative Generation", status="Completed", detail="Image variants created"),
            ProcessingStageOut(name="Face Detection & Alignment", status="Failed", detail=f"{failed_photos} photos encountered errors"),
            ProcessingStageOut(name="512-d Face Embedding", status="Failed", detail="Pipeline halted with failures"),
            ProcessingStageOut(name="pgvector Search Indexing", status="Waiting", detail="Waiting for retry"),
        ]
        current_stage = "Failed"
    else:
        stages = [
            ProcessingStageOut(name="Derivative Generation", status="Waiting", detail="Web & thumbnail generator"),
            ProcessingStageOut(name="Face Detection & Alignment", status="Waiting", detail="InsightFace buffalo_s"),
            ProcessingStageOut(name="512-d Face Embedding", status="Waiting", detail="ArcFace normalized embeddings"),
            ProcessingStageOut(name="pgvector Search Indexing", status="Waiting", detail="PostgreSQL vector store"),
        ]
        current_stage = "Idle"

    return ProcessingStatusResponse(
        eventId=event.id,
        status=overall_status,
        totalPhotos=total_photos,
        processed=completed_photos,
        remaining=remaining,
        failed=failed_photos,
        progressPercent=progress_percent,
        currentStage=current_stage,
        stages=stages,
        currentJobId=active_job.id if active_job else (recent_jobs[0].id if recent_jobs else None),
        activeJobs=[ProcessingJobOut.model_validate(j) for j in recent_jobs],
    )


@router.post(
    "/events/{event_id}/processing/start",
    response_model=ProcessingActionResponse,
)
def start_event_processing(
    event_id: str,
    photographer: Annotated[Photographer, Depends(get_current_photographer_or_default)],
    db: Annotated[Session, Depends(get_db)],
) -> ProcessingActionResponse:
    """
    Triggers background Celery processing for all pending or un-indexed photos in the event.
    """
    event = _resolve_event(event_id, db)

    unprocessed_count = db.scalar(
        select(func.count(Photo.id)).where(
            Photo.event_id == event.id,
            Photo.processing_status != "completed",
        )
    ) or 0

    if unprocessed_count == 0:
        return ProcessingActionResponse(
            success=True,
            message="All photos in this event are already processed.",
            dispatchedCount=0,
        )

    job = ProcessingJob(
        event_id=event.id,
        job_type="event_batch",
        status="queued",
        total_items=unprocessed_count,
        processed_items=0,
        failed_items=0,
    )
    db.add(job)
    db.commit()

    from app.workers.celery_app import is_celery_broker_reachable

    if is_celery_broker_reachable():
        try:
            task = process_event_photos_task.delay(
                event_id=event.id, job_id=job.id, force_reprocess=False
            )
            job.celery_task_id = task.id
            db.commit()
        except Exception as celery_err:
            logger.warning(f"Could not dispatch via Celery broker: {celery_err}. Executing task directly.")
            process_event_photos_task(
                event_id=event.id, job_id=job.id, force_reprocess=False
            )
    else:
        logger.info(f"Celery broker offline. Processing event photos directly.")
        process_event_photos_task(
            event_id=event.id, job_id=job.id, force_reprocess=False
        )

    return ProcessingActionResponse(
        success=True,
        message=f"Dispatched background processing for {unprocessed_count} photos.",
        jobId=job.id,
        dispatchedCount=unprocessed_count,
    )


@router.post(
    "/events/{event_id}/processing/reprocess",
    response_model=ProcessingActionResponse,
)
def reprocess_event_photos(
    event_id: str,
    photographer: Annotated[Photographer, Depends(get_current_photographer_or_default)],
    db: Annotated[Session, Depends(get_db)],
) -> ProcessingActionResponse:
    """
    Forces reprocessing of ALL photos in the event:
    Regenerates derivatives, re-detects faces, re-embeds vectors, and clears previous faces.
    """
    event = _resolve_event(event_id, db)

    total_photos = db.scalar(
        select(func.count(Photo.id)).where(Photo.event_id == event.id)
    ) or 0

    if total_photos == 0:
        return ProcessingActionResponse(
            success=True,
            message="No photos to reprocess in this event.",
            dispatchedCount=0,
        )

    job = ProcessingJob(
        event_id=event.id,
        job_type="reprocess_all",
        status="queued",
        total_items=total_photos,
        processed_items=0,
        failed_items=0,
    )
    db.add(job)
    db.commit()

    from app.workers.celery_app import is_celery_broker_reachable

    if is_celery_broker_reachable():
        try:
            task = process_event_photos_task.delay(
                event_id=event.id, job_id=job.id, force_reprocess=True
            )
            job.celery_task_id = task.id
            db.commit()
        except Exception as celery_err:
            logger.warning(f"Could not dispatch via Celery broker: {celery_err}. Executing task directly.")
            process_event_photos_task(
                event_id=event.id, job_id=job.id, force_reprocess=True
            )
    else:
        logger.info("Celery broker offline. Reprocessing event photos directly.")
        process_event_photos_task(
            event_id=event.id, job_id=job.id, force_reprocess=True
        )

    return ProcessingActionResponse(
        success=True,
        message=f"Reprocessing started for all {total_photos} photos.",
        jobId=job.id,
        dispatchedCount=total_photos,
    )


@router.post(
    "/events/{event_id}/processing/retry-failed",
    response_model=ProcessingActionResponse,
)
def retry_failed_photos(
    event_id: str,
    photographer: Annotated[Photographer, Depends(get_current_photographer_or_default)],
    db: Annotated[Session, Depends(get_db)],
) -> ProcessingActionResponse:
    """
    Retries processing only for photos currently in 'failed' status.
    """
    event = _resolve_event(event_id, db)

    failed_count = db.scalar(
        select(func.count(Photo.id)).where(
            Photo.event_id == event.id,
            Photo.processing_status == "failed",
        )
    ) or 0

    if failed_count == 0:
        return ProcessingActionResponse(
            success=True,
            message="No failed photos found to retry.",
            dispatchedCount=0,
        )

    job = ProcessingJob(
        event_id=event.id,
        job_type="retry_failed",
        status="queued",
        total_items=failed_count,
        processed_items=0,
        failed_items=0,
    )
    db.add(job)
    db.commit()

    if is_celery_broker_reachable():
        try:
            task = retry_failed_photos_task.delay(event_id=event.id, job_id=job.id)
            job.celery_task_id = task.id
            db.commit()
        except Exception as celery_err:
            logger.warning(f"Could not dispatch via Celery broker: {celery_err}. Executing task directly.")
            retry_failed_photos_task(event_id=event.id, job_id=job.id)
    else:
        logger.info("Celery broker offline. Retrying failed photos directly.")
        retry_failed_photos_task(event_id=event.id, job_id=job.id)

    return ProcessingActionResponse(
        success=True,
        message=f"Retrying processing for {failed_count} failed photos.",
        jobId=job.id,
        dispatchedCount=failed_count,
    )


@router.post(
    "/events/{event_id}/processing/cancel",
    response_model=ProcessingActionResponse,
)
def cancel_event_processing(
    event_id: str,
    photographer: Annotated[Photographer, Depends(get_current_photographer_or_default)],
    db: Annotated[Session, Depends(get_db)],
) -> ProcessingActionResponse:
    """
    Cancels active processing jobs for the event and revokes Celery tasks.
    """
    event = _resolve_event(event_id, db)

    active_jobs = db.scalars(
        select(ProcessingJob).where(
            ProcessingJob.event_id == event.id,
            ProcessingJob.status.in_(["pending", "queued", "processing", "retrying"]),
        )
    ).all()

    cancelled_count = 0
    now = datetime.now(timezone.utc)

    for job in active_jobs:
        if job.celery_task_id:
            try:
                celery_app.control.revoke(job.celery_task_id, terminate=True)
            except Exception as e:
                logger.warning(f"Could not revoke Celery task {job.celery_task_id}: {e}")
        job.status = "cancelled"
        job.completed_at = now
        cancelled_count += 1

    # Reset in-flight photos to pending
    photos = db.scalars(
        select(Photo).where(
            Photo.event_id == event.id,
            Photo.processing_status.in_(["queued", "processing"]),
        )
    ).all()
    for p in photos:
        p.processing_status = "pending"

    db.commit()

    return ProcessingActionResponse(
        success=True,
        message=f"Cancelled {cancelled_count} active processing job(s).",
        dispatchedCount=cancelled_count,
    )

