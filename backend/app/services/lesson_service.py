import re
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from ..models.user import User
from ..repositories.lesson_repository import LessonRepository
from ..repositories.progress_repository import ProgressRepository
from ..repositories.user_repository import UserRepository
from ..schemas.lesson import CourseOut, WeekOut, LessonOut
from . import ai_service
from .achievement_service import check_and_award_achievements


async def get_course(user: User, db: AsyncSession) -> CourseOut:
    lesson_repo = LessonRepository(db)
    prog_repo = ProgressRepository(db)

    weeks_db = await lesson_repo.get_all_weeks()
    user_progress = await prog_repo.get_user_progress(user.id)
    progress_map = {p.lesson_id: p for p in user_progress}

    total_lessons = 0
    completed_lessons = 0
    weeks_out = []

    for week in weeks_db:
        lessons_out = []
        week_completed = 0

        for lesson in week.lessons:
            prog = progress_map.get(lesson.id)
            is_completed = prog.completed if prog else False
            theory_read = prog.theory_read if prog else False

            if is_completed:
                week_completed += 1
                completed_lessons += 1
            total_lessons += 1

            lessons_out.append(
                LessonOut(
                    id=lesson.id,
                    title=lesson.title,
                    slug=lesson.slug,
                    description=lesson.description,
                    topic=lesson.topic,
                    order=lesson.order,
                    is_completed=is_completed,
                    theory_read=theory_read,
                )
            )

        weeks_out.append(
            WeekOut(
                id=week.id,
                number=week.number,
                title=week.title,
                description=week.description,
                lessons=lessons_out,
                lessons_completed=week_completed,
                total_lessons=len(week.lessons),
            )
        )

    progress_pct = (completed_lessons / total_lessons * 100) if total_lessons > 0 else 0.0
    return CourseOut(
        weeks=weeks_out,
        total_lessons=total_lessons,
        completed_lessons=completed_lessons,
        progress_percent=round(progress_pct, 1),
    )


async def get_lesson_theory(lesson_id: int, user: User, db: AsyncSession, regenerate: bool = False) -> dict:
    lesson_repo = LessonRepository(db)
    prog_repo = ProgressRepository(db)
    user_repo = UserRepository(db)

    lesson = await lesson_repo.get_lesson_by_id(lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Урок не найден")

    if not lesson.theory_content or regenerate:
        theory = await ai_service.generate_theory(
            topic=lesson.topic,
            week_number=lesson.week.number,
            lesson_order=lesson.order,
        )
        await lesson_repo.update_theory(lesson_id, theory, [])
        lesson.theory_content = theory

    # Mark theory as read + update streak
    await prog_repo.mark_theory_read(user.id, lesson_id)
    await user_repo.update_streak(user.id)

    return {
        "id": lesson.id,
        "title": lesson.title,
        "topic": lesson.topic,
        "theory_content": lesson.theory_content,
        "week_number": lesson.week_id,
    }


async def initialize_course(db: AsyncSession) -> dict:
    """Seed course structure from course_structure.py data. Idempotent — safe to call multiple times."""
    from ..data.course_structure import COURSE_STRUCTURE

    lesson_repo = LessonRepository(db)
    created_lessons = 0
    skipped_lessons = 0

    for week_data in COURSE_STRUCTURE:
        # Upsert week by number
        week = await lesson_repo.get_week_by_number(week_data["week"])
        if not week:
            week = await lesson_repo.create_week(
                number=week_data["week"],
                title=week_data["title"],
                description=week_data["description"],
            )

        for i, lesson_data in enumerate(week_data["lessons"], 1):
            slug = re.sub(r"[^a-z0-9]+", "-", lesson_data["slug"].lower()).strip("-")
            # Check by slug to avoid duplicates across workers
            existing = await lesson_repo.get_lesson_by_slug(slug)
            if existing:
                skipped_lessons += 1
                continue
            await lesson_repo.create_lesson(
                week_id=week.id,
                title=lesson_data["title"],
                slug=slug,
                description=lesson_data["description"],
                topic=lesson_data["topic"],
                order=i,
            )
            created_lessons += 1

    total = created_lessons + skipped_lessons
    return {"message": f"Курс инициализирован: {created_lessons} создано, {skipped_lessons} уже существовало (всего {total})"}
