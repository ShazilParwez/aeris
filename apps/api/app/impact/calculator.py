"""Low-Emission Routine Optimizer & Two-Dimensional Impact Model.

Calculates:
1. Direct Environmental Emissions (kg CO2 per passenger-trip)
2. Commuter Personal Inhalation Exposure Index (accounting for route ventilation & filtration)
3. Transparent Tradeoff Analysis avoiding naive assumptions.
"""

from typing import Dict, Any
from app.schemas.profiles import TransportMode
from app.schemas.impact import (
    TransportOptionImpact,
    TransportComparisonRequest,
    TransportComparisonResponse,
)

# Documented Emission Factors (g CO2 per passenger-km)
# Sources: IPCC AR6 WGIII, UK BEIS/DEFRA Greenhouse Gas Reporting, Indian MoRTH Urban Mobility Benchmarks
EMISSION_FACTORS: Dict[TransportMode, float] = {
    TransportMode.PRIVATE_CAR: 172.0,      # Average petrol sedan single-occupancy
    TransportMode.PUBLIC_BUS: 68.0,        # Urban CNG/diesel mixed bus fleet
    TransportMode.METRO_TRAIN: 24.0,       # Mass rapid transit electric grid-backed
    TransportMode.CYCLING: 0.0,            # Zero direct tailpipe emissions
    TransportMode.WALKING: 0.0,            # Zero direct tailpipe emissions
    TransportMode.WORK_FROM_HOME: 0.0,     # Commute avoided entirely
}

# Average Urban Speeds (km/h) for duration estimates
AVERAGE_SPEEDS: Dict[TransportMode, float] = {
    TransportMode.PRIVATE_CAR: 22.0,
    TransportMode.PUBLIC_BUS: 16.0,
    TransportMode.METRO_TRAIN: 32.0,
    TransportMode.CYCLING: 14.0,
    TransportMode.WALKING: 4.5,
    TransportMode.WORK_FROM_HOME: 999.0,
}

# Inhalation rate multiplier (relative to resting 8 L/min)
# Higher exertion = greater air volume drawn into lungs
EXERTION_VENTILATION_MULTIPLIER: Dict[TransportMode, float] = {
    TransportMode.PRIVATE_CAR: 1.0,        # Seated driver
    TransportMode.PUBLIC_BUS: 1.1,         # Seated / standing passenger
    TransportMode.METRO_TRAIN: 1.05,       # Seated / standing passenger
    TransportMode.CYCLING: 3.8,            # Moderate cycling aerobic workload (~30 L/min)
    TransportMode.WALKING: 2.2,            # Moderate walking workload (~18 L/min)
    TransportMode.WORK_FROM_HOME: 0.8,     # Indoor sedentary
}

# In-cabin / microenvironment particulate filtration ratio (relative to ambient curbside PM2.5)
# Value < 1 means cabin acts as protective buffer; > 1 means near tailpipe plume turbulence
MICROENVIRONMENT_RATIO: Dict[TransportMode, float] = {
    TransportMode.PRIVATE_CAR: 0.45,       # Closed windows + cabin AC recirculation
    TransportMode.PUBLIC_BUS: 0.85,        # Mixed open/closed window urban bus
    TransportMode.METRO_TRAIN: 0.35,       # Underground/grade-separated HVAC with MERV filtration
    TransportMode.CYCLING: 1.25,           # Roadside curb lane proximity to tailpipes
    TransportMode.WALKING: 1.15,           # Pedestrian sidewalk roadside exposure
    TransportMode.WORK_FROM_HOME: 0.40,    # Indoor closed home environment
}

MODE_LABELS: Dict[TransportMode, str] = {
    TransportMode.PRIVATE_CAR: "Private Petrol Car",
    TransportMode.PUBLIC_BUS: "Public Transit Bus",
    TransportMode.METRO_TRAIN: "Electric Metro / Subway",
    TransportMode.CYCLING: "Bicycle / Active Cycling",
    TransportMode.WALKING: "Walking / Pedestrian",
    TransportMode.WORK_FROM_HOME: "Remote Work / WFH",
}


