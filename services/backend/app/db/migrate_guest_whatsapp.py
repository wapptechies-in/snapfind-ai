"""
Database migration: creates guests, marketing_leads, whatsapp_message_logs,
and search_jobs tables, and adds branding & engagement columns to events.
Status: IMPLEMENTED
Compatible with PostgreSQL and SQLite.
"""

import logging
from sqlalchemy import inspect, text
from app.db.session import Base, engine
import app.models  # ensure all models are registered with Base metadata

logger = logging.getLogger("snapfind.migrations.guest_whatsapp")


def run_guest_whatsapp_migrations() -> None:
    """Safely creates new tables and adds branding/engagement columns to events."""
    # 1. Create tables if they do not exist
    Base.metadata.create_all(bind=engine)

    inspector = inspect(engine)
    existing_tables = inspector.get_table_names()
    if "events" not in existing_tables:
        return

    event_cols = [c["name"] for c in inspector.get_columns("events")]
    is_sqlite = engine.dialect.name == "sqlite"

    with engine.begin() as conn:
        # Engagement metrics
        new_cols = [
            ("total_registrations", "INTEGER DEFAULT 0 NOT NULL"),
            ("total_matches_found", "INTEGER DEFAULT 0 NOT NULL"),
            ("total_whatsapp_sent", "INTEGER DEFAULT 0 NOT NULL"),
            ("total_marketing_consents", "INTEGER DEFAULT 0 NOT NULL"),
            ("welcome_message", "TEXT"),
            ("custom_logo_url", "VARCHAR(512)"),
            ("show_snapfind_branding", "BOOLEAN DEFAULT 1 NOT NULL" if is_sqlite else "BOOLEAN DEFAULT TRUE NOT NULL"),
            ("show_company_cta", "BOOLEAN DEFAULT 1 NOT NULL" if is_sqlite else "BOOLEAN DEFAULT TRUE NOT NULL"),
            ("show_contact_button", "BOOLEAN DEFAULT 1 NOT NULL" if is_sqlite else "BOOLEAN DEFAULT TRUE NOT NULL"),
        ]

        for col_name, col_def in new_cols:
            if col_name not in event_cols:
                logger.info(f"Adding '{col_name}' column to 'events' table...")
                conn.execute(text(f"ALTER TABLE events ADD COLUMN {col_name} {col_def};"))
                logger.info(f"Successfully added '{col_name}' to 'events'.")

    logger.info("Guest & WhatsApp migrations completed successfully.")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    run_guest_whatsapp_migrations()

