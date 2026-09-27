import uuid
from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import select, or_, func

from app.db.database import get_db
from app.models.user import User
from app.models.agent import Agent
from app.models.booking import Booking
from app.models.schedule import Schedule
from app.models.vendor import Vendor
from app.models.tour import Tour
from app.models.notification import AgentNotification
from app.api.deps import get_current_agent
from app.schemas.agent_operations import (
    BookingCreate,
    BookingStatusUpdate,
    BookingResponse,
    ScheduleCreate,
    ScheduleUpdate,
    ScheduleResponse,
    VendorCreate,
    VendorUpdate,
    VendorResponse,
    TourCreate,
    TourUpdate,
    TourResponse,
    UpcomingTourSummaryResponse,
    NotificationCreate,
    NotificationResponse,
    AgentTravelerResponse,
    AgentStatsResponse,
)

router = APIRouter(prefix="/agent", tags=["Agent Operations"])


# ==========================================
# Starter Seed Helpers
# ==========================================
STARTER_BOOKINGS = [
    {
        "booking_code": "VY-8921",
        "traveler_name": "Rahul Sharma",
        "traveler_email": "rahul.sharma@example.com",
        "tour_name": "Goa Luxury Coastal & Heritage",
        "service": "Full Tour Package",
        "departure_date": "12 Jun 2026",
        "amount": "₹69,000",
        "status": "Confirmed"
    },
    {
        "booking_code": "VY-8922",
        "traveler_name": "Priya Mehta",
        "traveler_email": "priya.mehta@example.com",
        "tour_name": "Himalayan High Altitude Pass",
        "service": "Hotel + Sightseeing",
        "departure_date": "20 Jun 2026",
        "amount": "₹84,000",
        "status": "Pending"
    },
    {
        "booking_code": "VY-8923",
        "traveler_name": "Amit Shah",
        "traveler_email": "amit.shah@example.com",
        "tour_name": "Kerala Backwaters & Tea Estates",
        "service": "Full Tour Package",
        "departure_date": "25 Jun 2026",
        "amount": "₹97,800",
        "status": "Confirmed"
    },
    {
        "booking_code": "VY-8924",
        "traveler_name": "Sneha Kapoor",
        "traveler_email": "sneha.kapoor@example.com",
        "tour_name": "Meghalaya Cloud Forest Trek",
        "service": "Custom Excursion",
        "departure_date": "02 Jul 2026",
        "amount": "₹36,000",
        "status": "Confirmed"
    },
    {
        "booking_code": "VY-8925",
        "traveler_name": "Vikram Malhotra",
        "traveler_email": "vikram.m@example.com",
        "tour_name": "Golden Triangle & Desert Camps",
        "service": "Transport & Transfers",
        "departure_date": "10 Jul 2026",
        "amount": "₹22,500",
        "status": "Pending"
    },
    {
        "booking_code": "VY-8926",
        "traveler_name": "Ananya Sen",
        "traveler_email": "ananya.sen@example.com",
        "tour_name": "Kashmir Valley Spring Blossom",
        "service": "Full Tour Package",
        "departure_date": "15 Jul 2026",
        "amount": "₹1,12,000",
        "status": "Cancelled"
    }
]

