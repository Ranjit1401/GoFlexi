import pytest
import uuid
from starlette.testclient import TestClient


def create_agent(client: TestClient, name="Agent One", agency="Agency Alpha"):
    email = f"agent_{uuid.uuid4().hex[:8]}@example.com"
    password = "SecurePassword123!"
    reg = client.post(
        "/api/auth/register",
        json={"name": name, "email": email, "password": password, "role": "agent", "agency_name": agency}
    )
    assert reg.status_code == 201
    login = client.post(
        "/api/auth/login",
        json={"email": email, "password": password, "role": "agent"}
    )
    assert login.status_code == 200
    token = login.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}, email


def create_traveler(client: TestClient, name="Traveler One"):
    email = f"traveler_{uuid.uuid4().hex[:8]}@example.com"
    password = "SecurePassword123!"
    reg = client.post(
        "/api/auth/register",
        json={"name": name, "email": email, "password": password, "role": "traveler"}
    )
    assert reg.status_code == 201
    login = client.post(
        "/api/auth/login",
        json={"email": email, "password": password, "role": "traveler"}
    )
    assert login.status_code == 200
    token = login.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}, email


# 1. Agent can load dashboard
def test_agent_can_load_dashboard(client: TestClient):
    headers, email = create_agent(client, name="Aarav Mehta", agency="Mehta Explorations")

    # GET /api/agents/dashboard
    resp1 = client.get("/api/agents/dashboard", headers=headers)
    assert resp1.status_code == 200
    data1 = resp1.json()
    assert data1["operator"]["name"] == "Aarav Mehta"
    assert data1["operator"]["agency_name"] == "Mehta Explorations"
    assert data1["statistics"]["total_travelers"] == 0
    assert data1["statistics"]["total_tours"] == 0
    assert data1["statistics"]["upcoming_tours"] == 0
    assert data1["statistics"]["total_bookings"] == 0
    assert data1["upcoming_tours"] == []
    assert data1["active_alerts"] == []

    # GET /api/agent/dashboard (alias route)
    resp2 = client.get("/api/agent/dashboard", headers=headers)
    assert resp2.status_code == 200
    data2 = resp2.json()
    assert data2["operator"]["name"] == "Aarav Mehta"


# 2. Traveler cannot load dashboard (403 Forbidden)
def test_traveler_cannot_load_dashboard(client: TestClient):
    headers, _ = create_traveler(client)
    resp = client.get("/api/agents/dashboard", headers=headers)
    assert resp.status_code == 403

    resp2 = client.get("/api/agent/dashboard", headers=headers)
    assert resp2.status_code == 403


# 3. Unauthenticated user cannot load dashboard (401 Unauthorized)
def test_unauthenticated_cannot_load_dashboard(client: TestClient):
    resp = client.get("/api/agents/dashboard")
    assert resp.status_code == 401

    resp2 = client.get("/api/agent/dashboard")
    assert resp2.status_code == 401


# 4. Dashboard statistics come from database
def test_dashboard_statistics_come_from_db(client: TestClient):
    headers, _ = create_agent(client)

    # Initially all 0
    resp = client.get("/api/agents/dashboard", headers=headers)
    assert resp.status_code == 200
    stats = resp.json()["statistics"]
    assert stats["total_travelers"] == 0
    assert stats["total_tours"] == 0
    assert stats["upcoming_tours"] == 0
    assert stats["total_bookings"] == 0
    assert stats["pending_bookings"] == 0

    # Add a tour
    t_resp = client.post("/api/agent/tours", json={
        "name": "Kashmir Alpine Lakes",
        "destination": "Srinagar, Kashmir",
        "duration": "6 Days / 5 Nights",
        "budget_per_person": 38000,
        "max_participants": 10,
        "status": "Upcoming"
    }, headers=headers)
    assert t_resp.status_code == 201
    tour_id = t_resp.json()["id"]

    # Add a booking
    b_resp = client.post("/api/agent/bookings", json={
        "booking_code": f"BK-{uuid.uuid4().hex[:6].upper()}",
        "traveler_name": "Maya Pillai",
        "traveler_email": "maya.pillai@example.com",
        "tour_name": "Kashmir Alpine Lakes",
        "service": "Custom Tour",
        "departure_date": "2026-11-20",
        "amount": "₹38,000",
        "status": "Pending",
        "tour_id": tour_id
    }, headers=headers)
    assert b_resp.status_code == 201

    # Re-check dashboard stats
    resp2 = client.get("/api/agents/dashboard", headers=headers)
    assert resp2.status_code == 200
    stats2 = resp2.json()["statistics"]
    assert stats2["total_tours"] == 1
    assert stats2["upcoming_tours"] == 1
    assert stats2["total_bookings"] == 1
    assert stats2["pending_bookings"] == 1


