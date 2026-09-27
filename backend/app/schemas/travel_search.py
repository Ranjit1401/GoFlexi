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
    airline_logo: Optional[str] = None
    flight_number: Optional[str] = None

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
    booking_link: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class HotelSearchResponse(BaseModel):
    query: HotelSearchRequest
    results: List[HotelOption]
    count: int


class TrainScheduleStop(BaseModel):
    station_code: str
    station_name: str
    arrival_time: str
    departure_time: str
    halt_minutes: int = 0
    distance_km: int = 0
    day: int = 1


class TrainOption(BaseModel):
    id: str
    train_number: str
    train_name: str
    origin_station_code: str
    origin_station_name: str
    destination_station_code: str
    destination_station_name: str
    depart_time: str
    arrive_time: str
    duration_minutes: int
    duration_formatted: str
    run_days: List[str] = Field(default_factory=list)
    available_classes: List[str] = Field(default_factory=list)
    price: float
    currency: str = "INR"
    train_type: str = "Express"
    booking_link: Optional[str] = None
    schedule: Optional[List[TrainScheduleStop]] = None
    # Live day-specific timetable fields
    journey_date: Optional[str] = None
    journey_day: Optional[str] = None
    arrival_date: Optional[str] = None
    arrival_day: Optional[str] = None
    days_offset: int = 0
    runs_on_selected_day: bool = True
    live_status_note: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class TrainSearchRequest(BaseModel):
    origin: str = Field(..., description="Origin city or railway station code")
    destination: str = Field(..., description="Destination city or railway station code")
    depart_date: date = Field(..., description="Date of journey (YYYY-MM-DD)")
    travelers: int = Field(1, ge=1, le=10)
    train_class: Optional[str] = Field(None, description="Preferred class: 1A, 2A, 3A, SL, CC, EC, 2S")
    only_running_today: bool = Field(True, description="Filter only to trains operating on the selected date")


class TrainSearchResponse(BaseModel):
    query: TrainSearchRequest
    is_domestic_india: bool = True
    source: str = "irctc_official_schedule"  # "rapidapi_live" or "irctc_official_schedule"
    date_formatted: Optional[str] = None
    day_name: Optional[str] = None
    total_trains_on_route: int = 0
    operating_today_count: int = 0
    notice: Optional[str] = None
    results: List[TrainOption]
    count: int

