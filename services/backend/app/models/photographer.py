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
    location: Mapped[str | None] = mapped_column(String(255), nullable=True)   # City, State, Country
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=True, default="")
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

    # Role & Access Approval Architecture
    role: Mapped[str] = mapped_column(
        String(32), default="photographer", nullable=False
    )  # photographer, admin, super_admin
    approval_status: Mapped[str] = mapped_column(
        String(32), default="pending", nullable=False
    )  # pending, approved, rejected, suspended
    auth_provider: Mapped[str] = mapped_column(
        String(32), default="email", nullable=False
    )  # email, google
    google_id: Mapped[str | None] = mapped_column(String(128), nullable=True, index=True)
    avatar_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    approved_by: Mapped[str | None] = mapped_column(String(64), nullable=True)
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    rejection_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    trial_expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Onboarding state — true after wizard is completed
    onboarding_completed: Mapped[bool] = mapped_column(default=False, nullable=False)

    # Notification preferences
    email_notifications: Mapped[bool] = mapped_column(default=True, nullable=False)
    guest_download_alerts: Mapped[bool] = mapped_column(default=True, nullable=False)
    auto_watermark: Mapped[bool] = mapped_column(default=False, nullable=False)

    # Phase 9: Subscription & Monetization fields
    subscription_tier: Mapped[str] = mapped_column(
        String(32), default="free", nullable=False
    )  # free, pro, studio
    subscription_status: Mapped[str] = mapped_column(
        String(32), default="active", nullable=False
    )  # active, canceled, past_due
    stripe_customer_id: Mapped[str | None] = mapped_column(String(128), nullable=True)
    stripe_subscription_id: Mapped[str | None] = mapped_column(String(128), nullable=True)
    razorpay_customer_id: Mapped[str | None] = mapped_column(String(128), nullable=True)
    razorpay_subscription_id: Mapped[str | None] = mapped_column(String(128), nullable=True)
    max_active_events: Mapped[int] = mapped_column(default=2, nullable=False)
    max_photos_per_event: Mapped[int] = mapped_column(default=500, nullable=False)

    @property
    def is_active(self) -> bool:
        return self.approval_status not in ("suspended", "rejected")

    @is_active.setter
    def is_active(self, value: bool) -> None:
        if not value:
            self.approval_status = "suspended"
        elif self.approval_status in ("suspended", "rejected"):
            self.approval_status = "approved"

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