STARTER_SCHEDULES = [
    {
        "time": "09:30 AM",
        "date": "Today",
        "item_type": "departure",
        "title": "Flight 6E-204 Arrival & Airport Pickup",
        "details": "Terminal 2, Dabolim. Chauffeur assigned: Suresh Kumar.",
        "traveler_or_group": "Rahul Sharma (2 Guests)",
        "location": "Goa Airport (GOI)",
        "status": "Scheduled"
    },
    {
        "time": "11:45 AM",
        "date": "Today",
        "item_type": "checkin",
        "title": "Boutique Heritage Villa Check-In",
        "details": "Oceanfront Suite with welcome drinks and briefing.",
        "traveler_or_group": "Rahul Sharma",
        "location": "Candolim, Goa",
        "status": "On Track"
    },
    {
        "time": "03:00 PM",
        "date": "Today",
        "item_type": "activity",
        "title": "Mandovi River Catamaran Sunset Cruise",
        "details": "Private 2-hour charter with refreshments.",
        "traveler_or_group": "Priya Mehta & Group",
        "location": "Panaji Jetty",
        "status": "Scheduled"
    },
    {
        "time": "10:00 AM",
        "date": "Tomorrow",
        "item_type": "activity",
        "title": "Organic Spice Plantation & Cooking Workshop",
        "details": "Guided tour through Sahakari spice farm with lunch.",
        "traveler_or_group": "Amit Shah Family",
        "location": "Ponda, Goa",
        "status": "Scheduled"
    },
    {
        "time": "02:30 PM",
        "date": "Tomorrow",
        "item_type": "transfer",
        "title": "Luxury Coach Transfer to Old Goa",
        "details": "Mercedes Sprinter 12-seater with English speaking guide.",
        "traveler_or_group": "Sneha Kapoor Trek Group",
        "location": "Old Goa Churches",
        "status": "Scheduled"
    }
]

STARTER_VENDORS = [
    {
        "name": "Grand Hyatt Resort & Spa",
        "category": "Hotels",
        "location": "Bambolim, Goa",
        "contact_person": "Pooja Hegde",
        "phone": "+91 98230 11445",
        "email": "pooja.hegde@hyatt-goa.com",
        "rating": 4.9,
        "status": "Verified Partner"
    },
    {
        "name": "Coastal Sands Coaches",
        "category": "Transport",
        "location": "Panaji, Goa",
        "contact_person": "Rajesh Naik",
        "phone": "+91 98221 44556",
        "email": "bookings@coastalsandscoaches.in",
        "rating": 4.7,
        "status": "Verified Partner"
    },
    {
        "name": "Ocean Blue Scuba & Cruises",
        "category": "Activities",
        "location": "Calangute, Goa",
        "contact_person": "Capt. Alok Verma",
        "phone": "+91 98110 99881",
        "email": "alok@oceanbluescuba.com",
        "rating": 4.8,
        "status": "Verified Partner"
    },
    {
        "name": "Spice Village Heritage Kitchen",
        "category": "Restaurants",
        "location": "Ponda, Goa",
        "contact_person": "Sunita Fernandes",
        "phone": "+91 98334 55667",
        "email": "sunita@spicevillagegoa.com",
        "rating": 4.6,
        "status": "Active"
    },
    {
        "name": "Taj Holiday Village",
        "category": "Hotels",
        "location": "Candolim, Goa",
        "contact_person": "Vikram Seth",
        "phone": "+91 98222 33441",
        "email": "vikram.seth@ihcltata.com",
        "rating": 4.9,
        "status": "Verified Partner"
    }
]

