"""
SnapFind AI API — FastAPI entrypoint.

Run locally with:
    uvicorn app.main:app --reload --port 8000

Interactive API docs then live at:
    http://localhost:8000/docs

Status: IMPLEMENTED (health check only)
        PLANNED (auth, events, photos, AI routes — later phases)
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import health
from app.core.config import get_settings

settings = get_settings()

app = FastAPI(
    title=settings.APP_NAME,
    description="Backend API for SnapFind AI — Scan. Find. Relive.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, tags=["health"])
