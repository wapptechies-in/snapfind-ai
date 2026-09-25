"""
Database schema migration helper for Task 1: Sub-folders inside an Event.
Safely creates the `folders` table and adds `folder_id` to `photos`.
Compatible with PostgreSQL and SQLite.
"""

import logging
from sqlalchemy import inspect, text
from app.db.session import Base, engine
from app.models.folder import Folder

logger = logging.getLogger("snapfind.migration.folders")


def run_folder_migrations() -> None:
    """Ensure folders table and photo.folder_id column exist across SQLite or PostgreSQL."""
    # Ensure all tables defined in metadata exist
    Base.metadata.create_all(bind=engine)

    inspector = inspect(engine)
    existing_tables = inspector.get_table_names()

    with engine.begin() as conn:
        # 1. Ensure folders table exists
        if "folders" not in existing_tables:
            logger.info("Creating folders table...")
            Folder.__table__.create(conn)
        else:
            logger.info("Table 'folders' already exists.")

        # 2. Inspect photos table
        if "photos" in existing_tables:
            photo_cols = [c["name"] for c in inspector.get_columns("photos")]

            if "folder_id" not in photo_cols:
                logger.info("Adding column 'folder_id' to photos table...")
                # SQLite doesn't support adding foreign key constraints via ALTER TABLE easily,
                # but PostgreSQL does. We use safe standard SQL.
                is_sqlite = engine.dialect.name == "sqlite"
                if is_sqlite:
                    conn.execute(
                        text("ALTER TABLE photos ADD COLUMN folder_id VARCHAR(64) REFERENCES folders(id)")
                    )
                else:
                    conn.execute(
                        text("ALTER TABLE photos ADD COLUMN folder_id VARCHAR(64) REFERENCES folders(id) ON DELETE SET NULL")
                    )
                    conn.execute(
                        text("CREATE INDEX IF NOT EXISTS ix_photos_folder_id ON photos(folder_id)")
                    )
                logger.info("Successfully added 'folder_id' column to photos.")
            else:
                logger.info("Column 'folder_id' already exists on 'photos'.")

    logger.info("Folder migration completed successfully.")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    run_folder_migrations()

