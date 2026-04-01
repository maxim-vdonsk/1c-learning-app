from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from ..models.achievement import Achievement, UserAchievement, ConditionType
from ..models.user import User
from ..repositories.user_repository import UserRepository
from ..repositories.submission_repository import SubmissionRepository
from ..repositories.progress_repository import ProgressRepository


ACHIEVEMENTS_SEED = [
    {
        "name": "first_lesson",
        "title": "Первый шаг",
        "description": "Завершите свой первый урок",
        "icon": "🎯",
        "xp_reward": 50,
        "condition_type": ConditionType.lessons_completed,
        "condition_value": 1,
    },
    {
        "name": "five_lessons",
        "title": "Набираю обороты",
        "description": "Завершите 5 уроков",
        "icon": "⚡",
        "xp_reward": 150,
        "condition_type": ConditionType.lessons_completed,
        "condition_value": 5,
    },
    {
        "name": "ten_lessons",
        "title": "Уверенный старт",
        "description": "Завершите 10 уроков",
        "icon": "🚀",
        "xp_reward": 300,
        "condition_type": ConditionType.lessons_completed,
        "condition_value": 10,
    },
    {
        "name": "thirty_lessons",
        "title": "На полпути",
        "description": "Завершите 30 уроков",
        "icon": "🏅",
        "xp_reward": 500,
        "condition_type": ConditionType.lessons_completed,
        "condition_value": 30,
    },
    {
        "name": "all_lessons",
        "title": "Мастер 1С",
        "description": "Завершите все 60 уроков",
        "icon": "👑",
        "xp_reward": 2000,
        "condition_type": ConditionType.lessons_completed,
        "condition_value": 60,
    },
    {
        "name": "week_streak",
        "title": "Семь дней подряд",
        "description": "Учитесь 7 дней без перерыва",
        "icon": "🔥",
        "xp_reward": 200,
        "condition_type": ConditionType.streak,
        "condition_value": 7,
    },
    {
        "name": "month_streak",
        "title": "Железная воля",
        "description": "Учитесь 30 дней без перерыва",
        "icon": "💎",
        "xp_reward": 1000,
        "condition_type": ConditionType.streak,
        "condition_value": 30,
    },
    {
        "name": "ten_correct",
        "title": "Решатель задач",
        "description": "Решите 10 задач правильно",
        "icon": "✅",
        "xp_reward": 200,
        "condition_type": ConditionType.submissions_correct,
        "condition_value": 10,
    },
    {
        "name": "fifty_correct",
        "title": "Код-ниндзя",
        "description": "Решите 50 задач правильно",
        "icon": "🥷",
        "xp_reward": 500,
        "condition_type": ConditionType.submissions_correct,
        "condition_value": 50,
    },
]


async def seed_achievements(db: AsyncSession) -> int:
    created = 0
    for ach_data in ACHIEVEMENTS_SEED:
        existing = await db.execute(
            select(Achievement).where(Achievement.name == ach_data["name"])
        )
        if not existing.scalar_one_or_none():
            ach = Achievement(**ach_data)
            db.add(ach)
            created += 1
    await db.commit()
    return created


async def check_and_award_achievements(user: User, db: AsyncSession) -> List[dict]:
    """Check all achievements and award any not yet earned."""
    new_achievements = []

    all_achievements = (await db.execute(select(Achievement))).scalars().all()
    earned_ids = {
        ua.achievement_id
        for ua in (
            await db.execute(
                select(UserAchievement).where(UserAchievement.user_id == user.id)
            )
        ).scalars().all()
    }

    sub_repo = SubmissionRepository(db)
    prog_repo = ProgressRepository(db)

    correct_count = await sub_repo.count_user_correct(user.id)
    lessons_done = await prog_repo.count_completed(user.id)

    user_repo = UserRepository(db)
    fresh_user = await user_repo.get_by_id(user.id)

    for ach in all_achievements:
        if ach.id in earned_ids:
            continue

        earned = False
        if ach.condition_type == ConditionType.lessons_completed:
            earned = lessons_done >= ach.condition_value
        elif ach.condition_type == ConditionType.streak:
            earned = (fresh_user.streak_days or 0) >= ach.condition_value
        elif ach.condition_type == ConditionType.submissions_correct:
            earned = correct_count >= ach.condition_value
        elif ach.condition_type == ConditionType.xp_earned:
            earned = (fresh_user.xp_points or 0) >= ach.condition_value

        if earned:
            ua = UserAchievement(user_id=user.id, achievement_id=ach.id)
            db.add(ua)
            await user_repo.add_xp(user.id, ach.xp_reward)
            new_achievements.append({
                "name": ach.name,
                "title": ach.title,
                "description": ach.description,
                "icon": ach.icon,
                "xp_reward": ach.xp_reward,
            })

    if new_achievements:
        await db.commit()

    return new_achievements
