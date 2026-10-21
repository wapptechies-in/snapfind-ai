"""
Database Seeding Script for SnapFind AI.
Seeds initial development data for testing: Photographer, Events, Photos, and Bookings.
Status: IMPLEMENTED (Phase 4)
"""

import logging
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.user import User
from app.models.photographer import Photographer
from app.models.event import Event
from app.models.photo import Photo
from app.models.booking import Booking

logger = logging.getLogger(__name__)


def _ensure_account(
    db: Session,
    user_id: str,
    photographer_id: str,
    email: str,
    password: str,
    studio_name: str,
    display_name: str,
    phone: str = "+1 (555) 234-8901",
    subscription_tier: str = "studio",
) -> tuple[User, Photographer]:
    pwd_hash = hash_password(password)
    user = db.scalar(select(User).where(User.email == email))
    if not user:
        user = User(
            id=user_id,
            email=email,
            password_hash=pwd_hash,
            full_name=display_name,
            role="photographer",
            is_active=True,
        )
        db.add(user)
        db.flush()
    else:
        user.password_hash = pwd_hash
        user.is_active = True
        db.flush()

    photographer = db.scalar(select(Photographer).where(Photographer.email == email))
    if not photographer:
        photographer = Photographer(
            id=photographer_id,
            user_id=user.id,
            email=email,
            studio_name=studio_name,
            display_name=display_name,
            phone=phone,
            bio="Professional AI studio workflow and event photography.",
            website="https://snapfind.ai",
            hashed_password=pwd_hash,
            approval_status="approved",
            subscription_tier=subscription_tier,
            subscription_status="active",
        )
        db.add(photographer)
        db.flush()
    else:
        photographer.hashed_password = pwd_hash
        photographer.approval_status = "approved"
        photographer.subscription_tier = subscription_tier
        photographer.subscription_status = "active"
        db.flush()

    return user, photographer


