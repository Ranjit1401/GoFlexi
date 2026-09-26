from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import select

from app.db.database import get_db
from app.models.user import User
from app.models.traveler_profile import TravelerProfile
from app.models.destination import Destination
from app.schemas.recommendation import RecommendationResponse
from app.api.deps import get_current_traveler
from app.services.recommendation_service import get_personalized_recommendations

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])


@router.get(
    "",
    response_model=RecommendationResponse,
    summary="Get personalized destination recommendations for authenticated traveler"
)
def get_recommendations(
    limit: int = Query(10, ge=1, le=50, description="Maximum number of recommendations to return"),
    traveler: User = Depends(get_current_traveler),
    db: Session = Depends(get_db)
):
    """
    Returns personalized destination recommendations scored against the authenticated traveler's
    saved preferences in Neon PostgreSQL.

    - Authenticated traveler required (401 for unauthenticated, 403 for agents).
    - Uses content-based filtering across Places, Experiences, Budget, Travel Style, Companion, Transport, Pace.
    - Deterministic ranking and hallucination-free explanations.
    """
    # 1. Load traveler profile and interests
    stmt_profile = (
        select(TravelerProfile)
        .where(TravelerProfile.user_id == traveler.id)
        .options(selectinload(TravelerProfile.interests))
    )
    profile = db.execute(stmt_profile).scalar_one_or_none()

    # 2. Load candidate destinations with all child metadata eager-loaded
    stmt_destinations = (
        select(Destination)
        .options(
            selectinload(Destination.tags),
            selectinload(Destination.travel_styles),
            selectinload(Destination.companions),
            selectinload(Destination.transport_options),
            selectinload(Destination.paces),
            selectinload(Destination.best_months),
        )
    )
    destinations = db.execute(stmt_destinations).scalars().all()

    # 3. Compute recommendations
    return get_personalized_recommendations(
        profile=profile,
        destinations=destinations,
        limit=limit
    )
