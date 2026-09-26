from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.db.database import get_db
from app.models.user import User
from app.models.traveler_profile import TravelerProfile, TravelerInterest
from app.schemas.user import UserSafeResponse
from app.schemas.preferences import TravelerPreferencesUpdate, TravelerPreferencesResponse
from app.api.deps import get_current_user, get_current_traveler

router = APIRouter(prefix="/users", tags=["Users"])


@router.get(
    "/me",
    response_model=UserSafeResponse,
    summary="Get authenticated user's profile"
)
def get_user_me(
    current_user: User = Depends(get_current_user)
):
    """
    Returns profile information for the authenticated user.
    Never exposes password_hash.
    """
    return UserSafeResponse.model_validate(current_user)


@router.get(
    "/me/preferences",
    response_model=TravelerPreferencesResponse,
    summary="Get authenticated traveler preferences and onboarding status"
)
def get_traveler_preferences(
    traveler: User = Depends(get_current_traveler),
    db: Session = Depends(get_db)
):
    """
    Returns the traveler's saved preferences and onboarding status.
    If no preferences have been saved yet, returns a default response with onboarding_completed=False.
    """
    stmt = select(TravelerProfile).where(TravelerProfile.user_id == traveler.id)
    profile = db.execute(stmt).scalar_one_or_none()

    if not profile:
        return TravelerPreferencesResponse(
            id=None,
            user_id=traveler.id,
            places=[],
            experiences=[],
            travel_style="",
            companions="",
            transport="",
            itinerary_pace="",
            budget_range="",
            onboarding_completed=False,
            created_at=None,
            updated_at=None
        )

    places = [
        item.interest_value for item in profile.interests if item.interest_type == "place"
    ]
    experiences = [
        item.interest_value for item in profile.interests if item.interest_type == "experience"
    ]

    return TravelerPreferencesResponse(
        id=profile.id,
        user_id=profile.user_id,
        places=places,
        experiences=experiences,
        travel_style=profile.travel_style,
        companions=profile.companions,
        transport=profile.transport,
        itinerary_pace=profile.itinerary_pace,
        budget_range=profile.budget_range,
        onboarding_completed=profile.onboarding_completed,
        created_at=profile.created_at,
        updated_at=profile.updated_at
    )


@router.put(
    "/me/preferences",
    response_model=TravelerPreferencesResponse,
    summary="Create or update authenticated traveler preferences and onboarding status"
)
def update_traveler_preferences(
    data: TravelerPreferencesUpdate,
    traveler: User = Depends(get_current_traveler),
    db: Session = Depends(get_db)
):
    """
    Idempotently creates or updates the traveler's profile and preferences.
    Multi-select places and experiences are stored normalized in traveler_interests.
    Single-select options and onboarding status are persisted in traveler_profiles.
    """
    stmt = select(TravelerProfile).where(TravelerProfile.user_id == traveler.id)
    profile = db.execute(stmt).scalar_one_or_none()

    if not profile:
        profile = TravelerProfile(
            user_id=traveler.id,
            travel_style=data.travel_style,
            companions=data.companions,
            transport=data.transport,
            itinerary_pace=data.itinerary_pace,
            budget_range=data.budget_range,
            onboarding_completed=data.onboarding_completed
        )
        db.add(profile)
        db.flush()
    else:
        profile.travel_style = data.travel_style
        profile.companions = data.companions
        profile.transport = data.transport
        profile.itinerary_pace = data.itinerary_pace
        profile.budget_range = data.budget_range
        profile.onboarding_completed = data.onboarding_completed
        db.flush()

    # Clear existing interests for this profile and re-insert normalized
    db.query(TravelerInterest).filter(TravelerInterest.traveler_profile_id == profile.id).delete()
    db.flush()

    seen_interests = set()
    for place in data.places:
        key = ("place", place)
        if key not in seen_interests:
            seen_interests.add(key)
            db.add(TravelerInterest(
                traveler_profile_id=profile.id,
                interest_type="place",
                interest_value=place
            ))

    for exp in data.experiences:
        key = ("experience", exp)
        if key not in seen_interests:
            seen_interests.add(key)
            db.add(TravelerInterest(
                traveler_profile_id=profile.id,
                interest_type="experience",
                interest_value=exp
            ))

    db.commit()
    db.refresh(profile)

    places = [
        item.interest_value for item in profile.interests if item.interest_type == "place"
    ]
    experiences = [
        item.interest_value for item in profile.interests if item.interest_type == "experience"
    ]

    return TravelerPreferencesResponse(
        id=profile.id,
        user_id=profile.user_id,
        places=places,
        experiences=experiences,
        travel_style=profile.travel_style,
        companions=profile.companions,
        transport=profile.transport,
        itinerary_pace=profile.itinerary_pace,
        budget_range=profile.budget_range,
        onboarding_completed=profile.onboarding_completed,
        created_at=profile.created_at,
        updated_at=profile.updated_at
    )
