"""
Billing and monetization models for Phase 9.
Represents guest purchases and order logs for unwatermarked photo downloads.
Status: IMPLEMENTED (Phase 9)
"""

from datetime import datetime, timezone
import secrets
import uuid
from sqlalchemy import DateTime, Float, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


def generate_purchase_id() -> str:
    return f"pur_{uuid.uuid4().hex[:12]}"


def generate_download_token() -> str:
    return f"dl_{secrets.token_urlsafe(24)}"


class GuestPurchase(Base):
    __tablename__ = "guest_purchases"

    id: Mapped[str] = mapped_column(
        String(64), primary_key=True, default=generate_purchase_id
    )
    event_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("events.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    photo_id: Mapped[str | None] = mapped_column(
        String(64),
        ForeignKey("photos.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    customer_email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    amount: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    currency: Mapped[str] = mapped_column(String(8), default="USD", nullable=False)
    purchase_type: Mapped[str] = mapped_column(
        String(32), default="photo", nullable=False
    )  # "photo" or "gallery"
    status: Mapped[str] = mapped_column(
        String(32), default="completed", nullable=False, index=True
    )  # "completed", "pending", "refunded"
    download_token: Mapped[str] = mapped_column(
        String(64), default=generate_download_token, unique=True, index=True, nullable=False
    )
    stripe_session_id: Mapped[str | None] = mapped_column(String(128), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    event = relationship("Event", back_populates="guest_purchases", foreign_keys=[event_id])
    photo = relationship("Photo", foreign_keys=[photo_id])

