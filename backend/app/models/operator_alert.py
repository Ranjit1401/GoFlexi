import uuid
from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.database import Base
from app.models.user import GUID

if TYPE_CHECKING:
    from app.models.agent import Agent


class OperatorAlert(Base):
    """
    Real operational alerts produced only by actual business events (e.g. flight delay,
    booking conflict, schedule change). Empty by default with zero fake seeds.
    """
    __tablename__ = "operator_alerts"

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
    type: Mapped[str] = mapped_column(String(50), nullable=False)  # delay, booking, schedule, safety, operations
    severity: Mapped[str] = mapped_column(String(50), default="info", nullable=False)  # high, medium, info
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="Active", nullable=False)  # Active, Resolved, Dismissed

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
    resolved_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )

    agent: Mapped["Agent"] = relationship("Agent", back_populates="operator_alerts")
