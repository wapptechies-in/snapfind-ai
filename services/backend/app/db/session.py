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

def _is_host_reachable(host: str, port: int, timeout: float = 0.05) -> bool:
    import socket
    try:
        with socket.create_connection((host, port), timeout=timeout):
            return True
    except OSError:
        return False

db_url = settings.DATABASE_URL
if db_url.startswith("postgresql://"):
    db_url = db_url.replace("postgresql://", "postgresql+psycopg://", 1)

from pathlib import Path
from urllib.parse import urlparse

BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
CANONICAL_SQLITE_PATH = BACKEND_DIR / "snapfind_local.db"

use_sqlite = False
if "postgresql" in db_url:
    try:
        parsed = urlparse(db_url)
        host = parsed.hostname or "localhost"
        port = parsed.port or 5432
        if not _is_host_reachable(host, port):
            use_sqlite = True
            logger.info("Configured PostgreSQL at %s:%s is unreachable. Falling back immediately to SQLite.", host, port)
    except Exception:
        pass

from sqlalchemy import event

def _configure_sqlite_engine(eng):
    @event.listens_for(eng, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        try:
            cursor = dbapi_connection.cursor()
            cursor.execute("PRAGMA journal_mode=WAL")
            cursor.execute("PRAGMA synchronous=NORMAL")
            cursor.execute("PRAGMA busy_timeout=30000")
            cursor.close()
        except Exception:
            pass

if use_sqlite or db_url.startswith("sqlite"):
    db_url = f"sqlite:///{CANONICAL_SQLITE_PATH.as_posix()}"
    connect_args = {"check_same_thread": False, "timeout": 30}
    engine = create_engine(db_url, pool_pre_ping=True, connect_args=connect_args)
    _configure_sqlite_engine(engine)
else:
    connect_args = {"connect_timeout": 2}
    try:
        engine = create_engine(db_url, pool_pre_ping=True, connect_args=connect_args)
        with engine.connect() as conn:
            pass
    except Exception as e:
        logger.warning(
            "Could not connect to configured DATABASE_URL (%s). Falling back to SQLite at %s.",
            e,
            CANONICAL_SQLITE_PATH,
        )
        db_url = f"sqlite:///{CANONICAL_SQLITE_PATH.as_posix()}"
        connect_args = {"check_same_thread": False, "timeout": 30}
        engine = create_engine(db_url, pool_pre_ping=True, connect_args=connect_args)
        _configure_sqlite_engine(engine)

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
