"""
Pytest configuration for SnapFind AI backend test suite.
Automatically ensures database schema migrations and provides authenticated client headers.
"""

import pytest
from sqlalchemy import select
from app.core.security import create_access_token
from app.db.session import SessionLocal, init_db
from app.models.photographer import Photographer


@pytest.fixture(autouse=True, scope="session")
def ensure_test_database():
    """Ensure database schema is created and migrated before tests run."""
    init_db()


@pytest.fixture(autouse=True)
def auto_auth_client(request):
    """
    Injects default Bearer token header onto module-level TestClient instances
    so existing suites have authenticated photographer context without breaking
    tenant isolation or unauthenticated tests.
    """
    mod = getattr(request, "module", None)
    if mod and hasattr(mod, "client"):
        client = getattr(mod, "client")
        db = SessionLocal()
        try:
            p = db.scalar(select(Photographer).where(Photographer.email == "photographer@example.com"))
            if p:
                token = create_access_token(p.id)
                client.headers["Authorization"] = f"Bearer {token}"
        finally:
            db.close()
