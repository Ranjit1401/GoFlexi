import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class UserSafeResponse(BaseModel):
    id: uuid.UUID
    name: str
    email: str
    role: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
