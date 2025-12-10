import os
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.security import OAuth2PasswordRequestForm
from workos import WorkOSClient

from app.api.deps import CurrentUser
from app.core.config import settings
from app.models import Token

router = APIRouter(tags=["login"])
workos = WorkOSClient(
    api_key=settings.WORKOS_API_KEY, client_id=settings.WORKOS_CLIENT_ID
)

@router.post("/login/access-token")
async def login_access_token(form_data: Annotated[OAuth2PasswordRequestForm, Depends()]) -> Token:
    print("settings secret:", settings.SECRET_KEY)
    try:
        password_response = workos.user_management.authenticate_with_password(
            email=form_data.username, password=form_data.password
        )
        auth_response = workos.user_management.authenticate_with_refresh_token(
            refresh_token=password_response.refresh_token,
            session={"seal_session": True, "cookie_password": settings.SECRET_KEY},
        )

        print("WorkOS auth response:", auth_response)

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    return Token(
        access_token=auth_response.sealed_session
    )


@router.get("/")
async def index():
    "Non-authenticated function that returns {'Hello': 'World'}"
    return {"Hello": "World"}


@router.get("/debug")
async def debug(request: Request, user: CurrentUser):
    """
    Authenticated function that returns a few pieces of debug
     * Environ of the service process
     * Request headers
     * User model
    """
    return {
        "env": dict(os.environ),
        "headers": dict(request.headers),
        "user": user,
    }
