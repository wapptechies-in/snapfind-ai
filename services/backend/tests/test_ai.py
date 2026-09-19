"""
AI test suite: face detection, quality filtering, embedding normalization,
photo processing, exactly-1-face selfie validation, and event-scoped vector search.

Status: IMPLEMENTED (Phase 5)
"""

import os
import cv2
import numpy as np
from fastapi.testclient import TestClient
import pytest

from app.main import app
from app.services.ai.insightface_engine import get_face_engine
from app.services.ai.quality import evaluate_face_quality

client = TestClient(app)

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")


def test_model_info_endpoint():
    """Verify model metadata, 512-d embedding, and development-only license."""
    resp = client.get("/api/v1/ai/model-info")
    assert resp.status_code == 200
    data = resp.json()
    assert data["name"] == "insightface"
    assert data["version"] == "buffalo_s"
    assert data["embeddingDimension"] == 512
    assert data["commercialCleared"] is False
    assert data["status"] == "DEVELOPMENT / TEST ONLY"


def test_face_detection_and_embedding_properties():
    """Verify face detection and normalized 512-d unit vector generation."""
    engine = get_face_engine()
    p1_path = os.path.join(DATA_DIR, "person1_portrait.jpg")
    img = cv2.imread(p1_path)
    assert img is not None

    faces = engine.detect_faces(img)
    assert len(faces) == 1
    face = faces[0]
    assert face.detection_score > 0.75
    assert len(face.bbox) == 4
    assert face.embedding is not None
    assert face.embedding.shape == (512,)

    # Verify L2 unit normalization
    norm = float(np.linalg.norm(face.embedding))
    assert abs(norm - 1.0) < 1e-4


def test_face_detection_scenarios():
    """Verify multiple faces and no-face scenarios."""
    engine = get_face_engine()

    # 1. Group / multiple faces
    group_img = cv2.imread(os.path.join(DATA_DIR, "group_faces.jpg"))
    faces_group = engine.detect_faces(group_img)
    assert len(faces_group) == 2

    # 2. No face image
    no_face_img = cv2.imread(os.path.join(DATA_DIR, "no_face.jpg"))
    faces_none = engine.detect_faces(no_face_img)
    assert len(faces_none) == 0


def test_face_quality_evaluation():
    """Verify blur and quality filtering."""
    engine = get_face_engine()
    p1_img = cv2.imread(os.path.join(DATA_DIR, "person1_portrait.jpg"))
    face = engine.detect_faces(p1_img)[0]

    # Sharp face passes
    is_ok, quality, reason = evaluate_face_quality(p1_img, face)
    assert is_ok is True
    assert quality > 0.6
    assert reason is None

    # Artificially blur the face crop and verify rejection
    blurred_img = cv2.GaussianBlur(p1_img, (51, 51), 30)
    # create synthetic detected face with blurred crop
    is_ok_blur, quality_blur, reason_blur = evaluate_face_quality(
        blurred_img, face, blur_threshold=15.0
    )
    assert is_ok_blur is False
    assert "blurry" in reason_blur.lower()


