from fastapi import APIRouter, Depends
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from ...core.database import get_db
from ...repositories.submission_repository import SubmissionRepository
from ...services import task_service
from ...schemas.submission import SubmissionCreate, SubmissionResult, SubmissionOut
from .auth import get_current_user_dep

router = APIRouter(prefix="/submissions", tags=["submissions"])


@router.post("/", response_model=SubmissionResult)
async def submit(
    data: SubmissionCreate,
    current_user=Depends(get_current_user_dep),
    db: AsyncSession = Depends(get_db),
):
    return await task_service.submit_code(data, current_user, db)


@router.get("/my", response_model=list[SubmissionOut])
async def my_submissions(
    task_id: Optional[int] = None,
    limit: int = 50,
    current_user=Depends(get_current_user_dep),
    db: AsyncSession = Depends(get_db),
):
    repo = SubmissionRepository(db)
    subs = await repo.get_user_submissions(current_user.id, task_id, limit)
    return [SubmissionOut.model_validate(s) for s in subs]
