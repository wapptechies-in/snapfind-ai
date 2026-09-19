"""
Event model — represents a photoshoot or event belonging to a photographer.
Status: IMPLEMENTED (Phase 4)
"""

from datetime import datetime, timezone
import secrets
import uuid
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


def generate_event_id() -> str:
    return f"evt_{uuid.uuid4().hex[:12]}"


def generate_public_token() -> str:
    # Generates a clean, secure random 8-character alphanumeric token (e.g., "EVT8F3A2")
    return f"EVT{secrets.token_hex(3).upper()}"


class Event(Base):
    __tablename__ = "events"

    id: Mapped[str] = mapped_column(
        String(64), primary_key=True, default=generate_event_id
    )
    photographer_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("photographers.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    event_type: Mapped[str] = mapped_column(
        String(64), default="Wedding", nullable=False, index=True
    )  # Wedding, Marriage, Birthday, Sports, Family, Corporate, College/School, Candid, Nature, Other
    event_date: Mapped[str] = mapped_column(
        String(32), nullable=False
    )  # YYYY-MM-DD
    location: Mapped[str] = mapped_column(
        String(255), default="Venue unspecified", nullable=False
    )
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    cover_image_reference: Mapped[str | None] = mapped_column(
        String(512), nullable=True
    )
    status: Mapped[str] = mapped_column(
        String(32), default="Active", nullable=False, index=True
    )  # Draft, Processing, Active, Expired, Archived

    # Public token separate from internal primary key ID
    public_token: Mapped[str] = mapped_column(
        String(32), unique=True, index=True, default=generate_public_token, nullable=False
    )

    # Event policy toggle flags
    face_search_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    downloads_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    original_downloads_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    watermark_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    expiry_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    expiry_date: Mapped[str | None] = mapped_column(String(32), nullable=True)

    # Engagement counters
    gallery_views: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_downloads: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_searches: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Backward compatibility property for Phase 2 date
    @property
    def date(self) -> str:
        return self.event_date

    @date.setter
    def date(self, val: str):
        self.event_date = val

    # Backward compatibility property for cover photo url
    @property
    def cover_photo_url(self) -> str | None:
        return self.cover_image_reference

    @cover_photo_url.setter
    def cover_photo_url(self, val: str | None):
        self.cover_image_reference = val

    # Relationships
    photographer = relationship("Photographer", back_populates="events")
    photos = relationship(
        "Photo",
        back_populates="event",
        cascade="all, delete-orphan",
        order_by="desc(Photo.created_at)",
    )
    processing_jobs = relationship(
        "ProcessingJob",
        back_populates="event",
        cascade="all, delete-orphan",
        order_by="desc(ProcessingJob.created_at)",
    )
    search_sessions = relationship(
        "SearchSession",
        back_populates="event",
        cascade="all, delete-orphan",
        order_by="desc(SearchSession.created_at)",
    )
    download_logs = relationship(
        "DownloadLog",
        back_populates="event",
        cascade="all, delete-orphan",
        order_by="desc(DownloadLog.created_at)",
    )
    faces = relationship(
        "Face",
        back_populates="event",
        cascade="all, delete-orphan",
    )
