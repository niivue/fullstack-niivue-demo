import uuid
from enum import Enum
from sqlalchemy import JSON, Column
from datetime import datetime
from typing import Any, Dict
from pydantic import EmailStr
from sqlmodel import Field, Relationship, SQLModel


# Shared properties
class UserBase(SQLModel):
    email: EmailStr = Field(unique=True, index=True, max_length=255)
    is_active: bool = True
    is_superuser: bool = False
    first_name: str | None = Field(default=None, max_length=255)
    last_name: str | None = Field(default=None, max_length=255)


# Properties to receive via API on creation
class UserCreate(UserBase):
    email: EmailStr = Field(max_length=255)
    workos_id: str = Field(max_length=255)


class UserRegister(SQLModel):
    email: EmailStr = Field(max_length=255)
    password: str = Field(min_length=8, max_length=40)
    first_name: str | None = Field(default=None, max_length=255)
    last_name: str | None = Field(default=None, max_length=255)


# Properties to receive via API on update, all are optional
class UserUpdate(UserBase):
    email: EmailStr | None = Field(default=None, max_length=255)  # type: ignore
    first_name: str | None = Field(default=None, min_length=8, max_length=255)
    last_name: str | None = Field(default=None, min_length=8, max_length=255)


class UserUpdateMe(SQLModel):
    first_name: str | None = Field(default=None, max_length=255)
    last_name: str | None = Field(default=None, max_length=255)
    email: EmailStr | None = Field(default=None, max_length=255)


class UpdatePassword(SQLModel):
    current_password: str = Field(min_length=8, max_length=40)
    new_password: str = Field(min_length=8, max_length=40)


# Database model, database table inferred from class name
class User(UserBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    workos_id: str = Field(index=True, unique=True, max_length=255)
    scenes: list["Scene"] = Relationship(back_populates="owner", cascade_delete=True)

# Properties to return via API, id is always required
class UserPublic(UserBase):
    id: uuid.UUID


class UsersPublic(SQLModel):
    data: list[UserPublic]
    count: int


class ProcessingStatus(str, Enum):
    """Enum for scene processing status values."""
    PENDING = "pending"
    PROCESSING = "processing" 
    COMPLETED = "completed"
    FAILED = "failed"


# Shared properties
class SceneBase(SQLModel):
    timestamp: datetime = Field(default_factory=datetime.now)
    nv_document: Dict[str, Any] = Field(sa_column=Column(JSON))
    tool_name: str | None = Field(default=None, max_length=255)
    status: ProcessingStatus = Field(
        default=ProcessingStatus.PENDING
    )  # Uses enum for type safety
    result: Dict[str, Any] | None = Field(default=None, sa_column=Column(JSON))
    error: str | None = Field(default=None, max_length=255)


# Properties to receive on scene creation
class SceneCreate(SceneBase):
    pass


# Properties to receive on scene update
class SceneUpdate(SceneBase):
    nv_document: Dict[str, Any] | None = Field(
        default=None, sa_column=Column(JSON)
    )  # Optional update to nv_document
    tool_name: str | None = Field(
        default=None, min_length=1, max_length=255
    )  # Optional update to tool name
    status: ProcessingStatus | None = Field(
        default=None
    )  # Optional update to status using enum


# Database model, database table inferred from class name
class Scene(SceneBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    owner_id: uuid.UUID = Field(
        foreign_key="user.id", nullable=False, ondelete="CASCADE"
    )
    owner: User | None = Relationship(back_populates="scenes")


# Properties to return via API, id is always required
class ScenePublic(SceneBase):
    id: uuid.UUID
    owner_id: uuid.UUID

class ScenesPublic(SQLModel):
    data: list[ScenePublic]
    count: int

# Generic message
class Message(SQLModel):
    message: str

# JSON payload containing access token
class Token(SQLModel):
    access_token: str
    token_type: str = "bearer"