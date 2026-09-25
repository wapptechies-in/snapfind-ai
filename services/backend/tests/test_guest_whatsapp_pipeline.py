"""
Comprehensive test suite for:
- Event QR & Token Regeneration
- Guest Registration & (event_id, phone) Deduplication
- Strict Consent Gating (Selfie, WhatsApp transactional, Marketing opt-in)
- Event Isolation (Event A vs Event B data boundary)
- WhatsApp Delivery & Logging via WhatsAppService
- Right to be Forgotten (Guest Data Deletion)
- Async AI Face Search background job flow
"""

import io
import time
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.rate_limit import reset_rate_limits

client = TestClient(app)


@pytest.fixture(autouse=True)
def clean_rate_limits():
    """Reset rate limiter state before every test."""
    reset_rate_limits()
    yield
    reset_rate_limits()


def get_auth_headers():
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": "photographer@example.com", "password": "password123"},
    )
    assert login_resp.status_code == 200, "Authentication fixture failed"
    token = login_resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def auth_headers():
    return get_auth_headers()


_created_event_ids = []

@pytest.fixture(autouse=True)
def cleanup_events(auth_headers):
    yield
    for eid in _created_event_ids:
        try:
            client.delete(f"/api/v1/events/{eid}", headers=auth_headers)
        except Exception:
            pass
    _created_event_ids.clear()

def create_test_event(headers, name="Wedding Gala 2026"):
    resp = client.post(
        "/api/v1/events",
        json={
            "name": name,
            "date": "2026-06-15",
            "status": "active",
            "welcome_message": "Welcome to our special day!",
            "show_snapfind_branding": True,
            "show_company_cta": True,
        },
        headers=headers,
    )
    assert resp.status_code == 201
    evt = resp.json()
    _created_event_ids.append(evt["id"])
    return evt


def test_token_regeneration(auth_headers):
    """Event QR token regeneration should invalidate old token and assign a new public token."""
    event = create_test_event(auth_headers, "Token Regen Event")
    event_id = event["id"]
    original_token = event["token"]

    regen_resp = client.post(f"/api/v1/events/{event_id}/regenerate-token", headers=auth_headers)
    assert regen_resp.status_code == 200
    data = regen_resp.json()
    new_token = data.get("token") or data.get("public_token")

    assert new_token != original_token
    assert len(new_token) >= 6

    # Verify event can now be fetched via new token
    by_token_resp = client.get(f"/api/v1/events/{new_token}")
    assert by_token_resp.status_code == 200
    assert by_token_resp.json()["id"] == event_id


def test_guest_registration_and_deduplication(auth_headers):
    """
    Guests registering with the same phone under the same event
    must be deduplicated rather than creating duplicate database rows.
    """
    event = create_test_event(auth_headers, "Deduplication Test Event")
    token = event["token"]
    event_id = event["id"]

    # 1. First registration
    payload1 = {
        "event_token": token,
        "full_name": "Arjun Kapoor",
        "whatsapp_number": "+91 98765 43210",
        "email": "arjun@example.com",
        "consent_selfie_processing": True,
        "consent_whatsapp_transactional": True,
        "consent_marketing": False,
        "source": "qr_landing",
    }
    resp1 = client.post("/api/v1/guests/register", json=payload1)
    assert resp1.status_code == 201, f"Expected 201 got {resp1.status_code}: {resp1.text}"
    guest1 = resp1.json()
    assert guest1.get("full_name") == "Arjun Kapoor" or guest1.get("name") == "Arjun Kapoor"
    guest_id_1 = guest1["id"]

    # 2. Second registration with slightly different phone formatting and updated name
    payload2 = {
        "event_token": token,
        "full_name": "Arjun K.",
        "whatsapp_number": "9876543210",  # Unnormalized input
        "email": "arjun.updated@example.com",
        "consent_selfie_processing": True,
        "consent_whatsapp_transactional": True,
        "consent_marketing": True,  # Now opts in to marketing
        "source": "qr_landing",
    }
    resp2 = client.post("/api/v1/guests/register", json=payload2)
    assert resp2.status_code in (200, 201), f"Expected 200/201 got {resp2.status_code}: {resp2.text}"
    guest2 = resp2.json()

    # Deduplicated to same guest ID
    assert guest2["id"] == guest_id_1
    assert guest2.get("consent_marketing") is True or guest2.get("consentMarketing") is True

    # 3. Verify total guest count for event is exactly 1
    list_resp = client.get(f"/api/v1/guests/events/{event_id}/list", headers=auth_headers)
    assert list_resp.status_code == 200
    guest_list = list_resp.json()
    assert len(guest_list) == 1


