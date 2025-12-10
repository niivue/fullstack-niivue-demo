from fastapi import APIRouter
# from pydantic.networks import EmailStr

router = APIRouter(prefix="/utils", tags=["utils"])

@router.get("/health-check/")
async def health_check() -> bool:
    return True
