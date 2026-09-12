import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.core.config import settings

client = TestClient(app)


def test_root_endpoint():
    """Verify GET / returns correct metadata and running status."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == settings.APP_NAME
    assert data["version"] == settings.APP_VERSION
    assert data["status"] == "running"


def test_health_endpoint():
    """Verify GET /api/v1/health returns healthy status."""
    response = client.get(f"{settings.API_V1_PREFIX}/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "jeevadrishti-backend"
    assert data["version"] == settings.APP_VERSION


def test_system_status_endpoint():
    """Verify GET /api/v1/system/status reports readiness and explicit 'pending' for AI."""
    response = client.get(f"{settings.API_V1_PREFIX}/system/status")
    assert response.status_code == 200
    data = response.json()
    assert data["backend"] == "ready"
    assert data["database"] == "configured"
    assert data["storage"] == "configured"
    # Critical requirement: AI engine must explicitly remain "pending" in B1
    assert data["ai_engine"] == "pending"
