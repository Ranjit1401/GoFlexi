import pytest
import uuid
from starlette.testclient import TestClient


def register_and_login(client: TestClient, role="traveler"):
    email = f"traveler_{uuid.uuid4().hex[:8]}@example.com"
    password = "SecurePassword123!"
    client.post(
        "/api/auth/register",
        json={"name": "Trip Tester", "email": email, "password": password, "role": role}
    )
    login_resp = client.post(
        "/api/auth/login",
        json={"email": email, "password": password, "role": role}
    )
    return login_resp.json()["access_token"]


@pytest.fixture
def auth_headers(client):
    token = register_and_login(client, role="traveler")
    return {"Authorization": f"Bearer {token}"}


def test_get_trips_unauthenticated(client):
    resp = client.get("/api/trips")
    assert resp.status_code == 401


def test_get_trips_auto_seeds_for_new_traveler(client, auth_headers):
    resp = client.get("/api/trips", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) >= 4
    titles = [t["title"] for t in data]
    assert "Goa Escape" in titles
    assert "Himalayan Ridge Expedition" in titles


def test_create_and_get_trip(client, auth_headers):
    payload = {
        "title": "Ladakh Bike Safari",
        "destination": "Leh Ladakh",
        "start_date": "2026-08-10",
        "end_date": "2026-08-18",
        "days": 9,
        "travelers_count": 2,
        "budget": "₹75,000",
        "status": "Upcoming",
        "image_url": "https://example.com/ladakh.jpg",
        "itinerary_summary": "High altitude passes, Pangong Tso camp, and monasteries.",
        "tags": ["Adventure", "Biking"],
        "stops": ["Leh", "Nubra Valley", "Pangong Tso"]
    }
    create_resp = client.post("/api/trips", json=payload, headers=auth_headers)
    assert create_resp.status_code == 201
    created = create_resp.json()
    assert created["title"] == "Ladakh Bike Safari"
    assert created["destination"] == "Leh Ladakh"
    assert created["days"] == 9
    trip_id = created["id"]

    # Get single
    get_resp = client.get(f"/api/trips/{trip_id}", headers=auth_headers)
    assert get_resp.status_code == 200
    assert get_resp.json()["id"] == trip_id
    assert get_resp.json()["title"] == "Ladakh Bike Safari"


def test_update_and_delete_trip(client, auth_headers):
    payload = {
        "title": "Draft Shimla Trip",
        "destination": "Shimla",
        "start_date": "2026-11-01",
        "end_date": "2026-11-04",
        "days": 4,
        "travelers_count": 1,
        "budget": "₹20,000",
        "status": "Draft",
    }
    create_resp = client.post("/api/trips", json=payload, headers=auth_headers)
    trip_id = create_resp.json()["id"]

    # Update
    update_resp = client.put(
        f"/api/trips/{trip_id}",
        json={"title": "Shimla Winter Wonderland", "status": "Upcoming", "budget": "₹25,000"},
        headers=auth_headers
    )
    assert update_resp.status_code == 200
    updated = update_resp.json()
    assert updated["title"] == "Shimla Winter Wonderland"
    assert updated["status"] == "Upcoming"
    assert updated["budget"] == "₹25,000"

    # Delete
    del_resp = client.delete(f"/api/trips/{trip_id}", headers=auth_headers)
    assert del_resp.status_code == 200
    assert del_resp.json()["status"] == "deleted"

    # Verify 404 after delete
    get_again = client.get(f"/api/trips/{trip_id}", headers=auth_headers)
    assert get_again.status_code == 404


def test_filter_trips_by_status(client, auth_headers):
    upcoming_resp = client.get("/api/trips?status=Upcoming", headers=auth_headers)
    assert upcoming_resp.status_code == 200
    for trip in upcoming_resp.json():
        assert trip["status"] == "Upcoming"

    past_resp = client.get("/api/trips?status=Past", headers=auth_headers)
    assert past_resp.status_code == 200
    for trip in past_resp.json():
        assert trip["status"] == "Past"
