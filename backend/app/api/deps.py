from collections.abc import Generator
from typing import Annotated
from workos import WorkOSClient
import os

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import ValidationError
from sqlmodel import Session, select

from app.core.config import settings
from app.core.db import engine
from app.models import User

reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/login/access-token"
)
workos = WorkOSClient(
    api_key=settings.WORKOS_API_KEY, client_id=settings.WORKOS_CLIENT_ID
)

def get_db() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session


SessionDep = Annotated[Session, Depends(get_db)]
TokenDep = Annotated[str, Depends(reusable_oauth2)]

def get_current_user(session: SessionDep, token: TokenDep) -> User:
    """Authenticate with WorkOS, map to SQLModel User."""
    print("token", token, settings.SECRET_KEY)
    # sealed_session = request.cookies.get("access_token")
    # print("Sealed session from cookie:", sealed_session)
    # if not sealed_session:
    #     raise HTTPException(status_code=307, headers={"Location": "/login"})

    try:
        workos_session = workos.user_management.load_sealed_session(
            sealed_session=token,
            cookie_password=settings.SECRET_KEY,
        )
        auth_response = workos_session.authenticate()
        print("Auth response:", auth_response)

    except Exception as e:
        print("Auth error:", e)

    if not auth_response.authenticated:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )
    
    user_id = auth_response.user.id
    print("Authenticated user email:", user_id)
    # 🔑 Fetch user from DB or create
    # db_user = session.exec(select(User).where(User.email == email)).first()
    user = session.exec(select(User).where(User.workos_id == user_id)).first()
    if not user_id or not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return user

CurrentUser = Annotated[User, Depends(get_current_user)]
