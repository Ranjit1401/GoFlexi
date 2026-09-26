import pytest
from app.models.destination import (
    Destination,
    DestinationTag,
    DestinationTravelStyle,
    DestinationCompanion,
    DestinationTransport,
    DestinationPace,
    DestinationBestMonth,
)


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


@pytest.fixture
def sample_kb(db_session):
    """Creates a sample destination knowledge base in the test database."""
    # 1. Manali (Mountains, Nature, Adventure)
    d1 = Destination(
        name="Manali",
        country="India",
        state="Himachal Pradesh",
        city="Manali",
        description="Alpine town with snow peaks and pine forests.",
        short_description="Snow valleys and mountain treks.",
        budget_min=15000,
        budget_max=45000,
        popularity_score=9.3,
    )
    db_session.add(d1)
    db_session.flush()
    db_session.add(DestinationTag(destination_id=d1.id, tag_type="place", tag_value="Mountains"))
    db_session.add(DestinationTag(destination_id=d1.id, tag_type="place", tag_value="Nature"))
    db_session.add(DestinationTag(destination_id=d1.id, tag_type="experience", tag_value="Adventure"))
    db_session.add(DestinationTag(destination_id=d1.id, tag_type="experience", tag_value="Photography"))
    db_session.add(DestinationTravelStyle(destination_id=d1.id, travel_style="Balanced"))
    db_session.add(DestinationTravelStyle(destination_id=d1.id, travel_style="Budget"))
    db_session.add(DestinationCompanion(destination_id=d1.id, companion_type="Friends"))
    db_session.add(DestinationCompanion(destination_id=d1.id, companion_type="Couple"))
    db_session.add(DestinationTransport(destination_id=d1.id, transport_type="Bus"))
    db_session.add(DestinationTransport(destination_id=d1.id, transport_type="Car"))
    db_session.add(DestinationTransport(destination_id=d1.id, transport_type="Flight"))
    db_session.add(DestinationPace(destination_id=d1.id, pace="Balanced"))
    db_session.add(DestinationBestMonth(destination_id=d1.id, month=5))

    # 2. Goa (Beaches, Nightlife, Food)
    d2 = Destination(
        name="Goa",
        country="India",
        state="Goa",
        city="Panaji",
        description="Sun-kissed beaches and Portuguese heritage.",
        short_description="Beaches and vibrant nightlife.",
        budget_min=12000,
        budget_max=40000,
        popularity_score=9.5,
    )
    db_session.add(d2)
    db_session.flush()
    db_session.add(DestinationTag(destination_id=d2.id, tag_type="place", tag_value="Beaches"))
    db_session.add(DestinationTag(destination_id=d2.id, tag_type="experience", tag_value="Nightlife"))
    db_session.add(DestinationTag(destination_id=d2.id, tag_type="experience", tag_value="Food"))
    db_session.add(DestinationTravelStyle(destination_id=d2.id, travel_style="Balanced"))
    db_session.add(DestinationTravelStyle(destination_id=d2.id, travel_style="Luxury"))
    db_session.add(DestinationCompanion(destination_id=d2.id, companion_type="Friends"))
    db_session.add(DestinationCompanion(destination_id=d2.id, companion_type="Couple"))
    db_session.add(DestinationTransport(destination_id=d2.id, transport_type="Flight"))
    db_session.add(DestinationTransport(destination_id=d2.id, transport_type="Train"))
    db_session.add(DestinationPace(destination_id=d2.id, pace="Relaxed"))
    db_session.add(DestinationBestMonth(destination_id=d2.id, month=12))

    # 3. Ranthambore (Nature, Wildlife, Photography)
    d3 = Destination(
        name="Ranthambore",
        country="India",
        state="Rajasthan",
        city="Sawai Madhopur",
        description="Royal Bengal tigers and historic forest reserve.",
        short_description="Wild jungle safaris.",
        budget_min=18000,
        budget_max=45000,
        popularity_score=8.8,
    )
    db_session.add(d3)
    db_session.flush()
    db_session.add(DestinationTag(destination_id=d3.id, tag_type="place", tag_value="Nature"))
    db_session.add(DestinationTag(destination_id=d3.id, tag_type="experience", tag_value="Wildlife"))
    db_session.add(DestinationTag(destination_id=d3.id, tag_type="experience", tag_value="Photography"))
    db_session.add(DestinationTravelStyle(destination_id=d3.id, travel_style="Balanced"))
    db_session.add(DestinationCompanion(destination_id=d3.id, companion_type="Family"))
    db_session.add(DestinationCompanion(destination_id=d3.id, companion_type="Friends"))
    db_session.add(DestinationTransport(destination_id=d3.id, transport_type="Train"))
    db_session.add(DestinationTransport(destination_id=d3.id, transport_type="Car"))
    db_session.add(DestinationPace(destination_id=d3.id, pace="Balanced"))
    db_session.add(DestinationBestMonth(destination_id=d3.id, month=11))

    # 4. Incomplete destination (no child tags)
    d4 = Destination(
        name="Minimal Haven",
        country="India",
        state="Karnataka",
        city="Shimoga",
        description="Quiet green landscape.",
        short_description="Peaceful town.",
        budget_min=8000,
        budget_max=20000,
        popularity_score=7.0,
    )
    db_session.add(d4)

    # 5. Strict Flight-Only / Luxury-Only destination
    d5 = Destination(
        name="Luxury Atoll",
        country="India",
        state="Lakshadweep",
        city="Agatti",
        description="Ultra luxury coral island villas.",
        short_description="Exclusive coral lagoon.",
        budget_min=80000,
        budget_max=160000,
        popularity_score=9.1,
    )
    db_session.add(d5)
    db_session.flush()
    db_session.add(DestinationTag(destination_id=d5.id, tag_type="place", tag_value="Islands"))
    db_session.add(DestinationTag(destination_id=d5.id, tag_type="experience", tag_value="Relaxation"))
    db_session.add(DestinationTravelStyle(destination_id=d5.id, travel_style="Luxury"))
    db_session.add(DestinationCompanion(destination_id=d5.id, companion_type="Couple"))
    db_session.add(DestinationTransport(destination_id=d5.id, transport_type="Flight"))
    db_session.add(DestinationPace(destination_id=d5.id, pace="Relaxed"))

    db_session.commit()
    return [d1, d2, d3, d4, d5]


