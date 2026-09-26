import uuid
import pytest
from sqlalchemy import select, func
from app.models.destination import (
    Destination,
    DestinationTag,
    DestinationTravelStyle,
    DestinationCompanion,
    DestinationTransport,
    DestinationPace,
    DestinationBestMonth,
)


@pytest.fixture
def sample_destination(db_session):
    dest = Destination(
        name="Goa Beachside",
        country="India",
        state="Goa",
        city="Panaji",
        description="Famous coastal getaway with golden sand beaches and Portuguese architecture.",
        short_description="Sun-kissed beaches and Portuguese heritage.",
        latitude=15.2993,
        longitude=74.1240,
        budget_min=10000,
        budget_max=35000,
        popularity_score=9.5,
    )
    db_session.add(dest)
    db_session.flush()

    # Add tags
    db_session.add(DestinationTag(destination_id=dest.id, tag_type="place", tag_value="Beaches"))
    db_session.add(DestinationTag(destination_id=dest.id, tag_type="place", tag_value="Cultural"))
    db_session.add(DestinationTag(destination_id=dest.id, tag_type="experience", tag_value="Nightlife"))
    db_session.add(DestinationTag(destination_id=dest.id, tag_type="experience", tag_value="Food"))

    # Add styles
    db_session.add(DestinationTravelStyle(destination_id=dest.id, travel_style="Balanced"))
    db_session.add(DestinationTravelStyle(destination_id=dest.id, travel_style="Luxury"))

    # Add companions
    db_session.add(DestinationCompanion(destination_id=dest.id, companion_type="Friends"))
    db_session.add(DestinationCompanion(destination_id=dest.id, companion_type="Couple"))

    # Add transport
    db_session.add(DestinationTransport(destination_id=dest.id, transport_type="Flight"))
    db_session.add(DestinationTransport(destination_id=dest.id, transport_type="Train"))

    # Add pace
    db_session.add(DestinationPace(destination_id=dest.id, pace="Relaxed"))

    # Add best months
    db_session.add(DestinationBestMonth(destination_id=dest.id, month=11))
    db_session.add(DestinationBestMonth(destination_id=dest.id, month=12))
    db_session.add(DestinationBestMonth(destination_id=dest.id, month=1))

    db_session.commit()
    db_session.refresh(dest)
    return dest


def test_list_destinations_empty(client):
    response = client.get("/api/destinations")
    assert response.status_code == 200
    data = response.json()
    assert data["items"] == []
    assert data["total"] == 0
    assert data["page"] == 1
    assert data["pages"] == 0


def test_list_destinations_with_data(client, sample_destination):
    response = client.get("/api/destinations")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["pages"] == 1
    assert len(data["items"]) == 1

    item = data["items"][0]
    assert item["name"] == "Goa Beachside"
    assert item["state"] == "Goa"
    assert item["city"] == "Panaji"
    assert item["budget_min"] == 10000
    assert item["budget_max"] == 35000
    assert item["popularity_score"] == 9.5
    assert "Beaches" in item["places"]
    assert "Nightlife" in item["experiences"]
    assert "Balanced" in item["travel_styles"]
    assert "Friends" in item["companions"]
    assert "Flight" in item["transport_options"]
    assert "Relaxed" in item["paces"]
    assert 12 in item["best_months"]


def test_get_destination_detail(client, sample_destination):
    response = client.get(f"/api/destinations/{sample_destination.id}")
    assert response.status_code == 200
    data = response.json()

    assert data["id"] == str(sample_destination.id)
    assert data["name"] == "Goa Beachside"
    assert data["description"] == sample_destination.description
    assert data["short_description"] == sample_destination.short_description
    assert data["latitude"] == pytest.approx(15.2993)
    assert data["longitude"] == pytest.approx(74.1240)
    assert len(data["tags"]) == 4
    assert len(data["places"]) == 2
    assert len(data["experiences"]) == 2
    assert len(data["travel_styles"]) == 2
    assert len(data["companions"]) == 2
    assert len(data["transport_options"]) == 2
    assert len(data["paces"]) == 1
    assert len(data["best_months"]) == 3
    assert data["best_months"] == [1, 11, 12]


def test_get_destination_not_found(client):
    random_uuid = str(uuid.uuid4())
    response = client.get(f"/api/destinations/{random_uuid}")
    assert response.status_code == 404
    assert response.json()["detail"] == "Destination not found"


def test_get_destination_invalid_id(client):
    response = client.get("/api/destinations/not-a-uuid")
    assert response.status_code == 404
    assert response.json()["detail"] == "Destination not found"


def test_list_destinations_pagination(client, db_session):
    # Insert 5 destinations
    for i in range(5):
        dest = Destination(
            name=f"Destination {i}",
            country="India",
            state=f"State {i}",
            city=f"City {i}",
            description=f"Description for destination {i}",
            short_description=f"Short description {i}",
            popularity_score=float(i),
        )
        db_session.add(dest)
    db_session.commit()

    # Page 1 size 2
    res1 = client.get("/api/destinations?page=1&size=2")
    assert res1.status_code == 200
    data1 = res1.json()
    assert data1["total"] == 5
    assert data1["page"] == 1
    assert data1["size"] == 2
    assert data1["pages"] == 3
    assert len(data1["items"]) == 2

    # Page 2 size 2
    res2 = client.get("/api/destinations?page=2&size=2")
    assert res2.status_code == 200
    data2 = res2.json()
    assert len(data2["items"]) == 2
    assert data2["items"][0]["name"] != data1["items"][0]["name"]

    # Page 3 size 2
    res3 = client.get("/api/destinations?page=3&size=2")
    assert res3.status_code == 200
    data3 = res3.json()
    assert len(data3["items"]) == 1


