"""
SnapFind AI API — FastAPI entrypoint.

Run locally with:
    uvicorn app.main:app --reload --port 8000

Interactive API docs live at:
    http://localhost:8000/docs

Status: IMPLEMENTED (Health, Auth, Events CRUD, Dashboard metrics — Phase 2)
"""

from contextlib import asynccontextmanager
from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import (
    ai,
    auth,
    bookings,
    dashboard,
    events,
    health,
    photos,
    processing,
    upload_sessions,
)
from app.core.config import get_settings
from app.db.session import init_db
from app.services.ai.insightface_engine import get_face_engine

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan event to automatically initialize database schema, seed fixtures, and warm up AI face model."""
    init_db()
    # Warm up face engine singleton so it is ready for instant inference
    get_face_engine()
    yield


app = FastAPI(
    title=settings.APP_NAME,
    description="Backend API for SnapFind AI — Scan. Find. Relive.",
    version="0.2.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?|null|app://.*|file://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root health router
app.include_router(health.router, tags=["health"])

# API v1 subrouter
api_v1 = APIRouter(prefix="/api/v1")
api_v1.include_router(auth.router)
api_v1.include_router(events.router)
api_v1.include_router(dashboard.router)
api_v1.include_router(bookings.router)
api_v1.include_router(photos.router)
api_v1.include_router(processing.router)
api_v1.include_router(upload_sessions.router)
api_v1.include_router(ai.router)

app.include_router(api_v1)


