from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ...core.database import get_db
from ...models.achievement import Achievement, UserAchievement
from ...services.achievement_service import seed_achievements
from ...schemas.achievement import AchievementOut, UserAchievementOut
from .auth import get_current_user_dep

router = APIRouter(prefix="/achievements", tags=["achievements"])


@router.get("/", response_model=list[UserAchievementOut])
async def my_achievements(
    current_user=Depends(get_current_user_dep),
    db: AsyncSession = Depends(get_db),
):
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(UserAchievement)
        .where(UserAchievement.user_id == current_user.id)
        .options(selectinload(UserAchievement.achievement))
    )
    return result.scalars().all()


@router.get("/all", response_model=list[AchievementOut])
async def all_achievements(
    current_user=Depends(get_current_user_dep),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Achievement))
    return result.scalars().all()


@router.post("/seed")
async def seed(
    current_user=Depends(get_current_user_dep),
    db: AsyncSession = Depends(get_db),
):
    count = await seed_achievements(db)
    return {"message": f"Создано достижений: {count}"}
