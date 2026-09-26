import uuid
from typing import Tuple, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.db.database import get_db
from app.models.user import User
from app.models.agent import Agent
from app.core.security import decode_access_token

security_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    auth: HTTPAuthorizationCredentials = Depends(security_scheme),
    db: Session = Depends(get_db)
) -> User:
    """
    Extracts Bearer token from header, validates signature and expiration,
    and returns current User from database.
    Raises 401 Unauthorized if missing, malformed, expired, or user not found.
    """
    if not auth or not auth.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token is missing",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = auth.credentials
    try:
        payload = decode_access_token(token)
        user_id_str: str = payload.get("sub")
        if not user_id_str:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token payload is invalid",
                headers={"WWW-Authenticate": "Bearer"},
            )
        user_id = uuid.UUID(user_id_str)
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except (jwt.PyJWTError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token is invalid",
            headers={"WWW-Authenticate": "Bearer"},
        )

    stmt = select(User).where(User.id == user_id)
    user = db.execute(stmt).scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User associated with token not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


def get_current_traveler(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Ensures authenticated user has 'traveler' role.
    Raises 403 Forbidden if user is not a traveler.
    """
    if current_user.role != "traveler":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Traveler privileges required",
        )
    return current_user


def get_optional_traveler(
    auth: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """
    Extracts Bearer token if present. If valid traveler token, returns User.
    If missing, expired, invalid, or non-traveler, returns None without raising an exception.
    """
    if not auth or not auth.credentials:
        return None
    try:
        payload = decode_access_token(auth.credentials)
        user_id_str: str = payload.get("sub")
        if not user_id_str:
            return None
        user_id = uuid.UUID(user_id_str)
        stmt = select(User).where(User.id == user_id)
        user = db.execute(stmt).scalar_one_or_none()
        if user and user.role == "traveler":
            return user
        return None
    except Exception:
        return None



def get_current_agent(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Tuple[User, Agent]:
    """
    Ensures authenticated user has 'agent' role and fetches corresponding Agent profile.
    Raises 403 Forbidden if user is not an agent.
    """
    if current_user.role != "agent":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Agent privileges required",
        )

    stmt = select(Agent).where(Agent.user_id == current_user.id)
    agent = db.execute(stmt).scalar_one_or_none()

    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent profile not found for this account",
        )

    return current_user, agent
