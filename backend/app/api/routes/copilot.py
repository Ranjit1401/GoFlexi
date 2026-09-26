from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.user import User
from app.api.deps import get_current_traveler
from app.schemas.copilot import TripPlanRequest, TripPlanResponse
from app.services.copilot_service import generate_trip_plan

router = APIRouter(prefix="/copilot", tags=["AI Trip Co-Pilot"])


@router.post(
    "/plan",
    response_model=TripPlanResponse,
    summary="Generate structured multi-agent trip plan",
    status_code=status.HTTP_200_OK
)
def create_trip_plan(
    request: TripPlanRequest,
    traveler: User = Depends(get_current_traveler),
    db: Session = Depends(get_db)
):
    """
    Generates a personalized, structured multi-agent trip plan using the
    Voyara Destination Knowledge Base and saved Neon traveler preferences.
    """
    return generate_trip_plan(request=request, user=traveler, db=db)