STARTER_TOURS = [
    {
        "name": "Goa Luxury Coastal & Heritage",
        "description": "Candolim boutique villa stay, Latin Quarter culture walk, sunset sailing at Morjim, and seaside dining.",
        "destination": "Goa",
        "duration": "5 Days / 4 Nights",
        "status": "Active",
        "max_participants": 16,
        "booked_slots": 12,
        "budget_per_person": 69000,
        "currency": "INR",
        "image_url": "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1000&q=80"
    },
    {
        "name": "Himalayan High Altitude Pass",
        "description": "Snow adventures at Atal Tunnel, riverside wooden chalet retreat in Old Manali, and paragliding thrills.",
        "destination": "Manali & Solang",
        "duration": "6 Days / 5 Nights",
        "status": "Upcoming",
        "max_participants": 14,
        "booked_slots": 9,
        "budget_per_person": 84000,
        "currency": "INR",
        "image_url": "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=1000&q=80"
    },
    {
        "name": "Kerala Backwaters & Tea Estates",
        "description": "Private Kettuvallam houseboat along Punnamada Lake, organic spice trail in Thekkady, and colonial Fort Kochi.",
        "destination": "Kerala",
        "duration": "7 Days / 6 Nights",
        "status": "Active",
        "max_participants": 12,
        "booked_slots": 10,
        "budget_per_person": 97800,
        "currency": "INR",
        "image_url": "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1000&q=80"
    },
    {
        "name": "Meghalaya Cloud Forest Trek",
        "description": "Living Root Bridges, crystal clear Umngot River boating at Dawki, and misty waterfalls of Cherrapunji.",
        "destination": "Meghalaya",
        "duration": "5 Days / 4 Nights",
        "status": "Upcoming",
        "max_participants": 10,
        "booked_slots": 6,
        "budget_per_person": 52000,
        "currency": "INR",
        "image_url": "https://images.unsplash.com/photo-1596401057633-54a8fe8ef647?auto=format&fit=crop&w=1000&q=80"
    },
    {
        "name": "Rajasthan Royal Forts & Havelis",
        "description": "Desert glamping under starlit Thar sands, Mehrangarh Fort exploration, and Udaipur lake palace dinner.",
        "destination": "Rajasthan",
        "duration": "7 Days / 6 Nights",
        "status": "Completed",
        "max_participants": 18,
        "booked_slots": 18,
        "budget_per_person": 78000,
        "currency": "INR",
        "image_url": "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1000&q=80"
    }
]

STARTER_NOTIFICATIONS = [
    {
        "title": "New booking confirmed",
        "message": "Rahul Sharma completed payment for Goa Luxury Coastal & Heritage (Ref #VY-8921).",
        "category": "New booking",
        "notification_type": "notification",
        "urgency": "info",
        "time_label": "10 mins ago"
    },
    {
        "title": "Flight schedule change notice",
        "message": "Flight 6E-204 for Candolim arrival delayed by 25 mins. Airport pickup driver updated.",
        "category": "Schedule update",
        "notification_type": "alert",
        "urgency": "high",
        "time_label": "45 mins ago"
    },
    {
        "title": "Traveler special request submitted",
        "message": "Priya Mehta requested dietary preference update (Gluten-Free) for Sunset Catamaran Cruise.",
        "category": "Traveler request",
        "notification_type": "notification",
        "urgency": "medium",
        "time_label": "2 hours ago"
    },
    {
        "title": "Pending vendor invoice approval",
        "message": "Coastal Sands Coaches submitted transport invoice #INV-4412 for ₹18,500.",
        "category": "Pending approval",
        "notification_type": "alert",
        "urgency": "medium",
        "time_label": "3 hours ago"
    },
    {
        "title": "Driver contact assigned",
        "message": "Suresh Kumar assigned to Dabolim airport pickup for group VY-8921.",
        "category": "Schedule update",
        "notification_type": "activity",
        "urgency": "info",
        "time_label": "4 hours ago"
    },
    {
        "title": "Custom itinerary generated",
        "message": "AI Copilot finalized 6-day Meghalaya trekking itinerary for review.",
        "category": "Traveler request",
        "notification_type": "activity",
        "urgency": "info",
        "time_label": "5 hours ago"
    }
]


