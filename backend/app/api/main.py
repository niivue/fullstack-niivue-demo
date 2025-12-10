from fastapi import APIRouter
from app.api.routes import scenes, upload, utils, login, users
from app.core.config import settings

api_router = APIRouter()
api_router.include_router(utils.router)
api_router.include_router(scenes.router)
api_router.include_router(upload.router)
api_router.include_router(login.router)
api_router.include_router(users.router)