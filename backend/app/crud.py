import uuid
from typing import Any

from sqlmodel import Session, select

from app.models import Scene, SceneCreate, User, UserCreate


def create_user(*, session: Session, user_create: UserCreate) -> User:
    db_obj = User.model_validate(
        user_create
    )
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj

def get_user_by_email(*, session: Session, email: str) -> User | None:
    statement = select(User).where(User.email == email)
    session_user = session.exec(statement).first()
    return session_user

def create_scene(*, session: Session, scene_in: SceneCreate, owner_id: uuid.UUID) -> Scene:
    print(f"Creating scene with data: {scene_in}")
    db_scene = Scene.model_validate(scene_in, update={"owner_id": owner_id})
    session.add(db_scene)
    session.commit()
    session.refresh(db_scene)
    return db_scene
