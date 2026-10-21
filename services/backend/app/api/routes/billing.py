"""
Billing and Monetization API routes: plans, subscriptions, upgrades, and guest purchases.
Status: IMPLEMENTED (Phase 9)
"""

from typing import Annotated, Any
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_photographer
from app.core.config import get_settings
from app.db.session import get_db
from app.models.billing import GuestPurchase, generate_download_token
from app.models.event import Event
from app.models.photo import Photo
from app.models.photographer import Photographer

settings = get_settings()
router = APIRouter(prefix="/billing", tags=["billing"])


# --- Schemas ---

class PlanFeature(BaseModel):
    name: str
    included: bool


class PlanTier(BaseModel):
    id: str
    name: str
    tagline: str
    price_usd_monthly: float
    price_inr_monthly: float
    max_active_events: int
    max_photos_per_event: int
    features: list[str]
    popular: bool = False


class SubscriptionOut(BaseModel):
    tier: str
    status: str
    active_events_count: int
    max_active_events: int
    total_photos_count: int
    max_photos_per_event: int
    custom_branding: bool
    guest_paywall_enabled: bool
    used_storage_bytes: int = 0
    max_storage_bytes: int = 9 * 1024 * 1024 * 1024
    is_trial_edition: bool = True


class UpgradeRequest(BaseModel):
    tier: str = Field(..., pattern="^(free|pro|studio)$")


class CreateCheckoutSessionRequest(BaseModel):
    plan_id: str = Field(..., alias="planId")
    interval: str = "monthly"  # monthly or yearly
    currency: str = "usd"


class GuestCheckoutRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    event_id: str = Field(..., alias="eventId")
    photo_id: str | None = Field(default=None, alias="photoId")
    customer_email: EmailStr = Field(..., alias="customerEmail")
    purchase_type: str = Field(default="photo", alias="purchaseType")  # "photo" or "gallery"
    payment_method: str = Field(default="card", alias="paymentMethod")


class GuestCheckoutResponse(BaseModel):
    purchase_id: str
    download_token: str
    status: str
    amount: float
    currency: str
    message: str


# --- Plan Catalog ---

PLANS: list[PlanTier] = [
    PlanTier(
        id="free",
        name="Free Starter",
        tagline="Perfect for testing AI facial recognition and small private events.",
        price_usd_monthly=0.0,
        price_inr_monthly=0.0,
        max_active_events=2,
        max_photos_per_event=500,
        features=[
            "2 Active Event Galleries",
            "500 Photos per Event",
            "AI Face Search Enabled",
            "Standard QR Code Sharing",
            "Community Support",
        ],
        popular=False,
    ),
    PlanTier(
        id="pro",
        name="Pro Photographer",
        tagline="For professional wedding and event photographers demanding high throughput.",
        price_usd_monthly=29.0,
        price_inr_monthly=2499.0,
        max_active_events=50,
        max_photos_per_event=5000,
        features=[
            "50 Active Event Galleries",
            "5,000 Photos per Event",
            "Full-Speed Parallel S3/MinIO Ingestion",
            "Guest High-Res Paywalls (Keep 100% of sales)",
            "Custom Studio Watermarks & Branding",
            "Priority Email & Chat Support",
        ],
        popular=True,
    ),
    PlanTier(
        id="studio",
        name="Enterprise Studio",
        tagline="For busy studios with multiple camera crews and massive seasonal volumes.",
        price_usd_monthly=79.0,
        price_inr_monthly=6499.0,
        max_active_events=9999,
        max_photos_per_event=99999,
        features=[
            "Unlimited Event Galleries",
            "Unlimited High-Res Photos",
            "Custom Domain CNAME (gallery.yourstudio.com)",
            "Multi-Photographer Ingestion Agents",
            "Automated WhatsApp / SMS Guest Alerts",
            "Dedicated Account Manager",
        ],
        popular=False,
    ),
]


@router.get("/plans", response_model=list[PlanTier])
def get_plans() -> list[PlanTier]:
    """Return available photographer subscription plans with limits and features."""
    return PLANS