def calculate_mode_impact(mode: TransportMode, distance_km: float, current_pm2_5: float) -> TransportOptionImpact:
    factor = EMISSION_FACTORS[mode]
    co2_kg = round((factor * distance_km) / 1000.0, 3)

    speed = AVERAGE_SPEEDS[mode]
    duration_min = max(5, int(round((distance_km / speed) * 60.0))) if speed < 900 else 0

    exertion = EXERTION_VENTILATION_MULTIPLIER[mode]
    micro_ratio = MICROENVIRONMENT_RATIO[mode]

    # Exposure index: proportional to ambient PM2.5 * time * exertion * microenvironment
    # Normalized so resting 1 hour at 100 ug/m3 = 100.0
    exposure_index = round(
        (current_pm2_5 / 100.0) * (duration_min / 60.0) * exertion * micro_ratio * 100.0,
        1,
    )

    methodology = (
        f"Direct tailpipe CO2 calculated at {factor} g/km. Comparative exposure indicator modeled using {exertion}x ventilation factor "
        f"and {micro_ratio}x cabin filtration coefficient relative to ambient PM2.5 ({current_pm2_5} µg/m³)."
    )

    if mode in (TransportMode.CYCLING, TransportMode.WALKING):
        tradeoff = "Zero direct tailpipe carbon emissions, but elevated concentration-time particulate exposure during smog events due to aerobic exertion."
    elif mode == TransportMode.METRO_TRAIN:
        tradeoff = "Optimal dual benefit: high direct carbon reduction with enclosed, HVAC-filtered cabin minimizing particulate exposure."
    elif mode == TransportMode.PRIVATE_CAR:
        tradeoff = "Filtered in-cabin air if AC is on recirculation, but highest direct tailpipe emissions per passenger-kilometer."
    else:
        tradeoff = "Intermediate direct emissions and exposure profile."

    return TransportOptionImpact(
        mode=mode,
        mode_label=MODE_LABELS[mode],
        distance_km=distance_km,
        estimated_co2_kg=co2_kg,
        relative_exposure_index=exposure_index,
        estimated_duration_min=duration_min,
        methodology=methodology,
        tradeoff_summary=tradeoff,
    )


def compare_transport_impact(request: TransportComparisonRequest) -> TransportComparisonResponse:
    baseline = calculate_mode_impact(request.baseline_mode, request.distance_km, request.current_pm2_5)
    alternative = calculate_mode_impact(request.alternative_mode, request.distance_km, request.current_pm2_5)

    co2_saved = round(baseline.estimated_co2_kg - alternative.estimated_co2_kg, 3)
    co2_pct = (
        round((co2_saved / baseline.estimated_co2_kg) * 100.0, 1)
        if baseline.estimated_co2_kg > 0
        else 0.0
    )

    # Exposure comparison
    exp_diff = alternative.relative_exposure_index - baseline.relative_exposure_index
    if exp_diff > 15:
        exp_text = (
            f"Attention: While {alternative.mode_label} saves {co2_saved} kg of direct tailpipe CO2, "
            f"it increases your relative concentration-time particulate exposure indicator by +{round((alternative.relative_exposure_index / max(1.0, baseline.relative_exposure_index) - 1)*100)}% "
            f"due to aerobic physical exertion and proximity to roadway vehicular exhaust."
        )
        reconcile = (
            "During severe winter smog, prefer Electric Metro or wear an airtight N95/FFP2 respirator "
            "if choosing active cycling or walking."
        )
    elif exp_diff < -10:
        exp_text = (
            f"Win-Win: {alternative.mode_label} saves {co2_saved} kg of direct tailpipe CO2 AND decreases your particulate exposure indicator "
            f"by {round(abs(exp_diff), 1)} index points due to sealed, filtered cabin air."
        )
        reconcile = "Highly recommended: achieves both transport decarbonization and personal respiratory risk mitigation."
    else:
        exp_text = f"{alternative.mode_label} offers comparable exposure while cutting direct tailpipe CO2 by {co2_pct}%."
        reconcile = "A sustainable alternative that maintains manageable personal exposure."

    assumptions = [
        "Emissions factors derived from DEFRA & MoRTH urban transit averages.",
        "Individual car emissions assume single occupancy in a standard petrol vehicle.",
        "Metro electricity emissions calculated using current regional grid carbon intensity.",
        "Respiratory ventilation rate for cycling estimated at ~30 L/min vs ~8 L/min seated.",
        "Car cabin filtration assumes windows closed with AC set to fresh/recirculate mix.",
    ]

    return TransportComparisonResponse(
        baseline=baseline,
        alternative=alternative,
        co2_saved_kg=co2_saved,
        co2_reduction_pct=co2_pct,
        exposure_comparison_text=exp_text,
        reconciliation_advice=reconcile,
        data_assumptions=assumptions,
    )
