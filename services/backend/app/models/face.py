"""
Face model — facial detection metadata and pgvector embeddings.
Status: IMPLEMENTED (Phase 5)
"""

from datetime import datetime, timezone
from typing import Any
import uuid
from pgvector.sqlalchemy import Vector
from sqlalchemy import DateTime, Float, ForeignKey, Integer, JSON, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


def generate_face_id() -> str:
    return f"face_{uuid.uuid4().hex[:12]}"


class Face(Base):
    __tablename__ = "faces"

    id: Mapped[str] = mapped_column(
        String(64), primary_key=True, default=generate_face_id
    )
    photo_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("photos.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    event_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("events.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    face_index: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # 512-dimensional face embedding vector using pgvector
    embedding = mapped_column(Vector(512), nullable=True)

    # Bounding box as [x, y, w, h]
    bbox: Mapped[dict[str, Any] | list[Any]] = mapped_column(
        JSON, default=list, nullable=False
    )
    detection_score: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)
    face_quality_score: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)

    model_name: Mapped[str] = mapped_column(
        String(64), default="insightface", nullable=False
    )
    model_version: Mapped[str] = mapped_column(
        String(32), default="buffalo_s", nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    photo = relationship("Photo", back_populates="faces")
    event = relationship("Event", back_populates="faces")
