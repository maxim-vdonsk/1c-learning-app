from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class SubmissionCreate(BaseModel):
    task_id: int
    code: str


class TestCaseResult(BaseModel):
    input: str
    expected: str
    got: str
    passed: bool


class SubmissionOut(BaseModel):
    id: int
    task_id: int
    code: str
    is_correct: bool
    status: str
    execution_time_ms: Optional[int]
    output: Optional[str]
    error: Optional[str]
    ai_feedback: Optional[str]
    ai_score: Optional[int]
    created_at: datetime

    model_config = {"from_attributes": True}


class SubmissionResult(BaseModel):
    submission_id: int
    is_correct: bool
    status: str
    passed_tests: int
    total_tests: int
    test_results: List[TestCaseResult] = []
    execution_time_ms: Optional[int]
    output: Optional[str]
    error: Optional[str]
    ai_feedback: Optional[str]
    ai_score: Optional[int]
    xp_earned: int = 0
    new_achievements: List[dict] = []
    new_level: Optional[int] = None
