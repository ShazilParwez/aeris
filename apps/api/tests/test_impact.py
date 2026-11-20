"""Unit tests for Sustainable Routine & Two-Dimensional Impact Model."""

import pytest
from app.schemas.profiles import TransportMode
from app.schemas.impact import TransportComparisonRequest
from app.impact.calculator import compare_transport_impact, calculate_mode_impact


def test_car_vs_metro_co2_savings():
    req = TransportComparisonRequest(
        baseline_mode=TransportMode.PRIVATE_CAR,
        alternative_mode=TransportMode.METRO_TRAIN,
        distance_km=15.0,
        current_pm2_5=150.0,
    )
    res = compare_transport_impact(req)

    # Car (172 g/km) vs Metro (24 g/km) over 15 km
    assert res.baseline.estimated_co2_kg > res.alternative.estimated_co2_kg
    assert res.co2_saved_kg > 2.0
    assert res.co2_reduction_pct > 80.0
    # Metro has sealed filtered cabin: lower exposure
    assert "Win-Win" in res.exposure_comparison_text or res.alternative.relative_exposure_index < res.baseline.relative_exposure_index


def test_cycling_exposure_tradeoff_under_severe_smog():
    req = TransportComparisonRequest(
        baseline_mode=TransportMode.PRIVATE_CAR,
        alternative_mode=TransportMode.CYCLING,
        distance_km=10.0,
        current_pm2_5=220.0,
    )
    res = compare_transport_impact(req)

    # Cycling saves 100% direct CO2
    assert res.alternative.estimated_co2_kg == 0.0
    # BUT cycling exposure index is higher due to exertion & proximity
    assert res.alternative.relative_exposure_index > res.baseline.relative_exposure_index
    assert "Attention" in res.exposure_comparison_text or "increases" in res.exposure_comparison_text.lower()
