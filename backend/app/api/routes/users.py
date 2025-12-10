import uuid
from typing import Any
import os
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import col, delete, func, select
from workos import WorkOSClient

from app import crud
from app.api.deps import (
    CurrentUser,
    SessionDep,
)
from app.core.config import settings
from app.models import (
    Message,
    Scene,
    User,
    UserCreate,
    UserPublic,
    UserRegister
)

router = APIRouter(prefix="/users", tags=["users"])

workos = WorkOSClient(
    api_key=settings.WORKOS_API_KEY, client_id=settings.WORKOS_CLIENT_ID
)

@router.get("/me", response_model=UserPublic)
def read_user_me(current_user: CurrentUser) -> Any:
    """
    Get current user.
    """
    return current_user


@router.post("/signup", response_model=UserPublic)
def register_user(session: SessionDep, user_in: UserRegister) -> Any:
    """
    Create new user without the need to be logged in.
    """
    user = crud.get_user_by_email(session=session, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system",
        )
    try:
        response = workos.user_management.create_user(
            email=user_in.email, password=user_in.password, first_name=user_in.first_name, last_name=user_in.last_name
        )
        print("WorkOS create user response:", response)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    print("response.id:", response.id)
    
    user_data = user_in.model_dump()
    user_data["workos_id"] = response.id

    # Send verification email
    verification_response = workos.user_management.send_verification_email(user_id=response.id)
    print("WorkOS send verification email response:", verification_response)

    # Create user in the local database
    user_create = UserCreate.model_validate(user_data)
    user = crud.create_user(session=session, user_create=user_create)
    return user


@router.post("/verify-email", response_model=Message)
def verify_email(email: str, code: str) -> Any:
    """
    Verify email with the given code.
    """
    try:
        users = workos.user_management.list_users(email=email)
        user_id = users.data[0].id
        print("WorkOS get user by email response:", user_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    try:
        response = workos.user_management.verify_email(user_id=user_id, code=code)
        print("WorkOS verify email response:", response)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    return Message(message="Email verified successfully")


@router.get("/{user_id}", response_model=UserPublic)
def read_user_by_id(
    user_id: uuid.UUID, session: SessionDep, current_user: CurrentUser
) -> Any:
    """
    Get a specific user by id.
    """
    user = session.get(User, user_id)
    if user == current_user:
        return user
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=403,
            detail="The user doesn't have enough privileges",
        )
    return user