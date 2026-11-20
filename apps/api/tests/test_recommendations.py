"""Unit tests for the Deterministic Recommendation Engine."""

import pytest
from app.integrations.open_meteo import _get_delhi_demo_fixture
from app.recommendations.engine import generate_recommendations
from app.schemas.profiles import (
    LifestyleProfile,
    FamilyMember,
    SensitivityLevel,
    TransportMode,
)
from app.schemas.recommendations import PriorityLevel, RecommendationCategory


def test_sensitive_child_triggers_high_priority_alert():
    aq = _get_delhi_demo_fixture()
    profile = LifestyleProfile(
        family_members=[
            FamilyMember(id="m1", name="Aarav", role="Son", sensitivity=SensitivityLevel.CHILD)
        ],
        primary_transport=TransportMode.PUBLIC_BUS,
    )
    recs = generate_recommendations(air_quality=aq, profile=profile)
    assert len(recs) > 0

    # First recommendation should be HIGH priority family protection
    child_rec = next((r for r in recs if r.category == RecommendationCategory.FAMILY_PROTECTION), None)
    assert child_rec is not None
    assert child_rec.priority == PriorityLevel.HIGH
    assert "Children" in child_rec.explanation or "children" in child_rec.action.lower()


def test_priority_sorting_order():
    aq = _get_delhi_demo_fixture()
    recs = generate_recommendations(air_quality=aq)

    priorities = [r.priority for r in recs]
    priority_weights = {PriorityLevel.HIGH: 0, PriorityLevel.MEDIUM: 1, PriorityLevel.LOW: 2}
    weights = [priority_weights[p] for p in priorities]
    assert weights == sorted(weights)  # Must be sorted HIGH -> MEDIUM -> LOW


def test_inversion_and_cooking_rules_present():
    aq = _get_delhi_demo_fixture()
    recs = generate_recommendations(air_quality=aq)

    indoor_recs = [r for r in recs if r.category == RecommendationCategory.INDOOR_AIR]
    assert len(indoor_recs) >= 1
    # Check that kitchen or ventilation is mentioned
    assert any("kitchen" in r.action.lower() or "window" in r.action.lower() for r in indoor_recs)
