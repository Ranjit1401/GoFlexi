import uuid
from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, ConfigDict, Field


class TripBase(BaseModel):
    title: str = Field(..., description="Trip name/title")
    destination: str = Field(..., description="Destination name or route")
    start_date: str = Field(..., description="Start date format or string")
    end_date: str = Field(..., description="End date format or string")
    days: int = Field(1, ge=1, description="Total days")
    travelers_count: int = Field(1, ge=1, description="Number of travelers")
    budget: str = Field("₹25,000", description="Budget string e.g. ₹35,000")
    status: str = Field("Upcoming", description="Upcoming | Past | Draft")
    image_url: Optional[str] = None
    itinerary_summary: Optional[str] = None
    tags: Optional[List[str]] = None
    stops: Optional[List[str]] = None


class TripCreate(TripBase):
    pass


class TripUpdate(BaseModel):
    title: Optional[str] = None
    destination: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    days: Optional[int] = None
    travelers_count: Optional[int] = None
    budget: Optional[str] = None
    status: Optional[str] = None
    image_url: Optional[str] = None
    itinerary_summary: Optional[str] = None
    tags: Optional[List[str]] = None
    stops: Optional[List[str]] = None


class TripResponse(TripBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
