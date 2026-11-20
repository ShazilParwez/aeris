"""Adversarial and Security Edge-Case Tests for AERIS schemas and services.

Verifies:
1. Coordinate boundary validation (rejection of latitude > 90, < -90, longitude > 180, < -180).
2. Input payload bounding (excessive length, negative values, empty arrays).
3. In-memory rate limiting defense against rapid automated endpoint flooding.
4. Classical ML geographic domain enforcement (rejection of uncalibrated cities).
"""

import pytest
from pydantic import ValidationError
from fastapi import HTTPException

from app.schemas.planner import PlannerOptimizeRequest, ActivityItem
from app.schemas.impact import TransportComparisonRequest
from app.schemas.profiles import TransportMode
from app.schemas.ml import MLPredictionRequest
from app.schemas.assistant import AssistantChatRequest
from app.api.v1.endpoints import check_rate_limit, _RATE_LIMITS
from ml.model_registry import registry


def test_adversarial_invalid_coordinates_rejected():
    """Verify schemas reject out-of-range coordinates with ValidationError rather than silently clamping."""
    # Invalid latitude > 90
    with pytest.raises(ValidationError):
        PlannerOptimizeRequest(activities=[], latitude=125.0, longitude=77.2)

    # Invalid latitude < -90
    with pytest.raises(ValidationError):
        PlannerOptimizeRequest(activities=[], latitude=-95.0, longitude=77.2)

    # Invalid longitude > 180
    with pytest.raises(ValidationError):
        PlannerOptimizeRequest(activities=[], latitude=28.6, longitude=250.0)

    # Invalid longitude < -180
    with pytest.raises(ValidationError):
        PlannerOptimizeRequest(activities=[], latitude=28.6, longitude=-195.0)


def test_adversarial_impact_comparison_bounds():
    """Verify negative or excessive commute distances are rejected."""
    # Distance <= 0
    with pytest.raises(ValidationError):
        TransportComparisonRequest(
            baseline_mode=TransportMode.PRIVATE_CAR,
            alternative_mode=TransportMode.METRO_TRAIN,
            distance_km=-5.0,
            current_pm2_5=150.0,
        )

    # Distance > 500 km
    with pytest.raises(ValidationError):
        TransportComparisonRequest(
            baseline_mode=TransportMode.PRIVATE_CAR,
            alternative_mode=TransportMode.METRO_TRAIN,
            distance_km=9999.0,
            current_pm2_5=150.0,
        )


def test_adversarial_ml_predict_input_bounds():
    """Verify ML prediction bounds on history vector length."""
    # Empty history
    with pytest.raises(ValidationError):
        MLPredictionRequest(city="Delhi", recent_pm2_5_history=[])

    # History > 168 hours
    with pytest.raises(ValidationError):
        MLPredictionRequest(city="Delhi", recent_pm2_5_history=[100.0] * 200)


def test_adversarial_chat_oversized_payload_rejected():
    """Verify oversized chat question payloads (>1000 chars) are rejected."""
    huge_question = "What should I do? " * 100  # 1800 characters
    with pytest.raises(ValidationError):
        AssistantChatRequest(
            question=huge_question,
            location_name="Delhi",
            current_aqi=300.0,
        )


def test_adversarial_rate_limiting_enforcement():
    """Verify rate limiter throws 429 after 30 requests in a 60-second window."""
    class MockClient:
        host = "192.168.1.100"

    class MockRequest:
        client = MockClient()

    req = MockRequest()
    _RATE_LIMITS["192.168.1.100"].clear()

    # First 30 requests succeed
    for _ in range(30):
        check_rate_limit(req)

    # 31st request triggers 429 Too Many Requests
    with pytest.raises(HTTPException) as exc_info:
        check_rate_limit(req)
    assert exc_info.value.status_code == 429
    assert "Rate limit exceeded" in exc_info.value.detail


def test_adversarial_ml_geographic_domain_boundary():
    """Verify non-Delhi queries receive explicit boundary rejection rather than misleading predictions."""
    res = registry.predict_3h(city="Paris", pm2_5_history=[25.0] * 24)
    assert res.status == "unsupported_location"
    assert len(res.predictions) == 0
    assert "Geographic Applicability Boundary" in res.model_used
