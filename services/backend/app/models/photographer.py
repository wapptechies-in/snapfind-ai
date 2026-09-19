"""
Photographer model — represents a registered studio/photographer profile.
Status: IMPLEMENTED (Phase 4)
"""

from datetime import datetime, timezone
import uuid
from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


def generate_photographer_id() -> str:
    return f"p_{uuid.uuid4().hex[:12]}"


class Photographer(Base):
    __tablename__ = "photographers"

    id: Mapped[str] = mapped_column(
        String(64), primary_key=True, default=generate_photographer_id
    )
    user_id: Mapped[str | None] = mapped_column(
        String(64),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    email: Mapped[str] = mapped_column(
        String(255), unique=True, index=True, nullable=False
    )
    studio_name: Mapped[str] = mapped_column(String(255), nullable=False)
    display_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(64), nullable=True)
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)
    website: Mapped[str | None] = mapped_column(String(512), nullable=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
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
    user = relationship("User", back_populates="photographer")
    events = relationship(
        "Event",
        back_populates="photographer",
        cascade="all, delete-orphan",
        order_by="desc(Event.created_at)",
    )
    bookings = relationship(
        "Booking",
        back_populates="photographer",
        cascade="all, delete-orphan",
        order_by="desc(Booking.created_at)",
    )
