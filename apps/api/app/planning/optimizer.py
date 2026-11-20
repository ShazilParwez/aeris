"""Cleaner Day Planner - Interactive Schedule Optimizer.

Evaluates user's planned activities against hourly air quality forecasts,
identifying lower-pollution scheduling windows and indoor substitution opportunities
while strictly respecting fixed constraints and user autonomy.
"""

from typing import List, Optional
from datetime import datetime
from app.schemas.planner import (
    ActivityItem,
    OptimizedActivity,
    PlannerOptimizeRequest,
    PlannerOptimizeResponse,
)
from app.integrations.open_meteo import fetch_air_quality


def _parse_hour(time_str: str) -> int:
    try:
        parts = time_str.strip().split(":")
        return int(parts[0])
    except Exception:
        return 9


def optimize_schedule(
    request: PlannerOptimizeRequest,
    hourly_forecast: list,
) -> PlannerOptimizeResponse:
    if not request.activities:
        return PlannerOptimizeResponse(
            original_activities=[],
            suggested_activities=[],
            total_exposure_reduction_pct=0.0,
            overall_rationale="No activities provided to optimize.",
            best_cleaner_window=None,
        )

    # Build hour lookup: hour_int -> (aqi, pm25)
    hour_map = {}
    for pt in hourly_forecast[:24]:
        try:
            # pt.time_iso e.g. "2026-11-20T07:00" or ISO format
            h = int(pt.time_iso[11:13])
            hour_map[h] = (pt.aqi, pt.pm2_5 or (pt.aqi * 0.75))
        except Exception:
            pass

    # Find the day's relatively cleanest active window (between 08:00 and 19:00)
    best_clean_hour = 14
    min_day_aqi = 9999.0
    for h in range(8, 20):
        if h in hour_map and hour_map[h][0] < min_day_aqi:
            min_day_aqi = hour_map[h][0]
            best_clean_hour = h

    # Map of occupied hours by fixed activities
    occupied_hours = set()
    for act in request.activities:
        if act.is_fixed:
            h = _parse_hour(act.preferred_time)
            occupied_hours.add(h)

    suggested: List[OptimizedActivity] = []
    total_orig_exposure = 0.0
    total_sugg_exposure = 0.0

    for act in request.activities:
        orig_h = _parse_hour(act.preferred_time)
        orig_aqi, orig_pm25 = hour_map.get(orig_h, (180.0, 120.0))
        act_exposure_orig = orig_pm25 * (act.duration_minutes / 60.0) if act.is_outdoor else (orig_pm25 * 0.4 * (act.duration_minutes / 60.0))
        total_orig_exposure += act_exposure_orig

        if not act.is_outdoor:
            # Indoor activity already shielded
            suggested.append(
                OptimizedActivity(
                    id=act.id,
                    title=act.title,
                    original_time=act.preferred_time,
                    suggested_time=act.preferred_time,
                    duration_minutes=act.duration_minutes,
                    is_outdoor=False,
                    is_fixed=act.is_fixed,
                    status="unchanged",
                    change_rationale="Indoor activity with lower direct particulate exposure.",
                    original_aqi=orig_aqi,
                    suggested_aqi=orig_aqi,
                    relative_exposure_delta_pct=0.0,
                )
            )
            total_sugg_exposure += act_exposure_orig
            continue

        if act.is_fixed:
            # Fixed outdoor activity (e.g. school commute)
            advice = (
                f"Fixed schedule at {act.preferred_time}. Forecasted AQI is {round(orig_aqi)} ({round(orig_pm25)} µg/m³ PM2.5). "
                "Recommendation: Wear a certified, well-fitted particulate respirator (N95/FFP2) and select enclosed transit."
            )
            suggested.append(
                OptimizedActivity(
                    id=act.id,
                    title=act.title,
                    original_time=act.preferred_time,
                    suggested_time=act.preferred_time,
                    duration_minutes=act.duration_minutes,
                    is_outdoor=True,
                    is_fixed=True,
                    status="unchanged",
                    change_rationale=advice,
                    original_aqi=orig_aqi,
                    suggested_aqi=orig_aqi,
                    relative_exposure_delta_pct=0.0,
                )
            )
            total_sugg_exposure += act_exposure_orig
            continue

        # Flexible outdoor activity (e.g. morning walk, exercise, outdoor market)
        if orig_aqi >= 150:
            # If pollution is severe throughout the day or user is exercising:
            is_strenuous = any(k in act.title.lower() for k in ["run", "jog", "workout", "cardio", "sports", "football", "tennis"])

            if is_strenuous and orig_aqi >= 200:
                # Recommend moving indoors!
                sugg_exposure = (orig_pm25 * 0.3) * (act.duration_minutes / 60.0)
                reduction = ((act_exposure_orig - sugg_exposure) / act_exposure_orig) * 100.0 if act_exposure_orig > 0 else 0.0
                total_sugg_exposure += sugg_exposure

                suggested.append(
                    OptimizedActivity(
                        id=act.id,
                        title=f"{act.title} (Indoor Alternative)",
                        original_time=act.preferred_time,
                        suggested_time=act.preferred_time,
                        duration_minutes=act.duration_minutes,
                        is_outdoor=False,
                        is_fixed=False,
                        status="moved_indoors",
                        change_rationale=(
                            f"Outdoor AQI at {act.preferred_time} is {round(orig_aqi)} (Hazardous/Unhealthy). "
                            "Strenuous physical activity dramatically increases inhalation volume. Moving indoors with air purification "
                            "avoids up to 70% of deep pulmonary particulate deposition."
                        ),
                        original_aqi=orig_aqi,
                        suggested_aqi=round(orig_aqi * 0.35, 1),
                        relative_exposure_delta_pct=round(reduction, 1),
                    )
                )
            else:
                # Find best available cleaner hour
                target_hour = best_clean_hour
                # If target hour is occupied, find neighboring hour
                if target_hour in occupied_hours:
                    for offset in [1, -1, 2, -2, 3]:
                        candidate = target_hour + offset
                        if 8 <= candidate <= 19 and candidate not in occupied_hours:
                            target_hour = candidate
                            break

                sugg_time_str = f"{target_hour:02d}:00"
                sugg_aqi, sugg_pm25 = hour_map.get(target_hour, (orig_aqi * 0.7, orig_pm25 * 0.7))
                sugg_exposure = sugg_pm25 * (act.duration_minutes / 60.0)
                reduction = ((act_exposure_orig - sugg_exposure) / act_exposure_orig) * 100.0 if act_exposure_orig > 0 else 0.0
                total_sugg_exposure += sugg_exposure
                occupied_hours.add(target_hour)

                suggested.append(
                    OptimizedActivity(
                        id=act.id,
                        title=act.title,
                        original_time=act.preferred_time,
                        suggested_time=sugg_time_str,
                        duration_minutes=act.duration_minutes,
                        is_outdoor=True,
                        is_fixed=False,
                        status="shifted",
                        change_rationale=(
                            f"Rescheduled from {act.preferred_time} (AQI {round(orig_aqi)}) to cleaner afternoon window at {sugg_time_str} "
                            f"(Forecasted AQI {round(sugg_aqi)}). Boundary layer mixing reduces particulate density."
                        ),
                        original_aqi=orig_aqi,
                        suggested_aqi=sugg_aqi,
                        relative_exposure_delta_pct=round(reduction, 1),
                    )
                )
        else:
            # Pollution is already moderate/good
            suggested.append(
                OptimizedActivity(
                    id=act.id,
                    title=act.title,
                    original_time=act.preferred_time,
                    suggested_time=act.preferred_time,
                    duration_minutes=act.duration_minutes,
                    is_outdoor=True,
                    is_fixed=False,
                    status="unchanged",
                    change_rationale=f"Original window at {act.preferred_time} is acceptable (AQI {round(orig_aqi)}).",
                    original_aqi=orig_aqi,
                    suggested_aqi=orig_aqi,
                    relative_exposure_delta_pct=0.0,
                )
            )
            total_sugg_exposure += act_exposure_orig

    total_reduction = 0.0
    if total_orig_exposure > 0:
        total_reduction = round(((total_orig_exposure - total_sugg_exposure) / total_orig_exposure) * 100.0, 1)

    overall_rationale = (
        f"Reorganized schedule reduces estimated personal daily particulate inhalation by {max(0.0, total_reduction)}%. "
        f"Avoided peak morning temperature inversion stagnation and utilized the {best_clean_hour:02d}:00 solar dispersion window."
    )

    return PlannerOptimizeResponse(
        original_activities=request.activities,
        suggested_activities=suggested,
        total_exposure_reduction_pct=max(0.0, total_reduction),
        overall_rationale=overall_rationale,
        best_cleaner_window=f"{best_clean_hour:02d}:00 - {best_clean_hour+2:02d}:00",
    )