def test_photo_processing_and_event_scoped_search():
    """
    Complete end-to-end integration test:
    1. Create two separate events: Event A and Event B
    2. Upload Person 1 to Event A
    3. Upload Person 2 to Event B
    4. Process photos to extract and persist 512-d embeddings in pgvector
    5. Search with Person 1 selfie in Event A -> MATCH FOUND (strong)
    6. Search with Person 1 selfie in Event B -> NO MATCH (strict event isolation!)
    """
    # Create Event A
    resp_a = client.post(
        "/api/v1/events",
        json={"name": "Wedding Event A", "date": "2026-06-01", "status": "active"},
    )
    assert resp_a.status_code == 201
    event_a = resp_a.json()
    event_a_id = event_a["id"]
    event_a_token = event_a["token"]

    # Create Event B
    resp_b = client.post(
        "/api/v1/events",
        json={"name": "Conference Event B", "date": "2026-06-02", "status": "active"},
    )
    assert resp_b.status_code == 201
    event_b = resp_b.json()
    event_b_id = event_b["id"]
    event_b_token = event_b["token"]

    # Add Photo 1 (Person 1) to Event A
    p1_path = os.path.join(DATA_DIR, "person1_portrait.jpg")
    photo_a_resp = client.post(
        f"/api/v1/events/{event_a_id}/photos",
        json={"filename": "person1_portrait.jpg", "url": p1_path},
    )
    assert photo_a_resp.status_code == 201
    photo_a = photo_a_resp.json()

    # Add Photo 2 (Person 2) to Event B
    p2_path = os.path.join(DATA_DIR, "person2_portrait.jpg")
    photo_b_resp = client.post(
        f"/api/v1/events/{event_b_id}/photos",
        json={"filename": "person2_portrait.jpg", "url": p2_path},
    )
    assert photo_b_resp.status_code == 201
    photo_b = photo_b_resp.json()

    # Process Photo A
    with open(p1_path, "rb") as f:
        proc_a = client.post(
            f"/api/v1/ai/photos/{photo_a['id']}/process",
            files={"image_file": ("person1.jpg", f, "image/jpeg")},
        )
    assert proc_a.status_code == 200
    assert proc_a.json()["facesEmbedded"] == 1

    # Process Photo B
    with open(p2_path, "rb") as f:
        proc_b = client.post(
            f"/api/v1/ai/photos/{photo_b['id']}/process",
            files={"image_file": ("person2.jpg", f, "image/jpeg")},
        )
    assert proc_b.status_code == 200
    assert proc_b.json()["facesEmbedded"] == 1

    # Search with Person 1 selfie in Event A
    selfie_path = os.path.join(DATA_DIR, "person1_selfie.jpg")
    with open(selfie_path, "rb") as f:
        search_a = client.post(
            "/api/v1/ai/search",
            data={"token": event_a_token},
            files={"selfie": ("selfie.jpg", f, "image/jpeg")},
        )
    assert search_a.status_code == 200
    data_a = search_a.json()
    assert data_a["totalMatches"] >= 1
    assert any(p["id"] == photo_a["id"] for p in data_a["strongMatches"])
    matched_photo = next(p for p in data_a["strongMatches"] if p["id"] == photo_a["id"])
    assert matched_photo["matchConfidence"] >= 80

    # Search with Person 1 selfie in Event B (MUST NOT MATCH — Event Isolation!)
    with open(selfie_path, "rb") as f:
        search_b = client.post(
            "/api/v1/ai/search",
            data={"token": event_b_token},
            files={"selfie": ("selfie.jpg", f, "image/jpeg")},
        )
    assert search_b.status_code == 200
    data_b = search_b.json()
    # Event B has Person 2, so Person 1 selfie should have 0 matches
    assert data_b["totalMatches"] == 0
    assert len(data_b["strongMatches"]) == 0


def test_selfie_validation_errors():
    """Verify exactly-one-face enforcement on guest selfie search."""
    # 1. Multiple faces in selfie
    group_path = os.path.join(DATA_DIR, "group_faces.jpg")
    with open(group_path, "rb") as f:
        resp = client.post(
            "/api/v1/ai/search",
            data={"token": "EVT_TEST"},
            files={"selfie": ("group.jpg", f, "image/jpeg")},
        )
    # If event does not exist, 404 is returned first
    assert resp.status_code in [400, 404]

    # Create a dummy event to test the multi-face validation directly
    ev_resp = client.post(
        "/api/v1/events",
        json={"name": "Test Event", "date": "2026-07-01", "status": "active"},
    )
    token = ev_resp.json()["token"]

    with open(group_path, "rb") as f:
        resp_multi = client.post(
            "/api/v1/ai/search",
            data={"token": token},
            files={"selfie": ("group.jpg", f, "image/jpeg")},
        )
    assert resp_multi.status_code == 400
    assert "multiple faces" in resp_multi.json()["detail"].lower()

    # 2. No face in selfie
    no_face_path = os.path.join(DATA_DIR, "no_face.jpg")
    with open(no_face_path, "rb") as f:
        resp_none = client.post(
            "/api/v1/ai/search",
            data={"token": token},
            files={"selfie": ("none.jpg", f, "image/jpeg")},
        )
    assert resp_none.status_code == 400
    assert "no face detected" in resp_none.json()["detail"].lower()