# 5. Agent sees only own tours
def test_agent_sees_only_own_tours(client: TestClient):
    headers_a, _ = create_agent(client, name="Agent A", agency="Agency A")
    headers_b, _ = create_agent(client, name="Agent B", agency="Agency B")

    # Agent A creates tour
    client.post("/api/agent/tours", json={
        "name": "Tour of Agency A",
        "destination": "Goa",
        "duration": "3 Days",
        "budget_per_person": 15000,
        "max_participants": 8,
        "status": "Active"
    }, headers=headers_a)

    # Agent B lists tours
    resp_b = client.get("/api/agent/tours", headers=headers_b)
    assert resp_b.status_code == 200
    assert resp_b.json() == []

    # Agent A lists tours
    resp_a = client.get("/api/agent/tours", headers=headers_a)
    assert resp_a.status_code == 200
    assert len(resp_a.json()) == 1
    assert resp_a.json()[0]["name"] == "Tour of Agency A"


# 6. Agent sees only own bookings
def test_agent_sees_only_own_bookings(client: TestClient):
    headers_a, _ = create_agent(client, name="Agent A", agency="Agency A")
    headers_b, _ = create_agent(client, name="Agent B", agency="Agency B")

    client.post("/api/agent/bookings", json={
        "booking_code": f"BK-{uuid.uuid4().hex[:6].upper()}",
        "traveler_name": "Traveler A",
        "traveler_email": "traveler_a@example.com",
        "tour_name": "Tour A",
        "service": "Custom Tour",
        "departure_date": "2026-10-15",
        "amount": "₹20,000",
        "status": "Confirmed"
    }, headers=headers_a)

    resp_b = client.get("/api/agent/bookings", headers=headers_b)
    assert resp_b.status_code == 200
    assert resp_b.json() == []

    resp_a = client.get("/api/agent/bookings", headers=headers_a)
    assert resp_a.status_code == 200
    assert len(resp_a.json()) == 1


# 7. Agent sees only own travelers
def test_agent_sees_only_own_travelers(client: TestClient):
    headers_a, _ = create_agent(client, name="Agent A", agency="Agency A")
    headers_b, _ = create_agent(client, name="Agent B", agency="Agency B")

    client.post("/api/agent/travelers", json={
        "name": "Traveler Assigned to A",
        "email": "traveler_assigned_a@example.com",
        "phone": "+91 99999 11111",
        "preferred_destination": "Udaipur"
    }, headers=headers_a)

    resp_b = client.get("/api/agent/travelers", headers=headers_b)
    assert resp_b.status_code == 200
    assert resp_b.json() == []

    resp_a = client.get("/api/agent/travelers", headers=headers_a)
    assert resp_a.status_code == 200
    assert len(resp_a.json()) == 1
    assert resp_a.json()[0]["email"] == "traveler_assigned_a@example.com"


