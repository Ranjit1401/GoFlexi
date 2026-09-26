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
from app.models.traveler_profile import TravelerProfile


def register_and_login(client, name="Explore Traveler", email="explore_traveler@example.com", password="Password123!", role="traveler", agency_name=None):
    payload = {
        "name": name,
        "email": email,
        "password": password,
        "role": role,
    }
    if role == "agent":
        payload["agency_name"] = agency_name or "Explore Agency"
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
    # 1. Manali (Himachal Pradesh, Mountains, Nature, Adventure, Photography, Balanced/Budget, Bus/Car/Flight, Balanced pace, May)
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

    # 2. Goa (Goa, Beaches, Nightlife, Food, Balanced/Luxury, Flight/Train, Relaxed pace, Dec)
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

    # 3. Ranthambore (Rajasthan, Nature, Wildlife, Photography, Balanced, Family/Friends, Train/Car, Balanced pace, Nov)
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

    # 4. Minimal Haven (no metadata tags)
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

    # 5. Luxury Atoll (Lakshadweep, Islands, Relaxation, Luxury, Couple, Flight-only, Relaxed pace)
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
# PART 30 TESTS (1 - 19 + Extras)
# ==============================================================================

def test_01_existing_recommendation_endpoint_still_works(client, sample_kb):
    """1. Existing recommendation endpoint still works without query parameters."""
    token, _ = register_and_login(client, email="p30_user1@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.get("/api/recommendations", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "recommendations" in data
    assert len(data["recommendations"]) > 0
    assert data["total"] > 0
    assert "score" in data["recommendations"][0]


def test_02_explore_search_filter_works(client, sample_kb):
    """2. Explore search filter works and prioritizes matched destination."""
    token, _ = register_and_login(client, email="p30_user2@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.get("/api/recommendations?search=Goa", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["recommendations"]) >= 1
    assert data["recommendations"][0]["name"] == "Goa"


def test_03_place_filter_works(client, sample_kb):
    """3. Place filter works (e.g. Beaches)."""
    token, _ = register_and_login(client, email="p30_user3@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.get("/api/recommendations?places=Beaches", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    names = [r["name"] for r in data["recommendations"]]
    assert "Goa" in names
    # Manali only has Mountains/Nature, so it should not match Beaches
    assert "Manali" not in names


def test_04_experience_filter_works(client, sample_kb):
    """4. Experience filter works (e.g. Wildlife)."""
    token, _ = register_and_login(client, email="p30_user4@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.get("/api/recommendations?experiences=Wildlife", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["recommendations"][0]["name"] == "Ranthambore"


def test_05_travel_style_filter_works(client, sample_kb):
    """5. Travel style filter works (e.g. Luxury)."""
    token, _ = register_and_login(client, email="p30_user5@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.get("/api/recommendations?travel_style=Luxury", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    top_names = [r["name"] for r in data["recommendations"][:2]]
    # Luxury Atoll or Goa support Luxury
    assert "Luxury Atoll" in top_names or "Goa" in top_names


def test_06_companion_filter_works(client, sample_kb):
    """6. Companion filter works (e.g. Family)."""
    token, _ = register_and_login(client, email="p30_user6@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.get("/api/recommendations?companions=Family", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    names = [r["name"] for r in data["recommendations"]]
    assert "Ranthambore" in names
    # Luxury Atoll only supports Couple
    assert "Luxury Atoll" not in names


def test_07_transport_filter_works(client, sample_kb):
    """7. Transport filter works (e.g. Train)."""
    token, _ = register_and_login(client, email="p30_user7@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.get("/api/recommendations?transport=Train", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    names = [r["name"] for r in data["recommendations"]]
    assert "Goa" in names or "Ranthambore" in names
    # Luxury Atoll only supports Flight
    assert "Luxury Atoll" not in names


def test_08_pace_filter_works(client, sample_kb):
    """8. Pace filter works (e.g. Relaxed)."""
    token, _ = register_and_login(client, email="p30_user8@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.get("/api/recommendations?pace=Relaxed", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    top_name = data["recommendations"][0]["name"]
    # Goa and Luxury Atoll have pace="Relaxed"
    assert top_name in ["Goa", "Luxury Atoll"]


def test_09_budget_filter_works(client, sample_kb):
    """9. Budget filter works (e.g. ₹1L+)."""
    token, _ = register_and_login(client, email="p30_user9@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.get("/api/recommendations?budget_range=₹1L+", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    # Luxury Atoll has budget 80000 - 160000 (Tier 5)
    assert data["recommendations"][0]["name"] == "Luxury Atoll"


def test_10_state_filter_works(client, sample_kb):
    """10. State filter works (e.g. Rajasthan)."""
    token, _ = register_and_login(client, email="p30_user10@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.get("/api/recommendations?state=Rajasthan", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    for item in data["recommendations"]:
        assert item["state"] == "Rajasthan"
    assert data["recommendations"][0]["name"] == "Ranthambore"


def test_11_multiple_filters_work_together(client, sample_kb):
    """11. Multiple filters work together (Beaches + Nightlife + Couple)."""
    token, _ = register_and_login(client, email="p30_user11@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.get("/api/recommendations?places=Beaches&experiences=Nightlife&companions=Couple", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["recommendations"]) >= 1
    assert data["recommendations"][0]["name"] == "Goa"


def test_12_search_and_filters_work_together(client, sample_kb):
    """12. Search + filters work together (search=Manali, places=Mountains)."""
    token, _ = register_and_login(client, email="p30_user12@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.get("/api/recommendations?search=Manali&places=Mountains", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["recommendations"]) == 1
    assert data["recommendations"][0]["name"] == "Manali"


def test_13_saved_preferences_influence_ranking(client, sample_kb):
    """13. Saved preferences influence ranking when explore filters are broad or absent."""
    token, _ = register_and_login(client, email="p30_user13@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    # Save mountain preference
    client.put("/api/users/me/preferences", headers=headers, json={
        "places": ["Mountains"],
        "experiences": ["Adventure"],
        "travel_style": "Budget",
        "companions": "Friends",
        "transport": "Bus",
        "itinerary_pace": "Balanced",
        "budget_range": "₹10k–₹25k",
        "onboarding_completed": True
    })

    resp = client.get("/api/recommendations", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["recommendations"][0]["name"] == "Manali"


def test_14_explore_filters_do_not_modify_saved_preferences(client, sample_kb, db_session):
    """14. Explore filters do not modify saved profile preferences in PostgreSQL."""
    token, user_data = register_and_login(client, email="p30_user14@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    # Save initial preferences: Mountains
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

    # Execute Explore request with completely different filters: Beaches, Luxury, Couple
    resp = client.get(
        "/api/recommendations?places=Beaches&travel_style=Luxury&companions=Couple",
        headers=headers
    )
    assert resp.status_code == 200

    # Verify saved preferences in DB are 100% UNCHANGED
    pref_resp = client.get("/api/users/me/preferences", headers=headers)
    assert pref_resp.status_code == 200
    saved = pref_resp.json()
    assert saved["travel_style"] == "Budget"
    assert saved["companions"] == "Friends"
    assert saved["places"] == ["Mountains"]


def test_15_limit_works(client, sample_kb):
    """15. limit parameter works with Explore query."""
    token, _ = register_and_login(client, email="p30_user15@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.get("/api/recommendations?limit=1", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["recommendations"]) == 1
    assert data["total"] == 1


def test_16_unauthorized_request_fails(client):
    """16. Unauthorized request to GET /api/recommendations fails with 401."""
    resp = client.get("/api/recommendations")
    assert resp.status_code == 401


def test_17_agent_cannot_access_traveler_recommendations(client):
    """17. Authenticated agent cannot access traveler recommendations (403 Forbidden)."""
    token, _ = register_and_login(client, email="agent_p30@example.com", role="agent")
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.get("/api/recommendations", headers=headers)
    assert resp.status_code == 403


def test_18_zero_result_case_works(client, sample_kb):
    """18. Zero-result case returns clean empty list instead of crashing or fabricating."""
    token, _ = register_and_login(client, email="p30_user18@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.get("/api/recommendations?search=NonExistentCityXYZ", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["recommendations"] == []
    assert data["total"] == 0


def test_19_missing_metadata_does_not_crash_scoring(client, sample_kb):
    """19. Missing metadata (e.g. Minimal Haven) does not crash scoring."""
    token, _ = register_and_login(client, email="p30_user19@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.get("/api/recommendations", headers=headers)
    assert resp.status_code == 200
    names = [r["name"] for r in resp.json()["recommendations"]]
    assert "Minimal Haven" in names


def test_20_sorting_options_work(client, sample_kb):
    """20. Sorting options (popularity, budget_asc, budget_desc, match_score)."""
    token, _ = register_and_login(client, email="p30_sort_user@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    # Sort by popularity
    resp_pop = client.get("/api/recommendations?sort_by=popularity", headers=headers)
    assert resp_pop.status_code == 200
    pop_scores = [r["popularity_score"] for r in resp_pop.json()["recommendations"]]
    assert pop_scores == sorted(pop_scores, reverse=True)

    # Sort by budget ascending
    resp_b_asc = client.get("/api/recommendations?sort_by=budget_asc", headers=headers)
    assert resp_b_asc.status_code == 200
    min_budgets = [r["budget_min"] for r in resp_b_asc.json()["recommendations"]]
    assert min_budgets == sorted(min_budgets)


def test_21_explore_public_endpoint_works(client, sample_kb):
    """21. Dedicated /api/explore/recommendations endpoint works without auth."""
    resp = client.get("/api/explore/recommendations?search=Goa")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["recommendations"]) >= 1
    assert data["recommendations"][0]["name"] == "Goa"


def test_22_destination_states_list_endpoint_works(client, sample_kb):
    """22. GET /api/destinations/states/list returns distinct states."""
    resp = client.get("/api/destinations/states/list")
    assert resp.status_code == 200
    states = resp.json()
    assert isinstance(states, list)
    assert "Goa" in states
    assert "Himachal Pradesh" in states
    assert "Rajasthan" in states