def seed_agent_data_if_empty(db: Session, agent: Agent):
    # Bookings
    b_count = db.scalar(select(func.count()).select_from(Booking).where(Booking.agent_id == agent.id)) or 0
    if b_count == 0:
        for b in STARTER_BOOKINGS:
            db.add(Booking(agent_id=agent.id, **b))

    # Schedules
    s_count = db.scalar(select(func.count()).select_from(Schedule).where(Schedule.agent_id == agent.id)) or 0
    if s_count == 0:
        for s in STARTER_SCHEDULES:
            db.add(Schedule(agent_id=agent.id, **s))

    # Vendors
    v_count = db.scalar(select(func.count()).select_from(Vendor).where(Vendor.agent_id == agent.id)) or 0
    if v_count == 0:
        for v in STARTER_VENDORS:
            db.add(Vendor(agent_id=agent.id, **v))

    # Tours
    t_count = db.scalar(select(func.count()).select_from(Tour).where(Tour.agent_id == agent.id)) or 0
    if t_count == 0:
        for t in STARTER_TOURS:
            db.add(Tour(agent_id=agent.id, **t))

    # Notifications
    n_count = db.scalar(select(func.count()).select_from(AgentNotification).where(AgentNotification.agent_id == agent.id)) or 0
    if n_count == 0:
        for n in STARTER_NOTIFICATIONS:
            db.add(AgentNotification(agent_id=agent.id, **n))

    db.commit()


# ==========================================
# Domain 3: Bookings Routes
# ==========================================
@router.get("/bookings", response_model=List[BookingResponse], summary="List agent bookings")
def get_bookings(
    search: Optional[str] = Query(None, description="Search traveler, tour, or booking code"),
    status: Optional[str] = Query(None, description="Filter by status: Confirmed | Pending | Cancelled"),
    agent_tuple=Depends(get_current_agent),
    db: Session = Depends(get_db)
):
    agent: Agent = agent_tuple[1]
    seed_agent_data_if_empty(db, agent)

    stmt = select(Booking).where(Booking.agent_id == agent.id)
    if status and status.strip() and status.lower() != 'all':
        stmt = stmt.where(Booking.status.ilike(status.strip()))
    if search and search.strip():
        term = f"%{search.strip()}%"
        stmt = stmt.where(
            or_(
                Booking.traveler_name.ilike(term),
                Booking.tour_name.ilike(term),
                Booking.booking_code.ilike(term)
            )
        )
    stmt = stmt.order_by(Booking.created_at.desc())
    return db.execute(stmt).scalars().all()


@router.post("/bookings", response_model=BookingResponse, status_code=status.HTTP_201_CREATED, summary="Create a new booking")
def create_booking(
    payload: BookingCreate,
    agent_tuple=Depends(get_current_agent),
    db: Session = Depends(get_db)
):
    agent: Agent = agent_tuple[1]
    booking = Booking(
        agent_id=agent.id,
        booking_code=payload.booking_code,
        traveler_name=payload.traveler_name,
        traveler_email=payload.traveler_email,
        tour_name=payload.tour_name,
        service=payload.service,
        departure_date=payload.departure_date,
        amount=payload.amount,
        status=payload.status or "Confirmed"
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)
    return booking


@router.put("/bookings/{booking_id}/status", response_model=BookingResponse, summary="Update booking status")
def update_booking_status(
    booking_id: str,
    payload: BookingStatusUpdate,
    agent_tuple=Depends(get_current_agent),
    db: Session = Depends(get_db)
):
    agent: Agent = agent_tuple[1]
    try:
        b_uuid = uuid.UUID(booking_id)
    except (ValueError, TypeError):
        raise HTTPException(status_code=404, detail="Booking not found")

    stmt = select(Booking).where(Booking.id == b_uuid, Booking.agent_id == agent.id)
    booking = db.execute(stmt).scalar_one_or_none()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    booking.status = payload.status
    db.commit()
    db.refresh(booking)
    return booking


# ==========================================
# Domain 4: Schedules Routes
# ==========================================
@router.get("/schedules", response_model=List[ScheduleResponse], summary="List agent schedule events")
def get_schedules(
    item_type: Optional[str] = Query(None, description="departure | activity | transfer | checkin"),
    status: Optional[str] = Query(None, description="Scheduled | On Track | Delayed | Completed"),
    agent_tuple=Depends(get_current_agent),
    db: Session = Depends(get_db)
):
    agent: Agent = agent_tuple[1]
    seed_agent_data_if_empty(db, agent)

    stmt = select(Schedule).where(Schedule.agent_id == agent.id)
    if item_type and item_type.strip() and item_type.lower() != 'all':
        stmt = stmt.where(Schedule.item_type.ilike(item_type.strip()))
    if status and status.strip() and status.lower() != 'all':
        stmt = stmt.where(Schedule.status.ilike(status.strip()))
    stmt = stmt.order_by(Schedule.created_at.desc())
    return db.execute(stmt).scalars().all()


