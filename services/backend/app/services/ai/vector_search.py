"""
Vector search module using PostgreSQL and pgvector.
Implements event-scoped cosine similarity search.

Status: IMPLEMENTED (Phase 5)
"""

from typing import Any
import numpy as np
from sqlalchemy import desc, func, select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.face import Face
from app.models.photo import Photo

settings = get_settings()


def search_event_faces(
    event_id: str,
    query_vector: np.ndarray | list[float],
    db: Session,
    top_k: int | None = None,
    min_similarity: float | None = None,
) -> list[dict[str, Any]]:
    """
    Perform event-scoped cosine similarity search.
    Strictly isolated to faces belonging to the specified event_id.

    Returns a list of match dictionaries ordered by highest similarity:
    [
        {
            "photo_id": str,
            "face_id": str,
            "similarity": float,  # (0.0 to 1.0)
            "category": "strong" | "possible",
            "photo": Photo
        },
        ...
    ]
    """
    top_k = top_k or settings.TOP_K
    min_similarity = min_similarity if min_similarity is not None else settings.POSSIBLE_MATCH_THRESHOLD
    strong_threshold = settings.STRONG_MATCH_THRESHOLD

    # Ensure vector format
    if isinstance(query_vector, np.ndarray):
        vec_list = query_vector.tolist()
    else:
        vec_list = list(query_vector)

    is_sqlite = False
    try:
        bind = db.get_bind()
        if bind and bind.dialect.name == "sqlite":
            is_sqlite = True
    except Exception:
        pass

    ranked_matches: list[dict[str, Any]] = []

    if is_sqlite:
        # SQLite in-memory cosine similarity fallback (dev/offline mode)
        faces_with_photos = db.execute(
            select(Photo, Face)
            .join(Photo, Photo.id == Face.photo_id)
            .where(Face.event_id == event_id)
            .where(Face.embedding.isnot(None))
        ).all()

        q_vec = np.array(vec_list, dtype=np.float32)
        q_norm = np.linalg.norm(q_vec)
        if q_norm > 0:
            q_vec = q_vec / q_norm

        scored: list[tuple[Photo, str, float]] = []
        for photo, face in faces_with_photos:
            if not face.embedding:
                continue
            f_vec = np.array(face.embedding, dtype=np.float32)
            f_norm = np.linalg.norm(f_vec)
            if f_norm > 0:
                f_vec = f_vec / f_norm
            sim = float(np.dot(q_vec, f_vec))
            if sim >= min_similarity:
                scored.append((photo, face.id, sim))

        scored.sort(key=lambda x: x[2], reverse=True)

        seen_photos: set[str] = set()
        for photo, face_id, similarity in scored:
            if photo.id in seen_photos:
                continue
            seen_photos.add(photo.id)

            sim_float = float(round(similarity, 4))
            category = "strong" if sim_float >= strong_threshold else "possible"

            ranked_matches.append({
                "photo_id": photo.id,
                "face_id": face_id,
                "similarity": sim_float,
                "confidence_percent": int(round(sim_float * 100)),
                "category": category,
                "photo": photo,
            })

            if len(ranked_matches) >= top_k:
                break

        return ranked_matches

    # PostgreSQL + pgvector branch
    distance_expr = Face.embedding.cosine_distance(vec_list)
    similarity_expr = (1.0 - distance_expr).label("similarity")

    query = (
        select(
            Photo,
            Face.id.label("face_id"),
            similarity_expr,
        )
        .join(Photo, Photo.id == Face.photo_id)
        .where(Face.event_id == event_id)
        .where(Face.embedding.isnot(None))
        .where(similarity_expr >= min_similarity)
        .order_by(desc("similarity"))
        .limit(top_k * 2)  # retrieve candidates before photo deduplication
    )

    results = db.execute(query).all()

    seen_photos: set[str] = set()
    for photo, face_id, similarity in results:
        if photo.id in seen_photos:
            continue
        seen_photos.add(photo.id)

        sim_float = float(round(similarity, 4))
        category = "strong" if sim_float >= strong_threshold else "possible"

        ranked_matches.append({
            "photo_id": photo.id,
            "face_id": face_id,
            "similarity": sim_float,
            "confidence_percent": int(round(sim_float * 100)),
            "category": category,
            "photo": photo,
        })

        if len(ranked_matches) >= top_k:
            break

    return ranked_matches

