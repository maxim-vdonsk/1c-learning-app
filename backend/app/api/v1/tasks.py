from fastapi import APIRouter, Depends, Query
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from ...core.database import get_db
from ...repositories.task_repository import TaskRepository
from ...services import task_service
from ...schemas.task import TaskOut, GenerateTaskRequest
from .auth import get_current_user_dep
import re, uuid

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.get("/", response_model=list[TaskOut])
async def list_tasks(
    difficulty: Optional[str] = None,
    category: Optional[str] = None,
    lesson_id: Optional[int] = None,
    search: Optional[str] = None,
    offset: int = 0,
    limit: int = 20,
    current_user=Depends(get_current_user_dep),
    db: AsyncSession = Depends(get_db),
):
    repo = TaskRepository(db)
    tasks = await repo.get_filtered(difficulty, category, lesson_id, search, offset, limit)
    return [TaskOut.model_validate(t) for t in tasks]


@router.get("/{task_id}", response_model=TaskOut)
async def get_task(
    task_id: int,
    current_user=Depends(get_current_user_dep),
    db: AsyncSession = Depends(get_db),
):
    from fastapi import HTTPException
    repo = TaskRepository(db)
    task = await repo.get_by_id(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Задача не найдена")
    return TaskOut.model_validate(task)


@router.get("/lesson/{lesson_id}", response_model=TaskOut)
async def get_lesson_task(
    lesson_id: int,
    current_user=Depends(get_current_user_dep),
    db: AsyncSession = Depends(get_db),
):
    return await task_service.get_or_create_lesson_task(lesson_id, db)


@router.post("/generate", response_model=TaskOut)
async def generate_task(
    req: GenerateTaskRequest,
    current_user=Depends(get_current_user_dep),
    db: AsyncSession = Depends(get_db),
):
    from ...services import ai_service
    task_data = await ai_service.generate_task(req.topic, req.difficulty, week_number=1)
    repo = TaskRepository(db)
    slug = re.sub(r"[^a-z0-9]+", "-", task_data["title"].lower())[:80] + f"-{uuid.uuid4().hex[:6]}"
    task = await repo.create(
        lesson_id=req.lesson_id,
        title=task_data["title"],
        slug=slug,
        description=task_data["description"],
        difficulty=req.difficulty,
        category=task_data.get("category", "1с-основы"),
        hints=task_data.get("hints", []),
        test_cases=task_data.get("test_cases", []),
        solution_template=task_data.get("solution_template", ""),
    )
    return TaskOut.model_validate(task)