# ==============================================================================
# TESTS
# ==============================================================================

def test_01_traveler_can_access_recommendations(client, sample_kb):
    """1. Authenticated traveler can access GET /api/recommendations (200 OK)."""
    token, _ = register_and_login(client, email="rec_traveler@example.com")
    headers = {"Authorization": f"Bearer {token}"}
    resp = client.get("/api/recommendations", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "recommendations" in data
    assert "total" in data
    assert "generated_at" in data


def test_02_unauthenticated_user_gets_401(client):
    """2. Unauthenticated user gets 401."""
    resp = client.get("/api/recommendations")
    assert resp.status_code == 401
    assert "detail" in resp.json()


def test_03_agent_cannot_access_recommendations(client):
    """3. Authenticated agent cannot access traveler recommendations (403 Forbidden)."""
    token, _ = register_and_login(client, email="agent_rec@example.com", role="agent")
    headers = {"Authorization": f"Bearer {token}"}
    resp = client.get("/api/recommendations", headers=headers)
    assert resp.status_code == 403


def test_04_traveler_with_preferences_gets_recommendations(client, sample_kb):
    """4. Traveler with saved preferences gets recommendations array."""
    token, _ = register_and_login(client, email="pref_user@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    # Save mountain/adventure preferences
    client.put("/api/users/me/preferences", headers=headers, json={
        "places": ["Mountains", "Nature"],
        "experiences": ["Adventure", "Photography"],
        "travel_style": "Balanced",
        "companions": "Friends",
        "transport": "Bus, Car",
        "itinerary_pace": "Balanced",
        "budget_range": "₹25,000 – ₹50,000",
        "onboarding_completed": True
    })

    resp = client.get("/api/recommendations", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] > 0
    assert len(data["recommendations"]) > 0


def test_05_recommendations_sorted_by_score_descending(client, sample_kb):
    """5. Recommendations are sorted by score descending."""
    token, _ = register_and_login(client, email="sorted_user@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    client.put("/api/users/me/preferences", headers=headers, json={
        "places": ["Mountains"],
        "experiences": ["Adventure"],
        "travel_style": "Balanced",
        "companions": "Friends",
        "transport": "Car",
        "itinerary_pace": "Balanced",
        "budget_range": "₹25,000 – ₹50,000",
        "onboarding_completed": True
    })

    resp = client.get("/api/recommendations", headers=headers)
    assert resp.status_code == 200
    items = resp.json()["recommendations"]
    scores = [item["score"] for item in items]
    assert scores == sorted(scores, reverse=True)


def test_06_score_and_match_percentage_valid_range(client, sample_kb):
    """6 & 7. Score is between 0.0 and 1.0, and match_percentage is between 0 and 100."""
    token, _ = register_and_login(client, email="range_user@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.get("/api/recommendations", headers=headers)
    assert resp.status_code == 200
    for item in resp.json()["recommendations"]:
        assert 0.0 <= item["score"] <= 1.0
        assert 0 <= item["match_percentage"] <= 100
        assert round(item["score"] * 100) == item["match_percentage"] or abs(item["score"] * 100 - item["match_percentage"]) <= 1


def test_08_explanation_contains_only_actual_matched_preferences(client, sample_kb):
    """8. Explanation contains only actual matched preferences and never hallucinates."""
    token, _ = register_and_login(client, email="expl_user@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    client.put("/api/users/me/preferences", headers=headers, json={
        "places": ["Mountains"],
        "experiences": ["Adventure"],
        "travel_style": "Budget",
        "companions": "Friends",
        "transport": "Bus",
        "itinerary_pace": "Balanced",
        "budget_range": "₹10,000 – ₹25,000",
        "onboarding_completed": True
    })

    resp = client.get("/api/recommendations", headers=headers)
    assert resp.status_code == 200
    items = resp.json()["recommendations"]

    top_item = items[0]
    explanation = top_item["explanation"]
    assert "Beaches" not in explanation  # User did not select Beaches
    assert "Nightlife" not in explanation  # User did not select Nightlife


def test_09_changing_preferences_changes_ranking(client, sample_kb):
    """9. Changing preferences changes recommendation ranking appropriately."""
    token, _ = register_and_login(client, email="dynamic_user@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    # Case A: Mountain lover
    client.put("/api/users/me/preferences", headers=headers, json={
        "places": ["Mountains"],
        "experiences": ["Adventure"],
        "travel_style": "Balanced",
        "companions": "Friends",
        "transport": "Bus, Car",
        "itinerary_pace": "Balanced",
        "budget_range": "₹25,000 – ₹50,000",
        "onboarding_completed": True
    })
    resp1 = client.get("/api/recommendations", headers=headers)
    top_mountain = resp1.json()["recommendations"][0]["name"]
    assert top_mountain == "Manali"

    # Case B: Beach lover
    client.put("/api/users/me/preferences", headers=headers, json={
        "places": ["Beaches"],
        "experiences": ["Nightlife", "Food"],
        "travel_style": "Luxury",
        "companions": "Couple",
        "transport": "Flight",
        "itinerary_pace": "Relaxed",
        "budget_range": "₹50,000 – ₹1,00,000",
        "onboarding_completed": True
    })
    resp2 = client.get("/api/recommendations", headers=headers)
    top_beach = resp2.json()["recommendations"][0]["name"]
    assert top_beach == "Goa"


def test_10_no_cross_user_data_leakage(client, sample_kb):
    """10. No cross-user data leakage (User A cannot receive User B's preferences)."""
    token_a, _ = register_and_login(client, email="user_a@example.com")
    token_b, _ = register_and_login(client, email="user_b@example.com")

    # User A prefers Mountains
    client.put("/api/users/me/preferences", headers={"Authorization": f"Bearer {token_a}"}, json={
        "places": ["Mountains"],
        "experiences": ["Adventure"],
        "travel_style": "Budget",
        "companions": "Friends",
        "transport": "Car",
        "itinerary_pace": "Balanced",
        "budget_range": "₹10,000 – ₹25,000",
        "onboarding_completed": True
    })

    # User B prefers Beaches
    client.put("/api/users/me/preferences", headers={"Authorization": f"Bearer {token_b}"}, json={
        "places": ["Beaches"],
        "experiences": ["Nightlife"],
        "travel_style": "Balanced",
        "companions": "Friends",
        "transport": "Flight",
        "itinerary_pace": "Relaxed",
        "budget_range": "₹25,000 – ₹50,000",
        "onboarding_completed": True
    })

    resp_a = client.get("/api/recommendations", headers={"Authorization": f"Bearer {token_a}"})
    resp_b = client.get("/api/recommendations", headers={"Authorization": f"Bearer {token_b}"})

    assert resp_a.json()["recommendations"][0]["name"] == "Manali"
    assert resp_b.json()["recommendations"][0]["name"] == "Goa"


def test_11_limit_parameter_works(client, sample_kb):
    """11. Limit query parameter restricts number of returned items."""
    token, _ = register_and_login(client, email="limit_user@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.get("/api/recommendations?limit=2", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["recommendations"]) == 2
    assert data["total"] == 2


def test_12_missing_optional_metadata_does_not_crash(client, sample_kb):
    """12. Missing optional metadata does not crash recommendation generation."""
    token, _ = register_and_login(client, email="neutral_user@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.get("/api/recommendations", headers=headers)
    assert resp.status_code == 200
    names = [r["name"] for r in resp.json()["recommendations"]]
    assert "Minimal Haven" in names  # Minimal destination scored neutrally and returned safely


def test_13_no_preference_profile_produces_correct_response(client, sample_kb):
    """13. Traveler without saved preferences receives clean recommendations."""
    token, _ = register_and_login(client, email="newbie_no_pref@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.get("/api/recommendations", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["recommendations"]) > 0
    # Explanation indicates curated recommendation
    for item in data["recommendations"]:
        assert len(item["explanation"]) > 0


def test_14_hard_compatibility_filtering(client, sample_kb):
    """14. Hard compatibility filtering correctly filters incompatible options."""
    token, _ = register_and_login(client, email="compat_user@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    # User requires Train only
    client.put("/api/users/me/preferences", headers=headers, json={
        "places": ["Nature"],
        "experiences": ["Wildlife"],
        "travel_style": "Balanced",
        "companions": "Family",
        "transport": "Train",
        "itinerary_pace": "Balanced",
        "budget_range": "₹25,000 – ₹50,000",
        "onboarding_completed": True
    })

    resp = client.get("/api/recommendations", headers=headers)
    assert resp.status_code == 200
    names = [r["name"] for r in resp.json()["recommendations"]]
    # Luxury Atoll requires Flight only, so it must be excluded by hard filter
    assert "Luxury Atoll" not in names
