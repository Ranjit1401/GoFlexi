from app.schemas.user import UserSafeResponse
from app.schemas.agent import AgentProfileResponse
from app.schemas.auth import (
    RegisterRequest,
    RegisterResponse,
    LoginRequest,
    TokenResponse,
)
from app.schemas.preferences import (
    TravelerPreferencesUpdate,
    TravelerPreferencesResponse,
)
from app.schemas.destination import (
    DestinationTagSchema,
    DestinationTravelStyleSchema,
    DestinationCompanionSchema,
    DestinationTransportSchema,
    DestinationPaceSchema,
    DestinationBestMonthSchema,
    DestinationListItemResponse,
    DestinationDetailResponse,
    DestinationListResponse,
)
from app.schemas.travel_search import (
    AirportSuggestion,
    FlightSearchRequest,
    FlightOption,
    FlightSearchResponse,
    HotelSearchRequest,
    HotelOption,
    HotelSearchResponse,
)

__all__ = [
    "UserSafeResponse",
    "AgentProfileResponse",
    "RegisterRequest",
    "RegisterResponse",
    "LoginRequest",
    "TokenResponse",
    "TravelerPreferencesUpdate",
    "TravelerPreferencesResponse",
    "DestinationTagSchema",
    "DestinationTravelStyleSchema",
    "DestinationCompanionSchema",
    "DestinationTransportSchema",
    "DestinationPaceSchema",
    "DestinationBestMonthSchema",
    "DestinationListItemResponse",
    "DestinationDetailResponse",
    "DestinationListResponse",
    "AirportSuggestion",
    "FlightSearchRequest",
    "FlightOption",
    "FlightSearchResponse",
    "HotelSearchRequest",
    "HotelOption",
    "HotelSearchResponse",
]

