import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.db.database import get_db
from app.models.user import User
from app.models.trip import Trip
from app.schemas.trip import TripCreate, TripUpdate, TripResponse
from app.api.deps import get_current_traveler

router = APIRouter(prefix="/trips", tags=["Trips"])

STARTER_TRIPS = [
    {
        "title": "Goa Escape",
        "destination": "Goa",
        "start_date": "12 Oct 2026",
        "end_date": "16 Oct 2026",
        "days": 4,
        "travelers_count": 2,
        "budget": "₹32,500",
        "status": "Upcoming",
        "image_url": "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1000&q=80",
        "itinerary_summary": "Candolim boutique villa stay, Latin Quarter culture walk, sunset sailing at Morjim, and seaside dining.",
        "tags": ["Beaches", "Relaxation", "Food"],
        "stops": ["Candolim Beach", "Fontainhas", "Morjim Sunset Shack", "Grand Island Boat Tour"]
    },
    {
        "title": "Himalayan Ridge Expedition",
        "destination": "Manali & Solang",
        "start_date": "14 Nov 2026",
        "end_date": "19 Nov 2026",
        "days": 5,
        "travelers_count": 4,
        "budget": "₹46,000",
        "status": "Upcoming",
        "image_url": "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=1000&q=80",
        "itinerary_summary": "Snow adventures at Atal Tunnel, riverside wooden chalet retreat in Old Manali, and paragliding thrills.",
        "tags": ["Mountains", "Adventure", "Nature"],
        "stops": ["Solang Valley", "Atal Tunnel", "Jogini Falls", "Old Manali"]
    },
    {
        "title": "Kerala Spice & Waterways",
        "destination": "Kerala",
        "start_date": "04 Aug 2026",
        "end_date": "10 Aug 2026",
        "days": 6,
        "travelers_count": 2,
        "budget": "₹54,000",
        "status": "Past",
        "image_url": "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1000&q=80",
        "itinerary_summary": "Private Kettuvallam houseboat along Punnamada Lake, organic spice trail in Thekkady, and colonial Fort Kochi.",
        "tags": ["Relaxation", "Culture", "Food"],
        "stops": ["Fort Kochi", "Munnar Tea Hills", "Thekkady Reserve", "Alleppey Backwaters"]
    },
    {
        "title": "Royal Havelis of Jaisalmer",
        "destination": "Rajasthan",
        "start_date": "18 Jan 2026",
        "end_date": "24 Jan 2026",
        "days": 6,
        "travelers_count": 3,
        "budget": "₹62,000",
        "status": "Past",
        "image_url": "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1000&q=80",
        "itinerary_summary": "Luxury desert glamping, folklore performances around bonfire, and golden sandstone architecture exploration.",
        "tags": ["Culture", "Historical", "Adventure"],
        "stops": ["Jaisalmer Fort", "Sam Sand Dunes", "Patwon Ki Haveli", "Gadisar Lake"]
    }
]


def seed_starter_trips_if_empty(db: Session, user: User) -> List[Trip]:
    stmt = select(Trip).where(Trip.user_id == user.id)
    existing = db.execute(stmt).scalars().all()
    if existing:
        return list(existing)

    created_trips = []
    for item in STARTER_TRIPS:
        trip = Trip(
            user_id=user.id,
            title=item["title"],
            destination=item["destination"],
            start_date=item["start_date"],
            end_date=item["end_date"],
            days=item["days"],
            travelers_count=item["travelers_count"],
            budget=item["budget"],
            status=item["status"],
            image_url=item["image_url"],
            itinerary_summary=item["itinerary_summary"],
            tags=item["tags"],
            stops=item["stops"]
        )
        db.add(trip)
        created_trips.append(trip)
    db.commit()
    for t in created_trips:
        db.refresh(t)
    return created_trips


@router.get("", response_model=List[TripResponse], summary="List trips for current traveler")
def get_traveler_trips(
    status: Optional[str] = Query(None, description="Filter by status: Upcoming | Past | Draft"),
    current_user: User = Depends(get_current_traveler),
    db: Session = Depends(get_db)
):
    # Ensure starter trips exist if user has none
    seed_starter_trips_if_empty(db, current_user)

    stmt = select(Trip).where(Trip.user_id == current_user.id)
    if status and status.strip():
        stmt = stmt.where(Trip.status.ilike(status.strip()))

    stmt = stmt.order_by(Trip.created_at.desc())
    trips = db.execute(stmt).scalars().all()
    return trips


@router.get("/{trip_id}", response_model=TripResponse, summary="Get single trip details")
def get_trip(
    trip_id: str,
    current_user: User = Depends(get_current_traveler),
    db: Session = Depends(get_db)
):
    try:
        t_uuid = uuid.UUID(trip_id)
    except (ValueError, TypeError):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")

    stmt = select(Trip).where(Trip.id == t_uuid, Trip.user_id == current_user.id)
    trip = db.execute(stmt).scalar_one_or_none()
    if not trip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")
    return trip


@router.post("", response_model=TripResponse, status_code=status.HTTP_201_CREATED, summary="Create a new trip")
def create_trip(
    payload: TripCreate,
    current_user: User = Depends(get_current_traveler),
    db: Session = Depends(get_db)
):
    trip = Trip(
        user_id=current_user.id,
        title=payload.title,
        destination=payload.destination,
        start_date=payload.start_date,
        end_date=payload.end_date,
        days=payload.days,
        travelers_count=payload.travelers_count,
        budget=payload.budget,
        status=payload.status or "Upcoming",
        image_url=payload.image_url,
        itinerary_summary=payload.itinerary_summary,
        tags=payload.tags or [],
        stops=payload.stops or []
    )
    db.add(trip)
    db.commit()
    db.refresh(trip)
    return trip


@router.put("/{trip_id}", response_model=TripResponse, summary="Update an existing trip")
def update_trip(
    trip_id: str,
    payload: TripUpdate,
    current_user: User = Depends(get_current_traveler),
    db: Session = Depends(get_db)
):
    try:
        t_uuid = uuid.UUID(trip_id)
    except (ValueError, TypeError):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")

    stmt = select(Trip).where(Trip.id == t_uuid, Trip.user_id == current_user.id)
    trip = db.execute(stmt).scalar_one_or_none()
    if not trip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")

    data = payload.model_dump(exclude_unset=True)
    for field, val in data.items():
        setattr(trip, field, val)

    db.commit()
    db.refresh(trip)
    return trip


@router.delete("/{trip_id}", summary="Delete a trip")
def delete_trip(
    trip_id: str,
    current_user: User = Depends(get_current_traveler),
    db: Session = Depends(get_db)
):
    try:
        t_uuid = uuid.UUID(trip_id)
    except (ValueError, TypeError):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")

    stmt = select(Trip).where(Trip.id == t_uuid, Trip.user_id == current_user.id)
    trip = db.execute(stmt).scalar_one_or_none()
    if not trip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")

    db.delete(trip)
    db.commit()
    return {"status": "deleted", "id": str(t_uuid)}
