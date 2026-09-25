"""
Photo model — represents a photo associated with an event.
Status: IMPLEMENTED (Phase 4)
"""

from datetime import datetime, timezone
import uuid
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


def generate_photo_id() -> str:
    return f"pho_{uuid.uuid4().hex[:12]}"


class Photo(Base):
    __tablename__ = "photos"

    id: Mapped[str] = mapped_column(
        String(64), primary_key=True, default=generate_photo_id
    )
    event_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("events.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    folder_id: Mapped[str | None] = mapped_column(
        String(64),
        ForeignKey("folders.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    original_filename: Mapped[str | None] = mapped_column(String(255), nullable=True)
    storage_key: Mapped[str | None] = mapped_column(String(512), nullable=True)
    original_storage_key: Mapped[str | None] = mapped_column(String(512), nullable=True)
    web_storage_key: Mapped[str | None] = mapped_column(String(512), nullable=True)
    thumbnail_storage_key: Mapped[str | None] = mapped_column(String(512), nullable=True)
    thumbnail_key: Mapped[str | None] = mapped_column(String(512), nullable=True)
    web_image_key: Mapped[str | None] = mapped_column(String(512), nullable=True)
    original_key: Mapped[str | None] = mapped_column(String(512), nullable=True)
    width: Mapped[int | None] = mapped_column(Integer, nullable=True)
    height: Mapped[int | None] = mapped_column(Integer, nullable=True)
    file_size: Mapped[int | None] = mapped_column(Integer, nullable=True)
    mime_type: Mapped[str | None] = mapped_column(String(64), default="image/jpeg", nullable=True)
    checksum: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    upload_status: Mapped[str] = mapped_column(
        String(32), default="uploaded", nullable=False, index=True
    )  # pending, uploading, uploaded, failed
    processing_status: Mapped[str] = mapped_column(
        String(32), default="completed", nullable=False, index=True
    )  # pending, processing, completed, failed
    is_public_gallery: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False, server_default="0", index=True
    )
    url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    thumbnail_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
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

    # Relationships
    event = relationship("Event", back_populates="photos")
    folder = relationship("Folder", back_populates="photos")
    faces = relationship(
        "Face",
        back_populates="photo",
        cascade="all, delete-orphan",
    )
    download_logs = relationship(
        "DownloadLog",
        back_populates="photo",
        cascade="all, delete-orphan",
    )
    processing_jobs = relationship(
        "ProcessingJob",
        back_populates="photo",
        cascade="all, delete-orphan",
    )
