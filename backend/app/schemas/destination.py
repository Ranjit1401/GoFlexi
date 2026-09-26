import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class DestinationTagSchema(BaseModel):
    id: Optional[uuid.UUID] = None
    tag_type: str
    tag_value: str

    model_config = ConfigDict(from_attributes=True)


class DestinationTravelStyleSchema(BaseModel):
    id: Optional[uuid.UUID] = None
    travel_style: str

    model_config = ConfigDict(from_attributes=True)


class DestinationCompanionSchema(BaseModel):
    id: Optional[uuid.UUID] = None
    companion_type: str

    model_config = ConfigDict(from_attributes=True)


class DestinationTransportSchema(BaseModel):
    id: Optional[uuid.UUID] = None
    transport_type: str

    model_config = ConfigDict(from_attributes=True)


class DestinationPaceSchema(BaseModel):
    id: Optional[uuid.UUID] = None
    pace: str

    model_config = ConfigDict(from_attributes=True)


class DestinationBestMonthSchema(BaseModel):
    id: Optional[uuid.UUID] = None
    month: int

    model_config = ConfigDict(from_attributes=True)


class DestinationSourceSchema(BaseModel):
    id: Optional[uuid.UUID] = None
    source_name: str
    source_url: Optional[str] = None
    source_type: str
    external_id: Optional[str] = None
    verified_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)



class DestinationListItemResponse(BaseModel):
    id: uuid.UUID
    name: str
    country: str
    state: str
    city: str
    short_description: str
    budget_min: int
    budget_max: int
    popularity_score: float
    places: List[str] = Field(default_factory=list)
    experiences: List[str] = Field(default_factory=list)
    travel_styles: List[str] = Field(default_factory=list)
    companions: List[str] = Field(default_factory=list)
    transport_options: List[str] = Field(default_factory=list)
    paces: List[str] = Field(default_factory=list)
    best_months: List[int] = Field(default_factory=list)
    sources: List[DestinationSourceSchema] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class DestinationDetailResponse(BaseModel):
    id: uuid.UUID
    name: str
    country: str
    state: str
    city: str
    description: str
    short_description: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    budget_min: int
    budget_max: int
    popularity_score: float
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    tags: List[DestinationTagSchema] = Field(default_factory=list)
    places: List[str] = Field(default_factory=list)
    experiences: List[str] = Field(default_factory=list)
    travel_styles: List[str] = Field(default_factory=list)
    companions: List[str] = Field(default_factory=list)
    transport_options: List[str] = Field(default_factory=list)
    paces: List[str] = Field(default_factory=list)
    best_months: List[int] = Field(default_factory=list)
    sources: List[DestinationSourceSchema] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class DestinationListResponse(BaseModel):
    items: List[DestinationListItemResponse]
    total: int
    page: int
    size: int
    pages: int