# 8. Agent cannot access another agent's tour
def test_agent_cannot_access_another_agent_tour(client: TestClient):
    headers_a, _ = create_agent(client, name="Agent A", agency="Agency A")
    headers_b, _ = create_agent(client, name="Agent B", agency="Agency B")

    create_resp = client.post("/api/agent/tours", json={
        "name": "Private Luxury Retreat",
        "destination": "Shimla",
        "duration": "4 Days",
        "budget_per_person": 45000,
        "max_participants": 6,
        "status": "Active"
    }, headers=headers_a)
    tour_id = create_resp.json()["id"]

    # Agent B attempts GET /api/agent/tours/{tour_id}
    resp = client.get(f"/api/agent/tours/{tour_id}", headers=headers_b)
    assert resp.status_code in [403, 404]


# 9. Agent cannot modify another agent's tour
def test_agent_cannot_modify_another_agent_tour(client: TestClient):
    headers_a, _ = create_agent(client, name="Agent A", agency="Agency A")
    headers_b, _ = create_agent(client, name="Agent B", agency="Agency B")

    create_resp = client.post("/api/agent/tours", json={
        "name": "Golden Triangle Tour",
        "destination": "Agra",
        "duration": "5 Days",
        "budget_per_person": 30000,
        "max_participants": 15,
        "status": "Active"
    }, headers=headers_a)
    tour_id = create_resp.json()["id"]

    # Agent B attempts PUT /api/agent/tours/{tour_id}
    put_resp = client.put(f"/api/agent/tours/{tour_id}", json={
        "name": "Hacked Tour Name",
        "destination": "Agra",
        "duration": "5 Days",
        "budget_per_person": 1000,
        "max_participants": 15,
        "status": "Active"
    }, headers=headers_b)
    assert put_resp.status_code in [403, 404]

    # Verify tour unchanged
    get_resp = client.get(f"/api/agent/tours/{tour_id}", headers=headers_a)
    assert get_resp.status_code == 200
    assert get_resp.json()["name"] == "Golden Triangle Tour"


# 10. Agent cannot delete another agent's tour
def test_agent_cannot_delete_another_agent_tour(client: TestClient):
    headers_a, _ = create_agent(client, name="Agent A", agency="Agency A")
    headers_b, _ = create_agent(client, name="Agent B", agency="Agency B")

    create_resp = client.post("/api/agent/tours", json={
        "name": "Rishikesh Yoga Pilgrimage",
        "destination": "Rishikesh",
        "duration": "7 Days",
        "budget_per_person": 25000,
        "max_participants": 20,
        "status": "Upcoming"
    }, headers=headers_a)
    tour_id = create_resp.json()["id"]

    # Agent B attempts DELETE
    del_resp = client.delete(f"/api/agent/tours/{tour_id}", headers=headers_b)
    assert del_resp.status_code in [403, 404]

    # Verify tour still exists
    get_resp = client.get(f"/api/agent/tours/{tour_id}", headers=headers_a)
    assert get_resp.status_code == 200
    assert get_resp.json()["name"] == "Rishikesh Yoga Pilgrimage"


# 11. Tour creation works
def test_tour_creation_works(client: TestClient):
    headers, _ = create_agent(client)
    payload = {
        "name": "Sundarbans Delta Safari",
        "destination": "Sundarbans, West Bengal",
        "duration": "3 Days / 2 Nights",
        "budget_per_person": 24000,
        "max_participants": 12,
        "status": "Upcoming",
        "description": "Mangrove forest eco-tour."
    }
    resp = client.post("/api/agent/tours", json=payload, headers=headers)
    assert resp.status_code == 201
    tour = resp.json()
    assert tour["name"] == payload["name"]
    assert tour["destination"] == payload["destination"]
    assert tour["max_participants"] == 12
    assert tour["status"] == "Upcoming"
    assert tour["description"] == "Mangrove forest eco-tour."


# 12. Tour validation works
def test_tour_validation_works(client: TestClient):
    headers, _ = create_agent(client)

    # Missing name
    resp_no_name = client.post("/api/agent/tours", json={
        "destination": "Goa",
        "duration": "3 Days",
        "max_participants": 10
    }, headers=headers)
    assert resp_no_name.status_code == 422

    # Negative / zero capacity
    resp_bad_cap = client.post("/api/agent/tours", json={
        "name": "Invalid Capacity Tour",
        "max_participants": -5
    }, headers=headers)
    assert resp_bad_cap.status_code in [400, 422]


