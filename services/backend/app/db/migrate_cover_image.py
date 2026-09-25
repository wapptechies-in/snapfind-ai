"""
Database schema migration helper for Task 2: Custom cover image on Event creation.
Safely adds `cover_image` column to the `events` table and syncs existing records.
"""

import logging
from sqlalchemy import inspect, text
from app.db.session import engine

logger = logging.getLogger("snapfind.migration.cover_image")


def run_cover_image_migrations() -> None:
    """Ensure events table has cover_image column across SQLite and PostgreSQL."""
    inspector = inspect(engine)
    existing_tables = inspector.get_table_names()

    with engine.begin() as conn:
        if "events" in existing_tables:
            event_cols = [c["name"] for c in inspector.get_columns("events")]

            if "cover_image" not in event_cols:
                logger.info("Adding column 'cover_image' to events table...")
                conn.execute(
                    text("ALTER TABLE events ADD COLUMN cover_image VARCHAR(512)")
                )
                # Sync existing cover_image_reference values if present
                if "cover_image_reference" in event_cols:
                    conn.execute(
                        text("UPDATE events SET cover_image = cover_image_reference WHERE cover_image IS NULL AND cover_image_reference IS NOT NULL")
                    )
                logger.info("Successfully added 'cover_image' column to events.")
            else:
                logger.info("Column 'cover_image' already exists on 'events'.")

    logger.info("Cover image migration completed successfully.")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    run_cover_image_migrations()

