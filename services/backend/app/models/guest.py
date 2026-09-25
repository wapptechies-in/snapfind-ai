"""
Guest and MarketingLead models.
Tracks guest registration, explicit multi-type consent, and opt-in marketing leads.
"""

from datetime import datetime, timezone
import uuid
from sqlalchemy import Boolean, DateTime, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


def generate_guest_id() -> str:
    return f"gst_{uuid.uuid4().hex[:12]}"


def generate_lead_id() -> str:
    return f"lead_{uuid.uuid4().hex[:12]}"


class Guest(Base):
    __tablename__ = "guests"
    __table_args__ = (
        UniqueConstraint("event_id", "whatsapp_number", name="uq_event_guest_whatsapp"),
    )

    id: Mapped[str] = mapped_column(
        String(64), primary_key=True, default=generate_guest_id
    )
    event_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("events.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    whatsapp_number: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)

    # Explicit consent tracking with timestamps
    consent_selfie_processing: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    consent_selfie_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    consent_whatsapp_transactional: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    consent_whatsapp_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    consent_marketing: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    consent_marketing_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

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
    event = relationship("Event", back_populates="guests")
    leads = relationship("MarketingLead", back_populates="guest", cascade="all, delete-orphan")
    whatsapp_logs = relationship("WhatsAppMessageLog", back_populates="guest", cascade="all, delete-orphan")
    search_jobs = relationship("SearchJob", back_populates="guest", cascade="all, delete-orphan")


class MarketingLead(Base):
    __tablename__ = "marketing_leads"

    id: Mapped[str] = mapped_column(
        String(64), primary_key=True, default=generate_lead_id
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
    guest_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("guests.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    source: Mapped[str] = mapped_column(
        String(64), default="event_qr_registration", nullable=False
    )
    opted_in_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    event = relationship("Event", back_populates="marketing_leads")
    photographer = relationship("Photographer")
    guest = relationship("Guest", back_populates="leads")
