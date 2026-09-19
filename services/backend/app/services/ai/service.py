"""
High-level AI orchestrator service for photo processing and customer selfie search.
Status: IMPLEMENTED (Phase 5)
"""

import logging
import os
from typing import Any
import cv2
from fastapi import HTTPException, status
import numpy as np
import requests
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.event import Event
from app.models.face import Face
from app.models.photo import Photo
from app.services.ai.insightface_engine import get_face_engine
from app.services.ai.quality import evaluate_face_quality
from app.services.ai.vector_search import search_event_faces

logger = logging.getLogger("snapfind.ai")
settings = get_settings()


def _load_image_array(
    image_bytes: bytes | None = None,
    image_path: str | None = None,
    url: str | None = None,
    storage_key: str | None = None,
) -> np.ndarray:
    """Safely decode image into BGR numpy array from bytes, storage key, local path, or URL."""
    if image_bytes:
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is not None:
            return img

    if storage_key:
        try:
            from app.services.storage import StorageService
            storage = StorageService()
            if storage.provider.object_exists(storage_key):
                data = storage.provider.get_object_bytes(storage_key)
                nparr = np.frombuffer(data, np.uint8)
                img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                if img is not None:
                    return img
        except Exception as err:
            logger.debug(f"Could not load image from storage key '{storage_key}': {err}")

    if image_path and os.path.isfile(image_path):
        img = cv2.imread(image_path)
        if img is not None:
            return img

    if url:
        # Check if URL is actually a storage key
        if not url.startswith("http://") and not url.startswith("https://") and not os.path.isfile(url):
            try:
                from app.services.storage import StorageService
                storage = StorageService()
                if storage.provider.object_exists(url):
                    data = storage.provider.get_object_bytes(url)
                    nparr = np.frombuffer(data, np.uint8)
                    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                    if img is not None:
                        return img
            except Exception:
                pass

        # Check local file path in URL
        if os.path.isfile(url):
            img = cv2.imread(url)
            if img is not None:
                return img
        # Download from HTTP(S) URL
        if url.startswith("http://") or url.startswith("https://"):
            try:
                resp = requests.get(url, timeout=10)
                if resp.status_code == 200:
                    nparr = np.frombuffer(resp.content, np.uint8)
                    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                    if img is not None:
                        return img
            except Exception as e:
                logger.warning(f"Could not download photo image from {url}: {e}")

    raise ValueError("Could not decode image from provided source.")


def process_photo_for_faces(
    photo_id: str,
    db: Session,
    image_bytes: bytes | None = None,
    image_path: str | None = None,
) -> dict[str, Any]:
    """
    Process an event photo:
    1. Load image (from storage, bytes, path, or URL)
    2. Detect all faces
    3. Evaluate face quality
    4. Generate 512-d normalized embeddings
    5. Save Face records to PostgreSQL
    """
    photo = db.get(Photo, photo_id)
    if not photo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Photo '{photo_id}' not found",
        )

    # 1. Load image
    storage_key = (
        photo.web_storage_key
        or photo.original_storage_key
        or photo.storage_key
        or photo.original_key
    )
    try:
        image = _load_image_array(
            image_bytes=image_bytes,
            image_path=image_path,
            url=photo.url,
            storage_key=storage_key,
        )
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Could not load image for photo {photo_id}: {err}",
        )

    # 2. Face detection & embeddings via FaceEngine
    engine = get_face_engine()
    model_info = engine.get_model_info()
    detected_faces = engine.detect_faces(image)

    # Clear previous face detections for this photo if re-processing
    db.query(Face).filter(Face.photo_id == photo.id).delete()

    faces_detected = len(detected_faces)
    faces_embedded = 0
    faces_rejected = 0

    for idx, face in enumerate(detected_faces):
        is_acceptable, quality_score, reason = evaluate_face_quality(image, face)

        if not is_acceptable or face.embedding is None:
            faces_rejected += 1
            logger.info(f"Photo {photo_id} Face #{idx} rejected: {reason}")
            continue

        face_record = Face(
            photo_id=photo.id,
            event_id=photo.event_id,
            face_index=idx,
            embedding=face.embedding.tolist(),
            bbox=face.bbox,
            detection_score=face.detection_score,
            face_quality_score=quality_score,
            model_name=model_info.name,
            model_version=model_info.version,
        )
        db.add(face_record)
        faces_embedded += 1

    photo.processing_status = "completed"
    db.commit()

    return {
        "photo_id": photo.id,
        "event_id": photo.event_id,
        "faces_detected": faces_detected,
        "faces_embedded": faces_embedded,
        "faces_rejected": faces_rejected,
        "model_name": model_info.name,
        "model_version": model_info.version,
    }


def search_faces_by_selfie(
    event_id_or_token: str,
    selfie_bytes: bytes,
    db: Session,
) -> dict[str, Any]:
    """
    Execute guest selfie face search:
    1. Resolve event
    2. Decode selfie in memory (strictly discarded after search)
    3. Enforce exactly ONE face
    4. Enforce face quality
    5. Generate query embedding
    6. Search PostgreSQL pgvector scoped to event_id
    7. Return categorized matches
    """
    # 1. Resolve event
    event = db.scalar(
        select(Event).where(
            or_(
                Event.id == event_id_or_token,
                Event.public_token == event_id_or_token,
            )
        )
    )
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Event '{event_id_or_token}' not found",
        )

    if not event.face_search_enabled:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Face search is disabled for this event gallery.",
        )

    # 2. Decode selfie into memory
    nparr = np.frombuffer(selfie_bytes, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if image is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid image format. Please upload a clear JPEG, PNG, or WebP selfie.",
        )

    # 3. Detect faces
    engine = get_face_engine()
    detected_faces = engine.detect_faces(image)

    # Enforce exactly one face
    if len(detected_faces) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No face detected. Please upload a clear, well-lit selfie.",
        )
    if len(detected_faces) > 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Multiple faces detected. Please upload a selfie containing only you.",
        )

    selfie_face = detected_faces[0]

    # 4. Enforce quality
    is_acceptable, quality_score, reason = evaluate_face_quality(image, selfie_face)
    if not is_acceptable:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Face quality is too low: {reason}. Please upload a clearer image.",
        )

    # 5. Extract query embedding
    query_vector = selfie_face.embedding
    if query_vector is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to extract facial embedding from selfie.",
        )

    # 6. Event-scoped similarity search
    matches = search_event_faces(
        event_id=event.id,
        query_vector=query_vector,
        db=db,
        top_k=settings.TOP_K,
        min_similarity=settings.POSSIBLE_MATCH_THRESHOLD,
    )

    # Increment search analytics
    event.total_searches += 1
    db.commit()

    # 7. Format output for customer frontend
    strong_matches = []
    possible_matches = []

    for m in matches:
        photo = m["photo"]
        photo_dict = {
            "id": photo.id,
            "eventId": photo.event_id,
            "filename": photo.filename,
            "url": photo.url or "",
            "thumbnailUrl": photo.thumbnail_url or photo.url or "",
            "width": photo.width,
            "height": photo.height,
            "uploadedAt": photo.created_at.isoformat(),
            "matchConfidence": m["confidence_percent"],
            "similarity": m["similarity"],
        }
        if m["category"] == "strong":
            strong_matches.append(photo_dict)
        else:
            possible_matches.append(photo_dict)

    return {
        "event_id": event.id,
        "token": event.public_token,
        "total_matches": len(matches),
        "strong_matches": strong_matches,
        "possible_matches": possible_matches,
    }

