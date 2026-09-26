import uuid
from datetime import datetime
from typing import List, Optional, TYPE_CHECKING
from sqlalchemy import String, Boolean, DateTime, ForeignKey, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.database import Base
from app.models.user import GUID

if TYPE_CHECKING:
    from app.models.user import User


class TravelerProfile(Base):
    __tablename__ = "traveler_profiles"

    id: Mapped[uuid.UUID] = mapped_column(
        GUID,
        primary_key=True,
        default=uuid.uuid4,
        index=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        GUID,
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True
    )
    travel_style: Mapped[str] = mapped_column(String(50), nullable=False, default="")
    companions: Mapped[str] = mapped_column(String(50), nullable=False, default="")
    transport: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    itinerary_pace: Mapped[str] = mapped_column(String(50), nullable=False, default="")
    budget_range: Mapped[str] = mapped_column(String(100), nullable=False, default="")
    onboarding_completed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )

    # 1:1 Relationship back to User
    user: Mapped["User"] = relationship("User", back_populates="traveler_profile")

    # 1:N Relationship to TravelerInterest
    interests: Mapped[List["TravelerInterest"]] = relationship(
        "TravelerInterest",
        back_populates="profile",
        cascade="all, delete-orphan",
        order_by="TravelerInterest.id"
    )


class TravelerInterest(Base):
    __tablename__ = "traveler_interests"

    id: Mapped[uuid.UUID] = mapped_column(
        GUID,
        primary_key=True,
        default=uuid.uuid4,
        index=True
    )
    traveler_profile_id: Mapped[uuid.UUID] = mapped_column(
        GUID,
        ForeignKey("traveler_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    interest_type: Mapped[str] = mapped_column(String(50), nullable=False)   # 'place' or 'experience'
    interest_value: Mapped[str] = mapped_column(String(100), nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    profile: Mapped["TravelerProfile"] = relationship("TravelerProfile", back_populates="interests")

    __table_args__ = (
        UniqueConstraint("traveler_profile_id", "interest_type", "interest_value", name="uq_traveler_interest"),
    )
