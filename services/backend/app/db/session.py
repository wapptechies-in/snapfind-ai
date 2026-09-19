"""
Database connection setup and initialization.

Wires up SQLAlchemy's engine, sessionmaker, and provides `get_db` dependency
as well as `init_db()` to automatically seed demo data.

Status: IMPLEMENTED (Phase 4)
"""

from collections.abc import Generator
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

db_url = settings.DATABASE_URL
if db_url.startswith("postgresql://"):
    db_url = db_url.replace("postgresql://", "postgresql+psycopg://", 1)

connect_args = {}
if db_url.startswith("sqlite"):
    connect_args["check_same_thread"] = False

try:
    engine = create_engine(db_url, pool_pre_ping=True, connect_args=connect_args)
    # Test connection
    with engine.connect() as conn:
        pass
except Exception as e:
    logger.warning(
        "Could not connect to configured DATABASE_URL (%s). Falling back to SQLite.",
        e,
    )
    db_url = "sqlite:///./snapfind_local.db"
    connect_args = {"check_same_thread": False}
    engine = create_engine(db_url, pool_pre_ping=True, connect_args=connect_args)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """Base class every SQLAlchemy model inherits from."""

    pass


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency that yields a database session and always closes it."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Create all tables and seed initial test fixtures if the database is empty."""
    from app.db.base import Base as AppBase
    from app.db.seed import seed_dev_data

    # Ensure tables exist (also covered by Alembic migrations)
    AppBase.metadata.create_all(bind=engine)

    with SessionLocal() as db:
        seed_dev_data(db)
