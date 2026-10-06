"""
Celery Background Tasks for Photo Processing.
Handles derivative generation, AI face detection, vector embeddings, and job tracking.
Status: IMPLEMENTED (Phase 7)
"""

from datetime import datetime, timezone
import gc
import logging
import threading
from typing import Any
from celery.exceptions import MaxRetriesExceededError
from sqlalchemy import select

from app.db.session import SessionLocal
from app.models.photo import Photo
from app.models.processing_job import ProcessingJob
from app.services.ai.service import process_photo_for_faces
from app.services.storage import StorageService
from app.workers.celery_app import celery_app

logger = logging.getLogger("snapfind.tasks")

# Serializes heavy AI face detection across background threads on Render 512MB RAM tier
_FACE_INDEXING_LOCK = threading.Lock()

def process_photo_sync(photo_id: str, job_id: str | None = None) -> dict[str, Any]:
    """
    Directly processes a single photo without Celery dependency:
    1. Fetches photo record and updates status to 'processing'.
    2. Retrieves original image bytes from object storage.
    3. Generates web (1920px) and thumbnail (400px) image derivatives and marks photo uploaded.
    4. Executes AI face detection, quality filtering, and embeddings serialized under lock.
    5. Updates photo and processing job metrics in PostgreSQL.
    """
    logger.info(f"Starting direct processing for photo {photo_id} (job: {job_id})")
    with SessionLocal() as db:
        photo = db.get(Photo, photo_id)
        if not photo:
            logger.error(f"Photo {photo_id} not found in database.")
            return {"status": "error", "message": f"Photo {photo_id} not found"}

        photo.processing_status = "processing"
        event_id = photo.event_id
        storage_key = photo.original_storage_key or photo.storage_key

        if job_id:
            job = db.get(ProcessingJob, job_id)
            if job:
                if job.status in ("pending", "queued"):
                    job.status = "processing"
                if not job.started_at:
                    job.started_at = datetime.now(timezone.utc)
        db.commit()

    storage = StorageService()

    try:
        if not storage_key or not storage.provider.object_exists(storage_key):
            raise FileNotFoundError(f"Storage binary not found at key '{storage_key}' for photo {photo_id}")

        original_bytes = storage.provider.get_object_bytes(storage_key)

        derivs = storage.create_and_store_derivatives(
            event_id=event_id,
            photo_id=photo_id,
            original_bytes=original_bytes,
        )

        # Step 1: Save derivatives and mark photo uploaded immediately so client sees it
        with SessionLocal() as db:
            p = db.get(Photo, photo_id)
            if not p:
                raise ValueError(f"Photo {photo_id} missing during DB update")

            p.web_storage_key = derivs["web_storage_key"]
            p.web_image_key = derivs["web_storage_key"]
            p.thumbnail_storage_key = derivs["thumbnail_storage_key"]
            p.thumbnail_key = derivs["thumbnail_storage_key"]
            p.width = derivs["width"]
            p.height = derivs["height"]
            p.file_size = derivs["file_size"]
            p.checksum = derivs["checksum"]
            p.upload_status = "uploaded"
            db.commit()

        # Step 2: Serialized heavy AI face detection & pgvector embeddings
        proc_bytes = derivs.get("web_bytes") or original_bytes
        face_result = {"faces_detected": 0, "faces_embedded": 0, "faces_rejected": 0}
        try:
            with _FACE_INDEXING_LOCK:
                with SessionLocal() as db:
                    face_result = process_photo_for_faces(photo_id, db, image_bytes=proc_bytes)
                gc.collect()
        except Exception as face_err:
            logger.warning(f"Face indexing warning for photo {photo_id}: {face_err}")

        # Step 3: Complete processing job
        with SessionLocal() as db:
            p = db.get(Photo, photo_id)
            if p:
                p.processing_status = "completed"
            if job_id:
                j = db.get(ProcessingJob, job_id)
                if j:
                    j.processed_items += 1
                    if j.processed_items + j.failed_items >= j.total_items and j.total_items > 0:
                        j.status = "completed" if j.failed_items == 0 else ("failed" if j.processed_items == 0 else "completed")
                        j.completed_at = datetime.now(timezone.utc)
            db.commit()

        logger.info(
            f"Successfully processed photo {photo_id}: "
            f"{face_result.get('faces_embedded', 0)} faces indexed, "
            f"{face_result.get('faces_rejected', 0)} rejected"
        )
        return {
            "status": "completed",
            "photo_id": photo_id,
            "faces_detected": face_result.get("faces_detected", 0),
            "faces_embedded": face_result.get("faces_embedded", 0),
        }

    except Exception as exc:
        logger.error(f"Error direct-processing photo {photo_id}: {exc}", exc_info=True)
        with SessionLocal() as db:
            p = db.get(Photo, photo_id)
            if p:
                p.processing_status = "failed"
            if job_id:
                j = db.get(ProcessingJob, job_id)
                if j:
                    j.failed_items += 1
                    j.error_message = str(exc)
                    if j.processed_items + j.failed_items >= j.total_items and j.total_items > 0:
                        j.status = "failed" if j.processed_items == 0 else "completed"
                        j.completed_at = datetime.now(timezone.utc)
            db.commit()
        return {"status": "failed", "photo_id": photo_id, "error": str(exc)}


