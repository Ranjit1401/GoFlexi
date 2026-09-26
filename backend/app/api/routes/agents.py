from fastapi import APIRouter, Depends
from app.models.user import User
from app.models.agent import Agent
from app.schemas.agent import AgentProfileResponse, AgencyInfo
from app.schemas.user import UserSafeResponse
from app.api.deps import get_current_agent

router = APIRouter(prefix="/agents", tags=["Agents"])


@router.get(
    "/me",
    response_model=AgentProfileResponse,
    summary="Get authenticated tour agent's profile and agency info"
)
def get_agent_me(
    agent_tuple=Depends(get_current_agent)
):
    """
    Returns profile information for an authenticated agent.
    If called by a traveler, automatically raises HTTP 403 Forbidden.
    """
    current_user: User = agent_tuple[0]
    agent: Agent = agent_tuple[1]

    return AgentProfileResponse(
        user=UserSafeResponse.model_validate(current_user),
        agency=AgencyInfo.model_validate(agent)
    )
