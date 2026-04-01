from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, and_, func
from datetime import datetime, timezone
from typing import Optional, List
from ..models.progress import Progress


class ProgressRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get(self, user_id: int, lesson_id: int) -> Optional[Progress]:
        result = await self.db.execute(
            select(Progress).where(
                and_(Progress.user_id == user_id, Progress.lesson_id == lesson_id)
            )
        )
        return result.scalar_one_or_none()

    async def get_user_progress(self, user_id: int) -> List[Progress]:
        result = await self.db.execute(
            select(Progress).where(Progress.user_id == user_id)
        )
        return list(result.scalars().all())

    async def create_or_get(self, user_id: int, lesson_id: int) -> Progress:
        prog = await self.get(user_id, lesson_id)
        if not prog:
            prog = Progress(
                user_id=user_id,
                lesson_id=lesson_id,
                started_at=datetime.now(timezone.utc),
            )
            self.db.add(prog)
            await self.db.commit()
            await self.db.refresh(prog)
        return prog

    async def mark_theory_read(self, user_id: int, lesson_id: int) -> None:
        prog = await self.create_or_get(user_id, lesson_id)
        await self.db.execute(
            update(Progress)
            .where(and_(Progress.user_id == user_id, Progress.lesson_id == lesson_id))
            .values(theory_read=True)
        )
        await self.db.commit()

    async def mark_completed(self, user_id: int, lesson_id: int) -> None:
        now = datetime.now(timezone.utc)
        await self.create_or_get(user_id, lesson_id)
        await self.db.execute(
            update(Progress)
            .where(and_(Progress.user_id == user_id, Progress.lesson_id == lesson_id))
            .values(completed=True, completed_at=now)
        )
        await self.db.commit()

    async def count_completed(self, user_id: int) -> int:
        result = await self.db.execute(
            select(func.count()).where(
                and_(Progress.user_id == user_id, Progress.completed == True)
            )
        )
        return result.scalar() or 0