@router.post("/schedules", response_model=ScheduleResponse, status_code=status.HTTP_201_CREATED, summary="Create a schedule event")
def create_schedule(
    payload: ScheduleCreate,
    agent_tuple=Depends(get_current_agent),
    db: Session = Depends(get_db)
):
    agent: Agent = agent_tuple[1]
    schedule = Schedule(
        agent_id=agent.id,
        time=payload.time,
        date=payload.date,
        item_type=payload.item_type,
        title=payload.title,
        details=payload.details,
        traveler_or_group=payload.traveler_or_group,
        location=payload.location,
        status=payload.status or "Scheduled"
    )
    db.add(schedule)
    db.commit()
    db.refresh(schedule)
    return schedule


@router.put("/schedules/{schedule_id}", response_model=ScheduleResponse, summary="Update schedule event")
def update_schedule(
    schedule_id: str,
    payload: ScheduleUpdate,
    agent_tuple=Depends(get_current_agent),
    db: Session = Depends(get_db)
):
    agent: Agent = agent_tuple[1]
    try:
        s_uuid = uuid.UUID(schedule_id)
    except (ValueError, TypeError):
        raise HTTPException(status_code=404, detail="Schedule event not found")

    stmt = select(Schedule).where(Schedule.id == s_uuid, Schedule.agent_id == agent.id)
    schedule = db.execute(stmt).scalar_one_or_none()
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule event not found")

    data = payload.model_dump(exclude_unset=True)
    for field, val in data.items():
        setattr(schedule, field, val)

    db.commit()
    db.refresh(schedule)
    return schedule


@router.delete("/schedules/{schedule_id}", summary="Cancel/delete schedule event")
def delete_schedule(
    schedule_id: str,
    agent_tuple=Depends(get_current_agent),
    db: Session = Depends(get_db)
):
    agent: Agent = agent_tuple[1]
    try:
        s_uuid = uuid.UUID(schedule_id)
    except (ValueError, TypeError):
        raise HTTPException(status_code=404, detail="Schedule event not found")

    stmt = select(Schedule).where(Schedule.id == s_uuid, Schedule.agent_id == agent.id)
    schedule = db.execute(stmt).scalar_one_or_none()
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule event not found")

    db.delete(schedule)
    db.commit()
    return {"status": "deleted", "id": str(s_uuid)}


# ==========================================
# Domain 5: Vendors Routes (Full CRUD)
# ==========================================
@router.get("/vendors", response_model=List[VendorResponse], summary="List vendors with category filter")
def get_vendors(
    category: Optional[str] = Query(None, description="Hotels | Transport | Activities | Restaurants"),
    search: Optional[str] = Query(None, description="Search name, contact, location"),
    agent_tuple=Depends(get_current_agent),
    db: Session = Depends(get_db)
):
    agent: Agent = agent_tuple[1]
    seed_agent_data_if_empty(db, agent)

    stmt = select(Vendor).where(Vendor.agent_id == agent.id)
    if category and category.strip() and category.lower() != 'all':
        stmt = stmt.where(Vendor.category.ilike(category.strip()))
    if search and search.strip():
        term = f"%{search.strip()}%"
        stmt = stmt.where(
            or_(
                Vendor.name.ilike(term),
                Vendor.location.ilike(term),
                Vendor.contact_person.ilike(term)
            )
        )
    stmt = stmt.order_by(Vendor.rating.desc(), Vendor.created_at.desc())
    return db.execute(stmt).scalars().all()


