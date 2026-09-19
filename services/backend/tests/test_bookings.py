"""
Bookings test suite — public inquiry creation, listing, status updates, and validation.
Status: IMPLEMENTED (Phase 4)
"""

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_create_booking_success():
    payload = {
        "name": "Jane & John Doe",
        "phone": "+1 555-0199",
        "email": "jane.doe@example.com",
        "eventType": "Wedding",
        "eventDate": "2026-10-15",
        "location": "Grand Plaza Hotel, New York",
        "guestCount": 150,
        "message": "Looking for full-day wedding photography coverage.",
    }
    response = client.post("/api/v1/bookings", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == payload["name"]
    assert data["email"] == payload["email"]
    assert data["eventType"] == payload["eventType"]
    assert data["status"] == "pending"
    assert "id" in data
    assert data["id"].startswith("bkg_")

    booking_id = data["id"]

    # Test single booking lookup
    get_resp = client.get(f"/api/v1/bookings/{booking_id}")
    assert get_resp.status_code == 200
    assert get_resp.json()["id"] == booking_id

    # Test status update
    patch_resp = client.patch(
        f"/api/v1/bookings/{booking_id}",
        json={"status": "confirmed"},
    )
    assert patch_resp.status_code == 200
    assert patch_resp.json()["status"] == "confirmed"


def test_create_booking_validation_error():
    # Invalid email
    bad_email = {
        "name": "Bob Smith",
        "phone": "+1 555-0123",
        "email": "not-an-email",
        "eventType": "Corporate",
        "eventDate": "2026-11-01",
        "location": "Convention Center",
    }
    resp = client.post("/api/v1/bookings", json=bad_email)
    assert resp.status_code == 422

    # Missing required name
    missing_name = {
        "phone": "+1 555-0123",
        "email": "bob@example.com",
        "eventType": "Corporate",
        "eventDate": "2026-11-01",
        "location": "Convention Center",
    }
    resp2 = client.post("/api/v1/bookings", json=missing_name)
    assert resp2.status_code == 422


def test_list_bookings():
    resp = client.get("/api/v1/bookings")
    assert resp.status_code == 200
    bookings = resp.json()
    assert isinstance(bookings, list)
    assert len(bookings) >= 1


def test_get_nonexistent_booking():
    resp = client.get("/api/v1/bookings/bkg_doesnotexist")
    assert resp.status_code == 404

