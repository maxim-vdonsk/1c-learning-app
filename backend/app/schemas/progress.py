from pydantic import BaseModel
from typing import List, Optional


class LeaderboardEntry(BaseModel):
    rank: int
    username: str
    xp_points: int
    level: int
    streak_days: int
    is_current_user: bool = False


class DashboardOut(BaseModel):
    username: str
    xp_points: int
    level: int
    streak_days: int
    rating: float
    lessons_completed: int
    total_lessons: int
    progress_percent: float
    submissions_count: int
    correct_submissions: int
    leaderboard: List[LeaderboardEntry] = []
