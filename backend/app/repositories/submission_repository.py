from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, and_, func
from typing import Optional, List
from ..models.submission import Submission, SubmissionStatus


class SubmissionRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, user_id: int, task_id: int, code: str) -> Submission:
        sub = Submission(user_id=user_id, task_id=task_id, code=code)
        self.db.add(sub)
        await self.db.commit()
        await self.db.refresh(sub)
        return sub

    async def update(self, submission_id: int, **kwargs) -> None:
        await self.db.execute(
            update(Submission).where(Submission.id == submission_id).values(**kwargs)
        )
        await self.db.commit()

    async def get_by_id(self, submission_id: int) -> Optional[Submission]:
        result = await self.db.execute(select(Submission).where(Submission.id == submission_id))
        return result.scalar_one_or_none()

    async def get_user_submissions(
        self, user_id: int, task_id: Optional[int] = None, limit: int = 50
    ) -> List[Submission]:
        conditions = [Submission.user_id == user_id]
        if task_id:
            conditions.append(Submission.task_id == task_id)
        result = await self.db.execute(
            select(Submission)
            .where(and_(*conditions))
            .order_by(Submission.created_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())

    async def count_user_correct(self, user_id: int) -> int:
        result = await self.db.execute(
            select(func.count()).where(
                and_(Submission.user_id == user_id, Submission.is_correct == True)
            )
        )
        return result.scalar() or 0

    async def count_user_total(self, user_id: int) -> int:
        result = await self.db.execute(
            select(func.count()).where(Submission.user_id == user_id)
        )
        return result.scalar() or 0
