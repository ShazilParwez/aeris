"""Unit tests for the Cleaner Day Planner Optimizer."""

import pytest
from app.integrations.open_meteo import _get_delhi_demo_fixture
from app.planning.optimizer import optimize_schedule
from app.schemas.planner import ActivityItem, PlannerOptimizeRequest


def test_planner_moves_strenuous_outdoor_run_indoors():
    aq = _get_delhi_demo_fixture()
    request = PlannerOptimizeRequest(
        activities=[
            ActivityItem(
                id="act1",
                title="Morning Outdoor Run",
                preferred_time="07:00",
                duration_minutes=45,
                is_outdoor=True,
                is_fixed=False,
            ),
            ActivityItem(
                id="act2",
                title="School Drop-off",
                preferred_time="08:15",
                duration_minutes=30,
                is_outdoor=True,
                is_fixed=True,
            ),
        ],
        latitude=28.6139,
        longitude=77.2090,
    )

    resp = optimize_schedule(request=request, hourly_forecast=aq.hourly_forecast)
    assert len(resp.suggested_activities) == 2

    run_sugg = next(a for a in resp.suggested_activities if a.id == "act1")
    assert run_sugg.status in ("moved_indoors", "shifted")
    assert run_sugg.relative_exposure_delta_pct > 0.0

    # Fixed school drop-off should stay unchanged in time
    school_sugg = next(a for a in resp.suggested_activities if a.id == "act2")
    assert school_sugg.suggested_time == "08:15"
    assert school_sugg.is_fixed is True


def test_planner_empty_activities():
    request = PlannerOptimizeRequest(
        activities=[],
        latitude=28.6139,
        longitude=77.2090,
    )
    resp = optimize_schedule(request=request, hourly_forecast=[])
    assert resp.suggested_activities == []
    assert resp.total_exposure_reduction_pct == 0.0
