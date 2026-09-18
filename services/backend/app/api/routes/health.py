"""
Health check route.

Status: IMPLEMENTED
"""

from fastapi import APIRouter

from app.core.config import get_settings

router = APIRouter()
settings = get_settings()


@router.get("/")
def read_root() -> dict[str, str]:
    """
    Root health check. The SnapFind Web dashboard calls this to show
    'Backend Status: Connected' / 'Backend Status: Offline'.
    """
    return {
        "name": settings.APP_NAME,
        "status": "running",
        "environment": settings.ENVIRONMENT,
    }
