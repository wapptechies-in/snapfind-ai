"""
Dashboard metrics test suite.
"""

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_dashboard_summary():
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": "photographer@example.com", "password": "password123"},
    )
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.get("/api/v1/dashboard/summary", headers=headers)
    assert resp.status_code == 200
    data = resp.json()

    assert "totalEvents" in data
    assert "totalPhotos" in data
    assert "activeEvents" in data
    assert "photoSearches" in data
    assert "downloads" in data

    assert data["totalEvents"] >= 1
    assert data["photoSearches"] >= 0

