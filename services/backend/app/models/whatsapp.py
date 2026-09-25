"""
WhatsApp Message Log model.
Records delivery status, provider message IDs, and payload metadata with hard separation of message types.
"""

from datetime import datetime, timezone
import uuid
from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


def generate_whatsapp_log_id() -> str:
    return f"wml_{uuid.uuid4().hex[:12]}"


class WhatsAppMessageLog(Base):
    __tablename__ = "whatsapp_message_logs"

    id: Mapped[str] = mapped_column(
        String(64), primary_key=True, default=generate_whatsapp_log_id
    )
    event_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("events.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    guest_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("guests.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    recipient_phone: Mapped[str] = mapped_column(
        String(32), nullable=False, index=True
    )
    message_type: Mapped[str] = mapped_column(
        String(32), default="transactional", nullable=False, index=True
    )  # "transactional" or "marketing"
    provider: Mapped[str] = mapped_column(
        String(32), default="mock", nullable=False
    )  # "mock", "twilio", "meta"
    template_name: Mapped[str | None] = mapped_column(String(64), nullable=True)
    payload_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(
        String(32), default="queued", nullable=False, index=True
    )  # "queued", "sent", "delivered", "failed"
    provider_message_id: Mapped[str | None] = mapped_column(
        String(128), nullable=True, index=True
    )
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    sent_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    event = relationship("Event", back_populates="whatsapp_logs")
    guest = relationship("Guest", back_populates="whatsapp_logs")
