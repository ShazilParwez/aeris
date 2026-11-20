"""Sustainable transport impact comparison schemas."""

from typing import List
from pydantic import BaseModel, Field
from app.schemas.profiles import TransportMode


class TransportOptionImpact(BaseModel):
    mode: TransportMode
    mode_label: str
    distance_km: float
    estimated_co2_kg: float
    relative_exposure_index: float  # Comparative concentration-time exposure indicator (Screening Metric)
    estimated_duration_min: int
    methodology: str
    tradeoff_summary: str


class TransportComparisonRequest(BaseModel):
    baseline_mode: TransportMode = TransportMode.PRIVATE_CAR
    alternative_mode: TransportMode = TransportMode.METRO_TRAIN
    distance_km: float = Field(..., gt=0.0, le=500.0, description="Trip distance in km")
    current_pm2_5: float = Field(..., ge=0.0, le=1500.0, description="Ambient PM2.5 in µg/m³")


class TransportComparisonResponse(BaseModel):
    baseline: TransportOptionImpact
    alternative: TransportOptionImpact
    co2_saved_kg: float
    co2_reduction_pct: float
    exposure_comparison_text: str
    reconciliation_advice: str
    data_assumptions: List[str]
