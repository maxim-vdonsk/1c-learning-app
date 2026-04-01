from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from ...core.database import get_db
from ...services.progress_service import get_dashboard
from ...schemas.progress import DashboardOut
from .auth import get_current_user_dep

router = APIRouter(prefix="/progress", tags=["progress"])


@router.get("/dashboard", response_model=DashboardOut)
async def dashboard(
    current_user=Depends(get_current_user_dep),
    db: AsyncSession = Depends(get_db),
):
    return await get_dashboard(current_user, db)
