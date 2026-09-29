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
    admin,
    ai,
    auth,
    billing,
    bookings,
    dashboard,
    events,
    folders,
    guests,
    health,
    photos,
    processing,
    upload_sessions,
)
from app.core.config import get_settings
from app.db.migrate_approval import run_approval_migrations
from app.db.migrate_billing import run_billing_migrations
from app.db.migrate_cover_image import run_cover_image_migrations
from app.db.migrate_event_status import run_event_status_migrations
from app.db.migrate_folders import run_folder_migrations
from app.db.migrate_guest_whatsapp import run_guest_whatsapp_migrations
from app.db.migrate_photographer_onboarding import run_photographer_onboarding_migrations
from app.db.migrate_public_gallery import run_public_gallery_migrations
from app.db.migrate_trial_expiration import run_trial_expiration_migrations
from app.db.session import init_db
from app.services.ai.insightface_engine import get_face_engine

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan event to automatically initialize database schema, seed fixtures, and warm up AI face model."""
    init_db()
    run_approval_migrations()
    run_billing_migrations()
    run_cover_image_migrations()
    run_event_status_migrations()
    run_folder_migrations()
    run_guest_whatsapp_migrations()
    run_photographer_onboarding_migrations()
    run_public_gallery_migrations()
    run_trial_expiration_migrations()
    # AI face engine is lazy-loaded on first request to minimize boot memory
    yield


app = FastAPI(
    title=settings.APP_NAME,
    description="Backend API for SnapFind AI — Scan. Find. Relive.",
    version="0.2.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.\d+\.\d+\.\d+)(:\d+)?|null|app://.*|file://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root health router
app.include_router(health.router, tags=["health"])

# API v1 subrouter
api_v1 = APIRouter(prefix="/api/v1")
api_v1.include_router(auth.router)
api_v1.include_router(admin.router)
api_v1.include_router(events.router)
api_v1.include_router(folders.router)
api_v1.include_router(dashboard.router)
api_v1.include_router(bookings.router)
api_v1.include_router(photos.router)
api_v1.include_router(processing.router)
api_v1.include_router(upload_sessions.router)
api_v1.include_router(ai.router)
api_v1.include_router(billing.router)
api_v1.include_router(guests.router)

app.include_router(api_v1)


