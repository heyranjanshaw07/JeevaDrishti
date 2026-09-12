import pytest

from app.models.user import User
from app.core.security import hash_password, create_access_token
from tests.conftest import TestingSessionLocal, client


# ─── 1. Successful Registration ──────────────────────────────────────────────
def test_successful_registration():
    response = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Dr. Arya Sen",
            "email": "arya.sen@jeevadrishti.org",
            "password": "SecurePassword123!",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Dr. Arya Sen"
    assert data["email"] == "arya.sen@jeevadrishti.org"
    assert data["role"] == "researcher"
    assert data["is_active"] is True
    assert "hashed_password" not in data
    assert "password" not in data


# ─── 2. Duplicate Registration Rejection ─────────────────────────────────────
def test_duplicate_registration_rejected():
    payload = {
        "name": "Dr. Arya Sen",
        "email": "arya.sen@jeevadrishti.org",
        "password": "SecurePassword123!",
    }
    first_res = client.post("/api/v1/auth/register", json=payload)
    assert first_res.status_code == 201

    duplicate_res = client.post("/api/v1/auth/register", json=payload)
    assert duplicate_res.status_code == 400
    assert "already registered" in duplicate_res.json()["detail"].lower()


# ─── 3. Successful Login ─────────────────────────────────────────────────────
def test_successful_login():
    # Register user first
    client.post(
        "/api/v1/auth/register",
        json={
            "name": "Dr. Maya Roy",
            "email": "maya.roy@jeevadrishti.org",
            "password": "TargetPassword2026",
        },
    )

    # Login
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "maya.roy@jeevadrishti.org",
            "password": "TargetPassword2026",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "maya.roy@jeevadrishti.org"
    assert data["user"]["name"] == "Dr. Maya Roy"


# ─── 4. Login With Wrong Password ────────────────────────────────────────────
def test_login_wrong_password():
    client.post(
        "/api/v1/auth/register",
        json={
            "name": "Dr. Maya Roy",
            "email": "maya.roy@jeevadrishti.org",
            "password": "CorrectPassword123",
        },
    )

    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "maya.roy@jeevadrishti.org",
            "password": "WrongPassword999",
        },
    )
    assert response.status_code == 401
    assert "incorrect email or password" in response.json()["detail"].lower()


# ─── 5. Login With Non-Existent User ─────────────────────────────────────────
def test_login_non_existent_user():
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "ghost.user@jeevadrishti.org",
            "password": "AnyPassword123!",
        },
    )
    assert response.status_code == 401
    # Generic failure message to prevent email enumeration
    assert "incorrect email or password" in response.json()["detail"].lower()


# ─── 6. /me Without Token ────────────────────────────────────────────────────
def test_me_without_token():
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401
    assert "token is missing" in response.json()["detail"].lower()


# ─── 7. /me With Valid Token ─────────────────────────────────────────────────
def test_me_with_valid_token():
    reg = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Dr. Neil Vance",
            "email": "neil.vance@jeevadrishti.org",
            "password": "Password777!",
        },
    )
    assert reg.status_code == 201

    login_res = client.post(
        "/api/v1/auth/login",
        json={
            "email": "neil.vance@jeevadrishti.org",
            "password": "Password777!",
        },
    )
    token = login_res.json()["access_token"]

    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "neil.vance@jeevadrishti.org"
    assert data["name"] == "Dr. Neil Vance"
    assert data["role"] == "researcher"


# ─── 8. Inactive User Protection ─────────────────────────────────────────────
def test_inactive_user_protection():
    db = TestingSessionLocal()
    try:
        inactive_user = User(
            name="Deactivated Researcher",
            email="inactive@jeevadrishti.org",
            hashed_password=hash_password("Password123!"),
            role="researcher",
            is_active=False,
        )
        db.add(inactive_user)
        db.commit()
        db.refresh(inactive_user)
        user_id = inactive_user.id
    finally:
        db.close()

    # Attempt to log in as inactive user
    login_res = client.post(
        "/api/v1/auth/login",
        json={
            "email": "inactive@jeevadrishti.org",
            "password": "Password123!",
        },
    )
    assert login_res.status_code == 403
    assert "inactive" in login_res.json()["detail"].lower()

    # Attempt to access /me with token generated for inactive user
    token = create_access_token({"sub": str(user_id), "email": "inactive@jeevadrishti.org", "role": "researcher"})
    me_res = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert me_res.status_code == 403
    assert "inactive" in me_res.json()["detail"].lower()


# ─── 9. Password is Truly Hashed in Database ─────────────────────────────────
def test_password_is_hashed_in_database():
    plain_password = "MySuperSecretPassword#2026"
    client.post(
        "/api/v1/auth/register",
        json={
            "name": "Audit Researcher",
            "email": "audit@jeevadrishti.org",
            "password": plain_password,
        },
    )

    db = TestingSessionLocal()
    try:
        user = db.query(User).filter(User.email == "audit@jeevadrishti.org").first()
        assert user is not None
        # Must never equal plain password
        assert user.hashed_password != plain_password
        # Must be standard bcrypt hash prefix
        assert user.hashed_password.startswith("$2b$") or user.hashed_password.startswith("$2a$")
    finally:
        db.close()


# ─── 10. Role Authorization Check (Admin vs Researcher) ──────────────────────
def test_role_authorization():
    # 1. Register normal researcher
    reg = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Normal Researcher",
            "email": "normal@jeevadrishti.org",
            "password": "Password123!",
        },
    )
    user_id = reg.json()["id"]

    researcher_token = create_access_token({
        "sub": str(user_id),
        "email": "normal@jeevadrishti.org",
        "role": "researcher",
    })

    # Researcher attempts admin endpoint -> 403 Forbidden
    forbidden_res = client.get(
        "/api/v1/auth/admin-check",
        headers={"Authorization": f"Bearer {researcher_token}"},
    )
    assert forbidden_res.status_code == 403
    assert "requires one of the following roles: admin" in forbidden_res.json()["detail"].lower()

    # 2. Create Admin user in DB
    db = TestingSessionLocal()
    try:
        admin_user = User(
            name="Principal Admin",
            email="admin@jeevadrishti.org",
            hashed_password=hash_password("AdminSecurePass!"),
            role="admin",
            is_active=True,
        )
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        admin_id = admin_user.id
    finally:
        db.close()

    admin_token = create_access_token({
        "sub": str(admin_id),
        "email": "admin@jeevadrishti.org",
        "role": "admin",
    })

    # Admin accesses admin endpoint -> 200 OK
    allowed_res = client.get(
        "/api/v1/auth/admin-check",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert allowed_res.status_code == 200
    assert allowed_res.json()["role"] == "admin"


# ─── 11. Logout Endpoint ─────────────────────────────────────────────────────
def test_logout_endpoint():
    response = client.post("/api/v1/auth/logout")
    assert response.status_code == 200
    assert response.json()["message"] == "Successfully logged out"
