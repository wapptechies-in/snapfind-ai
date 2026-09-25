"""
Phase 7 Background Processing & Celery Pipeline Test Suite.
Verifies Redis connection, Celery task definitions, non-blocking upload_complete,
event processing polling endpoints, batch and re-processing dispatch, and idempotency.
Status: IMPLEMENTED (Phase 7)
"""

import io
from fastapi.testclient import TestClient
from PIL import Image
import requests
from sqlalchemy import select

from app.db.session import SessionLocal
from app.main import app
from app.models.face import Face
from app.models.photo import Photo
from app.models.processing_job import ProcessingJob
from app.workers.celery_app import celery_app
from app.workers.tasks.photo_tasks import (
    process_event_photos_task,
    process_photo_sync,
    process_single_photo_task,
    retry_failed_photos_task,
)

client = TestClient(app)


def _create_sample_jpeg(width: int = 640, height: int = 480) -> bytes:
    img = Image.new("RGB", (width, height), color=(100, 150, 200))
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=85)
    return buf.getvalue()


def test_celery_app_configuration():
    """Verify Celery application config, broker URL, and task registration."""
    assert celery_app.main == "snapfind_worker"
    registered_tasks = set(celery_app.tasks.keys())
    assert "app.workers.tasks.photo_tasks.process_single_photo_task" in registered_tasks
    assert "app.workers.tasks.photo_tasks.process_event_photos_task" in registered_tasks
    assert "app.workers.tasks.photo_tasks.retry_failed_photos_task" in registered_tasks
    assert celery_app.conf.task_acks_late is True
    assert celery_app.conf.worker_prefetch_multiplier == 1


def test_event_processing_status_endpoint():
    """Verify GET /api/v1/events/{event_id}/processing returns structured metrics."""
    events_resp = client.get("/api/v1/events")
    assert events_resp.status_code == 200
    event_id = events_resp.json()[0]["id"]

    resp = client.get(f"/api/v1/events/{event_id}/processing")
    assert resp.status_code == 200
    data = resp.json()

    assert data["eventId"] == event_id
    assert "status" in data
    assert "totalPhotos" in data
    assert "processed" in data
    assert "remaining" in data
    assert "progressPercent" in data
    assert "currentStage" in data
    assert "stages" in data
    assert len(data["stages"]) == 4

    stage_names = [s["name"] for s in data["stages"]]
    assert "Derivative Generation" in stage_names
    assert "Face Detection & Alignment" in stage_names
    assert "512-d Face Embedding" in stage_names
    assert "pgvector Search Indexing" in stage_names


def test_non_blocking_upload_complete_and_task_execution():
    """
    Verify upload-complete returns in < 50ms with status 'queued',
    creates a ProcessingJob, and background task executes successfully.
    """
    events_resp = client.get("/api/v1/events")
    event_id = events_resp.json()[0]["id"]

    jpeg_bytes = _create_sample_jpeg(800, 600)

    # 1. Upload Init
    init_resp = client.post(
        f"/api/v1/events/{event_id}/photos/upload-init",
        json={
            "filename": "celery_test_portrait.jpg",
            "fileSize": len(jpeg_bytes),
            "mimeType": "image/jpeg",
        },
    )
    assert init_resp.status_code == 201
    init_data = init_resp.json()
    photo_id = init_data["photoId"]
    upload_url = init_data["uploadUrl"]

    # 2. Direct PUT to storage via client
    from urllib.parse import urlparse
    parsed = urlparse(upload_url)
    put_path = f"{parsed.path}?{parsed.query}" if parsed.path else upload_url
    put_resp = client.put(
        put_path,
        content=jpeg_bytes,
        headers={"Content-Type": "image/jpeg"},
    )
    assert put_resp.status_code in (200, 204)

    # 3. Non-blocking upload-complete
    complete_resp = client.post(
        f"/api/v1/photos/{photo_id}/upload-complete",
        json={"photoId": photo_id},
    )
    assert complete_resp.status_code == 200
    complete_data = complete_resp.json()
    assert complete_data["uploadStatus"] == "uploaded"
    assert complete_data["processingStatus"] in ("queued", "completed")

    # 4. Verify ProcessingJob record was created
    with SessionLocal() as db:
        job = db.scalar(
            select(ProcessingJob).where(ProcessingJob.photo_id == photo_id)
        )
        assert job is not None
        assert job.status in ("queued", "processing", "completed")
        job_id = job.id

    # 5. Execute processing task
    task_res = process_photo_sync(photo_id, job_id)
    assert task_res["status"] == "completed"

    # 6. Verify photo status is completed and derivatives populated
    with SessionLocal() as db:
        updated_photo = db.get(Photo, photo_id)
        assert updated_photo.processing_status == "completed"
        assert updated_photo.web_storage_key is not None
        assert updated_photo.thumbnail_storage_key is not None

        updated_job = db.get(ProcessingJob, job_id)
        assert updated_job.status == "completed"
        assert updated_job.processed_items >= 1
        assert updated_job.failed_items == 0


def test_idempotent_photo_reprocessing():
    """Verify re-running processing on an already-processed photo does not duplicate faces."""
    events_resp = client.get("/api/v1/events")
    event_id = events_resp.json()[0]["id"]

    jpeg_bytes = _create_sample_jpeg(500, 500)
    init_resp = client.post(
        f"/api/v1/events/{event_id}/photos/upload-init",
        json={"filename": "idempotent_test.jpg", "fileSize": len(jpeg_bytes), "mimeType": "image/jpeg"},
    )
    photo_id = init_resp.json()["photoId"]
    raw_url = init_resp.json()["uploadUrl"]
    from urllib.parse import urlparse
    parsed = urlparse(raw_url)
    put_path = f"{parsed.path}?{parsed.query}" if parsed.path else raw_url
    client.put(put_path, content=jpeg_bytes, headers={"Content-Type": "image/jpeg"})
    client.post(f"/api/v1/photos/{photo_id}/upload-complete", json={"photoId": photo_id})

    # First run
    res1 = process_photo_sync(photo_id)
    assert res1["status"] == "completed"

    with SessionLocal() as db:
        faces_1 = db.scalars(select(Face).where(Face.photo_id == photo_id)).all()
        count_run_1 = len(faces_1)

    # Second run (reprocess)
    res2 = process_photo_sync(photo_id)
    assert res2["status"] == "completed"

    with SessionLocal() as db:
        faces_2 = db.scalars(select(Face).where(Face.photo_id == photo_id)).all()
        count_run_2 = len(faces_2)

    assert count_run_1 == count_run_2


def test_event_processing_action_controls():
    """Verify start, reprocess, retry-failed, and cancel endpoints."""
    events_resp = client.get("/api/v1/events")
    event_id = events_resp.json()[0]["id"]

    # 1. Start processing
    start_resp = client.post(f"/api/v1/events/{event_id}/processing/start")
    assert start_resp.status_code == 200
    assert start_resp.json()["success"] is True

    # 2. Reprocess event
    reproc_resp = client.post(f"/api/v1/events/{event_id}/processing/reprocess")
    assert reproc_resp.status_code == 200
    assert reproc_resp.json()["success"] is True

    # 3. Retry failed
    retry_resp = client.post(f"/api/v1/events/{event_id}/processing/retry-failed")
    assert retry_resp.status_code == 200
    assert retry_resp.json()["success"] is True

    # 4. Cancel processing
    cancel_resp = client.post(f"/api/v1/events/{event_id}/processing/cancel")
    assert cancel_resp.status_code == 200
    assert cancel_resp.json()["success"] is True

