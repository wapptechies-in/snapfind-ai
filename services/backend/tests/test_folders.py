"""
Unit tests for Task 1: Sub-folders inside an Event.
Verifies folder CRUD, upload-association, scoped filtering,
and 1 Event : 1 QR : N folders aggregation.
"""

import io
from fastapi.testclient import TestClient
from PIL import Image
import pytest
from app.main import app

client = TestClient(app)


def _make_image_bytes(color=(100, 150, 200), size=(200, 200)) -> bytes:
    buf = io.BytesIO()
    img = Image.new("RGB", size, color=color)
    img.save(buf, format="JPEG")
    return buf.getvalue()


def test_subfolder_lifecycle_and_qr_aggregation():
    # 1. Create a test event
    ev_resp = client.post(
        "/api/v1/events",
        json={
            "name": "Folder Test Wedding",
            "date": "2026-10-15",
            "location": "St. Jude Chapel",
            "status": "active",
        },
    )
    assert ev_resp.status_code == 201
    event = ev_resp.json()
    event_id = event["id"]
    token = event["token"]

    # 2. Check initially empty folders
    f_list_resp = client.get(f"/api/v1/events/{event_id}/folders")
    assert f_list_resp.status_code == 200
    assert f_list_resp.json() == []

    # 3. Create sub-folders: "Ceremony" and "Reception"
    c_resp = client.post(
        f"/api/v1/events/{event_id}/folders",
        json={"name": "Ceremony"},
    )
    assert c_resp.status_code == 201
    ceremony = c_resp.json()
    assert ceremony["name"] == "Ceremony"
    assert ceremony["photoCount"] == 0
    ceremony_id = ceremony["id"]

    r_resp = client.post(
        f"/api/v1/events/{event_id}/folders",
        json={"name": "Reception"},
    )
    assert r_resp.status_code == 201
    reception = r_resp.json()
    assert reception["name"] == "Reception"
    reception_id = reception["id"]

    # Duplicate name should return 409
    dup_resp = client.post(
        f"/api/v1/events/{event_id}/folders",
        json={"name": "ceremony"},
    )
    assert dup_resp.status_code == 409

    # 4. Upload photo to Ceremony sub-folder
    img_c = _make_image_bytes(color=(255, 100, 100))
    init_c = client.post(
        f"/api/v1/events/{event_id}/photos/upload-init",
        json={
            "filename": "ceremony_vows.jpg",
            "fileSize": len(img_c),
            "mimeType": "image/jpeg",
            "folderId": ceremony_id,
            "isPublicGallery": False,
        },
    )
    assert init_c.status_code == 201
    photo_c_id = init_c.json()["photoId"]

    # Upload binary
    upload_url_c = init_c.json()["uploadUrl"]
    put_c = client.put(
        upload_url_c,
        content=img_c,
        headers={"Content-Type": "image/jpeg"},
    )
    assert put_c.status_code == 200

    # Complete upload
    comp_c = client.post(
        f"/api/v1/photos/{photo_c_id}/upload-complete",
        json={"photoId": photo_c_id},
    )
    assert comp_c.status_code == 200
    assert comp_c.json()["folderId"] == ceremony_id
    assert comp_c.json()["folderName"] == "Ceremony"

    # 5. Upload photo to Reception sub-folder
    img_r = _make_image_bytes(color=(100, 255, 100))
    init_r = client.post(
        f"/api/v1/events/{event_id}/photos/upload-init",
        json={
            "filename": "reception_dance.jpg",
            "fileSize": len(img_r),
            "mimeType": "image/jpeg",
            "folderId": reception_id,
            "isPublicGallery": False,
        },
    )
    assert init_r.status_code == 201
    photo_r_id = init_r.json()["photoId"]

    put_r = client.put(
        init_r.json()["uploadUrl"],
        content=img_r,
        headers={"Content-Type": "image/jpeg"},
    )
    assert put_r.status_code == 200
    comp_r = client.post(
        f"/api/v1/photos/{photo_r_id}/upload-complete",
        json={"photoId": photo_r_id},
    )
    assert comp_r.status_code == 200
    assert comp_r.json()["folderId"] == reception_id

    # 6. Upload photo to Root (no folder)
    img_root = _make_image_bytes(color=(100, 100, 255))
    init_root = client.post(
        f"/api/v1/events/{event_id}/photos/upload-init",
        json={
            "filename": "cover_shot.jpg",
            "fileSize": len(img_root),
            "mimeType": "image/jpeg",
            "isPublicGallery": False,
        },
    )
    assert init_root.status_code == 201
    photo_root_id = init_root.json()["photoId"]
    client.put(
        init_root.json()["uploadUrl"],
        content=img_root,
        headers={"Content-Type": "image/jpeg"},
    )
    client.post(
        f"/api/v1/photos/{photo_root_id}/upload-complete",
        json={"photoId": photo_root_id},
    )

    # 7. Verify folder counts updated
    f_list_after = client.get(f"/api/v1/events/{event_id}/folders").json()
    c_entry = next(f for f in f_list_after if f["id"] == ceremony_id)
    r_entry = next(f for f in f_list_after if f["id"] == reception_id)
    assert c_entry["photoCount"] == 1
    assert r_entry["photoCount"] == 1

    # 8. Test scoped photo filtering
    # Ceremony folder photos
    c_photos = client.get(f"/api/v1/events/{event_id}/photos?folderId={ceremony_id}").json()
    assert c_photos["total"] == 1
    assert c_photos["items"][0]["filename"] == "ceremony_vows.jpg"

    # Reception folder photos
    r_photos = client.get(f"/api/v1/events/{event_id}/photos?folderId={reception_id}").json()
    assert r_photos["total"] == 1
    assert r_photos["items"][0]["filename"] == "reception_dance.jpg"

    # All photos in event
    all_photos = client.get(f"/api/v1/events/{event_id}/photos").json()
    assert all_photos["total"] == 3

    # 9. Verify QR Code Public Gallery Aggregates ALL Sub-folders (1 Event : 1 QR : N folders)
    # By default, public gallery only displays photos curated by the owner (is_public_gallery=True)
    init_pub = client.get(f"/api/v1/events/{token}/public-photos").json()
    assert init_pub["total"] == 0

    # Bulk publish photos to public gallery
    bulk_resp = client.post(
        f"/api/v1/events/{event_id}/photos/gallery-visibility",
        json={"photo_ids": [photo_c_id, photo_r_id, photo_root_id], "is_public_gallery": True},
    )
    assert bulk_resp.status_code == 200

    public_qr = client.get(f"/api/v1/events/{token}/public-photos").json()
    assert public_qr["total"] == 3
    filenames = [p["filename"] for p in public_qr["items"]]
    assert "ceremony_vows.jpg" in filenames
    assert "reception_dance.jpg" in filenames
    assert "cover_shot.jpg" in filenames

    # 10. Delete Ceremony folder — verify photos are detached to root without being lost
    del_resp = client.delete(f"/api/v1/events/{event_id}/folders/{ceremony_id}")
    assert del_resp.status_code == 200

    # Photos count on event remains 3
    all_after_del = client.get(f"/api/v1/events/{event_id}/photos").json()
    assert all_after_del["total"] == 3

