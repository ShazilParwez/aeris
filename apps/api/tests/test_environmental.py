"""Unit tests for Environmental schemas, AQI calculation, and Data Integration."""

import pytest
from app.schemas.environmental import (
    AQICategory,
    aqi_to_category,
    DataProvenance,
    PollutantBreakdown,
)
from app.integrations.open_meteo import _get_delhi_demo_fixture


def test_aqi_category_boundaries():
    # US EPA standard breakpoints
    assert aqi_to_category(0) == AQICategory.GOOD
    assert aqi_to_category(50) == AQICategory.GOOD
    assert aqi_to_category(51) == AQICategory.MODERATE
    assert aqi_to_category(100) == AQICategory.MODERATE
    assert aqi_to_category(101) == AQICategory.UNHEALTHY_SENSITIVE
    assert aqi_to_category(150) == AQICategory.UNHEALTHY_SENSITIVE
    assert aqi_to_category(151) == AQICategory.UNHEALTHY
    assert aqi_to_category(200) == AQICategory.UNHEALTHY
    assert aqi_to_category(201) == AQICategory.VERY_UNHEALTHY
    assert aqi_to_category(300) == AQICategory.VERY_UNHEALTHY
    assert aqi_to_category(301) == AQICategory.HAZARDOUS
    assert aqi_to_category(500) == AQICategory.HAZARDOUS


def test_missing_pollutant_handling():
    # Partial pollutant payload should not raise errors
    p = PollutantBreakdown(pm2_5=85.0, pm10=None, ozone=None)
    assert p.pm2_5 == 85.0
    assert p.pm10 is None
    assert p.ozone is None


def test_demo_fixture_validity():
    fixture = _get_delhi_demo_fixture()
    assert fixture.location.name == "Delhi"
    assert fixture.current.aqi > 200
    assert fixture.current.category in (AQICategory.VERY_UNHEALTHY, AQICategory.HAZARDOUS)
    assert len(fixture.hourly_forecast) >= 24
    assert len(fixture.cleaner_windows) >= 1
    assert fixture.provenance.is_demo_fixture is True
    assert "U.S. EPA" in fixture.provenance.indian_standard_note