def test_list_destinations_search(client, db_session):
    d1 = Destination(
        name="Manali Snow Heights",
        country="India",
        state="Himachal Pradesh",
        city="Manali",
        description="Alpine paradise with skiing and trekking.",
        short_description="Snow peaks and adventure.",
        popularity_score=9.0,
    )
    d2 = Destination(
        name="Alleppey Backwaters",
        country="India",
        state="Kerala",
        city="Alappuzha",
        description="Tranquil canals and serene houseboat cruises.",
        short_description="Houseboat waterways and coconut lagoons.",
        popularity_score=9.2,
    )
    db_session.add_all([d1, d2])
    db_session.commit()

    # Search for "skiing" in description
    res = client.get("/api/destinations?search=skiing")
    assert res.status_code == 200
    items = res.json()["items"]
    assert len(items) == 1
    assert items[0]["name"] == "Manali Snow Heights"

    # Search for "Alappuzha" in city
    res = client.get("/api/destinations?search=alappuzha")
    assert res.status_code == 200
    items = res.json()["items"]
    assert len(items) == 1
    assert items[0]["name"] == "Alleppey Backwaters"


def test_list_destinations_filter_state(client, db_session):
    d1 = Destination(
        name="Jaipur Forts",
        country="India",
        state="Rajasthan",
        city="Jaipur",
        description="Pink city royal palace.",
        short_description="Historic forts.",
    )
    d2 = Destination(
        name="Udaipur Lakes",
        country="India",
        state="Rajasthan",
        city="Udaipur",
        description="City of royal lakes.",
        short_description="Palaces and lakes.",
    )
    d3 = Destination(
        name="Ooty Gardens",
        country="India",
        state="Tamil Nadu",
        city="Ooty",
        description="Tea gardens and Nilgiri toy train.",
        short_description="Cool hill retreat.",
    )
    db_session.add_all([d1, d2, d3])
    db_session.commit()

    res = client.get("/api/destinations?state=Rajasthan")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] == 2
    assert all(i["state"] == "Rajasthan" for i in data["items"])


def test_cascade_delete(db_session, sample_destination):
    dest_id = sample_destination.id

    # Verify children exist
    tags = db_session.execute(select(DestinationTag).where(DestinationTag.destination_id == dest_id)).scalars().all()
    assert len(tags) > 0

    # Delete parent
    db_session.delete(sample_destination)
    db_session.commit()

    # Verify children are cascaded
    tags_after = db_session.execute(select(DestinationTag).where(DestinationTag.destination_id == dest_id)).scalars().all()
    assert len(tags_after) == 0

    styles = db_session.execute(select(DestinationTravelStyle).where(DestinationTravelStyle.destination_id == dest_id)).scalars().all()
    assert len(styles) == 0

    companions = db_session.execute(select(DestinationCompanion).where(DestinationCompanion.destination_id == dest_id)).scalars().all()
    assert len(companions) == 0

    months = db_session.execute(select(DestinationBestMonth).where(DestinationBestMonth.destination_id == dest_id)).scalars().all()
    assert len(months) == 0


from sqlalchemy.exc import IntegrityError
from scripts.seed_destinations import DESTINATIONS_DATA


def test_unique_constraint_name_state(db_session):
    d1 = Destination(name="Kullu", state="Himachal Pradesh", country="India", city="Kullu", description="Valley", short_description="Valley")
    d2 = Destination(name="Kullu", state="Himachal Pradesh", country="India", city="Kullu", description="Duplicate", short_description="Duplicate")
    db_session.add(d1)
    db_session.commit()

    db_session.add(d2)
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()


def test_unique_constraint_destination_tag(db_session, sample_destination):
    dup_tag = DestinationTag(
        destination_id=sample_destination.id,
        tag_type="place",
        tag_value="Beaches"  # Already present in sample_destination
    )
    db_session.add(dup_tag)
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()


def test_seed_execution_and_idempotency_in_db(db_session):
    # Test with subset of 5 destinations from DESTINATIONS_DATA
    subset = DESTINATIONS_DATA[:5]

    for item in subset:
        dest = Destination(
            name=item["name"],
            country=item["country"],
            state=item["state"],
            city=item["city"],
            description=item["description"],
            short_description=item["short_description"],
            popularity_score=item["popularity_score"],
        )
        db_session.add(dest)
        db_session.flush()

        for p in item.get("places", []):
            db_session.add(DestinationTag(destination_id=dest.id, tag_type="place", tag_value=p))
        for exp in item.get("experiences", []):
            db_session.add(DestinationTag(destination_id=dest.id, tag_type="experience", tag_value=exp))

    db_session.commit()

    count1 = db_session.scalar(select(func.count()).select_from(Destination))
    assert count1 == 5

    tags_count1 = db_session.scalar(select(func.count()).select_from(DestinationTag))
    assert tags_count1 > 10

    # Idempotent re-run simulation: updating same destinations
    for item in subset:
        stmt = select(Destination).where(Destination.name == item["name"], Destination.state == item["state"])
        dest = db_session.execute(stmt).scalar_one()
        dest.description = item["description"] + " updated"

    db_session.commit()

    count2 = db_session.scalar(select(func.count()).select_from(Destination))
    assert count2 == 5  # No duplicates
