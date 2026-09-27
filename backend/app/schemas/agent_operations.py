import uuid
from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field


# ==========================================
# 1. Bookings Schemas
# ==========================================
class BookingBase(BaseModel):
    booking_code: str = Field(..., description="Booking code e.g. VY-8921")
    traveler_name: str = Field(..., description="Traveler full name")
    traveler_email: str = Field(..., description="Traveler email address")
    tour_name: str = Field(..., description="Tour or package title")
    service: str = Field("Full Tour Package", description="Full Tour Package, Hotel + Sightseeing, Transport & Transfers, Custom Excursion")
    departure_date: str = Field(..., description="Date of departure e.g. 12 Jun 2026")
    amount: str = Field(..., description="Formatted amount e.g. ₹69,000")
    status: str = Field("Confirmed", description="Confirmed | Pending | Cancelled")


class BookingCreate(BookingBase):
    pass


class BookingStatusUpdate(BaseModel):
    status: str = Field(..., description="Confirmed | Pending | Cancelled")


class BookingResponse(BookingBase):
    id: uuid.UUID
    agent_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# 2. Schedules Schemas
# ==========================================
class ScheduleBase(BaseModel):
    time: str = Field(..., description="Time e.g. 09:30 AM")
    date: str = Field(..., description="Date string e.g. Today, Tomorrow, or YYYY-MM-DD")
    item_type: str = Field(..., description="departure | activity | transfer | checkin")
    title: str = Field(..., description="Title of scheduled event")
    details: Optional[str] = None
    traveler_or_group: str = Field(..., description="Traveler or group name")
    location: str = Field(..., description="City or landmark")
    status: str = Field("Scheduled", description="Scheduled | On Track | Delayed | Completed")


class ScheduleCreate(ScheduleBase):
    pass


class ScheduleUpdate(BaseModel):
    time: Optional[str] = None
    date: Optional[str] = None
    item_type: Optional[str] = None
    title: Optional[str] = None
    details: Optional[str] = None
    traveler_or_group: Optional[str] = None
    location: Optional[str] = None
    status: Optional[str] = None


class ScheduleResponse(ScheduleBase):
    id: uuid.UUID
    agent_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# 3. Vendors Schemas
# ==========================================
class VendorBase(BaseModel):
    name: str = Field(..., description="Vendor company or provider name")
    category: str = Field(..., description="Hotels | Transport | Activities | Restaurants")
    location: str = Field(..., description="City or region")
    contact_person: str = Field(..., description="Representative name")
    phone: str = Field(..., description="Contact phone")
    email: str = Field(..., description="Contact email")
    rating: float = Field(4.5, ge=1.0, le=5.0)
    status: str = Field("Active", description="Verified Partner | Pending Review | Active")


class VendorCreate(VendorBase):
    pass


class VendorUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    location: Optional[str] = None
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    rating: Optional[float] = None
    status: Optional[str] = None


class VendorResponse(VendorBase):
    id: uuid.UUID
    agent_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# 4. Tours Schemas
# ==========================================
class TourBase(BaseModel):
    name: str = Field(..., description="Tour package title")
    description: Optional[str] = None
    destination: Optional[str] = None
    duration: Optional[str] = Field("5 Days / 4 Nights", description="Formatted duration")
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: str = Field("Active", description="Active | Upcoming | Completed | Draft")
    max_participants: int = Field(20, ge=1)
    booked_slots: int = Field(0, ge=0)
    budget_per_person: Optional[float] = None
    currency: str = Field("INR")
    image_url: Optional[str] = None


class TourCreate(TourBase):
    pass


class TourUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    destination: Optional[str] = None
    duration: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[str] = None
    max_participants: Optional[int] = None
    booked_slots: Optional[int] = None
    budget_per_person: Optional[float] = None
    currency: Optional[str] = None
    image_url: Optional[str] = None


class TourResponse(TourBase):
    id: uuid.UUID
    agent_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UpcomingTourSummaryResponse(BaseModel):
    id: str
    tour: str
    traveler: str
    destination: str
    dates: str
    status: str


# ==========================================
# 5. Agent Notifications & Alerts Schemas
# ==========================================
class NotificationBase(BaseModel):
    title: str
    message: str
    category: str = Field("New booking", description="New booking | Traveler request | Schedule update | Pending approval")
    notification_type: str = Field("notification", description="notification | activity | alert")
    urgency: str = Field("info", description="high | medium | info")
    is_read: bool = False
    time_label: Optional[str] = "Just now"


class NotificationCreate(NotificationBase):
    pass


class NotificationResponse(NotificationBase):
    id: uuid.UUID
    agent_id: uuid.UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# 6. Agent Travelers Schemas
# ==========================================
class AgentTravelerResponse(BaseModel):
    id: str
    name: str
    email: str
    phone: str
    avatar_url: Optional[str] = None
    trips_count: int = 1
    status: str = "Active"  # Active | Lead | Completed | Inactive
    last_activity: str = "Recent booking"
    preferred_destination: Optional[str] = None


# ==========================================
# 7. Agent Dashboard Stats Schemas
# ==========================================
class AgentStatsResponse(BaseModel):
    active_travelers: int
    active_tours: int
    upcoming_tours: int
    pending_actions: int