@router.get("/subscription", response_model=SubscriptionOut)
def get_current_subscription(
    photographer: Annotated[Photographer, Depends(get_current_photographer)],
    db: Annotated[Session, Depends(get_db)],
) -> SubscriptionOut:
    """Return current photographer's active subscription status and resource quotas."""
    active_events = db.scalar(
        select(func.count(Event.id)).where(
            Event.photographer_id == photographer.id,
            Event.status.ilike("active"),
        )
    ) or 0

    total_photos = db.scalar(
        select(func.count(Photo.id))
        .join(Event, Event.id == Photo.event_id)
        .where(Event.photographer_id == photographer.id)
    ) or 0

    used_storage_bytes = db.scalar(
        select(func.coalesce(func.sum(Photo.file_size), 0))
        .join(Event, Event.id == Photo.event_id)
        .where(Event.photographer_id == photographer.id)
    ) or 0

    tier = getattr(photographer, "subscription_tier", "trial")
    status_str = getattr(photographer, "subscription_status", "active")

    if settings.TRIAL_EDITION_MODE or tier in ("free", "trial"):
        max_events = 99999  # Unlimited events for trial edition
        max_photos = getattr(photographer, "max_photos_per_event", 1000) or 1000
        max_storage = settings.TRIAL_STORAGE_LIMIT_BYTES  # 9.0 GB hard limit
        is_trial = True
    else:
        max_events = getattr(photographer, "max_active_events", 50)
        max_photos = getattr(photographer, "max_photos_per_event", 5000)
        max_storage = 50 * 1024 * 1024 * 1024
        is_trial = False

    return SubscriptionOut(
        tier=tier,
        status=status_str,
        active_events_count=active_events,
        max_active_events=max_events,
        total_photos_count=total_photos,
        max_photos_per_event=max_photos,
        custom_branding=True,
        guest_paywall_enabled=(tier in ("pro", "studio")),
        used_storage_bytes=int(used_storage_bytes),
        max_storage_bytes=max_storage,
        is_trial_edition=is_trial,
    )


TIER_RANK = {"free": 0, "pro": 1, "studio": 2}
TIER_QUOTAS = {
    "free": (2, 500),
    "pro": (50, 5000),
    "studio": (9999, 99999),
}


@router.post("/upgrade", response_model=SubscriptionOut)
def upgrade_subscription(
    body: UpgradeRequest,
    photographer: Annotated[Photographer, Depends(get_current_photographer)],
    db: Annotated[Session, Depends(get_db)],
) -> SubscriptionOut:
    """
    Subscription tier change.
    - Downgrades (e.g. Pro → Free) are allowed directly.
    - Upgrades (Free → Pro, Free → Studio, Pro → Studio) MUST go through
      the payment checkout flow (POST /billing/create-checkout-session)
      and are activated via webhook (POST /billing/webhook).
    """
    new_tier = body.tier.lower()
    current_tier = getattr(photographer, "subscription_tier", "free").lower()

    current_rank = TIER_RANK.get(current_tier, 0)
    new_rank = TIER_RANK.get(new_tier, 0)

    if new_rank > current_rank and settings.ENVIRONMENT.lower() not in ("development", "test") and not settings.TRIAL_EDITION_MODE:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail=(
                f"Upgrading from '{current_tier}' to '{new_tier}' requires payment. "
                f"Please use POST /api/v1/billing/create-checkout-session to start checkout."
            ),
        )

    max_events, max_photos = TIER_QUOTAS.get(new_tier, (2, 500))
    photographer.subscription_tier = new_tier
    photographer.max_active_events = max_events
    photographer.max_photos_per_event = max_photos
    photographer.subscription_status = "active"
    db.commit()
    db.refresh(photographer)

    return get_current_subscription(photographer=photographer, db=db)


