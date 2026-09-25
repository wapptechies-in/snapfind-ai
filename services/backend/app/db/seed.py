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


def seed_dev_data(db: Session) -> None:
    """Seed sample development data if database is empty."""
    # Check if demo photographer already exists
    existing = db.scalar(
        select(Photographer).where(Photographer.email == "photographer@example.com")
    )
    if existing:
        logger.info("Database already seeded. Skipping initial fixtures.")
        return

    logger.info("Seeding development data...")

    # 1. Create User
    demo_user = User(
        id="usr_001",
        email="photographer@example.com",
        password_hash=hash_password("password123"),
        full_name="Alex Marlowe",
        role="photographer",
        is_active=True,
    )
    db.add(demo_user)
    db.flush()

    # 2. Create Photographer Profile
    demo_photographer = Photographer(
        id="p_001",
        user_id=demo_user.id,
        email=demo_user.email,
        studio_name="Marlowe & Finch Photography",
        display_name="Alex Marlowe",
        phone="+1 (555) 234-8901",
        bio="Commercial and luxury wedding photography specializing in natural light and candid portraits.",
        website="https://marlowefinch.photo",
        hashed_password=demo_user.password_hash,
    )
    db.add(demo_photographer)

    # 2b. Create Desktop Demo User (demo@snapfind.ai / snapfind123)
    snapfind_demo_user = User(
        id="usr_002",
        email="demo@snapfind.ai",
        password_hash=hash_password("snapfind123"),
        full_name="SnapFind Pro Photographer",
        role="photographer",
        is_active=True,
    )
    db.add(snapfind_demo_user)
    db.flush()

    snapfind_photographer = Photographer(
        id="p_002",
        user_id=snapfind_demo_user.id,
        email=snapfind_demo_user.email,
        studio_name="SnapFind Studio Pro",
        display_name="SnapFind Pro Agent",
        phone="+1 (555) 987-6543",
        bio="Professional AI studio workflow and event photography.",
        website="https://snapfind.ai",
        hashed_password=snapfind_demo_user.password_hash,
    )
    db.add(snapfind_photographer)
    db.flush()

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

