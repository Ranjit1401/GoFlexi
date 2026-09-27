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
    d3 = Destination(
        name="Jaipur",
        country="India",
        state="Rajasthan",
        city="Jaipur",
        latitude=26.9124,
        longitude=75.7873,
        description="The Pink City of Rajasthan, famous for royal palaces and grand forts.",
        short_description="Historic forts, grand palaces, and royal heritage.",
        budget_min=10000,
        budget_max=35000,
        popularity_score=9.5,
    )
    db_session.add(d1)
    db_session.add(d2)
    db_session.add(d3)
    db_session.commit()
    return [d1, d2, d3]


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


def test_copilot_chat_unauthenticated(client):
    """Calling /api/copilot/chat without auth returns 401."""
    response = client.post(
        "/api/copilot/chat",
        json={"message": "hello"}
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_copilot_chat_agent_forbidden(client):
    """Calling /api/copilot/chat as an agent returns 403."""
    agent_token = register_and_login(client, name="Agent Sarah", email="agent.sarah@example.com", role="agent")
    response = client.post(
        "/api/copilot/chat",
        headers={"Authorization": f"Bearer {agent_token}"},
        json={"message": "hello"}
    )
    assert response.status_code == status.HTTP_403_FORBIDDEN


def test_copilot_chat_empty_message(client):
    """Calling /api/copilot/chat with empty message returns 400."""
    traveler_token = register_and_login(client, name="Traveler Sam", email="traveler.sam@example.com", role="traveler")
    response = client.post(
        "/api/copilot/chat",
        headers={"Authorization": f"Bearer {traveler_token}"},
        json={"message": "   "}
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST


# =============================================================================
# Exact User Scenarios (Test Cases 1 - 8)
# =============================================================================

def test_case_1_hello_casual_chat(client):
    """
    Test Case 1:
    Input: hello
    Expected: CASUAL_CHAT, No itinerary, No selected places, No map changes.
    """
    token = register_and_login(client, name="Traveler One", email="t1@example.com", role="traveler")
    response = client.post(
        "/api/copilot/chat",
        headers={"Authorization": f"Bearer {token}"},
        json={"message": "hello"}
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["intent"] == "CASUAL_CHAT"
    assert "GoFlexi" in data["message"] or "help" in data["message"].lower() or "where" in data["message"].lower()
    assert data["trip_plan"] is None
    assert len(data["selected_places"]) == 0
    assert len(data["places"]) == 0
    assert len(data["locations"]) == 0
    assert len(data["itinerary_changes"]) == 0


def test_case_2_destination_discovery_jaipur(client, sample_destinations):
    """
    Test Case 2:
    Input: I want to visit Jaipur
    Expected: DESTINATION_DISCOVERY, Real Jaipur destination, Real POIs, Place cards, No automatic itinerary.
    """
    token = register_and_login(client, name="Traveler Two", email="t2@example.com", role="traveler")
    response = client.post(
        "/api/copilot/chat",
        headers={"Authorization": f"Bearer {token}"},
        json={"message": "I want to visit Jaipur"}
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["intent"] == "DESTINATION_DISCOVERY"
    assert data["trip_plan"] is None  # NO automatic itinerary!
    assert len(data["places"]) >= 3  # Real POIs returned for place cards
    # Verify every place has real coordinates and IDs
    for p in data["places"]:
        assert p["name"] is not None
        assert p["latitude"] != 0
        assert p["longitude"] != 0
        assert p["source"] is not None


def test_case_3_add_place_amber_fort(client, sample_destinations):
    """
    Test Case 3:
    Click / Input: Add Amber Fort
    Expected: Amber Fort appears in selected places, locations (globe), no fake schedule.
    """
    token = register_and_login(client, name="Traveler Three", email="t3@example.com", role="traveler")
    response = client.post(
        "/api/copilot/chat",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "message": "Add Amber Fort to my trip",
            "trip_context": {"destinations": ["Jaipur"]},
            "selected_places": []
        }
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["intent"] == "ADD_PLACE"
    assert "Added Amber Fort" in data["message"]
    assert data["trip_plan"] is None  # NO fake schedule yet
    assert len(data["selected_places"]) == 1
    assert "amber fort" in data["selected_places"][0]["name"].lower()
    # Coordinates must be valid
    assert data["selected_places"][0]["latitude"] != 0
    assert data["selected_places"][0]["longitude"] != 0
    # Globe locations must contain the marker
    assert any("amber fort" in l["name"].lower() for l in data["locations"])


def test_case_4_add_city_palace(client, sample_destinations):
    """
    Test Case 4:
    Input: Add City Palace
    Expected: Added to TripState and globe, selected places has both Amber Fort and City Palace.
    """
    token = register_and_login(client, name="Traveler Four", email="t4@example.com", role="traveler")
    # Simulate prior state with Amber Fort
    existing_place = {
        "poi_id": "poi_amber_1",
        "name": "Amber Fort",
        "latitude": 26.9855,
        "longitude": 75.8513,
        "description": "Hilltop fort",
        "source": "OpenTripMap"
    }
    response = client.post(
        "/api/copilot/chat",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "message": "Add City Palace",
            "trip_context": {"destinations": ["Jaipur"]},
            "selected_places": [existing_place]
        }
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["intent"] == "ADD_PLACE"
    assert len(data["selected_places"]) == 2
    names = [p["name"].lower() for p in data["selected_places"]]
    assert any("amber" in n for n in names)
    assert any("city palace" in n for n in names)
    # Check globe markers
    loc_names = [l["name"].lower() for l in data["locations"]]
    assert any("amber" in n for n in loc_names)
    assert any("city palace" in n for n in loc_names)


def test_case_5_show_me_more_places(client, sample_destinations):
    """
    Test Case 5:
    Input: Show me more places
    Expected: More real Jaipur POIs, no fake places.
    """
    token = register_and_login(client, name="Traveler Five", email="t5@example.com", role="traveler")
    response = client.post(
        "/api/copilot/chat",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "message": "Show me more places",
            "trip_context": {"destinations": ["Jaipur"]}
        }
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["intent"] == "SHOW_MORE_PLACES"
    assert len(data["places"]) >= 3
    for p in data["places"]:
        assert p["name"] is not None
        assert p["latitude"] != 0
        assert p["longitude"] != 0


def test_case_6_create_itinerary_explicit(client, sample_destinations):
    """
    Test Case 6:
    Input: Create a 3-day itinerary from these places
    Expected: Structured itinerary generated ONLY now, assigns Morning, Afternoon, Evening, uses real selected places.
    """
    token = register_and_login(client, name="Traveler Six", email="t6@example.com", role="traveler")
    selected = [
        {
            "poi_id": "poi_1",
            "name": "Amber Fort",
            "latitude": 26.9855,
            "longitude": 75.8513,
            "description": "Hilltop fort",
            "source": "OpenTripMap"
        },
        {
            "poi_id": "poi_2",
            "name": "City Palace",
            "latitude": 26.9258,
            "longitude": 75.8236,
            "description": "Royal palace",
            "source": "OpenTripMap"
        }
    ]
    response = client.post(
        "/api/copilot/chat",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "message": "Create a 3-day itinerary from these places",
            "trip_context": {"destinations": ["Jaipur"], "origin": "Mumbai"},
            "selected_places": selected
        }
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["intent"] == "ITINERARY_REQUEST"
    assert data["trip_plan"] is not None
    plan = data["trip_plan"]
    assert plan["duration_days"] == 3
    assert "Jaipur" in plan["destination"]
    assert len(plan["nodes"]) >= 4  # Flight, hotel, day 1, day 2, day 3
    assert len(data["itinerary_changes"]) >= 3
    # Check that day nodes have time blocks morning, afternoon, evening
    day_nodes = [n for n in plan["nodes"] if n["type"] == "day"]
    assert len(day_nodes) == 3
    for d in day_nodes:
        time_blocks = [c["time_block"] for c in d["children"] if c.get("time_block")]
        assert "morning" in time_blocks or "afternoon" in time_blocks or "evening" in time_blocks


def test_case_7_make_day_2_more_relaxed(client, sample_destinations):
    """
    Test Case 7:
    Input: Make day 2 more relaxed
    Expected: Existing itinerary modified.
    """
    token = register_and_login(client, name="Traveler Seven", email="t7@example.com", role="traveler")
    # First create a plan
    res_plan = client.post(
        "/api/copilot/chat",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "message": "Create a 3-day itinerary in Jaipur",
            "trip_context": {"destinations": ["Jaipur"]}
        }
    )
    initial_plan = res_plan.json()["trip_plan"]

    # Now ask to make day 2 more relaxed
    response = client.post(
        "/api/copilot/chat",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "message": "Make day 2 more relaxed",
            "trip_state": initial_plan
        }
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["intent"] == "ITINERARY_MODIFICATION"
    assert "Day 2" in data["message"]
    assert data["trip_plan"] is not None


def test_case_8_remove_place(client, sample_destinations):
    """
    Test Case 8:
    Input: Remove Amber Fort
    Expected: Amber Fort removed from selected places and globe marker.
    """
    token = register_and_login(client, name="Traveler Eight", email="t8@example.com", role="traveler")
    selected = [
        {
            "poi_id": "poi_1",
            "name": "Amber Fort",
            "latitude": 26.9855,
            "longitude": 75.8513,
            "description": "Hilltop fort",
            "source": "OpenTripMap"
        },
        {
            "poi_id": "poi_2",
            "name": "City Palace",
            "latitude": 26.9258,
            "longitude": 75.8236,
            "description": "Royal palace",
            "source": "OpenTripMap"
        }
    ]
    response = client.post(
        "/api/copilot/chat",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "message": "Remove Amber Fort",
            "trip_context": {"destinations": ["Jaipur"]},
            "selected_places": selected
        }
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["intent"] == "REMOVE_PLACE"
    assert "Removed Amber Fort" in data["message"]
    assert len(data["selected_places"]) == 1
    assert data["selected_places"][0]["name"] == "City Palace"
    # Globe markers must not contain Amber Fort
    loc_names = [l["name"].lower() for l in data["locations"]]
    assert not any("amber" in n for n in loc_names)
    assert any("city palace" in n for n in loc_names)


def test_destination_recommendation(client, sample_destinations):
    """
    Testing: Where should I go? -> Calls recommendation engine.
    """
    token = register_and_login(client, name="Traveler Rec", email="trec@example.com", role="traveler")
    response = client.post(
        "/api/copilot/chat",
        headers={"Authorization": f"Bearer {token}"},
        json={"message": "Where should I go?"}
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["intent"] == "DESTINATION_RECOMMENDATION"
    assert len(data["suggested_actions"]) >= 1
