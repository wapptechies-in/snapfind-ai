"""
Database connection setup.

This wires up SQLAlchemy's engine and session machinery so the rest of
the app *can* talk to PostgreSQL. It intentionally does NOT define any
tables or run any queries yet — that starts in Phase 2, once the first
models (Photographer, Event, Photo, ...) are designed.

Status: IMPLEMENTED (connection architecture only)
        PLANNED (actual tables / models — Phase 2)
"""

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import get_settings

settings = get_settings()

engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)

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
