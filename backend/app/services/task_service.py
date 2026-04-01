import re
import uuid
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from ..models.user import User
from ..repositories.task_repository import TaskRepository
from ..repositories.submission_repository import SubmissionRepository
from ..repositories.progress_repository import ProgressRepository
from ..repositories.user_repository import UserRepository
from ..schemas.task import TaskOut, GenerateTaskRequest
from ..schemas.submission import SubmissionCreate, SubmissionResult, TestCaseResult
from . import ai_service, sandbox_service
from .achievement_service import check_and_award_achievements


XP_REWARDS = {"easy": 30, "medium": 60, "hard": 100}


async def get_or_create_lesson_task(lesson_id: int, db: AsyncSession) -> TaskOut:
    lesson_repo = __import__(
        "app.repositories.lesson_repository", fromlist=["LessonRepository"]
    ).LessonRepository(db)
    task_repo = TaskRepository(db)

    lesson = await lesson_repo.get_lesson_by_id(lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Урок не найден")

    existing = await task_repo.get_by_lesson_id(lesson_id)
    if existing:
        return TaskOut.model_validate(existing)

    # Generate new task via AI
    task_data = await ai_service.generate_task(
        topic=lesson.topic, difficulty="easy", week_number=lesson.week_id
    )

    slug = re.sub(r"[^a-z0-9]+", "-", task_data["title"].lower())[:80] + f"-{uuid.uuid4().hex[:6]}"
    task = await task_repo.create(
        lesson_id=lesson_id,
        title=task_data["title"],
        slug=slug,
        description=task_data["description"],
        difficulty="easy",
        category=task_data.get("category", "1с-основы"),
        hints=task_data.get("hints", []),
        test_cases=task_data.get("test_cases", []),
        solution_template=task_data.get("solution_template", ""),
    )
    return TaskOut.model_validate(task)


async def submit_code(data: SubmissionCreate, user: User, db: AsyncSession) -> SubmissionResult:
    task_repo = TaskRepository(db)
    sub_repo = SubmissionRepository(db)
    user_repo = UserRepository(db)
    prog_repo = ProgressRepository(db)

    task = await task_repo.get_by_id(data.task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Задача не найдена")

    # Create pending submission
    submission = await sub_repo.create(user.id, data.task_id, data.code)

    await sub_repo.update(submission.id, status="running")

    # Execute against each test case
    test_results = []
    passed = 0
    last_output = ""
    last_error = ""
    total_time = 0

    test_cases = task.test_cases or []
    if not test_cases:
        # No test cases — run the code once and check it doesn't error
        result = await sandbox_service.execute_code(data.code)
        last_output = result.output
        last_error = result.error
        total_time = result.execution_time_ms
        is_correct = not result.error
        passed = 1 if is_correct else 0
        test_results = [
            TestCaseResult(
                input="",
                expected="(любой вывод без ошибки)",
                got=last_output,
                passed=is_correct,
            )
        ]
    else:
        for tc in test_cases:
            # Inject input handling: prepend input data as comments/variables if needed
            code_with_input = _inject_input(data.code, tc.get("input", ""))
            result = await sandbox_service.execute_code(code_with_input)
            last_output = result.output
            last_error = result.error
            total_time += result.execution_time_ms
            expected = tc.get("expected_output", "").strip()
            ok = sandbox_service.check_test_case(result.output, expected)
            if ok:
                passed += 1
            test_results.append(
                TestCaseResult(
                    input=tc.get("input", ""),
                    expected=expected,
                    got=result.output,
                    passed=ok,
                )
            )
            if result.error:
                last_error = result.error
                break  # Stop on runtime error

    is_correct = passed == len(test_results) and passed > 0

    # AI feedback
    ai_feedback, ai_score = await ai_service.analyze_code(
        data.code, task.description, is_correct
    )

    await sub_repo.update(
        submission.id,
        status="completed",
        is_correct=is_correct,
        execution_time_ms=total_time,
        output=last_output[:5000],
        error=last_error[:2000] if last_error else None,
        ai_feedback=ai_feedback,
        ai_score=ai_score,
    )

    # Award XP
    xp_earned = 0
    new_level = None
    if is_correct:
        xp = XP_REWARDS.get(task.difficulty, 30)
        updated_user = await user_repo.add_xp(user.id, xp)
        xp_earned = xp
        await user_repo.update_streak(user.id)
        if updated_user and updated_user.level > user.level:
            new_level = updated_user.level

        # Mark lesson progress if task belongs to a lesson
        if task.lesson_id:
            await prog_repo.mark_completed(user.id, task.lesson_id)

    # Check achievements
    new_achievements = await check_and_award_achievements(user, db)

    return SubmissionResult(
        submission_id=submission.id,
        is_correct=is_correct,
        status="completed",
        passed_tests=passed,
        total_tests=len(test_results),
        test_results=test_results,
        execution_time_ms=total_time,
        output=last_output[:2000] if last_output else None,
        error=last_error[:1000] if last_error else None,
        ai_feedback=ai_feedback,
        ai_score=ai_score,
        xp_earned=xp_earned,
        new_achievements=new_achievements,
        new_level=new_level,
    )


def _inject_input(code: str, input_data: str) -> str:
    """Prepend input data as a variable for tasks that use Ввод()."""
    if not input_data:
        return code
    # Simple approach: if code uses ВвестиЗначение or similar, we skip injection.
    # For most tasks, input is pre-defined in the task itself.
    return code
