from typing import List, Optional, Dict, Any, Tuple
from pydantic import BaseModel, Field


class TripLocationSchema(BaseModel):
    id: str
    name: str
    type: str  # 'origin', 'destination', 'flight', 'hotel', 'stay', 'activity', 'restaurant', 'transport'
    latitude: float
    longitude: float
    city: Optional[str] = None
    state: Optional[str] = None
    day: Optional[int] = None
    time_block: Optional[str] = None  # 'morning', 'afternoon', 'evening'
    description: Optional[str] = None
    destination_id: Optional[str] = None
    poi_id: Optional[str] = None
    rating: Optional[float] = None
    preview_image: Optional[str] = None
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
    type: str  # 'root', 'transport', 'flight', 'accommodation', 'hotel', 'day', 'time_block', 'activity', 'restaurant', 'destination'
    title: str
    subtitle: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None
    time_block: Optional[str] = None  # 'morning', 'afternoon', 'evening'
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


class ItineraryChangeSchema(BaseModel):
    day: int
    time_block: str  # 'morning', 'afternoon', 'evening'
    title: str
    subtitle: Optional[str] = None
    description: Optional[str] = None
    destination_id: Optional[str] = None
    poi_id: Optional[str] = None
    location: Optional[TripLocationSchema] = None
    action: str = "add"  # 'add', 'update', 'remove'


class TripUpdatesSchema(BaseModel):
    origin: Optional[str] = None
    destination: Optional[str] = None
    destinations: Optional[List[str]] = None
    duration_days: Optional[int] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    budget: Optional[str] = None
    travel_style: Optional[str] = None
    travelers: Optional[int] = None


class DiscoveredPlaceSchema(BaseModel):
    poi_id: Optional[str] = None
    destination_id: Optional[str] = None
    name: str
    description: Optional[str] = None
    latitude: float
    longitude: float
    image_url: Optional[str] = None
    source: Optional[str] = "OpenTripMap"
    kinds: Optional[str] = None
    rating: Optional[float] = None


class CopilotChatRequest(BaseModel):
    message: str
    trip_id: Optional[str] = None
    trip_state: Optional[TripPlanSchema] = None
    trip_context: Optional[TripContextSchema] = None
    selected_places: Optional[List[DiscoveredPlaceSchema]] = Field(default_factory=list)


class CopilotChatResponse(BaseModel):
    intent: str = "CASUAL_CHAT"
    message: str
    places: List[DiscoveredPlaceSchema] = Field(default_factory=list)
    selected_places: List[DiscoveredPlaceSchema] = Field(default_factory=list)
    trip_updates: Optional[TripUpdatesSchema] = None
    locations: List[TripLocationSchema] = Field(default_factory=list)
    itinerary_changes: List[ItineraryChangeSchema] = Field(default_factory=list)
    suggested_actions: List[str] = Field(default_factory=list)
    trip_plan: Optional[TripPlanSchema] = None


# Legacy compatibility schemas
class TripPlanRequest(BaseModel):
    message: str
    trip_context: Optional[TripContextSchema] = None


class TripPlanResponse(BaseModel):
    message: str
    trip_plan: TripPlanSchema
