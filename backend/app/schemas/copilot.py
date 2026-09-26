from typing import List, Optional, Dict, Any, Tuple
from pydantic import BaseModel, Field


class TripLocationSchema(BaseModel):
    id: str
    name: str
    type: str  # 'origin', 'destination', 'flight', 'hotel', 'activity', 'restaurant', 'transport'
    latitude: float
    longitude: float
    city: Optional[str] = None
    state: Optional[str] = None
    day: Optional[int] = None
    description: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class TripRouteSchema(BaseModel):
    id: str
    origin_id: str
    destination_id: str
    type: str = "flight"  # 'flight' or 'ground'
    from_coords: Tuple[float, float]
    to_coords: Tuple[float, float]
    label: Optional[str] = None
    distance_km: Optional[float] = None


class TripPlanNodeSchema(BaseModel):
    id: str
    type: str  # 'root', 'transport', 'flight', 'accommodation', 'hotel', 'day', 'activity', 'restaurant', 'destination'
    title: str
    subtitle: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None
    location_id: Optional[str] = None
    location: Optional[TripLocationSchema] = None
    status: Optional[str] = "suggested"  # 'confirmed', 'suggested', 'optional'
    children: Optional[List["TripPlanNodeSchema"]] = Field(default_factory=list)


class TripPlanSchema(BaseModel):
    id: str
    title: str
    origin: str
    destination: str
    duration_days: int
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    estimated_budget: Optional[str] = None
    travel_style: Optional[str] = None
    nodes: List[TripPlanNodeSchema] = Field(default_factory=list)
    locations: List[TripLocationSchema] = Field(default_factory=list)
    routes: List[TripRouteSchema] = Field(default_factory=list)


class TripContextSchema(BaseModel):
    origin: Optional[str] = "Mumbai"
    destinations: Optional[List[str]] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    budget: Optional[float] = None
    travelers: Optional[int] = 2


class TripPlanRequest(BaseModel):
    message: str
    trip_context: Optional[TripContextSchema] = None


class TripPlanResponse(BaseModel):
    message: str
    trip_plan: TripPlanSchema