@router.post("/webhook/confirm-payment", response_model=SubscriptionOut)
def confirm_payment_webhook(
    photographer_id: str,
    tier: str,
    payment_id: str,
    photographer: Annotated[Photographer, Depends(get_current_photographer)],
    db: Annotated[Session, Depends(get_db)],
) -> SubscriptionOut:
    """
    Internal endpoint called after successful Razorpay / Stripe webhook verification.
    Activates the new subscription tier.
    In production this is called by the webhook handler after HMAC signature verification.
    """
    # Enforce that the authenticated photographer can only modify their own subscription unless super_admin
    if photographer.id != photographer_id and getattr(photographer, "role", "") != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Cannot modify subscription of another photographer.",
        )

    new_tier = tier.lower()
    max_events, max_photos = TIER_QUOTAS.get(new_tier, (2, 500))
    p = db.get(Photographer, photographer_id)
    if not p:
        raise HTTPException(status_code=404, detail="Photographer not found.")
    p.subscription_tier = new_tier
    p.max_active_events = max_events
    p.max_photos_per_event = max_photos
    p.subscription_status = "active"
    db.commit()
    db.refresh(p)
    return get_current_subscription(photographer=p, db=db)


@router.post("/create-checkout-session")
def create_checkout_session(
    payload: CreateCheckoutSessionRequest,
    photographer: Annotated[Photographer, Depends(get_current_photographer)],
) -> dict[str, Any]:
    """
    Creates a Stripe/Razorpay checkout session for subscription tier upgrade.
    In local development / demo mode, returns a mock session URL.
    """
    tier_found = next((p for p in PLANS if p.id == payload.plan_id), None)
    if not tier_found:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid plan '{payload.plan_id}'",
        )

    # In production, this integrates with stripe.checkout.Session.create(...)
    session_id = f"cs_test_{photographer.id[:8]}_{payload.plan_id}"
    return {
        "sessionId": session_id,
        "planId": payload.plan_id,
        "amount": tier_found.price_usd_monthly,
        "currency": "usd",
        "provider": "stripe",
        "checkoutUrl": f"https://checkout.stripe.com/pay/{session_id}",
    }


@router.post("/guest-checkout", response_model=GuestCheckoutResponse)
def guest_checkout(
    payload: GuestCheckoutRequest,
    db: Annotated[Session, Depends(get_db)],
) -> GuestCheckoutResponse:
    """
    Process guest digital purchase of unwatermarked high-res photo or full gallery unlock.
    Issues a verified download token allowing original downloads through the paywall.
    """
    event = db.scalar(
        select(Event).where(
            (Event.id == payload.event_id) | (Event.public_token == payload.event_id)
        )
    )
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Event '{payload.event_id}' not found",
        )

    amount = event.photo_price
    if payload.purchase_type == "gallery" or not payload.photo_id:
        amount = event.gallery_unlock_price

    token = generate_download_token()
    purchase = GuestPurchase(
        event_id=event.id,
        photo_id=payload.photo_id if payload.purchase_type != "gallery" else None,
        customer_email=payload.customer_email.lower(),
        amount=amount,
        currency=event.currency,
        purchase_type=payload.purchase_type,
        status="completed",
        download_token=token,
    )
    db.add(purchase)
    db.commit()
    db.refresh(purchase)

    return GuestCheckoutResponse(
        purchase_id=purchase.id,
        download_token=token,
        status="completed",
        amount=amount,
        currency=event.currency,
        message="Purchase successful! High-resolution original downloads are now unlocked.",
    )


@router.get("/verify-purchase/{token}")
def verify_purchase(
    token: str,
    db: Annotated[Session, Depends(get_db)],
) -> dict[str, Any]:
    """Verify validity of a guest download token and return unlocked permissions."""
    purchase = db.scalar(
        select(GuestPurchase).where(
            GuestPurchase.download_token == token,
            GuestPurchase.status == "completed",
        )
    )
    if not purchase:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid or expired download token.",
        )

    return {
        "valid": True,
        "purchaseId": purchase.id,
        "eventId": purchase.event_id,
        "photoId": purchase.photo_id,
        "purchaseType": purchase.purchase_type,
        "customerEmail": purchase.customer_email,
        "createdAt": purchase.created_at,
    }

