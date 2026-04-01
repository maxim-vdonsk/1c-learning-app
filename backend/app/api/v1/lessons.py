from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from ...core.database import get_db
from ...services import lesson_service
from ...schemas.lesson import CourseOut
from .auth import get_current_user_dep

router = APIRouter(prefix="/lessons", tags=["lessons"])


@router.get("/course", response_model=CourseOut)
async def get_course(
    current_user=Depends(get_current_user_dep),
    db: AsyncSession = Depends(get_db),
):
    return await lesson_service.get_course(current_user, db)


@router.get("/{lesson_id}/theory")
async def get_theory(
    lesson_id: int,
    regenerate: bool = Query(False),
    current_user=Depends(get_current_user_dep),
    db: AsyncSession = Depends(get_db),
):
    return await lesson_service.get_lesson_theory(lesson_id, current_user, db, regenerate)


@router.post("/initialize")
async def initialize_course(
    current_user=Depends(get_current_user_dep),
    db: AsyncSession = Depends(get_db),
):
    return await lesson_service.initialize_course(db)
