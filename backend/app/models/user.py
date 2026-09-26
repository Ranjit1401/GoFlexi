import uuid
from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, DateTime, func
from sqlalchemy.types import TypeDecorator, CHAR
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.database import Base

if TYPE_CHECKING:
    from app.models.agent import Agent
    from app.models.traveler_profile import TravelerProfile


class GUID(TypeDecorator):
    """Platform-independent GUID/UUID type stored as CHAR(36)."""
    impl = CHAR(36)
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        if isinstance(value, uuid.UUID):
            return str(value)
        return str(uuid.UUID(str(value)))

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        if isinstance(value, uuid.UUID):
            return value
        return uuid.UUID(str(value).strip())


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        GUID,
        primary_key=True,
        default=uuid.uuid4,
        index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(50), nullable=False)  # 'traveler' or 'agent'

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

    # 1:1 relationship with Agent profile
    agent: Mapped[Optional["Agent"]] = relationship(
        "Agent",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan"
    )

    # 1:1 relationship with Traveler profile
    traveler_profile: Mapped[Optional["TravelerProfile"]] = relationship(
        "TravelerProfile",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan"
    )
