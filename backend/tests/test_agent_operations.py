import pytest
import uuid
from starlette.testclient import TestClient


def register_and_login_agent(client: TestClient):
    email = f"agent_{uuid.uuid4().hex[:8]}@example.com"
    password = "SecurePassword123!"
    # Register agent
    client.post(
        "/api/auth/register",
        json={"name": "Agent Ops Tester", "email": email, "password": password, "role": "agent", "agency_name": "Voyagar Luxury Tours"}
    )
    login_resp = client.post(
        "/api/auth/login",
        json={"email": email, "password": password, "role": "agent"}
    )
    return login_resp.json()["access_token"]


@pytest.fixture
def agent_headers(client):
    token = register_and_login_agent(client)
    return {"Authorization": f"Bearer {token}"}


def test_agent_bookings_rbac(client):
    # Unauthenticated
    resp = client.get("/api/agent/bookings")
    assert resp.status_code == 401


def test_agent_bookings_list_and_seed(client, agent_headers):
    resp = client.get("/api/agent/bookings", headers=agent_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) >= 5
    codes = [b["booking_code"] for b in data]
    assert "VY-8921" in codes


def test_agent_booking_status_update(client, agent_headers):
    resp = client.get("/api/agent/bookings", headers=agent_headers)
    assert resp.status_code == 200
    booking = resp.json()[0]
    b_id = booking["id"]

    # Update to Cancelled
    update_resp = client.put(
        f"/api/agent/bookings/{b_id}/status",
        json={"status": "Cancelled"},
        headers=agent_headers
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["status"] == "Cancelled"


def test_agent_booking_search(client, agent_headers):
    resp = client.get("/api/agent/bookings?search=Rahul", headers=agent_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) >= 1
    assert any("Rahul" in b["traveler_name"] for b in data)
