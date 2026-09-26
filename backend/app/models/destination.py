import uuid
from datetime import datetime
from typing import List, Optional
from sqlalchemy import String, Integer, Float, Text, DateTime, ForeignKey, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.database import Base
from app.models.user import GUID


class Destination(Base):
    __tablename__ = "destinations"

    id: Mapped[uuid.UUID] = mapped_column(
        GUID,
        primary_key=True,
        default=uuid.uuid4,
        index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    country: Mapped[str] = mapped_column(String(100), nullable=False, default="India", index=True)
    state: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    city: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    short_description: Mapped[str] = mapped_column(String(500), nullable=False)
    latitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    longitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    budget_min: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    budget_max: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    popularity_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.0, index=True)

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

    # 1:N Relationships to metadata tables
    tags: Mapped[List["DestinationTag"]] = relationship(
        "DestinationTag",
        back_populates="destination",
        cascade="all, delete-orphan",
        order_by="DestinationTag.id"
    )
    travel_styles: Mapped[List["DestinationTravelStyle"]] = relationship(
        "DestinationTravelStyle",
        back_populates="destination",
        cascade="all, delete-orphan",
        order_by="DestinationTravelStyle.id"
    )
    companions: Mapped[List["DestinationCompanion"]] = relationship(
        "DestinationCompanion",
        back_populates="destination",
        cascade="all, delete-orphan",
        order_by="DestinationCompanion.id"
    )
    transport_options: Mapped[List["DestinationTransport"]] = relationship(
        "DestinationTransport",
        back_populates="destination",
        cascade="all, delete-orphan",
        order_by="DestinationTransport.id"
    )
    paces: Mapped[List["DestinationPace"]] = relationship(
        "DestinationPace",
        back_populates="destination",
        cascade="all, delete-orphan",
        order_by="DestinationPace.id"
    )
    best_months: Mapped[List["DestinationBestMonth"]] = relationship(
        "DestinationBestMonth",
        back_populates="destination",
        cascade="all, delete-orphan",
        order_by="DestinationBestMonth.month"
    )

    __table_args__ = (
        UniqueConstraint("name", "state", name="uq_destination_name_state"),
    )


class DestinationTag(Base):
    __tablename__ = "destination_tags"

    id: Mapped[uuid.UUID] = mapped_column(
        GUID,
        primary_key=True,
        default=uuid.uuid4,
        index=True
    )
    destination_id: Mapped[uuid.UUID] = mapped_column(
        GUID,
        ForeignKey("destinations.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    tag_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)   # 'place' or 'experience'
    tag_value: Mapped[str] = mapped_column(String(100), nullable=False, index=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    destination: Mapped["Destination"] = relationship("Destination", back_populates="tags")

    __table_args__ = (
        UniqueConstraint("destination_id", "tag_type", "tag_value", name="uq_destination_tag"),
    )


class DestinationTravelStyle(Base):
    __tablename__ = "destination_travel_styles"

    id: Mapped[uuid.UUID] = mapped_column(
        GUID,
        primary_key=True,
        default=uuid.uuid4,
        index=True
    )
    destination_id: Mapped[uuid.UUID] = mapped_column(
        GUID,
        ForeignKey("destinations.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    travel_style: Mapped[str] = mapped_column(String(50), nullable=False, index=True)  # Budget, Balanced, Premium, Luxury

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    destination: Mapped["Destination"] = relationship("Destination", back_populates="travel_styles")

    __table_args__ = (
        UniqueConstraint("destination_id", "travel_style", name="uq_destination_travel_style"),
    )


class DestinationCompanion(Base):
    __tablename__ = "destination_companions"

    id: Mapped[uuid.UUID] = mapped_column(
        GUID,
        primary_key=True,
        default=uuid.uuid4,
        index=True
    )
    destination_id: Mapped[uuid.UUID] = mapped_column(
        GUID,
        ForeignKey("destinations.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    companion_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)  # Solo, Couple, Family, Friends

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    destination: Mapped["Destination"] = relationship("Destination", back_populates="companions")

    __table_args__ = (
        UniqueConstraint("destination_id", "companion_type", name="uq_destination_companion"),
    )


class DestinationTransport(Base):
    __tablename__ = "destination_transport"

    id: Mapped[uuid.UUID] = mapped_column(
        GUID,
        primary_key=True,
        default=uuid.uuid4,
        index=True
    )
    destination_id: Mapped[uuid.UUID] = mapped_column(
        GUID,
        ForeignKey("destinations.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    transport_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)  # Flight, Train, Bus, Car, Flexible

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    destination: Mapped["Destination"] = relationship("Destination", back_populates="transport_options")

    __table_args__ = (
        UniqueConstraint("destination_id", "transport_type", name="uq_destination_transport"),
    )


class DestinationPace(Base):
    __tablename__ = "destination_paces"

    id: Mapped[uuid.UUID] = mapped_column(
        GUID,
        primary_key=True,
        default=uuid.uuid4,
        index=True
    )
    destination_id: Mapped[uuid.UUID] = mapped_column(
        GUID,
        ForeignKey("destinations.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    pace: Mapped[str] = mapped_column(String(50), nullable=False, index=True)  # Relaxed, Balanced, Packed

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    destination: Mapped["Destination"] = relationship("Destination", back_populates="paces")

    __table_args__ = (
        UniqueConstraint("destination_id", "pace", name="uq_destination_pace"),
    )


class DestinationBestMonth(Base):
    __tablename__ = "destination_best_months"

    id: Mapped[uuid.UUID] = mapped_column(
        GUID,
        primary_key=True,
        default=uuid.uuid4,
        index=True
    )
    destination_id: Mapped[uuid.UUID] = mapped_column(
        GUID,
        ForeignKey("destinations.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    month: Mapped[int] = mapped_column(Integer, nullable=False, index=True)  # 1 through 12

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    destination: Mapped["Destination"] = relationship("Destination", back_populates="best_months")

    __table_args__ = (
        UniqueConstraint("destination_id", "month", name="uq_destination_best_month"),
    )
