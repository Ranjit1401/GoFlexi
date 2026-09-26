import pytest
from app.models.traveler_profile import TravelerProfile, TravelerInterest


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
    token = login_resp.json()["access_token"]
    return token, login_resp.json()["user"]


def test_01_get_preferences_empty_before_onboarding(client):
    """GET /api/users/me/preferences returns onboarding_completed=False when not yet set."""
    token, user = register_and_login(client, email="empty_pref@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.get("/api/users/me/preferences", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["onboarding_completed"] is False
    assert data["user_id"] == user["id"]
    assert data["places"] == []
    assert data["experiences"] == []


def test_02_create_traveler_preferences(client):
    """PUT /api/users/me/preferences creates preferences and normalized interests."""
    token, user = register_and_login(client, email="create_pref@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    pref_payload = {
        "places": ["Mountains", "Beaches", "Nature"],
        "experiences": ["Adventure", "Food", "Relaxation"],
        "travel_style": "Balanced",
        "companions": "Couple",
        "transport": "Flight, Car",
        "itinerary_pace": "Balanced",
        "budget_range": "₹25,000 – ₹50,000",
        "onboarding_completed": True
    }

    resp = client.put("/api/users/me/preferences", json=pref_payload, headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["onboarding_completed"] is True
    assert set(data["places"]) == {"Mountains", "Beaches", "Nature"}
    assert set(data["experiences"]) == {"Adventure", "Food", "Relaxation"}
    assert data["travel_style"] == "Balanced"
    assert data["companions"] == "Couple"
    assert data["transport"] == "Flight, Car"
    assert data["itinerary_pace"] == "Balanced"
    assert data["budget_range"] == "₹25,000 – ₹50,000"


def test_03_get_traveler_preferences_populated(client):
    """GET /api/users/me/preferences returns saved preferences."""
    token, user = register_and_login(client, email="get_pop@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    pref_payload = {
        "places": ["Cities", "Historical"],
        "experiences": ["Culture", "Shopping"],
        "travel_style": "Luxury",
        "companions": "Solo",
        "transport": "Train",
        "itinerary_pace": "Relaxed",
        "budget_range": "₹50,000 – ₹1,00,000",
        "onboarding_completed": True
    }

    client.put("/api/users/me/preferences", json=pref_payload, headers=headers)

    resp = client.get("/api/users/me/preferences", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["onboarding_completed"] is True
    assert set(data["places"]) == {"Cities", "Historical"}
    assert set(data["experiences"]) == {"Culture", "Shopping"}
    assert data["travel_style"] == "Luxury"
    assert data["companions"] == "Solo"
    assert data["itinerary_pace"] == "Relaxed"


def test_04_repeated_update_idempotency_no_duplicate_profiles(client, db_session):
    """Repeated updates must NOT create duplicate profile rows."""
    token, user = register_and_login(client, email="idempotent_profile@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    payload1 = {
        "places": ["Mountains"],
        "experiences": ["Adventure"],
        "travel_style": "Budget",
        "companions": "Friends",
        "transport": "Bus",
        "itinerary_pace": "Packed",
        "budget_range": "Under ₹10,000",
        "onboarding_completed": True
    }
    client.put("/api/users/me/preferences", json=payload1, headers=headers)

    payload2 = {
        "places": ["Beaches"],
        "experiences": ["Relaxation"],
        "travel_style": "Premium",
        "companions": "Couple",
        "transport": "Flight",
        "itinerary_pace": "Relaxed",
        "budget_range": "₹1,00,000+",
        "onboarding_completed": True
    }
    resp = client.put("/api/users/me/preferences", json=payload2, headers=headers)
    assert resp.status_code == 200

    profiles = db_session.query(TravelerProfile).filter(TravelerProfile.user_id == user["id"]).all()
    assert len(profiles) == 1
    assert profiles[0].travel_style == "Premium"


def test_05_repeated_update_no_duplicate_interests(client, db_session):
    """Repeated updates must replace interests and not accumulate duplicate rows."""
    token, user = register_and_login(client, email="idempotent_interests@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    payload1 = {
        "places": ["Mountains", "Beaches"],
        "experiences": ["Adventure", "Food"],
        "travel_style": "Balanced",
        "companions": "Couple",
        "transport": "Flight",
        "itinerary_pace": "Balanced",
        "budget_range": "₹25,000 – ₹50,000",
        "onboarding_completed": True
    }
    client.put("/api/users/me/preferences", json=payload1, headers=headers)

    payload2 = {
        "places": ["Cities"],
        "experiences": ["Nightlife"],
        "travel_style": "Balanced",
        "companions": "Couple",
        "transport": "Flight",
        "itinerary_pace": "Balanced",
        "budget_range": "₹25,000 – ₹50,000",
        "onboarding_completed": True
    }
    resp = client.put("/api/users/me/preferences", json=payload2, headers=headers)
    assert resp.status_code == 200

    profile = db_session.query(TravelerProfile).filter(TravelerProfile.user_id == user["id"]).first()
    interests = db_session.query(TravelerInterest).filter(TravelerInterest.traveler_profile_id == profile.id).all()
    assert len(interests) == 2
    assert {i.interest_value for i in interests} == {"Cities", "Nightlife"}


def test_06_unauthenticated_requests_return_401(client):
    """Preferences endpoints return 401 without valid Bearer token."""
    resp_get = client.get("/api/users/me/preferences")
    assert resp_get.status_code == 401

    resp_put = client.put("/api/users/me/preferences", json={})
    assert resp_put.status_code == 401


def test_07_agent_role_forbidden_403(client):
    """Agent accounts must be forbidden (403) from accessing traveler preferences."""
    token, _ = register_and_login(client, email="agent_pref@agency.com", role="agent")
    headers = {"Authorization": f"Bearer {token}"}

    resp_get = client.get("/api/users/me/preferences", headers=headers)
    assert resp_get.status_code == 403

    resp_put = client.put("/api/users/me/preferences", json={
        "places": ["Mountains"],
        "experiences": ["Adventure"],
        "travel_style": "Budget",
        "companions": "Solo",
        "transport": "Car",
        "itinerary_pace": "Relaxed",
        "budget_range": "Under ₹10,000",
        "onboarding_completed": True
    }, headers=headers)
    assert resp_put.status_code == 403


def test_08_traveler_data_isolation(client):
    """Traveler A and Traveler B have strictly isolated preferences."""
    token_a, user_a = register_and_login(client, email="traveler_a@example.com")
    token_b, user_b = register_and_login(client, email="traveler_b@example.com")

    # Traveler A sets preferences
    client.put("/api/users/me/preferences", json={
        "places": ["Mountains"],
        "experiences": ["Adventure"],
        "travel_style": "Budget",
        "companions": "Solo",
        "transport": "Train",
        "itinerary_pace": "Packed",
        "budget_range": "Under ₹10,000",
        "onboarding_completed": True
    }, headers={"Authorization": f"Bearer {token_a}"})

    # Traveler B has NOT set preferences
    resp_b = client.get("/api/users/me/preferences", headers={"Authorization": f"Bearer {token_b}"})
    assert resp_b.status_code == 200
    assert resp_b.json()["onboarding_completed"] is False
    assert resp_b.json()["places"] == []


def test_09_invalid_preference_values_return_422(client):
    """Invalid enum values return 422 Unprocessable Entity."""
    token, _ = register_and_login(client, email="invalid_val@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    invalid_payload = {
        "places": ["Underwater"],  # invalid place
        "experiences": ["Adventure"],
        "travel_style": "SpaceTravel",  # invalid style
        "companions": "Alien",  # invalid companion
        "transport": "Rocket",
        "itinerary_pace": "Supersonic",  # invalid pace
        "budget_range": "Free",
        "onboarding_completed": True
    }
    resp = client.put("/api/users/me/preferences", json=invalid_payload, headers=headers)
    assert resp.status_code == 422


def test_10_onboarding_completed_persisted(client):
    """onboarding_completed field is persisted accurately."""
    token, _ = register_and_login(client, email="onboarding_status@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "places": ["Islands"],
        "experiences": ["Photography"],
        "travel_style": "Luxury",
        "companions": "Couple",
        "transport": "Flight",
        "itinerary_pace": "Relaxed",
        "budget_range": "₹1,00,000+",
        "onboarding_completed": True
    }
    resp = client.put("/api/users/me/preferences", json=payload, headers=headers)
    assert resp.status_code == 200
    assert resp.json()["onboarding_completed"] is True
