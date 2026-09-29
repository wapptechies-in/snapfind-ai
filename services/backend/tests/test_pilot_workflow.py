"""
Pilot Workflow Automated Test Suite.
Tests:
1. Operator trial provisioning and status inspection.
2. Time-limited trial account expiration gating (HTTP 403 TRIAL_EXPIRED).
3. Strict multi-tenant isolation (Photographer A cannot access or upload to Photographer B's events/photos/sessions).
4. Free-tier / no-payment photo upload, processing, and public client gallery access.
5. Production/staging environment gating of dev seed users.
"""

from datetime import datetime, timedelta, timezone
import io
from fastapi.testclient import TestClient
from PIL import Image
import pytest
from sqlalchemy import select

from app.core.config import Settings
from app.core.security import create_access_token, hash_password
from app.db.session import SessionLocal
from app.main import app
from app.models.event import Event, generate_event_id, generate_public_token
from app.models.photographer import Photographer, generate_photographer_id

client = TestClient(app)


def _make_dummy_image_bytes(color=(180, 140, 70), size=(200, 200)) -> bytes:
    buf = io.BytesIO()
    img = Image.new("RGB", size, color=color)
    img.save(buf, format="JPEG")
    return buf.getvalue()


def test_staging_environment_seed_data_gating():
    """Verify that demo credentials and seed data are disabled in staging and production."""
    staging_settings = Settings(ENVIRONMENT="staging", SEED_DEV_DATA=None)
    assert staging_settings.should_seed_dev_data is False

    prod_settings = Settings(ENVIRONMENT="production", SEED_DEV_DATA=None)
    assert prod_settings.should_seed_dev_data is False

    dev_settings = Settings(ENVIRONMENT="development", SEED_DEV_DATA=None)
    assert dev_settings.should_seed_dev_data is True


def test_trial_account_provisioning_and_expiration():
    """Verify trial account provisioning and automatic expiration blocking."""
    db = SessionLocal()
    try:
        # Create an expired trial account
        p_expired_id = generate_photographer_id()
        p_expired = Photographer(
            id=p_expired_id,
            email=f"expired_{p_expired_id}@pilot.com",
            studio_name="Expired Pilot Studio",
            role="photographer",
            approval_status="approved",
            subscription_tier="free",
            subscription_status="active",
            hashed_password=hash_password("pilotpass123"),
            trial_expires_at=datetime.now(timezone.utc) - timedelta(hours=2),
        )
        db.add(p_expired)

        # Create an active trial account
        p_active_id = generate_photographer_id()
        p_active = Photographer(
            id=p_active_id,
            email=f"active_{p_active_id}@pilot.com",
            studio_name="Active Pilot Studio",
            role="photographer",
            approval_status="approved",
            subscription_tier="free",
            subscription_status="active",
            hashed_password=hash_password("pilotpass123"),
            trial_expires_at=datetime.now(timezone.utc) + timedelta(days=14),
        )
        db.add(p_active)
        db.commit()

        # 1. Expired trial photographer token request should be blocked with 403 TRIAL_EXPIRED
        expired_token = create_access_token(p_expired_id)
        resp_expired = client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {expired_token}"},
        )
        assert resp_expired.status_code == 403
        assert "TRIAL_EXPIRED" in resp_expired.text

        # 2. Active trial photographer token request succeeds
        active_token = create_access_token(p_active_id)
        resp_active = client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {active_token}"},
        )
        assert resp_active.status_code == 200
        assert resp_active.json()["email"] == p_active.email
    finally:
        db.close()


def test_tenant_data_isolation():
    """Verify Photographer A cannot view, modify, or upload to Photographer B's resources."""
    db = SessionLocal()
    try:
        # Photographer A
        p_a_id = generate_photographer_id()
        p_a = Photographer(
            id=p_a_id,
            email=f"alpha_{p_a_id}@pilot.com",
            studio_name="Studio Alpha",
            role="photographer",
            approval_status="approved",
            hashed_password=hash_password("pilotpass123"),
            trial_expires_at=datetime.now(timezone.utc) + timedelta(days=7),
        )
        db.add(p_a)

        # Photographer B
        p_b_id = generate_photographer_id()
        p_b = Photographer(
            id=p_b_id,
            email=f"beta_{p_b_id}@pilot.com",
            studio_name="Studio Beta",
            role="photographer",
            approval_status="approved",
            hashed_password=hash_password("pilotpass123"),
            trial_expires_at=datetime.now(timezone.utc) + timedelta(days=7),
        )
        db.add(p_b)
        db.commit()

        # Event owned by Photographer A
        event_a_id = generate_event_id()
        event_a = Event(
            id=event_a_id,
            photographer_id=p_a_id,
            name="Alpha Wedding",
            event_type="Wedding",
            event_date="2026-11-20",
            location="Alpha Venue",
            public_token=generate_public_token(),
            status="Active",
            is_active=True,
            face_search_enabled=True,
            downloads_enabled=True,
            original_downloads_enabled=True,
        )
        db.add(event_a)
        db.commit()

        token_a = create_access_token(p_a_id)
        token_b = create_access_token(p_b_id)

        # 1. Photographer B attempts to list events -> should NOT see Alpha Wedding
        resp_b_list = client.get(
            "/api/v1/events",
            headers={"Authorization": f"Bearer {token_b}"},
        )
        assert resp_b_list.status_code == 200
        event_ids = [e["id"] for e in resp_b_list.json()]
        assert event_a_id not in event_ids

        # 2. Photographer B attempts to access event_a directly by ID -> 403 Forbidden
        resp_b_get = client.get(
            f"/api/v1/events/{event_a_id}",
            headers={"Authorization": f"Bearer {token_b}"},
        )
        assert resp_b_get.status_code == 403

        # 3. Photographer B attempts to initiate upload to Photographer A's event -> 403 Forbidden
        dummy_img = _make_dummy_image_bytes()
        resp_b_upload = client.post(
            f"/api/v1/events/{event_a_id}/photos/upload-init",
            json={
                "filename": "unauthorized.jpg",
                "fileSize": len(dummy_img),
                "mimeType": "image/jpeg",
            },
            headers={"Authorization": f"Bearer {token_b}"},
        )
        assert resp_b_upload.status_code == 403
        assert "permission" in resp_b_upload.text.lower()

        # 4. Photographer B attempts to create subfolder in Photographer A's event -> 403 Forbidden
        resp_b_folder = client.post(
            f"/api/v1/events/{event_a_id}/folders",
            json={"name": "Hacked Folder"},
            headers={"Authorization": f"Bearer {token_b}"},
        )
        assert resp_b_folder.status_code == 403

        # 5. Photographer B attempts to trigger AI processing on Photographer A's event -> 403 Forbidden
        resp_b_proc = client.post(
            f"/api/v1/events/{event_a_id}/processing/start",
            headers={"Authorization": f"Bearer {token_b}"},
        )
        assert resp_b_proc.status_code == 403

        # 6. Photographer A can successfully access their own event
        resp_a_get = client.get(
            f"/api/v1/events/{event_a_id}",
            headers={"Authorization": f"Bearer {token_a}"},
        )
        assert resp_a_get.status_code == 200
        assert resp_a_get.json()["id"] == event_a_id
    finally:
        db.close()