@celery_app.task(
    bind=True,
    max_retries=3,
    default_retry_delay=5,
    acks_late=True,
    name="app.workers.tasks.photo_tasks.process_single_photo_task",
)
def process_single_photo_task(
    self,
    photo_id: str,
    job_id: str | None = None,
) -> dict[str, Any]:
    """
    Asynchronously processes a single photo:
    1. Fetches photo record and updates status to 'processing'.
    2. Retrieves original image bytes from object storage (MinIO/S3).
    3. Generates web (1920px) and thumbnail (400px) image derivatives.
    4. Executes AI face detection, quality filtering, and pgvector embeddings.
    5. Updates photo and processing job metrics in PostgreSQL.
    """
    logger.info(f"Starting background processing for photo {photo_id} (job: {job_id}, attempt: {self.request.retries + 1})")

    with SessionLocal() as db:
        photo = db.get(Photo, photo_id)
        if not photo:
            logger.error(f"Photo {photo_id} not found in database.")
            return {"status": "error", "message": f"Photo {photo_id} not found"}

        photo.processing_status = "processing"
        event_id = photo.event_id
        storage_key = photo.original_storage_key or photo.storage_key

        if job_id:
            job = db.get(ProcessingJob, job_id)
            if job:
                if job.status in ("pending", "queued"):
                    job.status = "processing"
                if not job.started_at:
                    job.started_at = datetime.now(timezone.utc)
                job.celery_task_id = self.request.id
                job.attempt_count = self.request.retries + 1
        db.commit()

    storage = StorageService()

    try:
        if not storage_key or not storage.provider.object_exists(storage_key):
            raise FileNotFoundError(f"Storage binary not found at key '{storage_key}' for photo {photo_id}")

        # 1. Fetch original binary from storage
        original_bytes = storage.provider.get_object_bytes(storage_key)

        # 2. Generate web and thumbnail derivatives
        derivs = storage.create_and_store_derivatives(
            event_id=event_id,
            photo_id=photo_id,
            original_bytes=original_bytes,
        )

        # Step 1: Save derivatives and mark photo uploaded immediately
        with SessionLocal() as db:
            p = db.get(Photo, photo_id)
            if not p:
                raise ValueError(f"Photo {photo_id} missing during DB update")

            p.web_storage_key = derivs["web_storage_key"]
            p.web_image_key = derivs["web_storage_key"]
            p.thumbnail_storage_key = derivs["thumbnail_storage_key"]
            p.thumbnail_key = derivs["thumbnail_storage_key"]
            p.width = derivs["width"]
            p.height = derivs["height"]
            p.file_size = derivs["file_size"]
            p.checksum = derivs["checksum"]
            p.upload_status = "uploaded"
            db.commit()

        # Step 2: Serialized heavy AI face detection & pgvector embeddings
        proc_bytes = derivs.get("web_bytes") or original_bytes
        face_result = {"faces_detected": 0, "faces_embedded": 0, "faces_rejected": 0}
        try:
            with _FACE_INDEXING_LOCK:
                with SessionLocal() as db:
                    face_result = process_photo_for_faces(photo_id, db, image_bytes=proc_bytes)
                gc.collect()
        except Exception as face_err:
            logger.warning(f"Face indexing warning for photo {photo_id}: {face_err}")

        # Step 3: Complete processing job
        with SessionLocal() as db:
            p = db.get(Photo, photo_id)
            if p:
                p.processing_status = "completed"

            # Update Job counters if associated with a job
            if job_id:
                j = db.get(ProcessingJob, job_id)
                if j:
                    j.processed_items += 1
                    if j.processed_items + j.failed_items >= j.total_items and j.total_items > 0:
                        j.status = "completed" if j.failed_items == 0 else ("failed" if j.processed_items == 0 else "completed")
                        j.completed_at = datetime.now(timezone.utc)
            db.commit()

        logger.info(
            f"Successfully processed photo {photo_id}: "
            f"{face_result.get('faces_embedded', 0)} faces indexed, "
            f"{face_result.get('faces_rejected', 0)} rejected"
        )
        return {
            "status": "completed",
            "photo_id": photo_id,
            "faces_detected": face_result.get("faces_detected", 0),
            "faces_embedded": face_result.get("faces_embedded", 0),
        }

    except Exception as exc:
        from app.workers.celery_app import is_celery_broker_reachable

        # Determine if we should retry
        retries = getattr(getattr(self, "request", None), "retries", 0)
        max_retries = getattr(self, "max_retries", 3)
        if retries < max_retries and is_celery_broker_reachable():
            with SessionLocal() as db:
                if job_id:
                    j = db.get(ProcessingJob, job_id)
                    if j:
                        j.status = "retrying"
                        j.attempt_count = retries + 1
                        db.commit()
            raise self.retry(exc=exc)
        else:
            # Permanent failure after max retries
            logger.error(f"Exhausted retries for photo {photo_id}. Marking as failed.")
            with SessionLocal() as db:
                p = db.get(Photo, photo_id)
                if p:
                    p.processing_status = "failed"
                if job_id:
                    j = db.get(ProcessingJob, job_id)
                    if j:
                        j.failed_items += 1
                        j.error_message = str(exc)
                        j.attempt_count = self.request.retries + 1
                        if j.processed_items + j.failed_items >= j.total_items and j.total_items > 0:
                            j.status = "failed" if j.processed_items == 0 else "completed"
                            j.completed_at = datetime.now(timezone.utc)
                db.commit()

            return {"status": "failed", "photo_id": photo_id, "error": str(exc)}


