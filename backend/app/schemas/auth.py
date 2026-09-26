from typing import Literal, Optional
from pydantic import BaseModel, EmailStr, Field, model_validator
from app.schemas.user import UserSafeResponse


class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Full name")
    email: EmailStr = Field(..., description="Valid user email address")
    password: str = Field(..., min_length=6, max_length=128, description="Password (min 6 characters)")
    role: Literal["traveler", "agent"] = Field(..., description="User role: 'traveler' or 'agent'")
    agency_name: Optional[str] = Field(None, max_length=255, description="Agency name (required for agents)")

    @model_validator(mode="after")
    def validate_agent_fields(self):
        if self.role == "agent":
            if not self.agency_name or not self.agency_name.strip():
                raise ValueError("agency_name is required when registering as an agent")
        return self


class LoginRequest(BaseModel):
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., min_length=1, description="Password")
    role: Optional[Literal["traveler", "agent"]] = Field(None, description="Expected user role")


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserSafeResponse


class RegisterResponse(BaseModel):
    message: str = "Registration successful"
    user: UserSafeResponse
