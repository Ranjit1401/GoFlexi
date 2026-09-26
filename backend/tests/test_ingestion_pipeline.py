"""
Phase 5B Real Destination Data Ingestion Pipeline Tests
Voyara / Traveller Project

Tests:
1. GeoNames client configuration check and error reporting
2. OpenTripMap client configuration check and error reporting
3. Candidate filtering rules (valid vs village/hamlet/out-of-bounds)
4. Normalization and deduplication logic
5. Destination metadata classification rules
6. DestinationValidator validation suite
7. Database DestinationSource model and relationship
8. API endpoints: /api/destinations, /api/destinations/{id}, /api/recommendations
"""

import uuid
import pytest
from app.models.destination import Destination, DestinationSource, DestinationTag
from scripts.ingest_geonames import GeoNamesClient
from scripts.ingest_opentripmap import OpenTripMapClient
from scripts.normalize_destinations import DestinationNormalizer
from scripts.validate_destinations import DestinationValidator


def register_and_login(client, email="ingest_test@example.com"):
    client.post("/api/auth/register", json={
        "name": "Ingestion Tester",
        "email": email,
        "password": "Password123!",
        "role": "traveler"
    })
    login_resp = client.post("/api/auth/login", json={
        "email": email,
        "password": "Password123!",
        "role": "traveler"
    })
    return login_resp.json()["access_token"]


def test_geonames_configuration_error_message():
    """Verify GeoNames reports clear error message when GEONAMES_USERNAME is unconfigured."""
    client = GeoNamesClient(username="")
    configured, msg = client.check_configuration()
    assert not configured
    assert "ERROR: GEONAMES_USERNAME is not configured" in msg
    assert "GEONAMES_USERNAME" in msg


def test_opentripmap_configuration_error_message():
    """Verify OpenTripMap reports clear error message when OPENTRIPMAP_API_KEY is unconfigured."""
    client = OpenTripMapClient(api_key="")
    configured, msg = client.check_configuration()
    assert not configured
    assert "ERROR: OPENTRIPMAP_API_KEY is not configured" in msg
    assert "OPENTRIPMAP_API_KEY" in msg


def test_geonames_candidate_filtering():
    """Verify deterministic candidate filtering discards invalid points, hamlets, and foreign coordinates."""
    client = GeoNamesClient()

    candidates = [
        # Valid candidate
        {
            "geoname_id": 1262453,
            "name": "Munnar",
            "country_code": "IN",
            "latitude": 10.0889,
            "longitude": 77.0595,
            "feature_class": "P",
            "feature_code": "PPL",
            "population": 32000,
        },
        # Outside India
        {
            "geoname_id": 999999,
            "name": "Paris",
            "country_code": "FR",
            "latitude": 48.8566,
            "longitude": 2.3522,
            "feature_class": "P",
            "feature_code": "PPLC",
            "population": 2161000,
        },
        # Rejected hamlet feature code
        {
            "geoname_id": 888888,
            "name": "Random Hamlet",
            "country_code": "IN",
            "latitude": 20.5,
            "longitude": 78.5,
            "feature_class": "P",
            "feature_code": "PPLX",
            "population": 50,
        },
        # Tiny village without tourism/historical significance
        {
            "geoname_id": 777777,
            "name": "Small Agricultural Village",
            "country_code": "IN",
            "latitude": 21.0,
            "longitude": 79.0,
            "feature_class": "P",
            "feature_code": "PPL",
            "population": 300,
        }
    ]

    accepted, rejected = client.filter_candidates(candidates)
    assert len(accepted) == 1
    assert accepted[0]["name"] == "Munnar"
    assert len(rejected) == 3


def test_normalization_and_deduplication():
    """Verify normalizer cleans names and deduplicates nearby identical places."""
    normalizer = DestinationNormalizer()

    raw_candidates = [
        {
            "geoname_id": 1001,
            "name": "Munnar Town",
            "admin1": "State of Kerala",
            "latitude": 10.0889,
            "longitude": 77.0595,
            "feature_class": "P",
            "feature_code": "PPL",
            "population": 32000,
            "elevation": 1532,
        },
        {
            "geoname_id": 1002,
            "name": "Munnar",
            "admin1": "Kerala",
            "latitude": 10.0895,
            "longitude": 77.0600,
            "feature_class": "P",
            "feature_code": "PPL",
            "population": 32000,
            "elevation": 1532,
        }
    ]

    pois = {
        "1001": [
            {"xid": "X1", "name": "Eravikulam National Park", "kinds": "natural,national_parks"},
            {"xid": "X2", "name": "Anamudi Peak", "kinds": "natural,mountains,peaks"},
        ]
    }

    destinations, dup_count = normalizer.process(raw_candidates, pois)
    assert len(destinations) == 1
    assert dup_count == 1
    dest = destinations[0]
    assert dest["name"] == "Munnar"
    assert dest["state"] == "Kerala"
    assert "Mountains" in dest["places"]
    assert "Nature" in dest["places"]
    assert "Adventure" in dest["experiences"]
    # Check source tracking contains both external IDs
    ext_ids = {s["external_id"] for s in dest["sources"]}
    assert "1001" in ext_ids
    assert "1002" in ext_ids


