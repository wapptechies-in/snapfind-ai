"""
Folder model — represents a sub-folder within an event (e.g. "Ceremony", "Reception").
Status: IMPLEMENTED (Task 1)
"""

from datetime import datetime, timezone
import uuid
from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


def generate_folder_id() -> str:
    return f"fol_{uuid.uuid4().hex[:12]}"


class Folder(Base):
    __tablename__ = "folders"

    id: Mapped[str] = mapped_column(
        String(64), primary_key=True, default=generate_folder_id
    )
    event_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("events.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
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
    event = relationship("Event", back_populates="folders")
    photos = relationship(
        "Photo",
        back_populates="folder",
        passive_deletes=True,
    )
