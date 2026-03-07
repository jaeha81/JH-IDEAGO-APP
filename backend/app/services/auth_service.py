import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from passlib.context import CryptContext

from app.models.user import User
from app.schemas.auth import RegisterRequest, LoginRequest
from app.core.auth import create_access_token
from app.core.exceptions import ConflictError, UnauthorizedError

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def register(self, body: RegisterRequest) -> dict:
        result = await self.db.execute(select(User).where(User.email == body.email))
        if result.scalar_one_or_none():
            raise ConflictError("Email already registered")

        user = User(
            id=uuid.uuid4(),
            email=body.email,
            hashed_password=pwd_context.hash(body.password),
            display_name=body.display_name,
        )
        self.db.add(user)
        await self.db.flush()

        token = create_access_token({"sub": str(user.id)})
        return {"data": {"user_id": str(user.id), "email": user.email, "access_token": token}}

    async def login(self, body: LoginRequest) -> dict:
        result = await self.db.execute(select(User).where(User.email == body.email))
        user = result.scalar_one_or_none()
        if not user or not pwd_context.verify(body.password, user.hashed_password):
            raise UnauthorizedError("Invalid credentials")

        token = create_access_token({"sub": str(user.id)})
        return {"data": {"access_token": token, "user_id": str(user.id), "email": user.email}}
