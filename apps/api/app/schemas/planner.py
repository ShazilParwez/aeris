"""Activity and Day Planner Schemas."""

from typing import List, Optional
from pydantic import BaseModel, Field
from app.schemas.profiles import LifestyleProfile, TransportMode


class ActivityItem(BaseModel):
    id: str
    title: str
    preferred_time: str = Field(..., description="Time string HH:MM in 24h format")
    duration_minutes: int = 60
    is_outdoor: bool = True
    is_fixed: bool = False
    priority: str = "medium"  # high, medium, low
    transport_mode: Optional[TransportMode] = None


class OptimizedActivity(BaseModel):
    id: str
    title: str
    original_time: str
    suggested_time: str
    duration_minutes: int
    is_outdoor: bool
    is_fixed: bool
    status: str = "unchanged"  # unchanged, shifted, moved_indoors, cancelled
    change_rationale: str
    original_aqi: float
    suggested_aqi: float
    relative_exposure_delta_pct: float = 0.0


class PlannerOptimizeRequest(BaseModel):
    activities: List[ActivityItem]
    profile: Optional[LifestyleProfile] = None
    latitude: float
    longitude: float


class PlannerOptimizeResponse(BaseModel):
    original_activities: List[ActivityItem]
    suggested_activities: List[OptimizedActivity]
    total_exposure_reduction_pct: float
    overall_rationale: str
    best_cleaner_window: Optional[str] = None
