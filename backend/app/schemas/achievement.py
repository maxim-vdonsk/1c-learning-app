from pydantic import BaseModel
from datetime import datetime


class AchievementOut(BaseModel):
    id: int
    name: str
    title: str
    description: str
    icon: str
    xp_reward: int
    condition_type: str
    condition_value: int

    model_config = {"from_attributes": True}


class UserAchievementOut(BaseModel):
    id: int
    achievement: AchievementOut
    earned_at: datetime

    model_config = {"from_attributes": True}
