from datetime import date
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class AirportSuggestion(BaseModel):
    skyId: str
    entityId: str
    name: str
    city: str
    country: str

    model_config = ConfigDict(from_attributes=True)


class FlightSearchRequest(BaseModel):
    origin: str = Field(..., description="Origin city or airport name/code")
    destination: str = Field(..., description="Destination city or airport name/code")
    depart_date: date = Field(..., description="Departure date (YYYY-MM-DD)")
    return_date: Optional[date] = Field(None, description="Return date for round-trip (optional)")
    adults: int = Field(1, ge=1, le=10, description="Number of adult passengers")
    cabin_class: str = Field("economy", description="Cabin class: economy, premium_economy, business, first")
    currency: str = Field("INR", description="Currency code, e.g. INR, USD, EUR")


class FlightOption(BaseModel):
    id: str
    airline: str
    price: float
    currency: str = "INR"
    depart_time: str
    arrive_time: str
    duration_minutes: int
    stops: int
    origin_airport: str
    destination_airport: str
    booking_deeplink: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class FlightSearchResponse(BaseModel):
    query: FlightSearchRequest
    results: List[FlightOption]
    count: int


class HotelSearchRequest(BaseModel):
    destination: str = Field(..., description="Destination city, region, or hotel name")
    check_in: date = Field(..., description="Check-in date (YYYY-MM-DD)")
    check_out: date = Field(..., description="Check-out date (YYYY-MM-DD)")
    adults: int = Field(1, ge=1, le=20, description="Total adult guests")
    rooms: int = Field(1, ge=1, le=10, description="Number of rooms requested")
    currency: str = Field("INR", description="Currency code, e.g. INR, USD, EUR")


class HotelOption(BaseModel):
    id: str
    name: str
    star_rating: Optional[float] = None
    price_per_night: float
    currency: str = "INR"
    thumbnail_url: Optional[str] = None
    address: Optional[str] = None
    rating_score: Optional[float] = None
    review_count: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)


class HotelSearchResponse(BaseModel):
    query: HotelSearchRequest
    results: List[HotelOption]
    count: int
