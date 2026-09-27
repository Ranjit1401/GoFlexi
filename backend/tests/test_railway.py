import pytest
from datetime import date
from fastapi.testclient import TestClient
from app.main import app
from app.services.railway_service import (
    is_domestic_indian_location,
    resolve_station,
    railway_client,
)

client = TestClient(app)


def test_is_domestic_indian_location():
    # Indian destinations
    assert is_domestic_indian_location("Goa") is True
    assert is_domestic_indian_location("Mumbai, Maharashtra") is True
    assert is_domestic_indian_location("New Delhi") is True
    assert is_domestic_indian_location("Jaipur, Rajasthan") is True
    assert is_domestic_indian_location("Bengaluru, Karnataka") is True
    assert is_domestic_indian_location("Kochi, Kerala") is True
    assert is_domestic_indian_location("Varanasi, India") is True

    # International destinations outside India
    assert is_domestic_indian_location("Dubai, UAE") is False
    assert is_domestic_indian_location("Singapore") is False
    assert is_domestic_indian_location("London, UK") is False
    assert is_domestic_indian_location("Paris, France") is False
    assert is_domestic_indian_location("Bali, Indonesia") is False
    assert is_domestic_indian_location("Tokyo, Japan") is False


def test_resolve_station():
    code, name = resolve_station("Mumbai")
    assert code in ["CSMT", "BCT"]

    code, name = resolve_station("Goa")
    assert code in ["MAO", "KRMI", "THVM"]

    code, name = resolve_station("Delhi")
    assert code in ["NDLS", "DLI", "NZM"]

    # Direct uppercase code
    code, name = resolve_station("NDLS")
    assert code == "NDLS"


@pytest.mark.anyio
async def test_search_trains_domestic_india():
    res = await railway_client.search_trains_between_stations(
        origin_query="Mumbai",
        destination_query="Goa",
        depart_date=date(2026, 10, 15),
        travelers=2,
    )
    assert res.is_domestic_india is True
    assert res.count > 0
    assert any("VANDE BHARAT" in t.train_name.upper() or "SHATABDI" in t.train_name.upper() for t in res.results)


@pytest.mark.anyio
async def test_search_trains_international_blocked():
    res = await railway_client.search_trains_between_stations(
        origin_query="Mumbai",
        destination_query="Dubai",
        depart_date=date(2026, 10, 15),
        travelers=1,
    )
    assert res.is_domestic_india is False
    assert res.count == 0
    assert len(res.results) == 0


@pytest.mark.anyio
async def test_get_train_schedule():
    stops = await railway_client.get_train_schedule("22229")
    assert stops is not None
    assert len(stops) > 0
    assert stops[0].station_code == "CSMT"


def test_api_is_domestic_india_endpoint():
    res = client.get("/api/travel-search/is-domestic-india?destination=Goa&origin=Mumbai")
    assert res.status_code == 200
    data = res.json()
    assert data["is_domestic_india"] is True

    res_intl = client.get("/api/travel-search/is-domestic-india?destination=Dubai&origin=Mumbai")
    assert res_intl.status_code == 200
    data_intl = res_intl.json()
    assert data_intl["is_domestic_india"] is False
