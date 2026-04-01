from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import Optional, List
from ..models.task import Task, DifficultyEnum


class TaskRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, task_id: int) -> Optional[Task]:
        result = await self.db.execute(select(Task).where(Task.id == task_id))
        return result.scalar_one_or_none()

    async def get_by_lesson_id(self, lesson_id: int) -> Optional[Task]:
        result = await self.db.execute(
            select(Task).where(Task.lesson_id == lesson_id).limit(1)
        )
        return result.scalar_one_or_none()

    async def get_filtered(
        self,
        difficulty: Optional[str] = None,
        category: Optional[str] = None,
        lesson_id: Optional[int] = None,
        search: Optional[str] = None,
        offset: int = 0,
        limit: int = 20,
    ) -> List[Task]:
        conditions = []
        if difficulty:
            conditions.append(Task.difficulty == difficulty)
        if category:
            conditions.append(Task.category == category)
        if lesson_id:
            conditions.append(Task.lesson_id == lesson_id)
        if search:
            conditions.append(Task.title.ilike(f"%{search}%"))

        query = select(Task)
        if conditions:
            query = query.where(and_(*conditions))
        query = query.offset(offset).limit(limit)

        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def create(self, **kwargs) -> Task:
        task = Task(**kwargs)
        self.db.add(task)
        await self.db.commit()
        await self.db.refresh(task)
        return task

    async def delete_for_lesson(self, lesson_id: int) -> None:
        tasks = await self.get_filtered(lesson_id=lesson_id)
        for task in tasks:
            await self.db.delete(task)
        await self.db.commit()
