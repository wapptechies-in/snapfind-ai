"""
Database migration: Adds is_active boolean column to events table.
Status: IMPLEMENTED (Task 3)
Compatible with both PostgreSQL and SQLite.
"""

import logging
from sqlalchemy import inspect, text
from app.db.session import engine

logger = logging.getLogger("snapfind.migrations.event_status")


def run_event_status_migrations():
    """Safely adds is_active column to events table if it does not already exist."""
    inspector = inspect(engine)
    existing_tables = inspector.get_table_names()
    if "events" not in existing_tables:
        return

    columns = [c["name"] for c in inspector.get_columns("events")]

    with engine.begin() as conn:
        if "is_active" not in columns:
            logger.info("Adding 'is_active' column to 'events' table...")
            is_sqlite = engine.dialect.name == "sqlite"
            if is_sqlite:
                conn.execute(text("ALTER TABLE events ADD COLUMN is_active BOOLEAN DEFAULT 1 NOT NULL;"))
            else:
                conn.execute(text("ALTER TABLE events ADD COLUMN is_active BOOLEAN DEFAULT TRUE NOT NULL;"))
                conn.execute(text("CREATE INDEX IF NOT EXISTS ix_events_is_active ON events(is_active);"))

            # Sync existing status with is_active
            conn.execute(
                text(
                    """
                    UPDATE events 
                    SET is_active = CASE 
                        WHEN LOWER(status) = 'active' THEN 1 
                        ELSE 0 
                    END 
                    WHERE status IS NOT NULL;
                    """
                )
            )
            logger.info("Successfully added 'is_active' column to 'events' table.")
        else:
            logger.info("'is_active' column already exists in 'events' table.")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    run_event_status_migrations()

