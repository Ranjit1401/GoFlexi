import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Text, Boolean, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.database import Base
from app.models.user import GUID


class AgentNotification(Base):
    __tablename__ = "agent_notifications"

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
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str] = mapped_column(String(100), nullable=False)  # New booking, Traveler request, Schedule update, Pending approval
    notification_type: Mapped[str] = mapped_column(String(50), default="notification", nullable=False)  # notification, activity, alert
    urgency: Mapped[str] = mapped_column(String(50), default="info", nullable=False)  # high, medium, info
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    time_label: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    agent = relationship("Agent", backref="notifications")