@router.post("/vendors", response_model=VendorResponse, status_code=status.HTTP_201_CREATED, summary="Add a new vendor")
def create_vendor(
    payload: VendorCreate,
    agent_tuple=Depends(get_current_agent),
    db: Session = Depends(get_db)
):
    agent: Agent = agent_tuple[1]
    vendor = Vendor(
        agent_id=agent.id,
        name=payload.name,
        category=payload.category,
        location=payload.location,
        contact_person=payload.contact_person,
        phone=payload.phone,
        email=payload.email,
        rating=payload.rating,
        status=payload.status or "Active"
    )
    db.add(vendor)
    db.commit()
    db.refresh(vendor)
    return vendor


@router.put("/vendors/{vendor_id}", response_model=VendorResponse, summary="Update vendor")
def update_vendor(
    vendor_id: str,
    payload: VendorUpdate,
    agent_tuple=Depends(get_current_agent),
    db: Session = Depends(get_db)
):
    agent: Agent = agent_tuple[1]
    try:
        v_uuid = uuid.UUID(vendor_id)
    except (ValueError, TypeError):
        raise HTTPException(status_code=404, detail="Vendor not found")

    stmt = select(Vendor).where(Vendor.id == v_uuid, Vendor.agent_id == agent.id)
    vendor = db.execute(stmt).scalar_one_or_none()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    data = payload.model_dump(exclude_unset=True)
    for field, val in data.items():
        setattr(vendor, field, val)

    db.commit()
    db.refresh(vendor)
    return vendor


@router.delete("/vendors/{vendor_id}", summary="Delete vendor")
def delete_vendor(
    vendor_id: str,
    agent_tuple=Depends(get_current_agent),
    db: Session = Depends(get_db)
):
    agent: Agent = agent_tuple[1]
    try:
        v_uuid = uuid.UUID(vendor_id)
    except (ValueError, TypeError):
        raise HTTPException(status_code=404, detail="Vendor not found")

    stmt = select(Vendor).where(Vendor.id == v_uuid, Vendor.agent_id == agent.id)
    vendor = db.execute(stmt).scalar_one_or_none()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    db.delete(vendor)
    db.commit()
    return {"status": "deleted", "id": str(v_uuid)}


# ==========================================
# Domain 6: Tours Routes
# ==========================================
@router.get("/tours", response_model=List[TourResponse], summary="List agent tour packages")
def get_tours(
    category: Optional[str] = Query(None, description="Active | Upcoming | Completed"),
    agent_tuple=Depends(get_current_agent),
    db: Session = Depends(get_db)
):
    agent: Agent = agent_tuple[1]
    seed_agent_data_if_empty(db, agent)

    stmt = select(Tour).where(Tour.agent_id == agent.id)
    if category and category.strip() and category.lower() != 'all':
        stmt = stmt.where(Tour.status.ilike(category.strip()))
    stmt = stmt.order_by(Tour.created_at.desc())
    return db.execute(stmt).scalars().all()


@router.get("/tours/summaries", response_model=List[UpcomingTourSummaryResponse], summary="Upcoming tour summaries for dashboard")
def get_tour_summaries(
    agent_tuple=Depends(get_current_agent),
    db: Session = Depends(get_db)
):
    agent: Agent = agent_tuple[1]
    seed_agent_data_if_empty(db, agent)

    stmt = select(Tour).where(Tour.agent_id == agent.id).limit(4)
    tours = db.execute(stmt).scalars().all()

    summaries = []
    travelers_sample = ["Rahul Sharma", "Priya Mehta", "Amit Shah", "Sneha Kapoor"]
    for idx, t in enumerate(tours):
        summaries.append(
            UpcomingTourSummaryResponse(
                id=str(t.id),
                tour=t.name,
                traveler=travelers_sample[idx % len(travelers_sample)],
                destination=t.destination or "India",
                dates=t.duration or "5 Days",
                status=t.status
            )
        )
    return summaries