@celery_app.task(
    bind=True,
    name="app.workers.tasks.photo_tasks.process_event_photos_task",
)
def process_event_photos_task(
    self,
    event_id: str,
    job_id: str | None = None,
    force_reprocess: bool = False,
) -> dict[str, Any]:
    """
    Dispatches background processing for all pending or unprocessed photos in an event.
    If force_reprocess is True, re-runs all photos in the event regardless of current status.
    """
    logger.info(f"Orchestrating event photo processing for event {event_id} (force: {force_reprocess})")

    with SessionLocal() as db:
        query = select(Photo).where(Photo.event_id == event_id)
        if not force_reprocess:
            query = query.where(Photo.processing_status != "completed")
        photos = db.scalars(query).all()
        photo_ids = [p.id for p in photos]

        if job_id:
            job = db.get(ProcessingJob, job_id)
            if job:
                job.total_items = len(photo_ids)
                job.processed_items = 0
                job.failed_items = 0
                job.status = "processing" if photo_ids else "completed"
                if not photo_ids:
                    job.completed_at = datetime.now(timezone.utc)
                db.commit()

    if not photo_ids:
        logger.info(f"No photos to process for event {event_id}.")
        return {"event_id": event_id, "dispatched": 0}

    from app.workers.celery_app import is_celery_broker_reachable

    logger.info(f"Dispatching {len(photo_ids)} photo tasks for event {event_id}...")
    for pid in photo_ids:
        if is_celery_broker_reachable():
            try:
                process_single_photo_task.delay(photo_id=pid, job_id=job_id)
            except Exception as e:
                logger.warning(f"Could not delay photo {pid}: {e}. Processing synchronously.")
                process_photo_sync(photo_id=pid, job_id=job_id)
        else:
            process_photo_sync(photo_id=pid, job_id=job_id)

    return {"event_id": event_id, "dispatched": len(photo_ids)}


@celery_app.task(
    bind=True,
    name="app.workers.tasks.photo_tasks.retry_failed_photos_task",
)
def retry_failed_photos_task(
    self,
    event_id: str,
    job_id: str | None = None,
) -> dict[str, Any]:
    """
    Finds photos that failed processing in an event and re-enqueues them.
    """
    logger.info(f"Retrying failed photos for event {event_id}")

    with SessionLocal() as db:
        photos = db.scalars(
            select(Photo).where(
                Photo.event_id == event_id,
                Photo.processing_status == "failed",
            )
        ).all()
        photo_ids = [p.id for p in photos]

        if job_id:
            job = db.get(ProcessingJob, job_id)
            if job:
                job.total_items = len(photo_ids)
                job.processed_items = 0
                job.failed_items = 0
                job.status = "processing" if photo_ids else "completed"
                if not photo_ids:
                    job.completed_at = datetime.now(timezone.utc)
                db.commit()

    if not photo_ids:
        logger.info(f"No failed photos to retry for event {event_id}.")
        return {"event_id": event_id, "dispatched": 0}

    from app.workers.celery_app import is_celery_broker_reachable
    for pid in photo_ids:
        if is_celery_broker_reachable():
            try:
                process_single_photo_task.delay(photo_id=pid, job_id=job_id)
            except Exception as e:
                logger.warning(f"Could not delay photo {pid}: {e}. Processing synchronously.")
                process_photo_sync(photo_id=pid, job_id=job_id)
        else:
            process_photo_sync(photo_id=pid, job_id=job_id)

    return {"event_id": event_id, "dispatched": len(photo_ids)}

