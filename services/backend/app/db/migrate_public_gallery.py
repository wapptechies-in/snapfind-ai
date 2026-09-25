"""
Database migration: Adds is_public_gallery boolean column to photos table.
Compatible with both PostgreSQL and SQLite.
"""

import logging
from sqlalchemy import inspect, text
from app.db.session import engine

logger = logging.getLogger("snapfind.migrations.public_gallery")


def run_public_gallery_migrations():
    """Safely adds is_public_gallery column to photos table if it does not already exist."""
    inspector = inspect(engine)
    existing_tables = inspector.get_table_names()
    if "photos" not in existing_tables:
        return

    columns = [c["name"] for c in inspector.get_columns("photos")]

    with engine.begin() as conn:
        if "is_public_gallery" not in columns:
            logger.info("Adding 'is_public_gallery' column to 'photos' table...")
            is_sqlite = engine.dialect.name == "sqlite"
            if is_sqlite:
                conn.execute(
                    text("ALTER TABLE photos ADD COLUMN is_public_gallery BOOLEAN DEFAULT 0 NOT NULL;")
                )
            else:
                conn.execute(
                    text("ALTER TABLE photos ADD COLUMN is_public_gallery BOOLEAN DEFAULT FALSE NOT NULL;")
                )
                conn.execute(
                    text("CREATE INDEX IF NOT EXISTS ix_photos_is_public_gallery ON photos(is_public_gallery);")
                )
            logger.info("Successfully added 'is_public_gallery' column to 'photos' table.")
        else:
            logger.info("'is_public_gallery' column already exists in 'photos' table.")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    run_public_gallery_migrations()
