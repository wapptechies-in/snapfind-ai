"""
Events test suite.
"""

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def get_auth_headers():
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": "photographer@example.com", "password": "password123"},
    )
    token = login_resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_events_crud():
    headers = get_auth_headers()

    # 1. List events
    list_resp = client.get("/api/v1/events", headers=headers)
    assert list_resp.status_code == 200
    events = list_resp.json()
    assert isinstance(events, list)
    initial_count = len(events)

    # 2. Create new event
    new_event = {
        "name": "Spring Gala Showcase",
        "date": "2026-05-20",
        "status": "active",
    }
    create_resp = client.post("/api/v1/events", json=new_event, headers=headers)
    assert create_resp.status_code == 201
    created = create_resp.json()
    assert created["name"] == new_event["name"]
    assert created["date"] == new_event["date"]
    event_id = created["id"]

    # 3. Get single event
    get_resp = client.get(f"/api/v1/events/{event_id}", headers=headers)
    assert get_resp.status_code == 200
    assert get_resp.json()["id"] == event_id

    # 4. Update event
    update_resp = client.put(
        f"/api/v1/events/{event_id}",
        json={"name": "Spring Gala Showcase — Updated", "status": "completed"},
        headers=headers,
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["name"] == "Spring Gala Showcase — Updated"
    assert update_resp.json()["status"] == "completed"

    # 5. Filter events by status
    filtered_resp = client.get("/api/v1/events?status=completed", headers=headers)
    assert filtered_resp.status_code == 200
    assert any(e["id"] == event_id for e in filtered_resp.json())

    # 6. Delete event
    del_resp = client.delete(f"/api/v1/events/{event_id}", headers=headers)
    assert del_resp.status_code == 200

    # Verify deleted
    get_del = client.get(f"/api/v1/events/{event_id}", headers=headers)
    assert get_del.status_code == 404

