"""
Database schema migration helper for trial expiration.
Safely adds trial_expires_at column to photographers table if not present.
"""

import logging
from sqlalchemy import inspect, text

from app.db.session import Base, engine

logger = logging.getLogger("snapfind.migration")


def run_trial_expiration_migrations() -> None:
    """Ensure trial_expires_at column exists in photographers table."""
    from app.db.base import Base as AppBase
    AppBase.metadata.create_all(bind=engine)
    inspector = inspect(engine)

    with engine.begin() as conn:
        if "photographers" in inspector.get_table_names():
            photographer_cols = [c["name"] for c in inspector.get_columns("photographers")]

            if "trial_expires_at" not in photographer_cols:
                logger.info("Adding column 'trial_expires_at' to photographers table...")
                col_type = "TIMESTAMP WITH TIME ZONE" if engine.dialect.name == "postgresql" else "DATETIME"
                conn.execute(
                    text(f"ALTER TABLE photographers ADD COLUMN trial_expires_at {col_type}")
                )
