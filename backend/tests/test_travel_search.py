from unittest.mock import AsyncMock, patch
import pytest
from app.services.travel_search_service import TravelSearchAPIError


def register_and_login_traveler(
    client,
    email="search_test_traveler@example.com",
    name="Search Traveler",
    password="Password123!",
):
    client.post(
        "/api/auth/register",
        json={"name": name, "email": email, "password": password, "role": "traveler"},
    )
    res = client.post(
        "/api/auth/login",
        json={"email": email, "password": password, "role": "traveler"},
    )
    return res.json()["access_token"]


@pytest.fixture
def auth_headers(client):
    token = register_and_login_traveler(client)
    return {"Authorization": f"Bearer {token}"}


SAMPLE_AIRPORT_RAW = {
    "status": True,
    "data": [
        {
            "skyId": "BOM",
            "entityId": "95673320",
            "presentation": {
                "title": "Mumbai",
                "suggestionTitle": "Chhatrapati Shivaji Maharaj International Airport",
                "subtitle": "India",
            },
        },
        {
            "skyId": "GOI",
            "entityId": "95673400",
            "presentation": {
                "title": "Goa",
                "suggestionTitle": "Dabolim Airport",
                "subtitle": "India",
            },
        },
    ],
}

SAMPLE_FLIGHTS_RAW = {
    "data": {
        "itineraries": [
            {
                "id": "flight-expensive",
                "price": {"raw": 6200.0, "formatted": "₹6,200"},
                "legs": [
                    {
                        "origin": {"name": "Mumbai", "displayCode": "BOM"},
                        "destination": {"name": "Goa", "displayCode": "GOI"},
                        "departure": "2026-10-15T08:00:00",
                        "arrival": "2026-10-15T09:15:00",
                        "durationInMinutes": 75,
                        "stopCount": 0,
                        "carriers": {"marketing": [{"name": "Air India"}]},
                    }
                ],
                "deeplink": "https://booking.example.com/flight-expensive",
            },
            {
                "id": "flight-cheap",
                "price": {"raw": 4100.0, "formatted": "₹4,100"},
                "legs": [
                    {
                        "origin": {"name": "Mumbai", "displayCode": "BOM"},
                        "destination": {"name": "Goa", "displayCode": "GOI"},
                        "departure": "2026-10-15T14:30:00",
                        "arrival": "2026-10-15T15:45:00",
                        "durationInMinutes": 75,
                        "stopCount": 0,
                        "carriers": {"marketing": [{"name": "IndiGo"}]},
                    }
                ],
                "deeplink": "https://booking.example.com/flight-cheap",
            },
        ]
    }
}

SAMPLE_HOTEL_DEST_RAW = {
    "data": [{"entityId": "goa-entity-88", "entityName": "Goa, India"}]
}

SAMPLE_HOTELS_RAW = {
    "data": {
        "hotels": [
            {
                "hotelId": "hotel-luxury",
                "name": "Taj Exotica Resort & Spa",
                "stars": 5.0,
                "price": {"raw": 18500.0},
                "heroImage": {"url": "https://images.unsplash.com/hotel-taj.jpg"},
                "location": "Benaulim, Goa",
                "rating": 4.8,
                "reviewCount": 1240,
            },
            {
                "hotelId": "hotel-mid",
                "name": "Goa Marriott Resort",
                "stars": 4.5,
                "price": {"raw": 11500.0},
                "heroImage": {"url": "https://images.unsplash.com/hotel-marriott.jpg"},
                "location": "Miramar, Panaji",
                "rating": 4.6,
                "reviewCount": 890,
            },
        ]
    }
}


def test_unauthenticated_requests_return_401(client):
    """Endpoints require valid traveler authentication."""
    r1 = client.get("/api/travel-search/airports?query=Mumbai")
    assert r1.status_code == 401

    r2 = client.post(
        "/api/travel-search/flights",
        json={"origin": "BOM", "destination": "GOI", "depart_date": "2026-10-15"},
    )
    assert r2.status_code == 401

    r3 = client.get("/api/travel-search/hotels/destinations?query=Goa")
    assert r3.status_code == 401

    r4 = client.post(
        "/api/travel-search/hotels",
        json={
            "destination": "Goa",
            "check_in": "2026-10-15",
            "check_out": "2026-10-19",
        },
    )
    assert r4.status_code == 401


@pytest.mark.asyncio
def test_search_airports_success(client, auth_headers):
    """Airport search returns mapped AirportSuggestion schemas."""
    with patch(
        "app.api.routes.travel_search.travel_search_client.search_airports",
        new=AsyncMock(return_value=SAMPLE_AIRPORT_RAW),
    ):
        res = client.get(
            "/api/travel-search/airports?query=Mumbai",
            headers=auth_headers,
        )
        assert res.status_code == 200
        data = res.json()
        assert len(data) == 2
        assert data[0]["skyId"] == "BOM"
        assert data[0]["entityId"] == "95673320"
        assert "Mumbai" in data[0]["city"]