@router.post("/tours", response_model=TourResponse, status_code=status.HTTP_201_CREATED, summary="Create a new tour package")
def create_tour(
    payload: TourCreate,
    agent_tuple=Depends(get_current_agent),
    db: Session = Depends(get_db)
):
    agent: Agent = agent_tuple[1]
    tour = Tour(
        agent_id=agent.id,
        name=payload.name,
        description=payload.description,
        destination=payload.destination,
        duration=payload.duration,
        start_date=payload.start_date,
        end_date=payload.end_date,
        status=payload.status or "Active",
        max_participants=payload.max_participants,
        booked_slots=payload.booked_slots,
        budget_per_person=payload.budget_per_person,
        currency=payload.currency or "INR",
        image_url=payload.image_url
    )
    db.add(tour)
    db.commit()
    db.refresh(tour)
    return tour


@router.put("/tours/{tour_id}", response_model=TourResponse, summary="Update tour package")
def update_tour(
    tour_id: str,
    payload: TourUpdate,
    agent_tuple=Depends(get_current_agent),
    db: Session = Depends(get_db)
):
    agent: Agent = agent_tuple[1]
    try:
        t_uuid = uuid.UUID(tour_id)
    except (ValueError, TypeError):
        raise HTTPException(status_code=404, detail="Tour package not found")

    stmt = select(Tour).where(Tour.id == t_uuid, Tour.agent_id == agent.id)
    tour = db.execute(stmt).scalar_one_or_none()
    if not tour:
        raise HTTPException(status_code=404, detail="Tour package not found")

    data = payload.model_dump(exclude_unset=True)
    for field, val in data.items():
        setattr(tour, field, val)

    db.commit()
    db.refresh(tour)
    return tour


# ==========================================
# Domain 7: Notifications & Alerts Routes
# ==========================================
@router.get("/notifications", response_model=List[NotificationResponse], summary="List agent notifications")
def get_notifications(
    notification_type: Optional[str] = Query(None, description="notification | activity | alert"),
    agent_tuple=Depends(get_current_agent),
    db: Session = Depends(get_db)
):
    agent: Agent = agent_tuple[1]
    seed_agent_data_if_empty(db, agent)

    stmt = select(AgentNotification).where(AgentNotification.agent_id == agent.id)
    if notification_type and notification_type.strip() and notification_type.lower() != 'all':
        stmt = stmt.where(AgentNotification.notification_type.ilike(notification_type.strip()))

    stmt = stmt.order_by(AgentNotification.created_at.desc())
    return db.execute(stmt).scalars().all()


@router.put("/notifications/{notif_id}/read", response_model=NotificationResponse, summary="Mark notification as read")
def mark_notification_read(
    notif_id: str,
    agent_tuple=Depends(get_current_agent),
    db: Session = Depends(get_db)
):
    agent: Agent = agent_tuple[1]
    try:
        n_uuid = uuid.UUID(notif_id)
    except (ValueError, TypeError):
        raise HTTPException(status_code=404, detail="Notification not found")

    stmt = select(AgentNotification).where(AgentNotification.id == n_uuid, AgentNotification.agent_id == agent.id)
    notif = db.execute(stmt).scalar_one_or_none()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")

    notif.is_read = True
    db.commit()
    db.refresh(notif)
    return notif


@router.delete("/notifications/{notif_id}", summary="Dismiss notification")
def dismiss_notification(
    notif_id: str,
    agent_tuple=Depends(get_current_agent),
    db: Session = Depends(get_db)
):
    agent: Agent = agent_tuple[1]
    try:
        n_uuid = uuid.UUID(notif_id)
    except (ValueError, TypeError):
        raise HTTPException(status_code=404, detail="Notification not found")

    stmt = select(AgentNotification).where(AgentNotification.id == n_uuid, AgentNotification.agent_id == agent.id)
    notif = db.execute(stmt).scalar_one_or_none()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")

    db.delete(notif)
    db.commit()
    return {"status": "dismissed", "id": str(n_uuid)}


