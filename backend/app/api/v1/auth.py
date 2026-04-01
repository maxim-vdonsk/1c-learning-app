from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from ...core.database import get_db
from ...core.security import decode_token
from ...schemas.user import UserCreate, UserLogin, Token, ForgotPassword, UserOut
from ...services import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


async def get_current_user_dep(
    token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)
):
    payload = decode_token(token)
    if not payload:
        from fastapi import HTTPException
        raise HTTPException(status_code=401, detail="Недействительный токен")
    return await auth_service.get_current_user(payload, db)


@router.post("/register", response_model=Token)
async def register(data: UserCreate, db: AsyncSession = Depends(get_db)):
    return await auth_service.register_user(data, db)


@router.post("/login", response_model=Token)
async def login(form: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    return await auth_service.login_user(form.username, form.password, db)


@router.post("/login/json", response_model=Token)
async def login_json(data: UserLogin, db: AsyncSession = Depends(get_db)):
    return await auth_service.login_user(data.email, data.password, db)


@router.post("/forgot-password")
async def forgot_password(data: ForgotPassword, db: AsyncSession = Depends(get_db)):
    await auth_service.forgot_password(data.email, db)
    return {"message": "Если email зарегистрирован, письмо отправлено"}


@router.get("/me", response_model=UserOut)
async def me(current_user=Depends(get_current_user_dep)):
    return current_user
