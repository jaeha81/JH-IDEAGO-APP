from fastapi import APIRouter, Depends, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.schemas.auth import RegisterRequest, LoginRequest
from app.services.auth_service import AuthService
from app.core.auth import get_current_user
from app.config import settings

router = APIRouter()

_COOKIE_NAME = "access_token"
_COOKIE_MAX_AGE = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60


def _set_auth_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=_COOKIE_NAME,
        value=token,
        httponly=True,
        samesite="lax",
        max_age=_COOKIE_MAX_AGE,
        path="/",
        secure=False,  # True in production (HTTPS)
    )


@router.post("/register", response_model=dict)
async def register(body: RegisterRequest, response: Response, db: AsyncSession = Depends(get_db)):
    token, user_data = await AuthService(db).register(body)
    _set_auth_cookie(response, token)
    return {"data": user_data}


@router.post("/login", response_model=dict)
async def login(body: LoginRequest, response: Response, db: AsyncSession = Depends(get_db)):
    token, user_data = await AuthService(db).login(body)
    _set_auth_cookie(response, token)
    return {"data": user_data}


@router.get("/me", response_model=dict)
async def get_me(current_user: User = Depends(get_current_user)):
    return {
        "data": {
            "user_id": str(current_user.id),
            "email": current_user.email,
            "display_name": current_user.display_name,
        }
    }


@router.post("/logout", response_model=dict)
async def logout(response: Response):
    response.delete_cookie(key=_COOKIE_NAME, path="/")
    return {"data": {"logged_out": True}}
