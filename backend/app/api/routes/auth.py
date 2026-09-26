from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.db.database import get_db
from app.models.user import User
from app.models.agent import Agent
from app.core.security import hash_password, verify_password, create_access_token
from app.schemas.auth import RegisterRequest, RegisterResponse, LoginRequest, TokenResponse
from app.schemas.user import UserSafeResponse
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=RegisterResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new traveler or tour agent"
)
def register(
    data: RegisterRequest,
    db: Session = Depends(get_db)
):
    """
    Registers a new user account.
    - Hashes password using Argon2.
    - Enforces unique email.
    - If role is 'agent', creates an associated Agent profile.
    - Returns safe user data (never exposes password_hash).
    """
    normalized_email = data.email.lower().strip()

    # Check for duplicate email
    existing_user = db.execute(
        select(User).where(User.email == normalized_email)
    ).scalar_one_or_none()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email address already exists"
        )

    # Hash password with Argon2
    hashed_password = hash_password(data.password)

    # Create User model
    new_user = User(
        name=data.name.strip(),
        email=normalized_email,
        password_hash=hashed_password,
        role=data.role
    )
    db.add(new_user)
    db.flush()  # populate new_user.id for foreign key

    # If role is agent, create linked Agent record
    if data.role == "agent":
        agency_name = data.agency_name.strip() if data.agency_name else ""
        if not agency_name:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="agency_name is required for agent accounts"
            )
        new_agent = Agent(
            user_id=new_user.id,
            agency_name=agency_name
        )
        db.add(new_agent)

    db.commit()
    db.refresh(new_user)

    return RegisterResponse(
        message="Registration successful",
        user=UserSafeResponse.model_validate(new_user)
    )


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Log in with email and password to receive JWT access token"
)
def login(
    data: LoginRequest,
    db: Session = Depends(get_db)
):
    """
    Verifies credentials and returns a signed JWT access token.
    JWT payload includes:
      sub = user ID
      role = user role ('traveler' | 'agent')
      exp = expiration timestamp
    """
    normalized_email = data.email.lower().strip()

    user = db.execute(
        select(User).where(User.email == normalized_email)
    ).scalar_one_or_none()

    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if data.role and user.role != data.role:
        role_label = "Tour Agent" if user.role == "agent" else "Traveler"
        portal_label = "Agent Portal" if user.role == "agent" else "Traveler Portal"
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Account is registered as a {role_label}. Please log in through the {portal_label}."
        )

    # Generate JWT access token
    access_token = create_access_token(
        subject=str(user.id),
        role=user.role
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserSafeResponse.model_validate(user)
    )


@router.get(
    "/me",
    response_model=UserSafeResponse,
    summary="Get current authenticated user profile"
)
def get_current_user_profile(
    current_user: User = Depends(get_current_user)
):
    """
    Returns the authenticated user's safe information.
    Requires Authorization: Bearer <token>.
    """
    return UserSafeResponse.model_validate(current_user)