def test_free_tier_no_payment_pilot_event_workflow():
    """
    End-to-end pilot workflow:
    1. Photographer provisions trial account with Free tier (no payment).
    2. Photographer uploads photo directly to storage via presigned URL.
    3. Photographer completes upload without payment gate.
    4. Client accesses public gallery via event token.
    5. Client can view photos and downloads are permitted without paywalls.
    """
    db = SessionLocal()
    try:
        p_id = generate_photographer_id()
        photographer = Photographer(
            id=p_id,
            email=f"pilot_{p_id}@client.com",
            studio_name="Grand Showcase Studio",
            role="photographer",
            approval_status="approved",
            subscription_tier="free",
            subscription_status="active",
            max_active_events=5,
            max_photos_per_event=1000,
            hashed_password=hash_password("pilotpass123"),
            trial_expires_at=datetime.now(timezone.utc) + timedelta(days=14),
        )
        db.add(photographer)

        event_id = generate_event_id()
        public_token = generate_public_token()
        event = Event(
            id=event_id,
            photographer_id=p_id,
            name="Pilot Showcase Gala",
            event_type="Gala",
            event_date="2026-10-30",
            location="Civic Center",
            public_token=public_token,
            status="Active",
            is_active=True,
            face_search_enabled=True,
            downloads_enabled=True,
            original_downloads_enabled=True,
            paywall_enabled=False,
        )
        db.add(event)
        db.commit()

        token = create_access_token(p_id)
        auth_headers = {"Authorization": f"Bearer {token}"}

        # Step 1: Upload init (no payment prompt)
        img_bytes = _make_dummy_image_bytes(color=(214, 168, 79))
        init_res = client.post(
            f"/api/v1/events/{event_id}/photos/upload-init",
            json={
                "filename": "pilot_gala_01.jpg",
                "fileSize": len(img_bytes),
                "mimeType": "image/jpeg",
            },
            headers=auth_headers,
        )
        assert init_res.status_code == 201, init_res.text
        upload_data = init_res.json()
        photo_id = upload_data["photoId"]
        upload_url = upload_data["uploadUrl"]

        # Step 2: Binary upload to storage via presigned PUT
        put_res = client.put(
            upload_url,
            content=img_bytes,
            headers={"Content-Type": "image/jpeg"},
        )
        assert put_res.status_code == 200

        # Step 3: Upload complete signal (dispatches AI and derivatives)
        complete_res = client.post(
            f"/api/v1/photos/{photo_id}/upload-complete",
            json={"photoId": photo_id},
            headers=auth_headers,
        )
        assert complete_res.status_code == 200
        assert complete_res.json()["uploadStatus"] == "uploaded"

        # Step 3.5: Curate photo to public gallery
        curate_res = client.patch(
            f"/api/v1/photos/{photo_id}/gallery-visibility",
            json={"is_public_gallery": True},
            headers=auth_headers,
        )
        assert curate_res.status_code == 200

        # Step 4: Client accesses public gallery via public token (no auth required)
        gallery_res = client.get(f"/api/v1/events/{public_token}/gallery")
        assert gallery_res.status_code == 200
        gallery_data = gallery_res.json()
        assert gallery_data["eventName"] == "Pilot Showcase Gala"
        assert gallery_data["total"] >= 1
        assert gallery_data["downloadsEnabled"] is True
        assert len(gallery_data["items"]) >= 1
        assert gallery_data["items"][0]["url"] is not None

        # Step 5: Check subscription status shows free tier active without payment required
        sub_res = client.get("/api/v1/billing/subscription", headers=auth_headers)
        assert sub_res.status_code == 200
        sub_data = sub_res.json()
        assert sub_data["tier"] == "free"
        assert sub_data["status"] == "active"
        assert sub_data["max_photos_per_event"] == 1000
    finally:
        db.close()
