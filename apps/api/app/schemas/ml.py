"""Classical Machine Learning and Evaluation Schemas."""

from typing import Dict, List, Optional
from pydantic import BaseModel


class FeatureImportanceItem(BaseModel):
    feature: str
    importance: float
    description: str


class ModelMetrics(BaseModel):
    mae: float
    rmse: float
    r2: float
    persistence_mae: float
    persistence_rmse: float
    persistence_r2: float
    samples_count: int
    test_period: str
    model_name: str


class MLStatusResponse(BaseModel):
    is_available: bool
    model_type: str
    target_horizon_hours: int = 3
    trained_city: str
    metrics: Optional[ModelMetrics] = None
    feature_importances: List[FeatureImportanceItem] = []
    limitations: List[str] = []
    last_trained: str


class MLPredictionPoint(BaseModel):
    forecast_time_iso: str
    horizon_hours: int
    predicted_pm2_5: float
    persistence_pm2_5: float
    lower_bound_pm2_5: float
    upper_bound_pm2_5: float
    risk_category: str
    uncertainty_method: str = "Empirical Residual Quantiles (90% Confidence Interval)"


class MLPredictionRequest(BaseModel):
    city: str = "Delhi"
    recent_pm2_5_history: List[float]
    current_weather: Optional[Dict[str, float]] = None


class MLPredictionResponse(BaseModel):
    city: str
    origin_time_iso: str
    target_horizon_hours: int
    predictions: List[MLPredictionPoint]
    model_used: str
    status: str
    provenance_note: str
