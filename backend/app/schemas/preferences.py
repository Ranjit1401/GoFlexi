import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator

VALID_PLACES = {
    "mountains": "Mountains",
    "beaches": "Beaches",
    "nature": "Nature",
    "cities": "Cities",
    "historical": "Historical",
    "cultural": "Cultural",
    "islands": "Islands"
}

VALID_EXPERIENCES = {
    "adventure": "Adventure",
    "food": "Food",
    "nightlife": "Nightlife",
    "shopping": "Shopping",
    "relaxation": "Relaxation",
    "wildlife": "Wildlife",
    "photography": "Photography",
    "culture": "Culture",
    "sports": "Sports"
}

VALID_STYLES = {
    "budget": "Budget",
    "balanced": "Balanced",
    "premium": "Premium",
    "luxury": "Luxury"
}

VALID_COMPANIONS = {
    "solo": "Solo",
    "couple": "Couple",
    "family": "Family",
    "friends": "Friends"
}

VALID_PACING = {
    "relaxed": "Relaxed",
    "balanced": "Balanced",
    "packed": "Packed"
}


class TravelerPreferencesUpdate(BaseModel):
    places: List[str] = Field(default_factory=list, description="Selected destination types")
    experiences: List[str] = Field(default_factory=list, description="Selected travel experiences")
    travel_style: str = Field(..., min_length=1, max_length=50, description="Preferred travel style")
    companions: str = Field(..., min_length=1, max_length=50, description="Usual travel companions")
    transport: str = Field(..., min_length=1, max_length=255, description="Preferred transit modes")
    itinerary_pace: str = Field(..., min_length=1, max_length=50, description="Itinerary daily pace")
    budget_range: str = Field(..., min_length=1, max_length=100, description="Trip budget range")
    onboarding_completed: bool = Field(default=True, description="Whether onboarding is completed")

    @field_validator("places")
    @classmethod
    def validate_places(cls, v: List[str]) -> List[str]:
        cleaned = []
        for item in v:
            key = item.strip().lower()
            if not key:
                continue
            if key not in VALID_PLACES:
                raise ValueError(f"Invalid place '{item}'. Allowed: {list(VALID_PLACES.values())}")
            canonical = VALID_PLACES[key]
            if canonical not in cleaned:
                cleaned.append(canonical)
        return cleaned

    @field_validator("experiences")
    @classmethod
    def validate_experiences(cls, v: List[str]) -> List[str]:
        cleaned = []
        for item in v:
            key = item.strip().lower()
            if not key:
                continue
            if key not in VALID_EXPERIENCES:
                raise ValueError(f"Invalid experience '{item}'. Allowed: {list(VALID_EXPERIENCES.values())}")
            canonical = VALID_EXPERIENCES[key]
            if canonical not in cleaned:
                cleaned.append(canonical)
        return cleaned

    @field_validator("travel_style")
    @classmethod
    def validate_travel_style(cls, v: str) -> str:
        key = v.strip().lower()
        if key not in VALID_STYLES:
            raise ValueError(f"Invalid travel_style '{v}'. Allowed: {list(VALID_STYLES.values())}")
        return VALID_STYLES[key]

    @field_validator("companions")
    @classmethod
    def validate_companions(cls, v: str) -> str:
        key = v.strip().lower()
        if key not in VALID_COMPANIONS:
            raise ValueError(f"Invalid companions '{v}'. Allowed: {list(VALID_COMPANIONS.values())}")
        return VALID_COMPANIONS[key]

    @field_validator("itinerary_pace")
    @classmethod
    def validate_pacing(cls, v: str) -> str:
        key = v.strip().lower()
        if key not in VALID_PACING:
            raise ValueError(f"Invalid itinerary_pace '{v}'. Allowed: {list(VALID_PACING.values())}")
        return VALID_PACING[key]

    @field_validator("transport", "budget_range")
    @classmethod
    def clean_text_field(cls, v: str) -> str:
        cleaned = v.strip()
        if not cleaned:
            raise ValueError("Field cannot be empty")
        return cleaned


class TravelerPreferencesResponse(BaseModel):
    id: Optional[uuid.UUID] = None
    user_id: uuid.UUID
    places: List[str] = Field(default_factory=list)
    experiences: List[str] = Field(default_factory=list)
    travel_style: str = ""
    companions: str = ""
    transport: str = ""
    itinerary_pace: str = ""
    budget_range: str = ""
    onboarding_completed: bool = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
