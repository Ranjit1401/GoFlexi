import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import select

from app.db.database import get_db
from app.models.user import User
from app.models.traveler_profile import TravelerProfile
from app.models.destination import Destination
from app.schemas.recommendation import RecommendationResponse
from app.api.deps import get_current_traveler, get_optional_traveler
from app.services.recommendation_service import get_personalized_recommendations

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])
explore_router = APIRouter(prefix="/explore", tags=["Explore"])


def parse_csv_param(val: Optional[str]) -> Optional[List[str]]:
    """Splits a comma-separated query string into a list of trimmed strings."""
    if not val or not val.strip():
        return None
    items = [item.strip() for item in val.split(",") if item.strip()]
    return items if items else None


def fetch_destinations_with_metadata(db: Session) -> List[Destination]:
    """Loads all destinations with child metadata eagerly loaded."""
    stmt = (
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
    return list(db.execute(stmt).scalars().all())


def fetch_traveler_profile(user_id: uuid.UUID, db: Session) -> Optional[TravelerProfile]:
    """Loads traveler profile and interest tags for a given user ID."""
    stmt = (
        select(TravelerProfile)
        .where(TravelerProfile.user_id == user_id)
        .options(selectinload(TravelerProfile.interests))
    )
    return db.execute(stmt).scalar_one_or_none()


@router.get(
    "",
    response_model=RecommendationResponse,
    summary="Get personalized destination recommendations for authenticated traveler"
)
def get_recommendations(
    limit: int = Query(10, ge=1, le=50, description="Maximum number of recommendations to return"),
    search: Optional[str] = Query(None, description="Search keyword in name, city, state, description, tags"),
    places: Optional[str] = Query(None, description="Comma-separated places (e.g. Beaches,Mountains)"),
    experiences: Optional[str] = Query(None, description="Comma-separated experiences (e.g. Adventure,Food)"),
    travel_style: Optional[str] = Query(None, description="Travel style (Budget, Balanced, Premium, Luxury)"),
    companions: Optional[str] = Query(None, description="Companions (Solo, Couple, Family, Friends)"),
    transport: Optional[str] = Query(None, description="Transport options (Flight, Train, Bus, Car, Flexible)"),
    pace: Optional[str] = Query(None, description="Itinerary pace (Relaxed, Balanced, Packed)"),
    budget_range: Optional[str] = Query(None, description="Budget range tier"),
    state: Optional[str] = Query(None, description="Indian state"),
    travel_date: Optional[str] = Query(None, description="Travel date YYYY-MM-DD or month (1-12)"),
    sort_by: Optional[str] = Query("recommended", description="Sorting order: recommended, match_score, popularity, budget_asc, budget_desc"),
    traveler: User = Depends(get_current_traveler),
    db: Session = Depends(get_db)
):
    """
    Returns personalized destination recommendations scored against the authenticated traveler's
    saved preferences in Neon PostgreSQL, augmented with optional dynamic Explore filters.

    - Authenticated traveler required (401 for unauthenticated, 403 for agents).
    - Uses content-based filtering across Places, Experiences, Budget, Travel Style, Companion, Transport, Pace, Season.
    - Deterministic ranking and hallucination-free explanations.
    """
    profile = fetch_traveler_profile(traveler.id, db)
    destinations = fetch_destinations_with_metadata(db)

    return get_personalized_recommendations(
        profile=profile,
        destinations=destinations,
        limit=limit,
        explore_search=search,
        explore_places=parse_csv_param(places),
        explore_experiences=parse_csv_param(experiences),
        explore_travel_style=travel_style,
        explore_companions=parse_csv_param(companions),
        explore_transport=parse_csv_param(transport),
        explore_pace=pace,
        explore_budget_range=budget_range,
        explore_state=state,
        explore_travel_date=travel_date,
        sort_by=sort_by,
    )


@explore_router.get(
    "/recommendations",
    response_model=RecommendationResponse,
    summary="Explore destination recommendations with optional traveler personalization"
)
def get_explore_recommendations(
    limit: int = Query(20, ge=1, le=50, description="Maximum number of recommendations to return"),
    search: Optional[str] = Query(None, description="Search keyword in name, city, state, description, tags"),
    places: Optional[str] = Query(None, description="Comma-separated places (e.g. Beaches,Mountains)"),
    experiences: Optional[str] = Query(None, description="Comma-separated experiences (e.g. Adventure,Food)"),
    travel_style: Optional[str] = Query(None, description="Travel style (Budget, Balanced, Premium, Luxury)"),
    companions: Optional[str] = Query(None, description="Companions (Solo, Couple, Family, Friends)"),
    transport: Optional[str] = Query(None, description="Transport options (Flight, Train, Bus, Car, Flexible)"),
    pace: Optional[str] = Query(None, description="Itinerary pace (Relaxed, Balanced, Packed)"),
    budget_range: Optional[str] = Query(None, description="Budget range tier"),
    state: Optional[str] = Query(None, description="Indian state"),
    travel_date: Optional[str] = Query(None, description="Travel date YYYY-MM-DD or month (1-12)"),
    sort_by: Optional[str] = Query("recommended", description="Sorting order: recommended, match_score, popularity, budget_asc, budget_desc"),
    traveler: Optional[User] = Depends(get_optional_traveler),
    db: Session = Depends(get_db)
):
    """
    Public or authenticated Explore endpoint:
    - If user is authenticated as a traveler, incorporates saved preferences with Explore filters.
    - If unauthenticated, uses Explore filters and popularity ranking without requiring login.
    """
    profile = fetch_traveler_profile(traveler.id, db) if traveler else None
    destinations = fetch_destinations_with_metadata(db)

    return get_personalized_recommendations(
        profile=profile,
        destinations=destinations,
        limit=limit,
        explore_search=search,
        explore_places=parse_csv_param(places),
        explore_experiences=parse_csv_param(experiences),
        explore_travel_style=travel_style,
        explore_companions=parse_csv_param(companions),
        explore_transport=parse_csv_param(transport),
        explore_pace=pace,
        explore_budget_range=budget_range,
        explore_state=state,
        explore_travel_date=travel_date,
        sort_by=sort_by,
    )
