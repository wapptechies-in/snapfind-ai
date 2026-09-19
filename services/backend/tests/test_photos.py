"""
Photos test suite — metadata listing, lookup, creation, and deletion.
Status: IMPLEMENTED (Phase 4)
"""

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_photos_lifecycle():
    # 1. First get an existing event or create one
    events_resp = client.get("/api/v1/events")
    assert events_resp.status_code == 200
    events = events_resp.json()
    assert len(events) > 0
    test_event = events[0]
    event_id = test_event["id"]
    event_token = test_event["token"]

    # 2. Add photo metadata to event
    photo_payload = {
        "filename": "DSC_9942.jpg",
        "url": "https://images.unsplash.com/photo-1519741497674-611481863552",
        "thumbnailUrl": "https://images.unsplash.com/photo-1519741497674-611481863552?w=400",
        "width": 2400,
        "height": 1600,
        "fileSize": 3450000,
        "mimeType": "image/jpeg",
    }
    create_resp = client.post(f"/api/v1/events/{event_id}/photos", json=photo_payload)
    assert create_resp.status_code == 201
    photo = create_resp.json()
    assert photo["filename"] == photo_payload["filename"]
    assert photo["eventId"] == event_id
    photo_id = photo["id"]

    # 3. Retrieve single photo
    get_resp = client.get(f"/api/v1/photos/{photo_id}")
    assert get_resp.status_code == 200
    assert get_resp.json()["id"] == photo_id

    # 4. List photos by event ID
    list_by_id = client.get(f"/api/v1/events/{event_id}/photos")
    assert list_by_id.status_code == 200
    list_data = list_by_id.json()
    assert list_data["total"] >= 1
    assert any(p["id"] == photo_id for p in list_data["items"])

    # 5. List photos by public token
    list_by_token = client.get(f"/api/v1/events/{event_token}/photos")
    assert list_by_token.status_code == 200
    token_list_data = list_by_token.json()
    assert token_list_data["total"] >= 1

    # 6. Delete photo
    del_resp = client.delete(f"/api/v1/photos/{photo_id}")
    assert del_resp.status_code == 200
    assert del_resp.json()["ok"] is True

    # 7. Verify photo no longer exists
    get_del = client.get(f"/api/v1/photos/{photo_id}")
    assert get_del.status_code == 404


def test_photos_nonexistent_event():
    resp = client.get("/api/v1/events/evt_nonexistent/photos")
    assert resp.status_code == 404

