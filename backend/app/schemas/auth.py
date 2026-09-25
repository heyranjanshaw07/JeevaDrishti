from datetime import datetime
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserRegister(BaseModel):
    """Schema for user registration."""

    name: str = Field(..., min_length=1, max_length=100, description="Full name of researcher")
    email: EmailStr = Field(..., description="Unique email address")
    password: str = Field(..., min_length=8, description="Plaintext password, minimum 8 characters")


class UserLogin(BaseModel):
    """Schema for user authentication."""

    email: EmailStr = Field(..., description="Registered email address")
    password: str = Field(..., min_length=1, description="Account password")


class UserResponse(BaseModel):
    """Public user response schema excluding sensitive fields."""

    id: int
    name: str
    email: EmailStr
    role: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    """JWT bearer token and authenticated user details."""

    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class LogoutResponse(BaseModel):
    """Clean logout confirmation."""

    message: str = "Successfully logged out"


class DemoLoginCredentials(BaseModel):
    email: EmailStr
    password: str


class DemoSignupCredentials(BaseModel):
    name: str
    email: EmailStr
    password: str
    confirmPassword: str


class DemoAuthResponse(BaseModel):
    """Demo credentials for research exploration."""

    login: DemoLoginCredentials
    signup: DemoSignupCredentials