def test_consent_gating_and_marketing_leads(auth_headers):
    """
    Consent separation:
    - Marketing consent MUST NOT be inferred from phone submission.
    - Marketing leads MUST only be created when consent_marketing=True.
    - Sending marketing message without consent MUST be rejected.
    """
    event = create_test_event(auth_headers, "Consent Gating Event")
    event_id = event["id"]
    token = event["token"]

    # Guest 1: Denies marketing consent
    p1 = {
        "event_token": token,
        "full_name": "Priya Sharma",
        "whatsapp_number": "+919811122233",
        "consent_selfie_processing": True,
        "consent_whatsapp_transactional": True,
        "consent_marketing": False,
    }
    r1 = client.post("/api/v1/guests/register", json=p1)
    assert r1.status_code == 201, f"r1 failed: {r1.text}"
    g1 = r1.json()

    # Guest 2: Grants marketing consent
    p2 = {
        "event_token": token,
        "full_name": "Rohan Mehta",
        "whatsapp_number": "+919844455566",
        "consent_selfie_processing": True,
        "consent_whatsapp_transactional": True,
        "consent_marketing": True,
    }
    r2 = client.post("/api/v1/guests/register", json=p2)
    assert r2.status_code == 201, f"r2 failed: {r2.text}"
    g2 = r2.json()

    # Check leads list: only Guest 2 must be present
    leads_resp = client.get(f"/api/v1/guests/events/{event_id}/leads", headers=auth_headers)
    assert leads_resp.status_code == 200
    leads = leads_resp.json()
    assert len(leads) == 1
    lead_guest_id = leads[0].get("guestId") or leads[0].get("guest_id")
    assert lead_guest_id == g2["id"]

    # Gated messaging: Attempting marketing message to Guest 1 must be rejected/skipped
    wa_req = {"message_type": "marketing", "custom_message": "Special 20% discount!"}
    wa_g1 = client.post(f"/api/v1/guests/{g1['id']}/send-whatsapp", json=wa_req, headers=auth_headers)
    assert wa_g1.status_code == 200
    res_g1 = wa_g1.json()
    assert res_g1["success"] is False
    assert "consent" in res_g1["status"].lower() or "denied" in res_g1["status"].lower()

    # Marketing message to Guest 2 must succeed
    wa_g2 = client.post(f"/api/v1/guests/{g2['id']}/send-whatsapp", json=wa_req, headers=auth_headers)
    assert wa_g2.status_code == 200
    res_g2 = wa_g2.json()
    assert res_g2["success"] is True


def test_event_isolation(auth_headers):
    """
    Strict Event-Level Data Isolation:
    Guests and data under Event A must NEVER appear or be accessible under Event B.
    """
    event_a = create_test_event(auth_headers, "Event Alpha")
    event_b = create_test_event(auth_headers, "Event Beta")

    # Register guest in Event A
    r_a = client.post(
        "/api/v1/guests/register",
        json={
            "event_token": event_a["token"],
            "full_name": "Guest Alpha",
            "whatsapp_number": "+919900011122",
            "consent_selfie_processing": True,
            "consent_whatsapp_transactional": True,
            "consent_marketing": True,
        },
    )
    assert r_a.status_code == 201

    # Register guest in Event B
    r_b = client.post(
        "/api/v1/guests/register",
        json={
            "event_token": event_b["token"],
            "full_name": "Guest Beta",
            "whatsapp_number": "+919900033344",
            "consent_selfie_processing": True,
            "consent_whatsapp_transactional": True,
            "consent_marketing": True,
        },
    )
    assert r_b.status_code == 201

    # Verify Event A lists ONLY Guest Alpha
    list_a = client.get(f"/api/v1/guests/events/{event_a['id']}/list", headers=auth_headers).json()
    assert len(list_a) == 1
    assert list_a[0].get("name") == "Guest Alpha" or list_a[0].get("full_name") == "Guest Alpha"

    # Verify Event B lists ONLY Guest Beta
    list_b = client.get(f"/api/v1/guests/events/{event_b['id']}/list", headers=auth_headers).json()
    assert len(list_b) == 1
    assert list_b[0].get("name") == "Guest Beta" or list_b[0].get("full_name") == "Guest Beta"

    # Cross-check leads
    leads_a = client.get(f"/api/v1/guests/events/{event_a['id']}/leads", headers=auth_headers).json()
    assert len(leads_a) == 1
    assert leads_a[0].get("name") == "Guest Alpha" or leads_a[0].get("full_name") == "Guest Alpha"


