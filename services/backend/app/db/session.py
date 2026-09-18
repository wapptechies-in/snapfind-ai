"""
Database connection setup.

This wires up SQLAlchemy's engine and session machinery so the rest of
the app can talk to PostgreSQL (or SQLite for local development).
It intentionally does NOT define any tables or run any queries yet — that starts in Phase 2.

Status: IMPLEMENTED (connection architecture)
        PLANNED (actual tables / models — Phase 2)
"""

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import get_settings

settings = get_settings()

# Normalize URL for modern psycopg 3 driver if standard postgresql:// prefix is used
db_url = settings.DATABASE_URL
if db_url.startswith("postgresql://"):
    db_url = db_url.replace("postgresql://", "postgresql+psycopg://", 1)

connect_args = {}
if db_url.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine = create_engine(db_url, pool_pre_ping=True, connect_args=connect_args)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """Base class every future SQLAlchemy model will inherit from."""

    pass


def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency that yields a database session and always closes it.
    Not used by any route yet in Phase 1 — it's here so Phase 2 routes
    can start using `Depends(get_db)` immediately.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
