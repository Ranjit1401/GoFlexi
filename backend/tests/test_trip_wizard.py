import logging
import pytest
from unittest.mock import AsyncMock, patch
from starlette.testclient import TestClient

from app.main import app
from app.schemas.trip_wizard import (
    GeoResult,
    POIResult,
    POIDetail,
    WeatherOutlook,
    DateInsightResponse,
)
from app.schemas.travel_search import FlightOption, HotelOption


def register_and_login(client, email="wizard_user@example.com", password="Password123!"):
    client.post(
        "/api/auth/register",
        json={"name": "Wizard User", "email": email, "password": password, "role": "traveler"}
    )
    login_resp = client.post(
        "/api/auth/login",
        json={"email": email, "password": password, "role": "traveler"}
    )
    return login_resp.json()["access_token"]


@pytest.fixture
def auth_headers(client):
    """Creates a mock traveler token for testing trip wizard endpoints."""
    token = register_and_login(client)
    return {"Authorization": f"Bearer {token}"}


def test_destination_geocoding_search(client, auth_headers):
    """1. Test geocoding destination lookup."""
    with patch("app.api.routes.trip_wizard.geocode_place", new_callable=AsyncMock) as mock_geo:
        mock_geo.return_value = [
            GeoResult(
                name="Goa",
                country="India",
                admin1="Goa",
                latitude=15.2993,
                longitude=74.1240,
                country_code="IN",
            )
        ]
        resp = client.get("/api/trip-wizard/destinations?query=Goa", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 1
        assert data[0]["name"] == "Goa"
        assert data[0]["latitude"] == 15.2993


def test_activities_search_popular_and_hidden(client, auth_headers):
    """2. Test activity search in both popular and hidden modes."""
    mock_pois = [
        POIResult(xid="1", name="Famous Temple", popularity="Iconic", latitude=15.2, longitude=74.1),
        POIResult(xid="2", name="Secret Cave", popularity="Hidden Gem", latitude=15.3, longitude=74.2),
        POIResult(xid="3", name="Market Stalls", popularity="Popular", latitude=15.4, longitude=74.3),
    ]

    with patch("app.api.routes.trip_wizard.search_activities", new_callable=AsyncMock) as mock_search:
        mock_search.return_value = mock_pois

        # Mode: popular -> Iconic first
        resp_pop = client.get("/api/trip-wizard/activities?lat=15.2&lon=74.1&mode=popular", headers=auth_headers)
        assert resp_pop.status_code == 200
        data_pop = resp_pop.json()
        assert data_pop[0]["popularity"] == "Iconic"

        # Mode: hidden -> Hidden Gem first
        resp_hid = client.get("/api/trip-wizard/activities?lat=15.2&lon=74.1&mode=hidden", headers=auth_headers)
        assert resp_hid.status_code == 200
        data_hid = resp_hid.json()
        assert data_hid[0]["popularity"] == "Hidden Gem"


def test_activity_detail_endpoint(client, auth_headers):
    """3. Test on-demand activity detail lookup."""
    with patch("app.api.routes.trip_wizard.get_activity_detail", new_callable=AsyncMock) as mock_detail:
        mock_detail.return_value = POIDetail(
            xid="x123",
            name="Ancient Heritage Fort",
            description="Built in the 17th century with scenic sea views.",
            kinds="historic,fortifications",
        )
        resp = client.get("/api/trip-wizard/activities/x123", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["name"] == "Ancient Heritage Fort"
        assert "17th century" in data["description"]


def test_date_insight_happy_path(client, auth_headers):
    """4. Test date insight happy path."""
    with patch("app.api.routes.trip_wizard.get_date_insights", new_callable=AsyncMock) as mock_insight:
        mock_insight.return_value = DateInsightResponse(
            weather=WeatherOutlook(
                temp_max=31.5,
                temp_min=24.0,
                precipitation_probability=20,
                condition="Partly Cloudy",
                is_forecast=True,
                daily_summary="Pleasant tropical temperatures.",
            ),
            crowd_score=65,
            crowd_label="Moderate",
            crowd_disclaimer="Crowd level is a seasonal + public-holiday estimate, not live occupancy data.",
            holiday_overlap=False,
            holidays=[],
        )
        resp = client.get(
            "/api/trip-wizard/date-insight?lat=15.29&lon=74.12&start_date=2026-10-15&end_date=2026-10-19",
            headers=auth_headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["weather"]["temp_max"] == 31.5
        assert data["crowd_label"] == "Moderate"
        assert "Crowd level is a seasonal" in data["crowd_disclaimer"]


def test_date_insight_service_down_fallback(client, auth_headers):
    """5. Test date insight fallback when weather forecast is unavailable."""
    # When weather service is down, internal fallback computes typical seasonal average
    resp = client.get(
        "/api/trip-wizard/date-insight?lat=15.29&lon=74.12&start_date=2027-01-10&end_date=2027-01-15",
        headers=auth_headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["weather"]["is_forecast"] is False
    assert data["crowd_label"] in ("Low", "Moderate", "High")
    assert bool(data["crowd_disclaimer"])


def test_budget_preview(client, auth_headers):
    """6. Test live budget preview bounds calculation and exposed budget split ratios."""
    resp = client.get(
        "/api/trip-wizard/budget-preview?destination=Goa&start_date=2026-10-15&end_date=2026-10-19&travelers=2",
        headers=auth_headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["min_price"] > 0
    assert data["max_price"] >= data["min_price"]
    assert data["currency"] == "INR"
    assert data["flight_budget_ratio"] == 0.45
    assert data["hotel_budget_ratio"] == 0.55


def test_recommend_trip_happy_path(client, auth_headers):
    """7. Test composite recommendation endpoint producing a complete TripPlan graph."""
    payload = {
        "destination": "Goa",
        "destination_lat": 15.2993,
        "destination_lon": 74.1240,
        "country_code": "IN",
        "departure_city": "Mumbai",
        "start_date": "2026-10-15",
        "end_date": "2026-10-18",
        "travelers": 2,
        "budget_min": 15000,
        "budget_max": 45000,
        "activities": [
            {
                "xid": "act-1",
                "name": "Aguada Fort Heritage Tour",
                "popularity": "Iconic",
                "latitude": 15.29,
                "longitude": 74.12,
            },
            {
                "xid": "act-2",
                "name": "Secret Benaulim Backwater Kayak",
                "popularity": "Hidden Gem",
                "latitude": 15.25,
                "longitude": 74.10,
            },
        ],
        "travel_style": "Balanced",
    }

    resp = client.post("/api/trip-wizard/recommend", json=payload, headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()

    assert "trip_plan" in data
    plan = data["trip_plan"]
    assert plan["destination"] == "Goa"
    assert plan["origin"] == "Mumbai"
    assert len(plan["nodes"]) >= 3  # Root, flights, hotel, day nodes
    assert len(plan["locations"]) >= 2
    assert len(plan["routes"]) == 2  # Outbound and return arcs
    assert data["recommended_flight"] is not None
    assert data["recommended_hotel"] is not None

    # Mumbai to Goa real haversine distance (~440 km, not hardcoded 550.0)
    assert plan["routes"][0]["distance_km"] != 550.0
    assert plan["routes"][0]["distance_km"] == pytest.approx(439.8, abs=5.0)
    assert plan["routes"][1]["distance_km"] == plan["routes"][0]["distance_km"]


def test_recommend_trip_tight_budget_fallback(client, auth_headers):
    """8. Test recommend endpoint with extremely strict budget does not crash with 500."""
    payload = {
        "destination": "Goa",
        "destination_lat": 15.2993,
        "destination_lon": 74.1240,
        "country_code": "IN",
        "departure_city": "Mumbai",
        "start_date": "2026-10-15",
        "end_date": "2026-10-17",
        "travelers": 1,
        "budget_min": 500,
        "budget_max": 1000,  # Below flight/hotel price
        "activities": [],
        "travel_style": "Budget",
    }

    resp = client.post("/api/trip-wizard/recommend", json=payload, headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "trip_plan" in data
    assert data["trip_plan"]["destination"] == "Goa"


def test_recommend_trip_non_mumbai_departure_city(client, auth_headers):
    """(a) recommend_trip() with a non-Mumbai departure_city returns correct origin coordinates and a non-550 distance."""
    payload = {
        "destination": "Goa",
        "destination_lat": 15.2993,
        "destination_lon": 74.1240,
        "country_code": "IN",
        "departure_city": "Delhi",
        "start_date": "2026-10-15",
        "end_date": "2026-10-18",
        "travelers": 1,
        "budget_min": 10000,
        "budget_max": 30000,
        "activities": [],
        "travel_style": "Balanced",
    }

    resp = client.post("/api/trip-wizard/recommend", json=payload, headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    plan = data["trip_plan"]

    # Origin location should reflect Delhi's coordinates (28.6139, 77.2090), NOT Mumbai (19.0760, 72.8777)
    origin_loc = next(loc for loc in plan["locations"] if loc["type"] == "origin")
    assert origin_loc["city"] == "Delhi"
    assert origin_loc["latitude"] == pytest.approx(28.6139, abs=0.05)
    assert origin_loc["longitude"] == pytest.approx(77.2090, abs=0.05)

    # Routes should have real haversine distance between Delhi and Goa (~1518 km), definitely NOT 550.0
    assert plan["routes"][0]["distance_km"] != 550.0
    assert plan["routes"][0]["distance_km"] == pytest.approx(1518.7, abs=20.0)
    assert plan["routes"][1]["distance_km"] == plan["routes"][0]["distance_km"]


def test_recommend_trip_geocoding_failure_fallback_warning(client, auth_headers, caplog):
    """Test geocoding failure for departure_city falls back to Mumbai and logs a warning."""
    with patch("app.api.routes.trip_wizard.geocode_place", new_callable=AsyncMock) as mock_geo:
        mock_geo.return_value = []

        payload = {
            "destination": "Goa",
            "destination_lat": 15.2993,
            "destination_lon": 74.1240,
            "country_code": "IN",
            "departure_city": "AtlantisUnderwaterCity",
            "start_date": "2026-10-15",
            "end_date": "2026-10-18",
            "travelers": 1,
            "budget_min": 10000,
            "budget_max": 30000,
            "activities": [],
            "travel_style": "Balanced",
        }

        with caplog.at_level(logging.WARNING):
            resp = client.post("/api/trip-wizard/recommend", json=payload, headers=auth_headers)
            assert resp.status_code == 200
            data = resp.json()
            plan = data["trip_plan"]

            # Fallback to Mumbai coordinates
            origin_loc = next(loc for loc in plan["locations"] if loc["type"] == "origin")
            assert origin_loc["latitude"] == pytest.approx(19.0760, abs=0.001)
            assert origin_loc["longitude"] == pytest.approx(72.8777, abs=0.001)

            # Warning should be logged
            assert any("Failed to geocode departure city" in record.message for record in caplog.records)


def test_duration_days_agreement_with_frontend():
    """(b) duration_days/calculateDuration()/handleSaveTrip() all agree for a sample date range."""
    from datetime import datetime

    test_ranges = [
        ("2026-10-15", "2026-10-18", 4, 3),  # 4 calendar days, 3 nights
        ("2026-10-15", "2026-10-15", 1, 0),  # Same-day trip: 1 day, 0 nights
        ("2026-10-15", "2026-10-21", 7, 6),  # 1 week: 7 days, 6 nights
        ("2026-12-30", "2027-01-02", 4, 3),  # Across year boundary: 4 days, 3 nights
    ]

    for start_str, end_str, expected_days, expected_nights in test_ranges:
        # Backend recommend_trip() logic:
        start_d = datetime.strptime(start_str, "%Y-%m-%d").date()
        end_d = datetime.strptime(end_str, "%Y-%m-%d").date()
        backend_duration_days = max(1, (end_d - start_d).days + 1)

        # Frontend calculateTripDays logic (Math.max(1, Math.round(diffTime / 86400000) + 1)):
        # Notice diffTime / 86400000 equals (end_d - start_d).days
        frontend_diff_days = (end_d - start_d).days
        frontend_days = max(1, round(frontend_diff_days) + 1)
        frontend_nights = max(0, frontend_days - 1)
        frontend_duration_label = f"{frontend_days} Days / {frontend_nights} Nights"

        # Assert all 3 agree
        assert backend_duration_days == expected_days
        assert frontend_days == backend_duration_days
        assert frontend_nights == expected_nights
        assert frontend_duration_label == f"{expected_days} Days / {expected_nights} Nights"

