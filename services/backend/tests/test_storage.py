"""
Phase 6 Storage & Direct Upload Pipeline Test Suite.
Tests StorageProvider, MinIO S3 operations, presigned upload/download,
derivative generation, public gallery policies, and download logging.
Status: IMPLEMENTED (Phase 6)
"""

import io
import requests
from fastapi.testclient import TestClient
from PIL import Image

from app.main import app
from app.services.storage import StorageService

client = TestClient(app)


def _create_sample_jpeg_bytes(width: int = 800, height: int = 600) -> bytes:
    """Create a valid in-memory JPEG for upload testing."""
    img = Image.new("RGB", (width, height), color=(73, 109, 137))
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=90)
    return buf.getvalue()


def test_storage_provider_primitives():
    """Verify low-level storage provider operations (put, get, exists, presigned, delete)."""
    storage = StorageService()
    test_key = "tests/primitives_test.jpg"
    test_data = _create_sample_jpeg_bytes(200, 200)

    # 1. Put object
    storage.provider.put_object_bytes(test_key, test_data, content_type="image/jpeg")

    # 2. Exists
    assert storage.provider.object_exists(test_key) is True

    # 3. Metadata
    meta = storage.provider.get_object_metadata(test_key)
    assert meta["size"] == len(test_data)

    # 4. Get bytes
    retrieved = storage.provider.get_object_bytes(test_key)
    assert retrieved == test_data

    # 5. Presigned download URL
    download_url = storage.provider.generate_presigned_download_url(
        key=test_key, expires_in=300, filename="test.jpg"
    )
    assert "http" in download_url

    # 6. Presigned upload URL
    upload_info = storage.provider.generate_presigned_upload_url(
        key="tests/upload_test.jpg", content_type="image/jpeg", expires_in=300
    )
    assert "upload_url" in upload_info
    assert upload_info["method"] == "PUT"

    # 7. Delete object
    storage.provider.delete_object(test_key)
    assert storage.provider.object_exists(test_key) is False


def test_storage_service_derivatives():
    """Verify image derivative generation (1920px web, 400px thumb) and key generation."""
    storage = StorageService()
    event_id = "evt_test_derivs"
    photo_id = "pho_test_derivs"

    orig_key = storage.build_original_key(event_id, photo_id, "my wedding photo.jpg")
    assert orig_key == f"events/{event_id}/originals/{photo_id}/myweddingphoto.jpg"

    # Create large image (2400 x 1800)
    large_img_bytes = _create_sample_jpeg_bytes(2400, 1800)
    derivs = storage.create_and_store_derivatives(event_id, photo_id, large_img_bytes)

    assert derivs["width"] == 2400
    assert derivs["height"] == 1800
    assert derivs["checksum"] is not None
    assert storage.provider.object_exists(derivs["web_storage_key"]) is True
    assert storage.provider.object_exists(derivs["thumbnail_storage_key"]) is True

    # Clean up
    storage.provider.delete_objects([
        derivs["web_storage_key"],
        derivs["thumbnail_storage_key"],
    ])


def test_upload_pipeline_lifecycle():
    """
    Complete Phase 6 direct upload lifecycle:
    1. upload-init -> returns presigned PUT URL and pending photo
    2. direct PUT binary to MinIO using presigned URL
    3. upload-complete -> triggers derivative generation and AI indexing
    4. verify photo metadata, storage keys, and status
    5. presigned download URL with download logging
    6. delete photo with storage object cleanup
    """
    # 1. Get an existing event
    events_resp = client.get("/api/v1/events")
    assert events_resp.status_code == 200
    event = events_resp.json()[0]
    event_id = event["id"]
    event_token = event["token"]

    # 2. Upload Init
    sample_bytes = _create_sample_jpeg_bytes(1600, 1200)
    init_payload = {
        "filename": "wedding_dance.jpg",
        "fileSize": len(sample_bytes),
        "mimeType": "image/jpeg",
    }
    init_resp = client.post(f"/api/v1/events/{event_id}/photos/upload-init", json=init_payload)
    assert init_resp.status_code == 201
    init_data = init_resp.json()
    photo_id = init_data["photoId"]
    upload_url = init_data["uploadUrl"]
    storage_key = init_data["storageKey"]
    assert "events/" in storage_key
    assert upload_url.startswith("http")

    # 3. Direct PUT binary to MinIO
    put_resp = requests.put(
        upload_url,
        data=sample_bytes,
        headers={"Content-Type": "image/jpeg"},
        timeout=10,
    )
    assert put_resp.status_code in (200, 204)

    # 4. Upload Complete (non-blocking in Phase 7)
    complete_resp = client.post(
        f"/api/v1/photos/{photo_id}/upload-complete",
        json={"photoId": photo_id},
    )
    assert complete_resp.status_code == 200
    photo_data = complete_resp.json()
    assert photo_data["id"] == photo_id
    assert photo_data["uploadStatus"] == "uploaded"
    assert photo_data["processingStatus"] in ("queued", "completed")

    # Background worker processes derivatives and AI face indexing
    from app.workers.tasks.photo_tasks import process_single_photo_task
    task_res = process_single_photo_task(photo_id)
    assert task_res["status"] == "completed"


    # 5. Presigned URL generation with download tracking
    url_resp = client.get(f"/api/v1/photos/{photo_id}/url?variant=web&download=true")
    assert url_resp.status_code == 200
    url_data = url_resp.json()
    assert url_data["photoId"] == photo_id
    assert "http" in url_data["url"]

    # 6. Public guest gallery endpoint
    gallery_resp = client.get(f"/api/v1/events/{event_token}/public-photos")
    assert gallery_resp.status_code == 200
    gallery_data = gallery_resp.json()
    assert gallery_data["total"] >= 1
    assert any(p["id"] == photo_id for p in gallery_data["items"])

    # 7. Delete photo and verify storage objects are removed
    del_resp = client.delete(f"/api/v1/photos/{photo_id}")
    assert del_resp.status_code == 200
    assert del_resp.json()["ok"] is True

    # Storage objects should be deleted
    storage = StorageService()
    assert storage.provider.object_exists(storage_key) is False


def test_upload_init_validation_errors():
    """Verify file size and MIME type rejections in upload-init."""
    events_resp = client.get("/api/v1/events")
    event_id = events_resp.json()[0]["id"]

    # Oversized file (> 50 MB)
    too_large = {
        "filename": "huge_file.jpg",
        "fileSize": 60 * 1024 * 1024,
        "mimeType": "image/jpeg",
    }
    resp_large = client.post(f"/api/v1/events/{event_id}/photos/upload-init", json=too_large)
    assert resp_large.status_code == 413

    # Invalid MIME type
    invalid_mime = {
        "filename": "document.pdf",
        "fileSize": 1024,
        "mimeType": "application/pdf",
    }
    resp_mime = client.post(f"/api/v1/events/{event_id}/photos/upload-init", json=invalid_mime)
    assert resp_mime.status_code == 400

