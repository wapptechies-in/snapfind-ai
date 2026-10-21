"""
Health check routes: root and /api/v1/health with real database connectivity check.
Status: IMPLEMENTED (Phase 4)
"""

from typing import Annotated
from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.session import get_db
from app.schemas.health import HealthOut

router = APIRouter(tags=["health"])
settings = get_settings()


@router.get("/")
def read_root() -> dict[str, str]:
    """
    Root health check for backward compatibility.
    Dashboard shows 'Backend Status: Connected'.
    """
    return {
        "name": settings.APP_NAME,
        "status": "running",
        "environment": settings.ENVIRONMENT,
    }


@router.get("/health", response_model=HealthOut)
@router.get("/api/v1/health", response_model=HealthOut)
def get_v1_health(db: Annotated[Session, Depends(get_db)]) -> HealthOut:
    """
    Structured health check verifying API status and PostgreSQL connection.
    Supports both /health and /api/v1/health.
    """
    db_status = "connected"
    try:
        db.execute(text("SELECT 1"))
    except Exception:
        db_status = "disconnected"

    redis_status = "unconfigured"
    redis_url = getattr(settings, "REDIS_URL", None)
    if redis_url:
        try:
            import redis
            r = redis.from_url(redis_url, socket_timeout=1.0)
            r.ping()
            redis_status = "connected"
        except Exception:
            redis_status = "disconnected"

    is_healthy = db_status == "connected" and (redis_status in ("connected", "unconfigured"))

    return HealthOut(
        status="ok" if is_healthy else "degraded",
        service="snapfind-api",
        version="0.2.0",
        database=db_status,
        redis=redis_status,
        environment=settings.ENVIRONMENT,
    )
