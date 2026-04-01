from sqlalchemy import String, Integer, Text, ForeignKey, JSON, DateTime, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime, timezone
from typing import Optional, List
import enum
from ..core.database import Base


class DifficultyEnum(str, enum.Enum):
    easy = "easy"
    medium = "medium"
    hard = "hard"


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    lesson_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("lessons.id"), nullable=True)

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str] = mapped_column(String(100), nullable=False, default="general")

    difficulty: Mapped[DifficultyEnum] = mapped_column(
        Enum(DifficultyEnum), default=DifficultyEnum.easy
    )

    hints: Mapped[list] = mapped_column(JSON, default=list)
    test_cases: Mapped[list] = mapped_column(JSON, default=list)
    solution_template: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    reference_solution: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    time_limit_ms: Mapped[int] = mapped_column(Integer, default=5000)
    memory_limit_mb: Mapped[int] = mapped_column(Integer, default=64)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    lesson: Mapped[Optional["Lesson"]] = relationship("Lesson", back_populates="tasks")
    submissions: Mapped[List["Submission"]] = relationship("Submission", back_populates="task")
