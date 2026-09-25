from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import (
    UserRegister,
    UserLogin,
    UserResponse,
    TokenResponse,
    LogoutResponse,
    DemoAuthResponse,
)
from app.services.auth import register_user, authenticate_user
from app.core.security import create_access_token
from app.api.deps import get_current_active_user, require_role

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new researcher account",
    description="Registers a new user account with default 'researcher' role and hashed credentials.",
)
async def register(
    user_in: UserRegister,
    db: Session = Depends(get_db),
) -> UserResponse:
    """Register a new user in the database."""
    user = register_user(db, user_in)
    return UserResponse.model_validate(user)


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Authenticate and obtain JWT access token",
    description="Validates email and password credentials, returning a signed JWT access token.",
)
async def login(
    user_in: UserLogin,
    db: Session = Depends(get_db),
) -> TokenResponse:
    """Authenticate credentials and generate JWT token."""
    user = authenticate_user(db, user_in.email, user_in.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user account. Access forbidden.",
        )

    # JWT payload containing sub, email, and role
    token_payload = {
        "sub": str(user.id),
        "email": user.email,
        "role": user.role,
    }
    access_token = create_access_token(token_payload)

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current authenticated user profile",
    description="Returns the profile details of the currently authenticated active user.",
)
async def get_me(
    current_user: User = Depends(get_current_active_user),
) -> UserResponse:
    """Return authenticated user profile."""
    return UserResponse.model_validate(current_user)


@router.post(
    "/logout",
    response_model=LogoutResponse,
    summary="Stateless logout confirmation",
    description="Acknowledges client-side token discard for stateless JWT architecture.",
)
async def logout() -> LogoutResponse:
    """Stateless logout endpoint."""
    return LogoutResponse(message="Successfully logged out")


@router.get(
    "/demo",
    response_model=DemoAuthResponse,
    summary="Get verified demo credentials",
    description="Provides pre-seeded research account credentials for seamless platform exploration.",
)
async def get_demo_credentials() -> DemoAuthResponse:
    """Return demo authentication credentials for testing and exploration."""
    return DemoAuthResponse(
        login={
            "email": "dr.sharma@aiims.edu",
            "password": "microscopy-lab-key-2026",
        },
        signup={
            "name": "Dr. Evelyn Sharma",
            "email": "dr.evelyn.researcher@aiims.edu",
            "password": "microscopy-lab-key-2026",
            "confirmPassword": "microscopy-lab-key-2026",
        },
    )


@router.get(
    "/admin-check",
    response_model=UserResponse,
    summary="Admin role authorization test endpoint",
    description="Requires an active authenticated user with the 'admin' role.",
)
async def admin_check(
    admin_user: User = Depends(require_role(["admin"])),
) -> UserResponse:
    """Restricted endpoint for role verification."""
    return UserResponse.model_validate(admin_user)

