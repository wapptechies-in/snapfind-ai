"""
Phase 8 Desktop Upload Sessions Test Suite.
Tests creation of upload sessions, batch-init of presigned URLs, completion, cancellation,
and direct upload pipeline integration.
Status: IMPLEMENTED (Phase 8)
"""

import io
from fastapi.testclient import TestClient
from PIL import Image
import requests

from app.main import app

client = TestClient(app)


def _create_sample_jpeg(width: int = 400, height: int = 300) -> bytes:
    img = Image.new("RGB", (width, height), color=(60, 120, 180))
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=85)
    return buf.getvalue()


def test_upload_session_lifecycle():
    """Verify complete upload session lifecycle: create -> batch-init -> upload -> complete."""
    # 1. Get an existing event
    events_resp = client.get("/api/v1/events")
    assert events_resp.status_code == 200
    events = events_resp.json()
    assert len(events) > 0
    event_id = events[0]["id"]

    # 2. Create upload session
    create_payload = {
        "eventId": event_id,
        "name": "Test Desktop Batch 01",
        "totalFiles": 3,
        "totalBytes": 150000,
    }
    create_resp = client.post("/api/v1/upload-sessions", json=create_payload)
    assert create_resp.status_code == 201
    session_data = create_resp.json()
    session_id = session_data["id"]
    assert session_data["eventId"] == event_id
    assert session_data["status"] == "active"
    assert session_data["totalFiles"] == 3

    # 3. Get session
    get_resp = client.get(f"/api/v1/upload-sessions/{session_id}")
    assert get_resp.status_code == 200
    assert get_resp.json()["id"] == session_id

    # 4. Batch Init presigned URLs
    jpeg_bytes = _create_sample_jpeg(300, 200)
    batch_payload = {
        "items": [
            {"filename": "photo_a.jpg", "fileSize": len(jpeg_bytes), "mimeType": "image/jpeg"},
            {"filename": "photo_b.jpg", "fileSize": len(jpeg_bytes), "mimeType": "image/jpeg"},
        ]
    }
    batch_resp = client.post(f"/api/v1/upload-sessions/{session_id}/batch-init", json=batch_payload)
    assert batch_resp.status_code == 200
    batch_data = batch_resp.json()
    assert batch_data["uploadSessionId"] == session_id
    assert len(batch_data["items"]) == 2

    first_item = batch_data["items"][0]
    assert first_item["filename"] == "photo_a.jpg"
    assert first_item["uploadUrl"].startswith("http")
    assert "storageKey" in first_item

    # 5. Direct PUT binary to MinIO using presigned URL
    put_resp = requests.put(
        first_item["uploadUrl"],
        data=jpeg_bytes,
        headers={"Content-Type": "image/jpeg"},
        timeout=10,
    )
    assert put_resp.status_code in (200, 204)

    # 6. Upload Complete via standard endpoint
    complete_resp = client.post(
        f"/api/v1/photos/{first_item['photoId']}/upload-complete",
        json={"photoId": first_item["photoId"]},
    )
    assert complete_resp.status_code == 200
    assert complete_resp.json()["uploadStatus"] == "uploaded"

    # 7. Complete Upload Session
    session_complete_resp = client.post(f"/api/v1/upload-sessions/{session_id}/complete")
    assert session_complete_resp.status_code == 200
    assert session_complete_resp.json()["status"] == "completed"


def test_upload_session_cancellation():
    """Verify cancelling an upload session."""
    events_resp = client.get("/api/v1/events")
    event_id = events_resp.json()[0]["id"]

    create_resp = client.post(
        "/api/v1/upload-sessions",
        json={"eventId": event_id, "name": "Cancel Test Session", "totalFiles": 1, "totalBytes": 1000},
    )
    session_id = create_resp.json()["id"]

    cancel_resp = client.post(f"/api/v1/upload-sessions/{session_id}/cancel")
    assert cancel_resp.status_code == 200
    assert cancel_resp.json()["status"] == "cancelled"


def test_batch_upload_validation():
    """Verify validation: non-existent session and oversized batch."""
    # Non-existent session
    resp = client.post("/api/v1/upload-sessions/ups_nonexistent/batch-init", json={"items": []})
    assert resp.status_code == 404

    # Oversized batch (> 100 items)
    events_resp = client.get("/api/v1/events")
    event_id = events_resp.json()[0]["id"]
    create_resp = client.post("/api/v1/upload-sessions", json={"eventId": event_id, "totalFiles": 150})
    session_id = create_resp.json()["id"]

    items_105 = [{"filename": f"test_{i}.jpg", "fileSize": 1000, "mimeType": "image/jpeg"} for i in range(105)]
    oversized_resp = client.post(f"/api/v1/upload-sessions/{session_id}/batch-init", json={"items": items_105})
    assert oversized_resp.status_code == 400