def test_destination_validator():
    """Verify DestinationValidator accepts valid records and catches vocabulary/coordinate errors."""
    validator = DestinationValidator()

    valid_record = {
        "name": "Valid Destination",
        "state": "Kerala",
        "country": "India",
        "city": "Kochi",
        "latitude": 9.9312,
        "longitude": 76.2673,
        "places": ["Beaches", "Cultural"],
        "experiences": ["Relaxation", "Food"],
        "travel_styles": ["Balanced"],
        "companions": ["Couple", "Friends"],
        "transport_options": ["Flight", "Train", "Flexible"],
        "paces": ["Relaxed"],
        "best_months": [11, 12, 1],
        "sources": [
            {"source_name": "GeoNames", "source_type": "geographic_database", "external_id": "12345"}
        ],
    }

    is_valid, errors, _ = validator.validate_destination_records([valid_record])
    assert is_valid
    assert len(errors) == 0

    # Invalid record with bad vocabulary and bad coordinates
    invalid_record = dict(valid_record)
    invalid_record["latitude"] = 55.0  # Outside India
    invalid_record["places"] = ["Galaxies", "Beaches"]  # Fake place vocabulary
    invalid_record["sources"] = []  # Missing source tracking

    is_valid_bad, errors_bad, _ = validator.validate_destination_records([invalid_record])
    assert not is_valid_bad
    assert any("Latitude" in e for e in errors_bad)
    assert any("places vocabulary" in e for e in errors_bad)
    assert any("source tracking" in e for e in errors_bad)


def test_destination_source_db_model(db_session):
    """Verify DestinationSource can be persisted and cascaded on delete."""
    dest = Destination(
        id=uuid.uuid4(),
        name="Test Ingest Spot",
        state="Goa",
        city="Panaji",
        country="India",
        description="A verified real destination test.",
        short_description="Test spot.",
        latitude=15.4909,
        longitude=73.8278,
        budget_min=10000,
        budget_max=30000,
        popularity_score=8.5,
    )
    db_session.add(dest)
    db_session.flush()

    src1 = DestinationSource(
        id=uuid.uuid4(),
        destination_id=dest.id,
        source_name="GeoNames",
        source_type="geographic_database",
        external_id="1260206",
        source_url="https://www.geonames.org/1260206",
    )
    src2 = DestinationSource(
        id=uuid.uuid4(),
        destination_id=dest.id,
        source_name="OpenTripMap",
        source_type="tourism_poi",
        external_id="W39102870",
        source_url="https://opentripmap.com/en/card/W39102870",
    )
    db_session.add_all([src1, src2])
    db_session.commit()

    # Query destination and verify sources relationship
    loaded = db_session.query(Destination).filter(Destination.id == dest.id).first()
    assert len(loaded.sources) == 2
    source_names = {s.source_name for s in loaded.sources}
    assert source_names == {"GeoNames", "OpenTripMap"}

    # Test Cascade Delete
    db_session.delete(loaded)
    db_session.commit()
    remaining_sources = db_session.query(DestinationSource).filter(DestinationSource.destination_id == dest.id).all()
    assert len(remaining_sources) == 0


def test_api_destination_detail_returns_sources(client, db_session):
    """Verify GET /api/destinations/{id} returns serialized source metadata."""
    dest = Destination(
        id=uuid.uuid4(),
        name="Source Verification City",
        state="Rajasthan",
        city="Jaipur",
        country="India",
        description="Test description.",
        short_description="Short test.",
        latitude=26.9196,
        longitude=75.7878,
    )
    db_session.add(dest)
    db_session.flush()

    src = DestinationSource(
        id=uuid.uuid4(),
        destination_id=dest.id,
        source_name="GeoNames",
        source_type="geographic_database",
        external_id="1269515",
        source_url="https://www.geonames.org/1269515",
    )
    db_session.add(src)
    db_session.commit()

    resp = client.get(f"/api/destinations/{dest.id}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["name"] == "Source Verification City"
    assert "sources" in data
    assert len(data["sources"]) == 1
    assert data["sources"][0]["source_name"] == "GeoNames"
    assert data["sources"][0]["external_id"] == "1269515"


def test_api_recommendations_with_sources(client, db_session):
    """Verify recommendation endpoint operates seamlessly when destinations have source links."""
    token = register_and_login(client, email="rec_source_test@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.get("/api/recommendations?limit=5", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "recommendations" in data
    assert "total" in data
