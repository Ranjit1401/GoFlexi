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
    # 2026-10-15 is Thursday
    res = await railway_client.search_trains_between_stations(
        origin_query="Mumbai",
        destination_query="Goa",
        depart_date=date(2026, 10, 15),
        travelers=2,
        only_running_today=False,
    )
    assert res.is_domestic_india is True
    assert res.count > 0
    assert res.day_name == "Thursday"
    assert res.total_trains_on_route > 0
    assert any("VANDE BHARAT" in t.train_name.upper() or "SHATABDI" in t.train_name.upper() for t in res.results)

    # Vande Bharat 22229 does not run on Thursdays
    vande = next((t for t in res.results if t.train_number == "22229"), None)
    assert vande is not None
    assert vande.runs_on_selected_day is False
    assert "Does Not Run on Thursday" in (vande.live_status_note or "")

    # Jan Shatabdi 12051 runs Daily -> runs on Thursday
    shatabdi = next((t for t in res.results if t.train_number == "12051"), None)
    assert shatabdi is not None
    assert shatabdi.runs_on_selected_day is True

    # Konkan Kanya 10111 is overnight (+1 Day offset)
    konkan = next((t for t in res.results if t.train_number == "10111"), None)
    assert konkan is not None
    assert konkan.days_offset == 1
    assert konkan.arrival_day == "Friday"
    assert konkan.arrival_date == "2026-10-16"


@pytest.mark.anyio
async def test_search_trains_only_running_today_filter():
    # Thursday: 22229 should be filtered out when only_running_today=True
    res_thu = await railway_client.search_trains_between_stations(
        origin_query="Mumbai",
        destination_query="Goa",
        depart_date=date(2026, 10, 15),
        travelers=1,
        only_running_today=True,
    )
    assert all(t.runs_on_selected_day is True for t in res_thu.results)
    assert not any(t.train_number == "22229" for t in res_thu.results)

    # Friday (2026-10-16): 22229 DOES run on Friday
    res_fri = await railway_client.search_trains_between_stations(
        origin_query="Mumbai",
        destination_query="Goa",
        depart_date=date(2026, 10, 16),
        travelers=1,
        only_running_today=True,
    )
    assert any(t.train_number == "22229" for t in res_fri.results)


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
