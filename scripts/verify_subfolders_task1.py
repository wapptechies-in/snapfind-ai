"""
Verification script for Task 1: Sub-folders inside an Event.
Tests database schema, upload pipeline, scoped fetching, and 1 Event : 1 QR : N folders.
"""

import io
import sys
from fastapi.testclient import TestClient
from PIL import Image
from sqlalchemy import inspect

# Add backend directory to sys.path
sys.path.insert(0, "services/backend")

from app.main import app
from app.db.session import engine


def make_test_image(color=(120, 180, 240), size=(100, 100)) -> bytes:
    buf = io.BytesIO()
    img = Image.new("RGB", size, color=color)
    img.save(buf, format="JPEG")
    return buf.getvalue()


def run_verification():
    print("=" * 60)
    print("TASK 1 VERIFICATION: Sub-folders Inside an Event")
    print("=" * 60)

    # 1. Database Schema Inspection
    print("\n[1/5] Inspecting Database Schema...")
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    assert "folders" in tables, "Table 'folders' not found in database!"
    folder_cols = [c["name"] for c in inspector.get_columns("folders")]
    print(f"  + 'folders' table columns: {folder_cols}")
    assert "id" in folder_cols and "event_id" in folder_cols and "name" in folder_cols

    photo_cols = [c["name"] for c in inspector.get_columns("photos")]
    assert "folder_id" in photo_cols, "Column 'folder_id' missing from 'photos' table!"
    print(f"  + 'photos' table has 'folder_id' column: OK")

    # 2. API Lifecycle Test
    print("\n[2/5] Testing Event & Sub-folder Creation...")
    client = TestClient(app)

    ev_resp = client.post(
        "/api/v1/events",
        json={
            "name": "E2E Wedding Gala",
            "date": "2026-11-20",
            "location": "Grand Ballroom",
            "status": "active",
        },
    )
    assert ev_resp.status_code == 201, f"Failed to create event: {ev_resp.text}"
    event = ev_resp.json()
    event_id = event["id"]
    token = event["token"]
    print(f"  + Event created: {event['name']} (ID: {event_id}, Token: {token})")

    # Create sub-folders: "Ceremony" and "Reception"
    c_resp = client.post(
        f"/api/v1/events/{event_id}/folders",
        json={"name": "Ceremony"},
    )
    assert c_resp.status_code == 201, f"Failed to create Ceremony folder: {c_resp.text}"
    ceremony = c_resp.json()
    ceremony_id = ceremony["id"]
    print(f"  + Sub-folder created: {ceremony['name']} (ID: {ceremony_id})")

    r_resp = client.post(
        f"/api/v1/events/{event_id}/folders",
        json={"name": "Reception"},
    )
    assert r_resp.status_code == 201, f"Failed to create Reception folder: {r_resp.text}"
    reception = r_resp.json()
    reception_id = reception["id"]
    print(f"  + Sub-folder created: {reception['name']} (ID: {reception_id})")

    # 3. Upload photos to specific sub-folders
    print("\n[3/5] Uploading Photos into Sub-folders...")
    # Photo 1 -> Ceremony
    img1 = make_test_image(color=(255, 100, 100))
    init1 = client.post(
        f"/api/v1/events/{event_id}/photos/upload-init",
        json={"filename": "ceremony_exchange_rings.jpg", "fileSize": len(img1), "folderId": ceremony_id},
    ).json()
    client.put(init1["uploadUrl"], content=img1, headers={"Content-Type": "image/jpeg"})
    comp1 = client.post(f"/api/v1/photos/{init1['photoId']}/upload-complete", json={"photoId": init1["photoId"]}).json()
    assert comp1["folderId"] == ceremony_id
    assert comp1["folderName"] == "Ceremony"
    print(f"  + Photo 1 uploaded to Ceremony: folderId={comp1['folderId']} (Name: {comp1['folderName']})")

    # Photo 2 -> Ceremony
    img2 = make_test_image(color=(255, 150, 150))
    init2 = client.post(
        f"/api/v1/events/{event_id}/photos/upload-init",
        json={"filename": "ceremony_first_kiss.jpg", "fileSize": len(img2), "folderId": ceremony_id},
    ).json()
    client.put(init2["uploadUrl"], content=img2, headers={"Content-Type": "image/jpeg"})
    comp2 = client.post(f"/api/v1/photos/{init2['photoId']}/upload-complete", json={"photoId": init2["photoId"]}).json()
    assert comp2["folderId"] == ceremony_id
    print(f"  + Photo 2 uploaded to Ceremony: folderId={comp2['folderId']}")

    # Photo 3 -> Reception
    img3 = make_test_image(color=(100, 255, 100))
    init3 = client.post(
        f"/api/v1/events/{event_id}/photos/upload-init",
        json={"filename": "reception_first_dance.jpg", "fileSize": len(img3), "folderId": reception_id},
    ).json()
    client.put(init3["uploadUrl"], content=img3, headers={"Content-Type": "image/jpeg"})
    comp3 = client.post(f"/api/v1/photos/{init3['photoId']}/upload-complete", json={"photoId": init3["photoId"]}).json()
    assert comp3["folderId"] == reception_id
    print(f"  + Photo 3 uploaded to Reception: folderId={comp3['folderId']}")

    # Photo 4 -> Root (no folder)
    img4 = make_test_image(color=(100, 100, 255))
    init4 = client.post(
        f"/api/v1/events/{event_id}/photos/upload-init",
        json={"filename": "wedding_venue_overview.jpg", "fileSize": len(img4)},
    ).json()
    client.put(init4["uploadUrl"], content=img4, headers={"Content-Type": "image/jpeg"})
    comp4 = client.post(f"/api/v1/photos/{init4['photoId']}/upload-complete", json={"photoId": init4["photoId"]}).json()
    assert comp4["folderId"] is None
    print(f"  + Photo 4 uploaded to Root: folderId=None")

    # 4. Verify Scoped Filtering & Visibility
    print("\n[4/5] Verifying Scoped Gallery Visibility...")
    # Check folder counts
    folders_list = client.get(f"/api/v1/events/{event_id}/folders").json()
    c_meta = next(f for f in folders_list if f["id"] == ceremony_id)
    r_meta = next(f for f in folders_list if f["id"] == reception_id)
    print(f"  + Ceremony count: {c_meta['photoCount']} (expected: 2)")
    print(f"  + Reception count: {r_meta['photoCount']} (expected: 1)")
    assert c_meta["photoCount"] == 2
    assert r_meta["photoCount"] == 1

    # Fetch Ceremony gallery
    ceremony_gallery = client.get(f"/api/v1/events/{event_id}/photos?folderId={ceremony_id}").json()
    assert ceremony_gallery["total"] == 2
    c_names = [p["filename"] for p in ceremony_gallery["items"]]
    assert "ceremony_exchange_rings.jpg" in c_names and "ceremony_first_kiss.jpg" in c_names
    print(f"  + Ceremony gallery returns exactly {ceremony_gallery['total']} photos: {c_names}")

    # Fetch Reception gallery
    reception_gallery = client.get(f"/api/v1/events/{event_id}/photos?folderId={reception_id}").json()
    assert reception_gallery["total"] == 1
    assert reception_gallery["items"][0]["filename"] == "reception_first_dance.jpg"
    print(f"  + Reception gallery returns exactly {reception_gallery['total']} photo: reception_first_dance.jpg")

    # Fetch All event photos
    all_gallery = client.get(f"/api/v1/events/{event_id}/photos").json()
    assert all_gallery["total"] == 4
    print(f"  + All Photos gallery returns {all_gallery['total']} photos across all folders.")

    # 5. Verify Public QR Code Aggregates ALL Sub-folders (1 Event : 1 QR : N folders)
    print("\n[5/5] Verifying Public Event QR Code Aggregates ALL Sub-folders...")
    qr_gallery = client.get(f"/api/v1/events/{token}/public-photos").json()
    assert qr_gallery["total"] == 4, f"Expected 4 photos on QR gallery, got {qr_gallery['total']}"
    qr_names = [p["filename"] for p in qr_gallery["items"]]
    print(f"  + Public QR Gallery ({token}) contains all {qr_gallery['total']} photos:")
    for name in qr_names:
        print(f"    - {name}")
    print("  + Verified: 1 Event : 1 QR : N folders relationship preserved perfectly!")

    # Cleanup
    client.delete(f"/api/v1/events/{event_id}")
    print("\n[OK] Cleaned up test event.")
    print("\n>>> ALL TASK 1 CHECKS PASSED SUCCESSFULLY! <<<")


if __name__ == "__main__":
    run_verification()

