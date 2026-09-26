import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.schemas.user import UserSafeResponse


class AgencyInfo(BaseModel):
    id: uuid.UUID
    agency_name: str
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class AgentProfileResponse(BaseModel):
    user: UserSafeResponse
    agency: AgencyInfo

    model_config = ConfigDict(from_attributes=True)
