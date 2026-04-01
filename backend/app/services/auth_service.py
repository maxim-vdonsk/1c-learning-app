import secrets
import string
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from ..repositories.user_repository import UserRepository
from ..core.security import verify_password, get_password_hash, create_access_token
from ..schemas.user import UserCreate, UserOut, Token
from .email_service import send_temp_password_email


async def register_user(data: UserCreate, db: AsyncSession) -> Token:
    repo = UserRepository(db)

    if await repo.get_by_email(data.email):
        raise HTTPException(status_code=400, detail="Email уже зарегистрирован")
    if await repo.get_by_username(data.username):
        raise HTTPException(status_code=400, detail="Имя пользователя уже занято")
    if len(data.password) < 6:
        raise HTTPException(status_code=400, detail="Пароль должен содержать не менее 6 символов")

    hashed = get_password_hash(data.password)
    user = await repo.create(email=data.email, username=data.username, hashed_password=hashed)

    token = create_access_token({"sub": str(user.id)})
    return Token(access_token=token, user=UserOut.model_validate(user))


async def login_user(email: str, password: str, db: AsyncSession) -> Token:
    repo = UserRepository(db)
    user = await repo.get_by_email(email)

    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный email или пароль",
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Аккаунт заблокирован")

    token = create_access_token({"sub": str(user.id)})
    return Token(access_token=token, user=UserOut.model_validate(user))


async def forgot_password(email: str, db: AsyncSession) -> None:
    repo = UserRepository(db)
    user = await repo.get_by_email(email)
    if not user:
        return  # Don't leak whether email exists

    alphabet = string.ascii_letters + string.digits
    temp_password = "".join(secrets.choice(alphabet) for _ in range(12))
    hashed = get_password_hash(temp_password)
    await repo.update_password(user.id, hashed)
    await send_temp_password_email(email, user.username, temp_password)


async def get_current_user(token_payload: dict, db: AsyncSession):
    user_id = int(token_payload.get("sub", 0))
    repo = UserRepository(db)
    user = await repo.get_by_id(user_id)
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Пользователь не найден")
    return user
