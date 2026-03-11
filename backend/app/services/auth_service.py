import uuid
import bcrypt
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.user import User
from app.schemas.auth import RegisterRequest, LoginRequest
from app.core.auth import create_access_token
from app.core.exceptions import ConflictError, UnauthorizedError


def _hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def _verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def register(self, body: RegisterRequest) -> tuple[str, dict]:
        """Returns (access_token, user_data) — token set as cookie by router."""
        result = await self.db.execute(select(User).where(User.email == body.email))
        if result.scalar_one_or_none():
            raise ConflictError("Email already registered")

        user = User(
            id=uuid.uuid4(),
            email=body.email,
            hashed_password=_hash_password(body.password),
            display_name=body.display_name,
        )
        self.db.add(user)
        await self.db.flush()

        token = create_access_token({"sub": str(user.id)})
        user_data = {
            "user_id": str(user.id),
            "email": user.email,
            "display_name": user.display_name,
        }
        return token, user_data

    async def login(self, body: LoginRequest) -> tuple[str, dict]:
        """Returns (access_token, user_data) — token set as cookie by router."""
        result = await self.db.execute(select(User).where(User.email == body.email))
        user = result.scalar_one_or_none()
        if not user or not _verify_password(body.password, user.hashed_password):
            raise UnauthorizedError("Invalid credentials")

        token = create_access_token({"sub": str(user.id)})
        user_data = {
            "user_id": str(user.id),
            "email": user.email,
            "display_name": user.display_name,
        }
        return token, user_data
