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


def test_agent_schedules_list_and_create(client, agent_headers):
    resp = client.get("/api/agent/schedules", headers=agent_headers)
    assert resp.status_code == 200
    schedules = resp.json()
    assert len(schedules) >= 4

    # Create new schedule event
    new_event = {
        "time": "04:30 PM",
        "date": "Today",
        "item_type": "activity",
        "title": "Sunset Kayaking at Bambolim",
        "details": "Guided sea kayak excursion.",
        "traveler_or_group": "Mehta Family",
        "location": "Bambolim Beach",
        "status": "Scheduled"
    }
    create_resp = client.post("/api/agent/schedules", json=new_event, headers=agent_headers)
    assert create_resp.status_code == 201
    created = create_resp.json()
    assert created["title"] == "Sunset Kayaking at Bambolim"
    s_id = created["id"]

    # Delete
    del_resp = client.delete(f"/api/agent/schedules/{s_id}", headers=agent_headers)
    assert del_resp.status_code == 200
    assert del_resp.json()["status"] == "deleted"


def test_agent_vendors_crud(client, agent_headers):
    # List
    resp = client.get("/api/agent/vendors", headers=agent_headers)
    assert resp.status_code == 200
    vendors = resp.json()
    assert len(vendors) >= 5

    # Create
    new_vendor = {
        "name": "Panaji Coastal Jet Skis",
        "category": "Activities",
        "location": "Miramar, Goa",
        "contact_person": "Akash Gaonkar",
        "phone": "+91 98220 77112",
        "email": "akash@goajetski.com",
        "rating": 4.9,
        "status": "Verified Partner"
    }
    create_resp = client.post("/api/agent/vendors", json=new_vendor, headers=agent_headers)
    assert create_resp.status_code == 201
    created = create_resp.json()
    assert created["name"] == "Panaji Coastal Jet Skis"
    v_id = created["id"]

    # Update
    update_resp = client.put(
        f"/api/agent/vendors/{v_id}",
        json={"name": "Panaji Ocean Watersports", "rating": 5.0},
        headers=agent_headers
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["name"] == "Panaji Ocean Watersports"

    # Delete
    del_resp = client.delete(f"/api/agent/vendors/{v_id}", headers=agent_headers)
    assert del_resp.status_code == 200
    assert del_resp.json()["status"] == "deleted"


def test_agent_tours_and_summaries(client: TestClient, agent_headers: dict):
    # List tours
    resp = client.get("/api/agent/tours", headers=agent_headers)
    assert resp.status_code == 200
    tours = resp.json()
    assert len(tours) >= 3

    # Create tour
    new_tour = {
        "name": "Wayanad Rainforest Expedition",
        "destination": "Wayanad, Kerala",
        "duration": "4 Days / 3 Nights",
        "budget_per_person": 22000,
        "max_participants": 12,
        "status": "Upcoming"
    }
    create_resp = client.post("/api/agent/tours", json=new_tour, headers=agent_headers)
    assert create_resp.status_code == 201
    created = create_resp.json()
    assert created["name"] == "Wayanad Rainforest Expedition"
    assert created["status"] == "Upcoming"

    # Summaries
    sum_resp = client.get("/api/agent/tours/summaries", headers=agent_headers)
    assert sum_resp.status_code == 200
    summaries = sum_resp.json()
    assert len(summaries) >= 3
    assert "tour" in summaries[0]
    assert "traveler" in summaries[0]


def test_agent_notifications_and_mutations(client: TestClient, agent_headers: dict):
    # List notifications
    resp = client.get("/api/agent/notifications", headers=agent_headers)
    assert resp.status_code == 200
    notifs = resp.json()
    assert len(notifs) >= 4
    notif_id = notifs[0]["id"]

    # Toggle read
    read_resp = client.put(f"/api/agent/notifications/{notif_id}/read?read=true", headers=agent_headers)
    assert read_resp.status_code == 200
    assert read_resp.json()["is_read"] is True

    # Mark all read
    all_read_resp = client.put("/api/agent/notifications/mark-all-read", headers=agent_headers)
    assert all_read_resp.status_code == 200
    assert all_read_resp.json()["status"] == "ok"

    # Verify all are read
    verify_resp = client.get("/api/agent/notifications", headers=agent_headers)
    assert all(n["is_read"] is True for n in verify_resp.json())

    # Dismiss/delete one
    del_resp = client.delete(f"/api/agent/notifications/{notif_id}", headers=agent_headers)
    assert del_resp.status_code == 200
    assert del_resp.json()["status"] == "dismissed"