def seed_dev_data(db: Session) -> None:
    """Seed sample development data if database is empty."""
    # Ensure all three standard demo accounts exist with valid passwords
    demo_user, demo_photographer = _ensure_account(
        db, "usr_001", "p_001", "photographer@example.com", "password123",
        "Marlowe & Finch Photography", "Alex Marlowe", "+1 (555) 234-8901", "studio"
    )
    _ensure_account(
        db, "usr_002", "p_002", "demo@snapfind.ai", "snapfind123",
        "SnapFind Studio Pro", "SnapFind Pro Agent", "+1 (555) 987-6543", "pro"
    )
    _ensure_account(
        db, "usr_003", "p_003", "photographer@snapfind.ai", "Snapfind2026!",
        "Apex Photography Studio", "SnapFind Lead Photographer", "+1 (555) 345-6789", "studio"
    )

    # Check if demo events already exist
    existing_event = db.scalar(select(Event).limit(1))
    if existing_event:
        logger.info("Database events already seeded. Standard demo accounts verified.")
        return

    logger.info("Seeding initial events development data...")

    # 3. Create Sample Events
    sample_events = [
        Event(
            id="evt_1",
            photographer_id=demo_photographer.id,
            name="John & Mary Wedding",
            event_type="Wedding",
            event_date="2026-09-17",
            location="Highland Valley Estate, California",
            description="A scenic outdoor autumn ceremony followed by an evening celebration with family and friends.",
            cover_image_reference="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80",
            status="Active",
            public_token="ABC123",
            face_search_enabled=True,
            downloads_enabled=True,
            original_downloads_enabled=False,
            watermark_enabled=True,
            expiry_enabled=False,
            gallery_views=3840,
            total_searches=812,
            total_downloads=1940,
        ),
        Event(
            id="evt_2",
            photographer_id=demo_photographer.id,
            name="State Athletics Championship",
            event_type="Sports",
            event_date="2026-09-10",
            location="National Sports Arena, Seattle",
            description="Annual state athletics championship featuring track and field sprint events and medals.",
            cover_image_reference="https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=80",
            status="Active",
            public_token="SPT2026",
            face_search_enabled=True,
            downloads_enabled=True,
            original_downloads_enabled=True,
            watermark_enabled=False,
            expiry_enabled=False,
            gallery_views=2150,
            total_searches=432,
            total_downloads=870,
        ),
        Event(
            id="evt_3",
            photographer_id=demo_photographer.id,
            name="Elena's 30th Birthday Gala",
            event_type="Birthday",
            event_date="2026-09-05",
            location="Silverwood Banquet Hall, Seattle",
            description="Milestone birthday celebration party with games, family dinner, and live acoustic music.",
            cover_image_reference="https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=1200&q=80",
            status="Expired",
            public_token="BIRTH26",
            face_search_enabled=False,
            downloads_enabled=False,
            original_downloads_enabled=False,
            watermark_enabled=True,
            expiry_enabled=True,
            expiry_date="2026-09-15",
            gallery_views=980,
            total_searches=124,
            total_downloads=320,
        ),
        Event(
            id="evt_4",
            photographer_id=demo_photographer.id,
            name="Global Tech Summit 2026",
            event_type="Corporate",
            event_date="2026-08-14",
            location="Convention Center, Austin, TX",
            description="3-day technology conference covering AI, cloud infrastructure, and product strategy.",
            cover_image_reference="https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80",
            status="Active",
            public_token="TECH26",
            face_search_enabled=True,
            downloads_enabled=True,
            original_downloads_enabled=True,
            watermark_enabled=False,
            expiry_enabled=False,
            gallery_views=4120,
            total_searches=588,
            total_downloads=1450,
        ),
        Event(
            id="evt_5",
            photographer_id=demo_photographer.id,
            name="Sunrise Coastal Family Session",
            event_type="Family",
            event_date="2026-07-15",
            location="Cannon Beach, Oregon",
            description="Early morning golden hour portraits along the shoreline.",
            cover_image_reference="https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1200&q=80",
            status="Draft",
            public_token="FAM2026",
            face_search_enabled=False,
            downloads_enabled=True,
            original_downloads_enabled=False,
            watermark_enabled=True,
            expiry_enabled=False,
            gallery_views=0,
            total_searches=0,
            total_downloads=0,
        ),
        Event(
            id="evt_6",
            photographer_id=demo_photographer.id,
            name="Founder Headshots — Q3 batch",
            event_type="Candid",
            event_date="2026-07-22",
            location="Studio 4B, San Francisco",
            description="Studio portraits and candid headshots for startup founders and leadership teams.",
            cover_image_reference="https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=1200&q=80",
            status="Processing",
            public_token="HEAD26",
            face_search_enabled=True,
            downloads_enabled=True,
            original_downloads_enabled=True,
            watermark_enabled=False,
            expiry_enabled=False,
            gallery_views=120,
            total_searches=12,
            total_downloads=38,
        ),
    ]
    db.add_all(sample_events)
    db.flush()

    # 4. Create Sample Photos
    sample_photos = [
        Photo(
            id="pho_101",
            event_id="evt_1",
            filename="wedding_ceremony_01.jpg",
            url="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=80",
            thumbnail_url="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=80",
            storage_key="events/evt_1/originals/wedding_ceremony_01.jpg",
            thumbnail_key="events/evt_1/thumbs/wedding_ceremony_01_thumb.webp",
            web_image_key="events/evt_1/web/wedding_ceremony_01_web.webp",
            width=1600,
            height=1067,
            file_size=2450000,
            mime_type="image/jpeg",
            processing_status="completed",
        ),
        Photo(
            id="pho_102",
            event_id="evt_1",
            filename="wedding_vows_exchange.jpg",
            url="https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1600&q=80",
            thumbnail_url="https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=600&q=80",
            storage_key="events/evt_1/originals/wedding_vows_exchange.jpg",
            thumbnail_key="events/evt_1/thumbs/wedding_vows_exchange_thumb.webp",
            web_image_key="events/evt_1/web/wedding_vows_exchange_web.webp",
            width=1600,
            height=1067,
            file_size=2120000,
            mime_type="image/jpeg",
            processing_status="completed",
        ),
        Photo(
            id="pho_201",
            event_id="evt_2",
            filename="athletics_sprint_finish.jpg",
            url="https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1600&q=80",
            thumbnail_url="https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=600&q=80",
            storage_key="events/evt_2/originals/athletics_sprint_finish.jpg",
            thumbnail_key="events/evt_2/thumbs/athletics_sprint_finish_thumb.webp",
            web_image_key="events/evt_2/web/athletics_sprint_finish_web.webp",
            width=1600,
            height=1067,
            file_size=1980000,
            mime_type="image/jpeg",
            processing_status="completed",
        ),
    ]
    db.add_all(sample_photos)

    # 5. Create Sample Booking
    sample_booking = Booking(
        id="bkg_001",
        photographer_id=demo_photographer.id,
        name="Sarah Jenkins",
        phone="+1 (555) 987-6543",
        email="sarah.jenkins@example.com",
        event_type="Wedding",
        event_date="2026-11-20",
        location="Sonoma Vineyard, California",
        guest_count=120,
        message="Looking for full-day ceremony and reception coverage with selfie search for guests.",
        status="pending",
    )
    db.add(sample_booking)

    db.commit()
    logger.info("Development data seeded successfully!")