@pytest.mark.asyncio
def test_search_flights_success_and_sorted_by_price(client, auth_headers):
    """Flight search resolves airports, queries flights, and returns results sorted by price ascending."""
    with patch(
        "app.api.routes.travel_search.travel_search_client.search_airports",
        new=AsyncMock(return_value=SAMPLE_AIRPORT_RAW),
    ), patch(
        "app.api.routes.travel_search.travel_search_client.search_flights",
        new=AsyncMock(return_value=SAMPLE_FLIGHTS_RAW),
    ):
        payload = {
            "origin": "Mumbai",
            "destination": "Goa",
            "depart_date": "2026-10-15",
            "return_date": "2026-10-19",
            "adults": 2,
            "cabin_class": "economy",
            "currency": "INR",
        }
        res = client.post(
            "/api/travel-search/flights",
            json=payload,
            headers=auth_headers,
        )
        assert res.status_code == 200
        data = res.json()
        assert data["count"] == 2
        assert len(data["results"]) == 2

        # Verify sorted ascending by price
        assert data["results"][0]["id"] == "flight-cheap"
        assert data["results"][0]["price"] == 4100.0
        assert data["results"][0]["airline"] == "IndiGo"
        assert data["results"][1]["id"] == "flight-expensive"
        assert data["results"][1]["price"] == 6200.0
        assert data["results"][1]["airline"] == "Air India"


@pytest.mark.asyncio
def test_search_flights_unresolvable_origin_returns_404(client, auth_headers):
    """When airport lookup yields no matches, returns 404."""
    with patch(
        "app.api.routes.travel_search.travel_search_client.search_airports",
        new=AsyncMock(return_value={"data": []}),
    ):
        payload = {
            "origin": "UnknownFantasyCity",
            "destination": "Goa",
            "depart_date": "2026-10-15",
        }
        res = client.post(
            "/api/travel-search/flights",
            json=payload,
            headers=auth_headers,
        )
        assert res.status_code == 404
        assert "Could not resolve airport for origin" in res.json()["detail"]


@pytest.mark.asyncio
def test_search_flights_upstream_timeout_returns_502(client, auth_headers):
    """Upstream timeout or TravelSearchAPIError returns clean 502 error."""
    with patch(
        "app.api.routes.travel_search.travel_search_client.search_airports",
        new=AsyncMock(return_value=SAMPLE_AIRPORT_RAW),
    ), patch(
        "app.api.routes.travel_search.travel_search_client.search_flights",
        new=AsyncMock(
            side_effect=TravelSearchAPIError("Upstream timeout", status_code=504)
        ),
    ):
        payload = {
            "origin": "Mumbai",
            "destination": "Goa",
            "depart_date": "2026-10-15",
        }
        res = client.post(
            "/api/travel-search/flights",
            json=payload,
            headers=auth_headers,
        )
        assert res.status_code == 502
        assert res.json()["detail"] == "Flight search is temporarily unavailable"


@pytest.mark.asyncio
def test_search_flights_zero_results_returns_200(client, auth_headers):
    """Zero flight results returns 200 with empty list."""
    with patch(
        "app.api.routes.travel_search.travel_search_client.search_airports",
        new=AsyncMock(return_value=SAMPLE_AIRPORT_RAW),
    ), patch(
        "app.api.routes.travel_search.travel_search_client.search_flights",
        new=AsyncMock(return_value={"data": {"itineraries": []}}),
    ):
        payload = {
            "origin": "Mumbai",
            "destination": "Goa",
            "depart_date": "2026-10-15",
        }
        res = client.post(
            "/api/travel-search/flights",
            json=payload,
            headers=auth_headers,
        )
        assert res.status_code == 200
        data = res.json()
        assert data["count"] == 0
        assert data["results"] == []


@pytest.mark.asyncio
def test_search_hotel_destinations_success(client, auth_headers):
    """Hotel destination autosuggest returns entities."""
    with patch(
        "app.api.routes.travel_search.travel_search_client.search_hotel_destination",
        new=AsyncMock(return_value=SAMPLE_HOTEL_DEST_RAW),
    ):
        res = client.get(
            "/api/travel-search/hotels/destinations?query=Goa",
            headers=auth_headers,
        )
        assert res.status_code == 200
        data = res.json()
        assert len(data) == 1
        assert data[0]["entityId"] == "goa-entity-88"
        assert data[0]["name"] == "Goa, India"


@pytest.mark.asyncio
def test_search_hotels_success_and_sorted_by_price(client, auth_headers):
    """Hotel search resolves destination, queries hotels, and returns results sorted by price ascending."""
    with patch(
        "app.api.routes.travel_search.travel_search_client.search_hotel_destination",
        new=AsyncMock(return_value=SAMPLE_HOTEL_DEST_RAW),
    ), patch(
        "app.api.routes.travel_search.travel_search_client.search_hotels",
        new=AsyncMock(return_value=SAMPLE_HOTELS_RAW),
    ):
        payload = {
            "destination": "Goa",
            "check_in": "2026-10-15",
            "check_out": "2026-10-19",
            "adults": 2,
            "rooms": 1,
            "currency": "INR",
        }
        res = client.post(
            "/api/travel-search/hotels",
            json=payload,
            headers=auth_headers,
        )
        assert res.status_code == 200
        data = res.json()
        assert data["count"] == 2
        assert len(data["results"]) == 2

        # Verify sorted ascending by price_per_night
        assert data["results"][0]["id"] == "hotel-mid"
        assert data["results"][0]["price_per_night"] == 11500.0
        assert data["results"][0]["name"] == "Goa Marriott Resort"
        assert data["results"][1]["id"] == "hotel-luxury"
        assert data["results"][1]["price_per_night"] == 18500.0
        assert data["results"][1]["name"] == "Taj Exotica Resort & Spa"


