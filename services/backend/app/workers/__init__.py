"""
Celery worker package for SnapFind AI.
Status: IMPLEMENTED (Phase 7)
"""

from app.workers.celery_app import celery_app

__all__ = ["celery_app"]

