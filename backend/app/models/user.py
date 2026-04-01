from sqlalchemy import String, Boolean, Integer, Float, Date
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import date
from typing import Optional, List
from ..core.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    username: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_superuser: Mapped[bool] = mapped_column(Boolean, default=False)

    xp_points: Mapped[int] = mapped_column(Integer, default=0)
    level: Mapped[int] = mapped_column(Integer, default=1)
    streak_days: Mapped[int] = mapped_column(Integer, default=0)
    last_activity_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    rating: Mapped[float] = mapped_column(Float, default=0.0)

    progress: Mapped[List["Progress"]] = relationship("Progress", back_populates="user", lazy="dynamic")
    submissions: Mapped[List["Submission"]] = relationship("Submission", back_populates="user", lazy="dynamic")
    achievements: Mapped[List["UserAchievement"]] = relationship("UserAchievement", back_populates="user", lazy="dynamic")