@pytest.mark.asyncio
def test_search_hotels_unresolvable_destination_returns_404(client, auth_headers):
    """When hotel destination lookup returns empty, returns 404."""
    with patch(
        "app.api.routes.travel_search.travel_search_client.search_hotel_destination",
        new=AsyncMock(return_value={"data": []}),
    ):
        payload = {
            "destination": "NowhereLand",
            "check_in": "2026-10-15",
            "check_out": "2026-10-19",
        }
        res = client.post(
            "/api/travel-search/hotels",
            json=payload,
            headers=auth_headers,
        )
        assert res.status_code == 404
        assert "Could not resolve hotel destination" in res.json()["detail"]


@pytest.mark.asyncio
def test_search_hotels_upstream_error_returns_502(client, auth_headers):
    """Upstream error on hotel search returns clean 502 error."""
    with patch(
        "app.api.routes.travel_search.travel_search_client.search_hotel_destination",
        new=AsyncMock(return_value=SAMPLE_HOTEL_DEST_RAW),
    ), patch(
        "app.api.routes.travel_search.travel_search_client.search_hotels",
        new=AsyncMock(
            side_effect=TravelSearchAPIError("RapidAPI 500 error", status_code=502)
        ),
    ):
        payload = {
            "destination": "Goa",
            "check_in": "2026-10-15",
            "check_out": "2026-10-19",
        }
        res = client.post(
            "/api/travel-search/hotels",
            json=payload,
            headers=auth_headers,
        )
        assert res.status_code == 502
        assert res.json()["detail"] == "Hotel search is temporarily unavailable"


def test_sanitize_hotel_prices_zero_values_fixed():
    """Verify that zero-priced hotels get average of non-zero prices +/- random delta between 0 and 200."""
    from app.api.routes.travel_search import _sanitize_hotel_prices
    from app.schemas.travel_search import HotelOption

    hotels = [
        HotelOption(id="h1", name="Resort Alpha", price_per_night=4000.0),
        HotelOption(id="h2", name="Resort Beta", price_per_night=6000.0),
        HotelOption(id="h3", name="Resort Gamma", price_per_night=0.0),
        HotelOption(id="h4", name="Resort Delta", price_per_night=0.0),
    ]

    sanitized = _sanitize_hotel_prices(hotels)
    assert len(sanitized) == 4

    # Non-zero hotels stay the same
    assert sanitized[0].price_per_night == 4000.0
    assert sanitized[1].price_per_night == 6000.0

    # Zero hotels are replaced with average (5000.0) +/- 200 (between 4800 and 5200)
    for h in [sanitized[2], sanitized[3]]:
        assert h.price_per_night > 0
        assert 4800.0 <= h.price_per_night <= 5200.0


@pytest.mark.asyncio
def test_search_hotels_with_zero_price_fixed(client, auth_headers):
    """Zero-priced hotels in API response are replaced with average of nonzero hotels +/- 200."""
    raw_with_zero = {
        "properties": [
            {
                "property_token": "prop-1",
                "name": "Luxury Palm Resort",
                "rate_per_night": {"extracted_lowest": 8000.0},
            },
            {
                "property_token": "prop-2",
                "name": "Sunset Beach Resort",
                "rate_per_night": {"extracted_lowest": 12000.0},
            },
            {
                "property_token": "prop-zero",
                "name": "Zero Price Resort",
                "rate_per_night": {"extracted_lowest": 0.0},
            },
        ]
    }

    with patch(
        "app.api.routes.travel_search.travel_search_client.search_hotel_destination",
        new=AsyncMock(return_value=SAMPLE_HOTEL_DEST_RAW),
    ), patch(
        "app.api.routes.travel_search.travel_search_client.search_hotels",
        new=AsyncMock(return_value=raw_with_zero),
    ):
        res = client.post(
            "/api/travel-search/hotels",
            json={
                "destination": "Goa",
                "check_in": "2026-10-15",
                "check_out": "2026-10-19",
            },
            headers=auth_headers,
        )
        assert res.status_code == 200
        results = res.json()["results"]
        assert len(results) == 3

        # Every hotel has price > 0
        for h in results:
            assert h["price_per_night"] > 0

        # The previously zero-priced hotel should be around avg (10000.0) +/- 200
        zero_hotel = next(h for h in results if h["id"] == "prop-zero")
        assert 9800.0 <= zero_hotel["price_per_night"] <= 10200.0
