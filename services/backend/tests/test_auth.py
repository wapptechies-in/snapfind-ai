"""
Authentication test suite.
"""

import uuid
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_auth_flow():
    # 1. Login with seeded test credentials
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": "photographer@example.com", "password": "password123"},
    )
    assert login_resp.status_code == 200, login_resp.text
    data = login_resp.json()
    assert "access_token" in data
    assert data["user"]["email"] == "photographer@example.com"
    assert data["user"]["studio_name"] == "Marlowe & Finch Photography"
    token = data["access_token"]

    # 2. Get current profile (/me)
    me_resp = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert me_resp.status_code == 200
    assert me_resp.json()["email"] == "photographer@example.com"

    # 3. Invalid credentials
    bad_login = client.post(
        "/api/v1/auth/login",
        json={"email": "photographer@example.com", "password": "wrongpassword"},
    )
    assert bad_login.status_code == 401

    # 4. Register new user with unique email
    new_email = f"user_{uuid.uuid4().hex[:8]}@teststudio.com"
    reg_resp = client.post(
        "/api/v1/auth/register",
        json={
            "email": new_email,
            "password": "securepassword123",
            "studio_name": "Test Studio",
        },
    )
    assert reg_resp.status_code == 201, reg_resp.text
    assert reg_resp.json()["user"]["email"] == new_email

    # 5. Duplicate registration rejection
    dup_resp = client.post(
        "/api/v1/auth/register",
        json={
            "email": new_email,
            "password": "securepassword123",
            "studio_name": "Duplicate Studio",
        },
    )
    assert dup_resp.status_code == 400

