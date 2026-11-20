"""Unit tests for Classical Machine Learning Pipeline and Serving Registry."""

import pytest
from ml.model_registry import registry
from ml.feature_engineering import FEATURE_COLUMNS, TARGET_COLUMN


def test_ml_model_loaded_and_metadata_intact():
    status = registry.get_status()
    assert status.is_available is True
    assert status.target_horizon_hours == 3
    assert status.metrics is not None
    # Verify model actually beat persistence on held-out test data
    assert status.metrics.mae < status.metrics.persistence_mae
    assert status.metrics.r2 > status.metrics.persistence_r2
    assert len(status.feature_importances) > 0


def test_ml_prediction_valid_delhi():
    # Provide 24h history
    dummy_hist = [180.0 + (i * 2) for i in range(25)]
    res = registry.predict_3h(
        city="Delhi",
        pm2_5_history=dummy_hist,
        weather={"temperature_c": 16.0, "relative_humidity_pct": 80.0, "wind_speed_kmh": 4.5},
    )
    assert res.status == "success"
    assert len(res.predictions) == 1
    pt = res.predictions[0]
    assert pt.predicted_pm2_5 > 0.0
    assert pt.lower_bound_pm2_5 < pt.predicted_pm2_5 < pt.upper_bound_pm2_5
    assert pt.risk_category in ("Unhealthy", "Very Unhealthy", "Hazardous", "Moderate")


def test_ml_unsupported_location_boundary():
    # Verifies scientific boundary rule: don't apply Delhi winter inversion model to London or Tokyo
    res = registry.predict_3h(city="London", pm2_5_history=[20.0] * 25)
    assert res.status == "unsupported_location"
    assert len(res.predictions) == 0
    assert "Geographic Applicability Boundary" in res.model_used