# 13. Booking listing works
def test_booking_listing_works(client: TestClient):
    headers, _ = create_agent(client)

    # Empty list
    resp1 = client.get("/api/agent/bookings", headers=headers)
    assert resp1.status_code == 200
    assert resp1.json() == []

    # Create 2 bookings
    for i in range(2):
        client.post("/api/agent/bookings", json={
            "booking_code": f"BK-{uuid.uuid4().hex[:6].upper()}",
            "traveler_name": f"Traveler #{i}",
            "traveler_email": f"traveler_{i}@example.com",
            "tour_name": "Himalayan High Altitude Pass",
            "service": "Package Tour",
            "departure_date": "2026-11-01",
            "amount": "₹45,000",
            "status": "Confirmed"
        }, headers=headers)

    resp2 = client.get("/api/agent/bookings", headers=headers)
    assert resp2.status_code == 200
    assert len(resp2.json()) == 2


# 14. Empty dashboard works without fake data
def test_empty_dashboard_works_without_fake_data(client: TestClient):
    headers, _ = create_agent(client, name="Fresh Agent", agency="Fresh Agency")

    resp = client.get("/api/agents/dashboard", headers=headers)
    assert resp.status_code == 200
    data = resp.json()

    # Zero statistics
    assert data["statistics"]["total_travelers"] == 0
    assert data["statistics"]["total_tours"] == 0
    assert data["statistics"]["upcoming_tours"] == 0
    assert data["statistics"]["total_bookings"] == 0
    assert data["statistics"]["pending_bookings"] == 0

    # Empty arrays
    assert data["upcoming_tours"] == []
    assert data["active_alerts"] == []
    assert data["recent_activity"] == []

    # Verify no fake strings appear in response
    resp_text = resp.text
    assert "Rahul Sharma" not in resp_text
    assert "Priya Mehta" not in resp_text
    assert "Amit Shah" not in resp_text
    assert "Sneha Kapoor" not in resp_text
    assert "Goa Luxury Coastal & Heritage" not in resp_text
    assert "6E-204" not in resp_text


# 15. Operator traveler assignment works and prevents duplicate
def test_operator_traveler_assignment_and_duplicate(client: TestClient):
    headers, _ = create_agent(client)

    # First assignment
    payload = {
        "name": "Kavita Rao",
        "email": "kavita.rao@example.com",
        "phone": "+91 98333 44555",
        "preferred_destination": "Varanasi"
    }
    resp1 = client.post("/api/agent/travelers", json=payload, headers=headers)
    assert resp1.status_code == 201
    assert resp1.json()["name"] == "Kavita Rao"

    # Duplicate assignment to same agent should return 409 Conflict
    resp2 = client.post("/api/agent/travelers", json=payload, headers=headers)
    assert resp2.status_code == 409


# 16. Operator traveler unassignment works
def test_operator_traveler_unassignment(client: TestClient):
    headers, _ = create_agent(client)

    # Assign traveler
    payload = {
        "name": "Vikram Seth",
        "email": "vikram.seth@example.com",
        "phone": "+91 98444 55666",
        "preferred_destination": "Pondicherry"
    }
    resp = client.post("/api/agent/travelers", json=payload, headers=headers)
    assert resp.status_code == 201
    traveler_id = resp.json()["id"]

    # Verify in list
    list1 = client.get("/api/agent/travelers", headers=headers)
    assert len(list1.json()) == 1

    # Unassign / remove traveler
    del_resp = client.delete(f"/api/agent/travelers/{traveler_id}", headers=headers)
    assert del_resp.status_code == 200

    # Verify list is now empty
    list2 = client.get("/api/agent/travelers", headers=headers)
    assert len(list2.json()) == 0
