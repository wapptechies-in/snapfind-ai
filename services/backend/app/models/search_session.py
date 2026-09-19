"""
SearchSession model — tracks customer face search sessions.
Status: IMPLEMENTED (Phase 4 Database Architecture)
"""

from datetime import datetime, timezone
import uuid
from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


def generate_session_id() -> str:
    return f"sess_{uuid.uuid4().hex[:12]}"


class SearchSession(Base):
    __tablename__ = "search_sessions"

    id: Mapped[str] = mapped_column(
        String(64), primary_key=True, default=generate_session_id
    )
    event_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("events.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    status: Mapped[str] = mapped_column(
        String(32), default="active", nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    expires_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Relationships
    event = relationship("Event", back_populates="search_sessions")

