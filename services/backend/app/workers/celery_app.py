"""
Celery Application Configuration for SnapFind AI.
Status: IMPLEMENTED (Phase 7)
"""

import logging
from celery import Celery
from celery.signals import worker_process_init, worker_ready

from app.core.config import get_settings

logger = logging.getLogger("snapfind.worker")
settings = get_settings()

celery_app = Celery(
    "snapfind_worker",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=["app.workers.tasks.photo_tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    worker_prefetch_multiplier=1,
    broker_connection_retry_on_startup=True,
    task_track_started=True,
    result_expires=86400,  # 24 hours
)


@worker_ready.connect
def on_worker_ready(sender, **kwargs):
    logger.info("SnapFind Celery worker ready to process tasks.")


@worker_process_init.connect
def on_worker_process_init(**kwargs):
    """
    Pre-warm AI face recognition engine inside worker process.
    Prevents per-task cold-start latency when first photo is processed.
    """
    try:
        from app.services.ai.insightface_engine import get_face_engine
        engine = get_face_engine()
        info = engine.get_model_info()
        logger.info(f"Worker AI FaceEngine pre-warmed successfully: {info.name} ({info.version})")
    except Exception as e:
        logger.warning(f"Could not pre-warm FaceEngine in worker process: {e}")
