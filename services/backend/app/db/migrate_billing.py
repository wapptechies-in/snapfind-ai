"""
Database schema migration helper for Phase 9 Billing & Monetization.
Safely adds new columns to SQLite/PostgreSQL tables if not already present.
"""

import logging
from sqlalchemy import inspect, text
from sqlalchemy.orm import Session

from app.db.session import Base, engine
from app.models.billing import GuestPurchase

logger = logging.getLogger("snapfind.migration")


def run_billing_migrations() -> None:
    """Ensure billing columns and tables exist across SQLite or PostgreSQL."""
    # Ensure all tables created in metadata exist
    Base.metadata.create_all(bind=engine)

    inspector = inspect(engine)

    with engine.begin() as conn:
        # 1. Inspect photographers table
        if "photographers" in inspector.get_table_names():
            photographer_cols = [c["name"] for c in inspector.get_columns("photographers")]

            if "subscription_tier" not in photographer_cols:
                logger.info("Adding column 'subscription_tier' to photographers...")
                conn.execute(
                    text("ALTER TABLE photographers ADD COLUMN subscription_tier VARCHAR(32) DEFAULT 'pro'")
                )

            if "subscription_status" not in photographer_cols:
                logger.info("Adding column 'subscription_status' to photographers...")
                conn.execute(
                    text("ALTER TABLE photographers ADD COLUMN subscription_status VARCHAR(32) DEFAULT 'active'")
                )

            if "stripe_customer_id" not in photographer_cols:
                logger.info("Adding column 'stripe_customer_id' to photographers...")
                conn.execute(
                    text("ALTER TABLE photographers ADD COLUMN stripe_customer_id VARCHAR(128)")
                )

            if "stripe_subscription_id" not in photographer_cols:
                logger.info("Adding column 'stripe_subscription_id' to photographers...")
                conn.execute(
                    text("ALTER TABLE photographers ADD COLUMN stripe_subscription_id VARCHAR(128)")
                )

            if "max_active_events" not in photographer_cols:
                logger.info("Adding column 'max_active_events' to photographers...")
                conn.execute(
                    text("ALTER TABLE photographers ADD COLUMN max_active_events INTEGER DEFAULT 50")
                )

            if "max_photos_per_event" not in photographer_cols:
                logger.info("Adding column 'max_photos_per_event' to photographers...")
                conn.execute(
                    text("ALTER TABLE photographers ADD COLUMN max_photos_per_event INTEGER DEFAULT 5000")
                )

        # 2. Inspect events table
        if "events" in inspector.get_table_names():
            event_cols = [c["name"] for c in inspector.get_columns("events")]

            if "paywall_enabled" not in event_cols:
                logger.info("Adding column 'paywall_enabled' to events...")
                conn.execute(
                    text("ALTER TABLE events ADD COLUMN paywall_enabled BOOLEAN DEFAULT 0")
                )

            if "photo_price" not in event_cols:
                logger.info("Adding column 'photo_price' to events...")
                conn.execute(
                    text("ALTER TABLE events ADD COLUMN photo_price FLOAT DEFAULT 4.99")
                )

            if "gallery_unlock_price" not in event_cols:
                logger.info("Adding column 'gallery_unlock_price' to events...")
                conn.execute(
                    text("ALTER TABLE events ADD COLUMN gallery_unlock_price FLOAT DEFAULT 29.99")
                )

            if "currency" not in event_cols:
                logger.info("Adding column 'currency' to events...")
                conn.execute(
                    text("ALTER TABLE events ADD COLUMN currency VARCHAR(8) DEFAULT 'USD'")
                )

    logger.info("Billing and monetization schema check completed successfully.")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    run_billing_migrations()

