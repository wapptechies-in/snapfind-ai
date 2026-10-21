"""
SnapFind AI API — FastAPI entrypoint.

Run locally with:
    uvicorn app.main:app --reload --port 8000

Interactive API docs live at:
    http://localhost:8000/docs

Status: IMPLEMENTED (Health, Auth, Events CRUD, Dashboard metrics — Phase 2)
"""

from contextlib import asynccontextmanager
import logging
from fastapi import APIRouter, FastAPI, HTTPException, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

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
from app.core.limiter import limiter
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


is_prod = settings.ENVIRONMENT.lower() == "production"
logger = logging.getLogger("snapfind.api")

app = FastAPI(
    title=settings.APP_NAME,
    description="Backend API for SnapFind AI — Scan. Find. Relive.",
    version="0.2.0",
    lifespan=lifespan,
    docs_url=None if is_prod else "/docs",
    redoc_url=None if is_prod else "/redoc",
    openapi_url=None if is_prod else "/openapi.json",
)

# SlowAPI rate limiter state and error handler
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# 4. Error sanitization middleware (catches uncaught exceptions in production)
@app.middleware("http")
async def error_sanitization_middleware(request: Request, call_next):
    try:
        return await call_next(request)
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception(f"Unhandled server error processing {request.method} {request.url.path}: {exc}")
        if is_prod:
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={"detail": "Internal Server Error. Please contact support if the issue persists."},
            )
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": str(exc)},
        )

# 5. File upload size limit middleware (50MB max)
MAX_UPLOAD_SIZE_BYTES = getattr(settings, "MAX_UPLOAD_SIZE_MB", 50) * 1024 * 1024

@app.middleware("http")
async def upload_size_limit_middleware(request: Request, call_next):
    # Check Content-Length header on mutating requests
    if request.method in ("POST", "PUT", "PATCH"):
        content_length = request.headers.get("content-length")
        if content_length:
            try:
                length = int(content_length)
                if length > MAX_UPLOAD_SIZE_BYTES:
                    return JSONResponse(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        content={"detail": f"Payload too large. Maximum allowed upload size is {settings.MAX_UPLOAD_SIZE_MB}MB."},
                    )
            except ValueError:
                pass
    return await call_next(request)

# Security headers middleware (OWASP recommended defense-in-depth)
@app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    if is_prod:
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
    return response

# 3. Tightened CORS configuration
configured_origins = [o for o in settings.cors_origins_list if o not in ("*", "null")]

# In production allow configured origins + any Vercel deployment; in dev allow local LAN + Vercel
prod_origin_regex = r"https://.*\.vercel\.app"
dev_origin_regex = (
    r"https?://(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|.*\.vercel\.app|.*\.onrender\.com|.*\.snapfind\.ai)(:\d+)?"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=configured_origins,
    allow_origin_regex=prod_origin_regex if is_prod else dev_origin_regex,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"] if is_prod else ["*"],
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


