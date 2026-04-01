from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class LessonOut(BaseModel):
    id: int
    title: str
    slug: str
    description: Optional[str]
    topic: str
    order: int
    theory_content: Optional[str] = None
    is_completed: bool = False
    theory_read: bool = False

    model_config = {"from_attributes": True}


class WeekOut(BaseModel):
    id: int
    number: int
    title: str
    description: Optional[str]
    lessons: List[LessonOut] = []
    lessons_completed: int = 0
    total_lessons: int = 0

    model_config = {"from_attributes": True}


class CourseOut(BaseModel):
    weeks: List[WeekOut]
    total_lessons: int
    completed_lessons: int
    progress_percent: float
