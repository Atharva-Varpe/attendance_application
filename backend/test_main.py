import pytest
from main import app
from fastapi.testclient import TestClient

client = TestClient(app)

def test_login_success():
    response = client.post("/api/login", json={"email": "admin@example.com", "password": "admin123"})
    assert response.status_code == 200
    assert "token" in response.json()

def test_login_invalid():
    response = client.post("/api/login", json={"email": "invalid@example.com", "password": "wrong"})
    assert response.status_code == 401

def test_get_me_unauthorized():
    response = client.get("/api/me")
    assert response.status_code == 401