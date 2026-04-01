from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, desc
from datetime import date, datetime, timezone
from typing import Optional, List
from ..models.user import User


class UserRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_email(self, email: str) -> Optional[User]:
        result = await self.db.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    async def get_by_username(self, username: str) -> Optional[User]:
        result = await self.db.execute(select(User).where(User.username == username))
        return result.scalar_one_or_none()

    async def get_by_id(self, user_id: int) -> Optional[User]:
        result = await self.db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    async def create(self, email: str, username: str, hashed_password: str) -> User:
        user = User(email=email, username=username, hashed_password=hashed_password)
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def update_password(self, user_id: int, hashed_password: str) -> None:
        await self.db.execute(
            update(User).where(User.id == user_id).values(hashed_password=hashed_password)
        )
        await self.db.commit()

    async def add_xp(self, user_id: int, xp: int) -> User:
        user = await self.get_by_id(user_id)
        if not user:
            return None
        user.xp_points += xp
        user.level = (user.xp_points // 500) + 1
        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def update_streak(self, user_id: int) -> User:
        user = await self.get_by_id(user_id)
        if not user:
            return None
        today = date.today()
        if user.last_activity_date is None:
            user.streak_days = 1
        elif user.last_activity_date == today:
            pass  # already updated today
        elif (today - user.last_activity_date).days == 1:
            user.streak_days += 1
        else:
            user.streak_days = 1
        user.last_activity_date = today
        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def get_leaderboard(self, limit: int = 10) -> List[User]:
        result = await self.db.execute(
            select(User)
            .where(User.is_active == True)
            .order_by(desc(User.xp_points))
            .limit(limit)
        )
        return list(result.scalars().all())
