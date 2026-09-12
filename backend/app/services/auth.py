from typing import Optional
from sqlalchemy import select
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.user import User
from app.schemas.auth import UserRegister
from app.core.security import hash_password, verify_password


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    """Query a user by their unique email address."""
    statement = select(User).where(User.email == email.lower().strip())
    return db.scalars(statement).first()


def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
    """Query a user by their primary key id."""
    statement = select(User).where(User.id == user_id)
    return db.scalars(statement).first()


def register_user(db: Session, user_in: UserRegister) -> User:
    """Validate uniqueness, hash password, and create a new researcher user."""
    normalized_email = user_in.email.lower().strip()
    existing_user = get_user_by_email(db, normalized_email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email address is already registered.",
        )

    hashed_pw = hash_password(user_in.password)
    new_user = User(
        name=user_in.name.strip(),
        email=normalized_email,
        hashed_password=hashed_pw,
        role="researcher",
        is_active=True,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    """Verify credentials and return user, or None if invalid."""
    user = get_user_by_email(db, email)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user
