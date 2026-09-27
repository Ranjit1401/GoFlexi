import uuid
from datetime import datetime
from typing import TYPE_CHECKING
from sqlalchemy import String, DateTime, ForeignKey, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.database import Base
from app.models.user import GUID

if TYPE_CHECKING:
    from app.models.agent import Agent
    from app.models.user import User


class OperatorTraveler(Base):
    """
    Persistent relationship between a Tour Operator/Agent and an assigned Traveler.
    Enforces unique active assignment so a traveler cannot be duplicated under the same agent.
    """
    __tablename__ = "operator_travelers"
    __table_args__ = (
        UniqueConstraint("agent_id", "traveler_user_id", name="uq_operator_traveler"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        GUID,
        primary_key=True,
        default=uuid.uuid4,
        index=True
    )
    agent_id: Mapped[uuid.UUID] = mapped_column(
        GUID,
        ForeignKey("agents.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    traveler_user_id: Mapped[uuid.UUID] = mapped_column(
        GUID,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    status: Mapped[str] = mapped_column(
        String(50),
        default="Active",
        nullable=False
    )  # Active, Lead, Completed, Inactive

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

    agent: Mapped["Agent"] = relationship("Agent", back_populates="operator_travelers")
    traveler: Mapped["User"] = relationship("User", foreign_keys=[traveler_user_id], backref="operator_traveler_records")