def test_right_to_be_forgotten(auth_headers):
    """
    Real deletion capability: DELETE /api/v1/guests/{guest_id}
    Must delete guest record, associated marketing lead, and messages.
    """
    event = create_test_event(auth_headers, "Right to be Forgotten Event")
    resp = client.post(
        "/api/v1/guests/register",
        json={
            "event_token": event["token"],
            "full_name": "Deletable Guest",
            "whatsapp_number": "+919999900000",
            "consent_selfie_processing": True,
            "consent_whatsapp_transactional": True,
            "consent_marketing": True,
        },
    )
    assert resp.status_code == 201, f"Failed registration: {resp.text}"
    guest_id = resp.json()["id"]

    # Confirm guest exists
    get_resp = client.get(f"/api/v1/guests/{guest_id}")
    assert get_resp.status_code == 200

    # Delete guest
    del_resp = client.delete(f"/api/v1/guests/{guest_id}")
    assert del_resp.status_code == 200
    assert del_resp.json().get("status") == "deleted"

    # Subsequent fetch must be 404
    fetch_after = client.get(f"/api/v1/guests/{guest_id}")
    assert fetch_after.status_code == 404

    # Leads must not contain deleted guest
    leads = client.get(f"/api/v1/guests/events/{event['id']}/leads", headers=auth_headers).json()
    assert all((l.get("guestId") or l.get("guest_id")) != guest_id for l in leads)


def test_async_face_search_job(auth_headers):
    """
    AI Face Search background job pattern:
    - POST /api/v1/ai/search-async returns 202 Accepted with job_id.
    - GET /api/v1/ai/jobs/{job_id} returns the job status.
    """
    event = create_test_event(auth_headers, "Async Face Search Event")
    token = event["token"]

    dummy_jpeg = (
        b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00`\x00`\x00\x00"
        b"\xff\xdb\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t"
        b"\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a"
        b"\x1f\x1e\x1d\x1a\x1c\x1c $.' \",#\x1c\x1c(7),01444\x1f'9=82<.342"
        b"\xff\xc0\x00\x0b\x08\x00\x01\x00\x01\x01\x01\x11\x00\xff\xc4\x00"
        b"\x1f\x00\x00\x01\x05\x01\x01\x01\x01\x01\x01\x00\x00\x00\x00\x00"
        b"\x00\x00\x00\x01\x02\x03\x04\x05\x06\x07\x08\t\n\x0b\xff\xda\x00"
        b"\x08\x01\x01\x00\x00?\x00\xbf\x00\xff\xd9"
    )

    files = {"selfie": ("selfie.jpg", io.BytesIO(dummy_jpeg), "image/jpeg")}
    data = {"token": token}

    resp = client.post("/api/v1/ai/search-async", data=data, files=files)
    assert resp.status_code == 202
    job_info = resp.json()
    job_id = job_info.get("job_id") or job_info.get("jobId")
    assert job_id is not None

    # Poll status
    time.sleep(0.5)
    status_resp = client.get(f"/api/v1/ai/jobs/{job_id}")
    assert status_resp.status_code == 200
    status_data = status_resp.json()
    res_job_id = status_data.get("jobId") or status_data.get("job_id")
    assert res_job_id == job_id
    assert status_data["status"] in ("queued", "processing", "completed", "failed")

