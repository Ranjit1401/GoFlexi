import math
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import select, func, or_

from app.db.database import get_db
from app.models.destination import (
    Destination,
    DestinationTag,
    DestinationTravelStyle,
    DestinationCompanion,
    DestinationTransport,
    DestinationPace,
    DestinationBestMonth,
)
from app.schemas.destination import (
    DestinationTagSchema,
    DestinationListItemResponse,
    DestinationDetailResponse,
    DestinationListResponse,
)

router = APIRouter(prefix="/destinations", tags=["Destinations"])


def serialize_destination_item(dest: Destination) -> DestinationListItemResponse:
    places = [t.tag_value for t in dest.tags if t.tag_type == "place"]
    experiences = [t.tag_value for t in dest.tags if t.tag_type == "experience"]
    styles = [s.travel_style for s in dest.travel_styles]
    companions = [c.companion_type for c in dest.companions]
    transports = [t.transport_type for t in dest.transport_options]
    paces = [p.pace for p in dest.paces]
    months = sorted([m.month for m in dest.best_months])

    return DestinationListItemResponse(
        id=dest.id,
        name=dest.name,
        country=dest.country,
        state=dest.state,
        city=dest.city,
        short_description=dest.short_description,
        budget_min=dest.budget_min,
        budget_max=dest.budget_max,
        popularity_score=dest.popularity_score,
        places=places,
        experiences=experiences,
        travel_styles=styles,
        companions=companions,
        transport_options=transports,
        paces=paces,
        best_months=months,
    )


def serialize_destination_detail(dest: Destination) -> DestinationDetailResponse:
    tags = [DestinationTagSchema.model_validate(t) for t in dest.tags]
    places = [t.tag_value for t in dest.tags if t.tag_type == "place"]
    experiences = [t.tag_value for t in dest.tags if t.tag_type == "experience"]
    styles = [s.travel_style for s in dest.travel_styles]
    companions = [c.companion_type for c in dest.companions]
    transports = [t.transport_type for t in dest.transport_options]
    paces = [p.pace for p in dest.paces]
    months = sorted([m.month for m in dest.best_months])

    return DestinationDetailResponse(
        id=dest.id,
        name=dest.name,
        country=dest.country,
        state=dest.state,
        city=dest.city,
        description=dest.description,
        short_description=dest.short_description,
        latitude=dest.latitude,
        longitude=dest.longitude,
        budget_min=dest.budget_min,
        budget_max=dest.budget_max,
        popularity_score=dest.popularity_score,
        created_at=dest.created_at,
        updated_at=dest.updated_at,
        tags=tags,
        places=places,
        experiences=experiences,
        travel_styles=styles,
        companions=companions,
        transport_options=transports,
        paces=paces,
        best_months=months,
    )


@router.get(
    "",
    response_model=DestinationListResponse,
    summary="List destinations with search, filtering, and pagination"
)
def list_destinations(
    page: int = Query(1, ge=1, description="Page number starting at 1"),
    size: int = Query(20, ge=1, le=100, description="Items per page"),
    search: Optional[str] = Query(None, description="Search keyword in name, city, state, description"),
    country: Optional[str] = Query(None, description="Filter by country"),
    state: Optional[str] = Query(None, description="Filter by state"),
    db: Session = Depends(get_db)
):
    stmt = select(Destination)

    # Search filter
    if search and search.strip():
        term = f"%{search.strip()}%"
        stmt = stmt.where(
            or_(
                Destination.name.ilike(term),
                Destination.city.ilike(term),
                Destination.state.ilike(term),
                Destination.description.ilike(term),
                Destination.short_description.ilike(term)
            )
        )

    # Country filter
    if country and country.strip():
        stmt = stmt.where(Destination.country.ilike(country.strip()))

    # State filter
    if state and state.strip():
        stmt = stmt.where(Destination.state.ilike(state.strip()))

    # Total count
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = db.scalar(count_stmt) or 0
    pages = math.ceil(total / size) if total > 0 else 0

    # Pagination & eager loading
    stmt = (
        stmt.options(
            selectinload(Destination.tags),
            selectinload(Destination.travel_styles),
            selectinload(Destination.companions),
            selectinload(Destination.transport_options),
            selectinload(Destination.paces),
            selectinload(Destination.best_months),
        )
        .order_by(Destination.popularity_score.desc(), Destination.name.asc())
        .offset((page - 1) * size)
        .limit(size)
    )

    destinations = db.execute(stmt).scalars().all()

    items = [serialize_destination_item(d) for d in destinations]
    return DestinationListResponse(
        items=items,
        total=total,
        page=page,
        size=size,
        pages=pages
    )


@router.get(
    "/{destination_id}",
    response_model=DestinationDetailResponse,
    summary="Get detailed destination information with all metadata"
)
def get_destination(
    destination_id: str,
    db: Session = Depends(get_db)
):
    try:
        dest_uuid = uuid.UUID(destination_id)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Destination not found"
        )

    stmt = (
        select(Destination)
        .where(Destination.id == dest_uuid)
        .options(
            selectinload(Destination.tags),
            selectinload(Destination.travel_styles),
            selectinload(Destination.companions),
            selectinload(Destination.transport_options),
            selectinload(Destination.paces),
            selectinload(Destination.best_months),
        )
    )
    destination = db.execute(stmt).scalar_one_or_none()

    if not destination:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Destination not found"
        )

    return serialize_destination_detail(destination)
