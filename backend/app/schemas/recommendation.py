import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class RecommendationItem(BaseModel):
    destination_id: uuid.UUID
    name: str
    city: str
    state: str
    country: str
    short_description: str
    description: str
    score: float = Field(..., ge=0.0, le=1.0, description="Normalized match score between 0.0 and 1.0")
    match_percentage: int = Field(..., ge=0, le=100, description="Match score formatted as percentage")
    matched_preferences: List[str] = Field(default_factory=list, description="List of traveler preference labels that matched")
    explanation: str = Field(..., description="Deterministic explanation of why this destination matches")
    relevant_tags: List[str] = Field(default_factory=list, description="Key tags describing the destination")
    budget_min: int = Field(default=0)
    budget_max: int = Field(default=0)
    popularity_score: float = Field(default=0.0)

    model_config = ConfigDict(from_attributes=True)


class RecommendationResponse(BaseModel):
    recommendations: List[RecommendationItem] = Field(default_factory=list)
    total: int = Field(default=0)
    generated_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(from_attributes=True)
