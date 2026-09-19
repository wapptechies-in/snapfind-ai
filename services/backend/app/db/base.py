"""
SQLAlchemy declarative Base and imported models for Alembic metadata discovery.
Status: IMPLEMENTED (Phase 4)
"""

from app.db.session import Base
from app.models.user import User
from app.models.photographer import Photographer
from app.models.event import Event
from app.models.photo import Photo
from app.models.face import Face
from app.models.processing_job import ProcessingJob
from app.models.search_session import SearchSession
from app.models.download_log import DownloadLog
from app.models.audit_log import AuditLog
from app.models.booking import Booking

__all__ = [
    "Base",
    "User",
    "Photographer",
    "Event",
    "Photo",
    "Face",
    "ProcessingJob",
    "SearchSession",
    "DownloadLog",
    "AuditLog",
    "Booking",
]

