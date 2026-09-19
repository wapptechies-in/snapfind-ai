"""
Booking model — represents a photoshoot booking or client inquiry.
Status: IMPLEMENTED (Phase 4)
"""

from datetime import datetime, timezone
import uuid
from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


def generate_booking_id() -> str:
    return f"bkg_{uuid.uuid4().hex[:12]}"


class Booking(Base):
    __tablename__ = "bookings"

    id: Mapped[str] = mapped_column(
        String(64), primary_key=True, default=generate_booking_id
    )
    photographer_id: Mapped[str | None] = mapped_column(
        String(64),
        ForeignKey("photographers.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str] = mapped_column(String(64), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    event_type: Mapped[str] = mapped_column(String(64), nullable=False)
    event_date: Mapped[str] = mapped_column(String(32), nullable=False)  # YYYY-MM-DD
    location: Mapped[str] = mapped_column(String(255), nullable=False)
    guest_count: Mapped[int] = mapped_column(Integer, default=50, nullable=False)
    message: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(
        String(32), default="pending", nullable=False, index=True
    )  # pending, confirmed, cancelled
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
    photographer = relationship("Photographer", back_populates="bookings")

