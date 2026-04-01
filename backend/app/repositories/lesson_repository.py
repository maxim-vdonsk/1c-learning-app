from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from sqlalchemy.orm import selectinload
from typing import Optional, List
from ..models.lesson import Week, Lesson


class LessonRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all_weeks(self) -> List[Week]:
        result = await self.db.execute(
            select(Week)
            .order_by(Week.number)
            .options(selectinload(Week.lessons))
        )
        return list(result.scalars().unique().all())

    async def get_lesson_by_id(self, lesson_id: int) -> Optional[Lesson]:
        result = await self.db.execute(
            select(Lesson).where(Lesson.id == lesson_id).options(selectinload(Lesson.week))
        )
        return result.scalar_one_or_none()

    async def get_lesson_by_slug(self, slug: str) -> Optional[Lesson]:
        result = await self.db.execute(select(Lesson).where(Lesson.slug == slug))
        return result.scalar_one_or_none()

    async def get_week_by_number(self, number: int) -> Optional[Week]:
        result = await self.db.execute(select(Week).where(Week.number == number))
        return result.scalar_one_or_none()

    async def create_week(self, number: int, title: str, description: str) -> Week:
        week = Week(number=number, title=title, description=description)
        self.db.add(week)
        await self.db.commit()
        await self.db.refresh(week)
        return week

    async def create_lesson(
        self, week_id: int, title: str, slug: str, description: str, topic: str, order: int
    ) -> Lesson:
        lesson = Lesson(
            week_id=week_id, title=title, slug=slug,
            description=description, topic=topic, order=order,
        )
        self.db.add(lesson)
        await self.db.commit()
        await self.db.refresh(lesson)
        return lesson

    async def update_theory(self, lesson_id: int, theory_content: str, code_examples: list) -> None:
        await self.db.execute(
            update(Lesson)
            .where(Lesson.id == lesson_id)
            .values(theory_content=theory_content, code_examples=code_examples)
        )
        await self.db.commit()

    async def clear_theory(self, lesson_id: int) -> None:
        await self.db.execute(
            update(Lesson).where(Lesson.id == lesson_id).values(theory_content=None)
        )
        await self.db.commit()

    async def count_lessons(self) -> int:
        result = await self.db.execute(select(Lesson))
        return len(result.scalars().all())
