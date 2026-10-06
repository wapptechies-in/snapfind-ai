"""
AI API routes: face detection, photo ingestion processing, model metadata, and guest selfie search.
Status: IMPLEMENTED (Phase 5)
"""

from typing import Annotated
from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_photographer
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
    photographer: Annotated[Photographer, Depends(get_current_photographer)],
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
    request: Request,
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
        request=request,
    )

    return FaceSearchResponse(
        eventId=result["event_id"],
        token=result["token"],
        totalMatches=result["total_matches"],
        strongMatches=result["strong_matches"],
        possibleMatches=result["possible_matches"],
    )


import concurrent.futures
import gc
import json
import logging
from datetime import datetime, timezone
from app.db.session import SessionLocal
from app.models.search_job import SearchJob, generate_search_job_id
from app.schemas.search_job import SearchJobOut
from app.services.rate_limit import check_rate_limit

logger = logging.getLogger("snapfind.ai.async")
_SEARCH_EXECUTOR = concurrent.futures.ThreadPoolExecutor(max_workers=1, thread_name_prefix="face_search_worker")


def _run_search_job_background(job_id: str, event_id: str, selfie_bytes: bytes, base_url: str):
    """Background worker executing CPU/GPU face detection and pgvector search without blocking FastAPI."""
    db = SessionLocal()
    try:
        job = db.get(SearchJob, job_id)
        if not job:
            return
        job.status = "processing"
        job.progress_percent = 35
        db.commit()

        class _MockReq:
            def __init__(self, b_url: str):
                self.base_url = b_url

        result = search_faces_by_selfie(
            event_id_or_token=event_id,
            selfie_bytes=selfie_bytes,
            db=db,
            request=_MockReq(base_url),
        )

        job.status = "completed"
        job.progress_percent = 100
        job.total_matches = result["total_matches"]
        job.results_json = json.dumps({
            "strongMatches": result["strong_matches"],
            "possibleMatches": result["possible_matches"],
        })
        job.completed_at = datetime.now(timezone.utc)

        # Update event metric
        event = db.get(Event, event_id)
        if event:
            event.total_matches_found += result["total_matches"]

        db.commit()
    except Exception as exc:
        logger.warning(f"Async SearchJob {job_id} error: {exc}")
        try:
            job = db.get(SearchJob, job_id)
            if job:
                job.status = "failed"
                # Extract clean user-facing error message without HTTP status codes
                if hasattr(exc, "detail") and isinstance(exc.detail, str):
                    err_msg = exc.detail
                else:
                    err_msg = str(exc)
                    for prefix in ("400: ", "403: ", "404: ", "500: "):
                        if err_msg.startswith(prefix):
                            err_msg = err_msg[len(prefix):]
                            break
                job.error_message = err_msg
                job.completed_at = datetime.now(timezone.utc)
                db.commit()
        except Exception:
            pass
    finally:
        db.close()


@router.post("/search-async", response_model=SearchJobOut, status_code=status.HTTP_202_ACCEPTED)
async def search_faces_async_endpoint(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    token: Annotated[str, Form(description="Public event token or event ID")],
    selfie: Annotated[UploadFile, File(description="Uploaded guest selfie image")],
    guest_id: Annotated[str | None, Form(description="Optional registered guest ID")] = None,
) -> SearchJobOut:
    """
    Non-blocking async selfie search:
    1. Validates format and size (<10MB).
    2. Spawns background search task.
    3. Returns 202 Accepted with SearchJobOut immediately.
    """
    check_rate_limit(request, "selfie_search", max_requests=15, window_seconds=60)

    # Validate MIME type
    if selfie.content_type and not selfie.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please upload a valid image file (JPEG, PNG, or WebP).",
        )

    selfie_bytes = await selfie.read()
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

    # Resolve event
    from app.api.routes.guests import _resolve_event
    event = _resolve_event(token.strip(), db)

    job_id = generate_search_job_id()
    now = datetime.now(timezone.utc)
    job = SearchJob(
        id=job_id,
        event_id=event.id,
        guest_id=guest_id.strip() if guest_id else None,
        status="queued",
        progress_percent=10,
        total_matches=0,
        created_at=now,
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    # Submit to thread pool worker
    base_url_str = str(request.base_url)
    _SEARCH_EXECUTOR.submit(
        _run_search_job_background,
        job.id,
        event.id,
        selfie_bytes,
        base_url_str,
    )

    return SearchJobOut(
        jobId=job.id,
        eventId=job.event_id,
        guestId=job.guest_id,
        status=job.status,
        progressPercent=job.progress_percent,
        totalMatches=0,
        strongMatches=[],
        possibleMatches=[],
        errorMessage=None,
        createdAt=job.created_at.isoformat(),
        completedAt=None,
    )


@router.get("/jobs/{job_id}", response_model=SearchJobOut)
def get_search_job_status(
    job_id: str,
    db: Annotated[Session, Depends(get_db)],
) -> SearchJobOut:
    """Poll search job status and retrieve matched photos when completed."""
    job = db.get(SearchJob, job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Search job '{job_id}' not found.",
        )

    strong_matches = []
    possible_matches = []
    if job.results_json:
        try:
            parsed = json.loads(job.results_json)
            strong_matches = parsed.get("strongMatches", [])
            possible_matches = parsed.get("possibleMatches", [])
        except Exception:
            pass

    return SearchJobOut(
        jobId=job.id,
        eventId=job.event_id,
        guestId=job.guest_id,
        status=job.status,
        progressPercent=job.progress_percent,
        totalMatches=job.total_matches,
        strongMatches=strong_matches,
        possibleMatches=possible_matches,
        errorMessage=job.error_message,
        createdAt=job.created_at.isoformat(),
        completedAt=job.completed_at.isoformat() if job.completed_at else None,
    )


