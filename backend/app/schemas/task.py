from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class TaskOut(BaseModel):
    id: int
    lesson_id: Optional[int]
    title: str
    slug: str
    description: str
    difficulty: str
    category: str
    hints: List[str] = []
    test_cases: List[dict] = []
    solution_template: Optional[str] = None
    time_limit_ms: int
    memory_limit_mb: int
    created_at: datetime

    model_config = {"from_attributes": True}


class TaskFilter(BaseModel):
    difficulty: Optional[str] = None
    category: Optional[str] = None
    lesson_id: Optional[int] = None
    search: Optional[str] = None
    offset: int = 0
    limit: int = 20


class GenerateTaskRequest(BaseModel):
    topic: str
    difficulty: str = "easy"
    lesson_id: Optional[int] = None
