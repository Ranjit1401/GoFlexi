import pytest
from fastapi import status
from app.models.destination import Destination


def register_and_login(client, name="Test Traveler", email="traveler@example.com", password="Password123!", role="traveler", agency_name=None):
    payload = {
        "name": name,
        "email": email,
        "password": password,
        "role": role,
    }
    if role == "agent":
        payload["agency_name"] = agency_name or "Test Agency"
    reg_resp = client.post("/api/auth/register", json=payload)
    assert reg_resp.status_code == 201

    login_resp = client.post("/api/auth/login", json={
        "email": email,
        "password": password,
        "role": role
    })
    assert login_resp.status_code == 200
    return login_resp.json()["access_token"]


@pytest.fixture
def sample_destinations(db_session):
    """Seed test destinations with coordinates."""
    d1 = Destination(
        name="North Goa",
        country="India",
        state="Goa",
        city="Panaji",
        latitude=15.4989,
        longitude=73.8278,
        description="Sun-kissed beaches, Portuguese heritage, and coastal shacks.",
        short_description="Beaches and vibrant coastal lifestyle.",
        budget_min=12000,
        budget_max=40000,
        popularity_score=9.6,
    )
    d2 = Destination(
        name="Manali",
        country="India",
        state="Himachal Pradesh",
        city="Manali",
        latitude=32.2432,
        longitude=77.1892,
        description="Alpine town surrounded by cedar forests and snow peaks.",
        short_description="Snow valleys and mountain adventures.",
        budget_min=15000,
        budget_max=45000,
        popularity_score=9.3,
    )
    db_session.add(d1)
    db_session.add(d2)
    db_session.commit()
    return [d1, d2]


def test_copilot_unauthenticated(client):
    """Calling /api/copilot/plan without auth returns 401."""
    response = client.post(
        "/api/copilot/plan",
        json={"message": "Plan a 3-day trip to Goa"}
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_copilot_agent_forbidden(client):
    """Calling /api/copilot/plan as an agent returns 403."""
    agent_token = register_and_login(client, name="Agent John", email="agent.copilot@example.com", role="agent")
    response = client.post(
        "/api/copilot/plan",
        headers={"Authorization": f"Bearer {agent_token}"},
        json={"message": "Plan a 3-day trip to Goa"}
    )
    assert response.status_code == status.HTTP_403_FORBIDDEN


def test_copilot_empty_message(client):
    """Calling /api/copilot/plan with empty message returns 400."""
    traveler_token = register_and_login(client, name="Traveler Jane", email="traveler.jane@example.com", role="traveler")
    response = client.post(
        "/api/copilot/plan",
        headers={"Authorization": f"Bearer {traveler_token}"},
        json={"message": "   "}
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST


def test_copilot_generate_plan_goa(client, sample_destinations):
    """Calling /api/copilot/plan with valid prompt returns structured multi-agent plan."""
    traveler_token = register_and_login(client, name="Traveler Bob", email="traveler.bob@example.com", role="traveler")
    response = client.post(
        "/api/copilot/plan",
        headers={"Authorization": f"Bearer {traveler_token}"},
        json={"message": "Plan a 3-day luxury relaxing trip to Goa"}
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "message" in data
    assert "trip_plan" in data

    plan = data["trip_plan"]
    assert plan["origin"] is not None
    assert "Goa" in plan["destination"]
    assert plan["duration_days"] == 3
    assert len(plan["nodes"]) >= 4
    assert len(plan["locations"]) >= 4
    assert len(plan["routes"]) >= 1

    # Check route coordinates
    first_route = plan["routes"][0]
    assert len(first_route["from_coords"]) == 2
    assert len(first_route["to_coords"]) == 2