# ==========================================
# Domain 8: Agent Travelers Route (Derived from Bookings)
# ==========================================
@router.get("/travelers", response_model=List[AgentTravelerResponse], summary="List travelers booked with this agency")
def get_agent_travelers(
    status: Optional[str] = Query(None, description="Active | Lead | Completed | Inactive"),
    search: Optional[str] = Query(None, description="Search traveler name or email"),
    agent_tuple=Depends(get_current_agent),
    db: Session = Depends(get_db)
):
    agent: Agent = agent_tuple[1]
    seed_agent_data_if_empty(db, agent)

    # Derive travelers dynamically from the agency's bookings ledger
    stmt = select(Booking).where(Booking.agent_id == agent.id).order_by(Booking.created_at.desc())
    bookings = db.execute(stmt).scalars().all()

    traveler_dict = {}
    for b in bookings:
        key = b.traveler_email.lower().strip()
        if key not in traveler_dict:
            tr_status = "Active" if b.status == "Confirmed" else "Lead" if b.status == "Pending" else "Inactive"
            traveler_dict[key] = {
                "id": str(uuid.uuid5(uuid.NAMESPACE_DNS, key)),
                "name": b.traveler_name,
                "email": b.traveler_email,
                "phone": "+91 98" + str(abs(hash(key)) % 100000000).zfill(8),
                "avatar_url": None,
                "trips_count": 1,
                "status": tr_status,
                "last_activity": f"Booked {b.tour_name} ({b.departure_date})",
                "preferred_destination": b.tour_name.split()[0] if b.tour_name else "Goa",
            }
        else:
            traveler_dict[key]["trips_count"] += 1

    traveler_list = list(traveler_dict.values())
    if status and status.strip() and status.lower() != 'all':
        traveler_list = [t for t in traveler_list if t["status"].lower() == status.strip().lower()]
    if search and search.strip():
        q = search.strip().lower()
        traveler_list = [t for t in traveler_list if q in t["name"].lower() or q in t["email"].lower()]

    return [AgentTravelerResponse(**t) for t in traveler_list]


# ==========================================
# Agent Dashboard Aggregate Stats Route
# ==========================================
@router.get("/stats", response_model=AgentStatsResponse, summary="Agent dashboard metrics")
def get_agent_stats(
    agent_tuple=Depends(get_current_agent),
    db: Session = Depends(get_db)
):
    agent: Agent = agent_tuple[1]
    seed_agent_data_if_empty(db, agent)

    # 1. Active travelers from bookings
    active_b = db.scalar(
        select(func.count(func.distinct(Booking.traveler_email)))
        .where(Booking.agent_id == agent.id, Booking.status == "Confirmed")
    ) or 0

    # 2. Active tours
    active_t = db.scalar(
        select(func.count())
        .select_from(Tour)
        .where(Tour.agent_id == agent.id, Tour.status == "Active")
    ) or 0

    # 3. Upcoming tours
    upcoming_t = db.scalar(
        select(func.count())
        .select_from(Tour)
        .where(Tour.agent_id == agent.id, Tour.status == "Upcoming")
    ) or 0

    # 4. Pending actions (pending bookings + unread high/medium alerts)
    pending_b = db.scalar(
        select(func.count())
        .select_from(Booking)
        .where(Booking.agent_id == agent.id, Booking.status == "Pending")
    ) or 0

    pending_n = db.scalar(
        select(func.count())
        .select_from(AgentNotification)
        .where(
            AgentNotification.agent_id == agent.id,
            AgentNotification.is_read.is_(False),
            AgentNotification.urgency.in_(["high", "medium"])
        )
    ) or 0

    return AgentStatsResponse(
        active_travelers=max(active_b, 1),
        active_tours=max(active_t, 1),
        upcoming_tours=max(upcoming_t, 1),
        pending_actions=pending_b + pending_n
    )
