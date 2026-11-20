"""Deterministic Recommendation Schemas."""

from enum import Enum
from typing import Optional
from pydantic import BaseModel


class RecommendationCategory(str, Enum):
    EXPOSURE_REDUCTION = "exposure_reduction"
    SUSTAINABLE_TRANSPORT = "sustainable_transport"
    INDOOR_AIR = "indoor_air"
    EXERCISE_ROUTINE = "exercise_routine"
    FAMILY_PROTECTION = "family_protection"


class PriorityLevel(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class ImpactDimension(str, Enum):
    EXPOSURE_REDUCTION = "exposure_reduction"
    EMISSION_REDUCTION = "emission_reduction"
    DUAL_BENEFIT = "dual_benefit"


class RecommendationItem(BaseModel):
    id: str
    category: RecommendationCategory
    priority: PriorityLevel
    title: str
    action: str
    explanation: str
    triggering_rule: str
    impact_dimension: ImpactDimension
    qualitative_benefit: str
    caveat: Optional[str] = None
    action_label: str = "Apply Recommendation"
