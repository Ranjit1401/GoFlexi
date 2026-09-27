from typing import List, Optional, Literal
from pydantic import BaseModel, Field
from app.schemas.copilot import TripPlanSchema
from app.schemas.travel_search import FlightOption, HotelOption


class GeoResult(BaseModel):
    name: str
    country: str
    admin1: Optional[str] = None
    latitude: float
    longitude: float
    country_code: Optional[str] = "IN"


class POIResult(BaseModel):
    xid: str
    name: str
    kinds: str = ""
    rate: Optional[str] = None
    popularity: Literal["Iconic", "Popular", "Hidden Gem"] = "Popular"
    latitude: float
    longitude: float
    dist_meters: Optional[float] = None
    preview_image: Optional[str] = None


class POIDetail(BaseModel):
    xid: str
    name: str
    description: Optional[str] = None
    kinds: Optional[str] = None
    image_url: Optional[str] = None
    wikipedia_url: Optional[str] = None
    address: Optional[str] = None
    preview_image: Optional[str] = None


class WeatherOutlook(BaseModel):
    temp_max: float
    temp_min: float
    precipitation_probability: int
    condition: str
    is_forecast: bool = True
    daily_summary: Optional[str] = None


class DateInsightResponse(BaseModel):
    weather: WeatherOutlook
    crowd_score: int
    crowd_label: str
    crowd_disclaimer: str
    holiday_overlap: bool
    holidays: List[str] = Field(default_factory=list)


class BudgetPreview(BaseModel):
    min_price: float
    max_price: float
    flight_min: float
    flight_max: float
    hotel_min: float
    hotel_max: float
    currency: str = "INR"
    flight_budget_ratio: float = 0.45
    hotel_budget_ratio: float = 0.55



class WizardActivity(BaseModel):
    xid: str
    name: str
    popularity: Literal["Iconic", "Popular", "Hidden Gem"] = "Popular"
    kinds: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    day: Optional[int] = None
    description: Optional[str] = None
    preview_image: Optional[str] = None


class TripRecommendationRequest(BaseModel):
    destination: str
    destination_lat: float
    destination_lon: float
    country_code: Optional[str] = "IN"
    departure_city: str = "Mumbai"
    start_date: str
    end_date: str
    travelers: int = 1
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    activities: List[WizardActivity] = Field(default_factory=list)
    travel_style: str = "Balanced"
    selected_flight: Optional[FlightOption] = None
    selected_hotel: Optional[HotelOption] = None


class TripRecommendationResponse(BaseModel):
    trip_plan: TripPlanSchema
    recommended_flight: Optional[FlightOption] = None
    recommended_hotel: Optional[HotelOption] = None
    alternate_flights: List[FlightOption] = Field(default_factory=list)
    alternate_hotels: List[HotelOption] = Field(default_factory=list)
    message: str


class DigitalTwinImpact(BaseModel):
    name: str
    change_pct: float
    uncertainty_pct: float
    direction: Literal["increase", "decrease", "stable"]
    explanation: str


class SocialSignal(BaseModel):
    title: str
    score: Optional[int] = None
    created_at: Optional[str] = None
    source: str
    url: Optional[str] = None


class DigitalTwinScenario(BaseModel):
    rainfall_mm: float
    temperature_c: float
    storm_duration_hours: float


class DigitalTwinResponse(BaseModel):
    destination: str
    live_weather: WeatherOutlook
    scenario: DigitalTwinScenario
    system_risk_probability: int
    system_risk_uncertainty: int
    impacts: List[DigitalTwinImpact] = Field(default_factory=list)
    social_signals: List[SocialSignal] = Field(default_factory=list)
    social_signal_status: str = "No public signals available."
    updated_at: str
