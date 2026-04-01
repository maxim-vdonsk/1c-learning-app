from sqlalchemy.ext.asyncio import AsyncSession
from ..models.user import User
from ..repositories.user_repository import UserRepository
from ..repositories.lesson_repository import LessonRepository
from ..repositories.progress_repository import ProgressRepository
from ..repositories.submission_repository import SubmissionRepository
from ..schemas.progress import DashboardOut, LeaderboardEntry


async def get_dashboard(user: User, db: AsyncSession) -> DashboardOut:
    user_repo = UserRepository(db)
    lesson_repo = LessonRepository(db)
    prog_repo = ProgressRepository(db)
    sub_repo = SubmissionRepository(db)

    total_lessons = await lesson_repo.count_lessons()
    lessons_done = await prog_repo.count_completed(user.id)
    progress_pct = (lessons_done / total_lessons * 100) if total_lessons > 0 else 0.0

    total_subs = await sub_repo.count_user_total(user.id)
    correct_subs = await sub_repo.count_user_correct(user.id)

    top_users = await user_repo.get_leaderboard(limit=6)
    leaderboard = []
    for rank, u in enumerate(top_users, 1):
        leaderboard.append(
            LeaderboardEntry(
                rank=rank,
                username=u.username,
                xp_points=u.xp_points,
                level=u.level,
                streak_days=u.streak_days,
                is_current_user=(u.id == user.id),
            )
        )

    fresh = await user_repo.get_by_id(user.id)
    return DashboardOut(
        username=fresh.username,
        xp_points=fresh.xp_points,
        level=fresh.level,
        streak_days=fresh.streak_days,
        rating=fresh.rating,
        lessons_completed=lessons_done,
        total_lessons=total_lessons,
        progress_percent=round(progress_pct, 1),
        submissions_count=total_subs,
        correct_submissions=correct_subs,
        leaderboard=leaderboard,
    )
