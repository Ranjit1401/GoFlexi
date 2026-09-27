from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.user import User
from app.api.deps import get_current_traveler
from app.schemas.copilot import (
    TripPlanRequest,
    TripPlanResponse,
    CopilotChatRequest,
    CopilotChatResponse,
)
from app.services.copilot_service import generate_trip_plan, copilot_chat

router = APIRouter(prefix="/copilot", tags=["AI Trip Co-Pilot"])


@router.post(
    "/chat",
    response_model=CopilotChatResponse,
    summary="Interactive AI Trip Co-Pilot conversation and itinerary planning",
    status_code=status.HTTP_200_OK
)
async def post_copilot_chat(
    request: CopilotChatRequest,
    traveler: User = Depends(get_current_traveler),
    db: Session = Depends(get_db)
):
    """
    Real AI Trip Co-Pilot conversation endpoint powered by Groq and GoFlexi Knowledge Base:
    1. Loads traveler preferences from Neon DB.
    2. Uses Groq tool-calling to discover destinations and POIs without fabrication.
    3. Produces conversational rationale and structured trip state changes.
    """
    return await copilot_chat(request=request, user=traveler, db=db)


@router.post(
    "/plan",
    response_model=TripPlanResponse,
    summary="Generate structured multi-agent trip plan (legacy wrapper)",
    status_code=status.HTTP_200_OK
)
def create_trip_plan(
    request: TripPlanRequest,
    traveler: User = Depends(get_current_traveler),
    db: Session = Depends(get_db)
):
    """
    Generates a personalized, structured multi-agent trip plan using the
    GoFlexi Destination Knowledge Base and saved Neon traveler preferences.
    """
    return generate_trip_plan(request=request, user=traveler, db=db)
