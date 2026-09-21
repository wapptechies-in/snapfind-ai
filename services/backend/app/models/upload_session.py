"""
UploadSession and UploadSessionItem models — track desktop batch upload sessions.
Status: IMPLEMENTED (Phase 8 Desktop Architecture)
"""

from datetime import datetime, timezone
import uuid
from sqlalchemy import BigInteger, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


def generate_upload_session_id() -> str:
    return f"ups_{uuid.uuid4().hex[:12]}"


def generate_upload_session_item_id() -> str:
    return f"usi_{uuid.uuid4().hex[:12]}"


class UploadSession(Base):
    __tablename__ = "upload_sessions"

    id: Mapped[str] = mapped_column(
        String(64), primary_key=True, default=generate_upload_session_id
    )
    event_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("events.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    photographer_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("photographers.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), default="Desktop Upload Session")
    status: Mapped[str] = mapped_column(
        String(32), default="active", nullable=False, index=True
    )  # active, completed, cancelled, paused
    total_files: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    uploaded_files: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    failed_files: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_bytes: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)
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
    event = relationship("Event", backref="upload_sessions")
    photographer = relationship("Photographer", backref="upload_sessions")
    items = relationship(
        "UploadSessionItem",
        back_populates="upload_session",
        cascade="all, delete-orphan",
        order_by="UploadSessionItem.created_at",
    )


class UploadSessionItem(Base):
    __tablename__ = "upload_session_items"

    id: Mapped[str] = mapped_column(
        String(64), primary_key=True, default=generate_upload_session_item_id
    )
    upload_session_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("upload_sessions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    photo_id: Mapped[str | None] = mapped_column(
        String(64),
        ForeignKey("photos.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    file_size: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)
    checksum: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    status: Mapped[str] = mapped_column(
        String(32), default="pending", nullable=False, index=True
    )  # pending, uploading, uploaded, failed, skipped
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    retry_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
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
    upload_session = relationship("UploadSession", back_populates="items")
    photo = relationship("Photo")
