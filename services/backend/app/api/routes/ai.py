"""
AI API routes: face detection, photo ingestion processing, model metadata, and guest selfie search.
Status: IMPLEMENTED (Phase 5)
"""

from typing import Annotated
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_photographer_or_default
from app.db.session import get_db
from app.models.event import Event
from app.models.photo import Photo
from app.models.photographer import Photographer
from app.schemas.ai import FaceSearchResponse, ModelInfoOut, PhotoProcessResponse
from app.services.ai.insightface_engine import get_face_engine
from app.services.ai.service import process_photo_for_faces, search_faces_by_selfie

router = APIRouter(prefix="/ai", tags=["ai"])


@router.get("/model-info", response_model=ModelInfoOut)
def get_ai_model_info() -> ModelInfoOut:
    """Return metadata, dimension, and licensing status of the active face engine."""
    engine = get_face_engine()
    info = engine.get_model_info()
    return ModelInfoOut(
        name=info.name,
        version=info.version,
        embeddingDimension=info.embedding_dimension,
        license=info.license,
        commercialCleared=info.commercial_cleared,
        status=info.status,
    )


@router.post("/photos/{photo_id}/process", response_model=PhotoProcessResponse)
async def process_photo_endpoint(
    photo_id: str,
    photographer: Annotated[Photographer, Depends(get_current_photographer_or_default)],
    db: Annotated[Session, Depends(get_db)],
    image_file: UploadFile | None = File(None),
) -> PhotoProcessResponse:
    """
    Process an event photo: detect faces, run quality filtering, generate 512-d embeddings,
    and persist Face records to PostgreSQL pgvector.
    Requires photographer ownership of the event.
    """
    photo = db.get(Photo, photo_id)
    if not photo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Photo '{photo_id}' not found",
        )

    # Verify event ownership
    event = db.get(Event, photo.event_id)
    if not event or event.photographer_id != photographer.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to process photos for this event.",
        )

    image_bytes = None
    if image_file:
        image_bytes = await image_file.read()

    result = process_photo_for_faces(
        photo_id=photo_id,
        db=db,
        image_bytes=image_bytes,
    )

    return PhotoProcessResponse(
        photoId=result["photo_id"],
        eventId=result["event_id"],
        facesDetected=result["faces_detected"],
        facesEmbedded=result["faces_embedded"],
        facesRejected=result["faces_rejected"],
        modelName=result["model_name"],
        modelVersion=result["model_version"],
    )


@router.post("/search", response_model=FaceSearchResponse)
async def search_faces_endpoint(
    db: Annotated[Session, Depends(get_db)],
    token: Annotated[str, Form(description="Public event token or event ID")],
    selfie: Annotated[UploadFile, File(description="Uploaded guest selfie image")],
) -> FaceSearchResponse:
    """
    Guest face search endpoint:
    1. Validates uploaded selfie file format (<10MB)
    2. Enforces exactly ONE face in selfie
    3. Enforces selfie face quality
    4. Generates 512-d face embedding
    5. Performs event-scoped cosine similarity search in pgvector
    6. Returns categorized ranked matches (strong vs possible)
    7. Selfie is NEVER stored permanently (biometric privacy protection)
    """
    # Validate MIME type
    if selfie.content_type and not selfie.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please upload a valid image file (JPEG, PNG, or WebP).",
        )

    # Read bytes into memory
    selfie_bytes = await selfie.read()

    # Validate size (10MB limit)
    if len(selfie_bytes) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Image file size must be less than 10MB.",
        )

    if len(selfie_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty.",
        )

    result = search_faces_by_selfie(
        event_id_or_token=token.strip(),
        selfie_bytes=selfie_bytes,
        db=db,
    )

    return FaceSearchResponse(
        eventId=result["event_id"],
        token=result["token"],
        totalMatches=result["total_matches"],
        strongMatches=result["strong_matches"],
        possibleMatches=result["possible_matches"],
    )
