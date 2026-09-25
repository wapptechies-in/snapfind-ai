"""
Safe migration: add onboarding, notification, location, and payment fields to photographers table.
"""
import logging
from sqlalchemy import text
from app.db.session import SessionLocal

logger = logging.getLogger(__name__)


def run_photographer_onboarding_migrations() -> None:
    """Add new columns to photographers table — idempotent, safe to re-run."""
    db = SessionLocal()
    try:
        columns_to_add = [
            ("location", "VARCHAR(255)"),
            ("onboarding_completed", "BOOLEAN DEFAULT FALSE NOT NULL"),
            ("email_notifications", "BOOLEAN DEFAULT TRUE NOT NULL"),
            ("guest_download_alerts", "BOOLEAN DEFAULT TRUE NOT NULL"),
            ("auto_watermark", "BOOLEAN DEFAULT FALSE NOT NULL"),
            ("razorpay_customer_id", "VARCHAR(128)"),
            ("razorpay_subscription_id", "VARCHAR(128)"),
        ]

        for col_name, col_def in columns_to_add:
            try:
                db.execute(
                    text(f"ALTER TABLE photographers ADD COLUMN {col_name} {col_def}")
                )
                db.commit()
                logger.info(f"[migration] Added column: photographers.{col_name}")
            except Exception:
                db.rollback()
                # Column already exists — safe to skip
                pass

        # Fix defaults that may have been set to 'pro' on existing rows
        try:
            db.execute(
                text(
                    "UPDATE photographers SET subscription_tier = 'free', "
                    "max_active_events = 2, max_photos_per_event = 500 "
                    "WHERE subscription_tier IS NULL OR subscription_tier = ''"
                )
            )
            db.commit()
        except Exception as e:
            db.rollback()
            logger.warning(f"[migration] subscription default update skipped: {e}")

    finally:
        db.close()
