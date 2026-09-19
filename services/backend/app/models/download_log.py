"""
DownloadLog model — tracks future download activity.
Status: IMPLEMENTED (Phase 4 Database Architecture)
"""

from datetime import datetime, timezone
import uuid
from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


def generate_download_id() -> str:
    return f"dl_{uuid.uuid4().hex[:12]}"


class DownloadLog(Base):
    __tablename__ = "download_logs"

    id: Mapped[str] = mapped_column(
        String(64), primary_key=True, default=generate_download_id
    )
    event_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("events.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    photo_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("photos.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    download_type: Mapped[str] = mapped_column(
        String(32), default="web", nullable=False
    )  # web, original, batch
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    event = relationship("Event", back_populates="download_logs")
    photo = relationship("Photo", back_populates="download_logs")

