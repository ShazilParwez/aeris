"""ML Pipeline Schemas and Data Definitions."""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel


class TrainingMetadata(BaseModel):
    model_name: str
    target_variable: str = "pm2_5_lead3"
    target_horizon_hours: int = 3
    dataset_source: str
    start_date: str
    end_date: str
    total_samples: int
    train_samples: int
    test_samples: int
    features_used: List[str]
    best_hyperparameters: Dict[str, Any]
    evaluation_metrics: Dict[str, float]
    baseline_metrics: Dict[str, float]
    feature_importances: List[Dict[str, Any]]
    limitations: List[str]
    created_at_utc: str
