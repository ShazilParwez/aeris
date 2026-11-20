"""AERIS Deterministic Recommendation Engine.

Generates prioritized, grounded, actionable recommendations based on:
1. Real environmental conditions & pollutant concentrations
2. Forecasted atmospheric dispersion & cleaner windows
3. Family sensitivity profiles (children, elderly, respiratory conditions)
4. Lifestyle preferences (commute, exercise, cooking, air filtration)
"""

from typing import List, Optional
from app.schemas.environmental import AirQualityResponse, AQICategory
from app.schemas.profiles import LifestyleProfile, SensitivityLevel, TransportMode
from app.schemas.recommendations import (
    RecommendationItem,
    RecommendationCategory,
    PriorityLevel,
    ImpactDimension,
)


def generate_recommendations(
    air_quality: AirQualityResponse,
    profile: Optional[LifestyleProfile] = None,
) -> List[RecommendationItem]:
    items: List[RecommendationItem] = []
    aqi = air_quality.current.aqi
    pm25 = air_quality.current.pollutants.pm2_5 or 50.0

    # Inspect family sensitivities
    has_child = False
    has_elderly = False
    has_sensitive = False
    if profile and profile.family_members:
        for m in profile.family_members:
            if m.sensitivity == SensitivityLevel.CHILD:
                has_child = True
            elif m.sensitivity == SensitivityLevel.OLDER_ADULT:
                has_elderly = True
            elif m.sensitivity in (
                SensitivityLevel.RESPIRATORY_SENSITIVE,
                SensitivityLevel.CARDIO_SENSITIVE,
            ):
                has_sensitive = True

    # 1. Family & Exposure Reduction Rules
    if aqi >= 200 or pm25 >= 150:
        if has_child or has_sensitive:
            items.append(
                RecommendationItem(
                    id="rec_fam_severe_shelter",
                    category=RecommendationCategory.FAMILY_PROTECTION,
                    priority=PriorityLevel.HIGH,
                    title="Restrict Outdoor Play & Physical Exertion for Vulnerable Members",
                    action="Keep children and sensitive family members indoors with windows latched. Avoid open-air playgrounds.",
                    explanation=(
                        f"Current PM2.5 is {round(pm25, 1)} µg/m³ (Category: {air_quality.current.category.value}). "
                        "Children possess higher respiratory rates per kilogram of body mass and developing lung alveoli, "
                        "increasing relative particulate deposition by up to 50% compared to adults."
                    ),
                    triggering_rule="RULE_AQI_SEVERE_CHILD_SENSITIVE",
                    impact_dimension=ImpactDimension.EXPOSURE_REDUCTION,
                    qualitative_benefit="Significantly prevents acute bronchial inflammation and asthma exacerbation.",
                    caveat="Maintain adequate indoor airflow via mechanical filtration or indoor circulation.",
                    action_label="Acknowledge & Adjust Routine",
                )
            )

        items.append(
            RecommendationItem(
                id="rec_exercise_indoor_shift",
                category=RecommendationCategory.EXERCISE_ROUTINE,
                priority=PriorityLevel.HIGH,
                title="Shift Cardio & Workouts to Indoor Filtered Spaces",
                action="Substitute morning outdoor running/walking with indoor yoga, bodyweight training, or gym workouts.",
                explanation=(
                    f"At AQI {round(aqi)}, a 45-minute outdoor run results in inhaling approximately 40–60 µg of fine particulates "
                    "due to oral breathing and elevated tidal volumes (up to 40 L/min vs 6 L/min at rest)."
                ),
                triggering_rule="RULE_EXERCISE_OUTDOOR_HIGH_AQI",
                impact_dimension=ImpactDimension.EXPOSURE_REDUCTION,
                qualitative_benefit="Eliminates the majority of exercise-induced deep lung particulate penetration.",
                caveat="Ensure indoor room has an operating air purifier or closed windows during the workout.",
                action_label="View Indoor Workout Plan",
            )
        )
    elif aqi >= 101:
        items.append(
            RecommendationItem(
                id="rec_exercise_cleaner_window",
                category=RecommendationCategory.EXERCISE_ROUTINE,
                priority=PriorityLevel.MEDIUM,
                title="Time Outdoor Activities to the Afternoon Cleaner Window",
                action=(
                    f"Reschedule outdoor walks to {air_quality.cleaner_windows[0].start_time} - {air_quality.cleaner_windows[0].end_time} "
                    if air_quality.cleaner_windows
                    else "Reschedule outdoor walks to early afternoon."
                ),
                explanation=(
                    "Atmospheric boundary layer height rises in the afternoon due to surface solar heating, "
                    "diluting surface-level particulate concentrations compared to stagnant morning inversion peaks."
                ),
                triggering_rule="RULE_CLEANER_WINDOW_RESCHEDULE",
                impact_dimension=ImpactDimension.EXPOSURE_REDUCTION,
                qualitative_benefit="Reduces direct inhalation exposure by approximately 25–40% relative to morning hours.",
                caveat="Sensitive groups should still limit duration or wear a well-fitted particulate respirator.",
                action_label="Schedule for Cleaner Window",
            )
        )

    # 2. Sustainable Commute & Exposure Tradeoff Rules
    if aqi >= 150:
        items.append(
            RecommendationItem(
                id="rec_commute_exposure_tradeoff",
                category=RecommendationCategory.SUSTAINABLE_TRANSPORT,
                priority=PriorityLevel.HIGH if aqi >= 250 else PriorityLevel.MEDIUM,
                title="Prefer Metro or AC Public Transit Over Roadside Cycling/Walking",
                action="Switch from active roadside commuting (cycling/walking) or open auto-rickshaws to sealed Metro train or AC bus.",
                explanation=(
                    "Under severe winter smog, cycling alongside traffic exposes the commuter to direct vehicular exhaust plumes "
                    "combined with high respiratory ventilation rates. Electric Metro systems provide filtered cabin air "
                    "while generating zero direct tailpipe emissions."
                ),
                triggering_rule="RULE_2D_TRANSPORT_EXPOSURE_VS_EMISSION",
                impact_dimension=ImpactDimension.DUAL_BENEFIT,
                qualitative_benefit="Reduces personal particulate inhalation by ~60% while maintaining low carbon mobility.",
                caveat="Wear a sealed N95 respirator during the first-mile/last-mile walking portions to the station.",
                action_label="Compare Commute Options",
            )
        )
    else:
        items.append(
            RecommendationItem(
                id="rec_commute_active_green",
                category=RecommendationCategory.SUSTAINABLE_TRANSPORT,
                priority=PriorityLevel.LOW,
                title="Adopt Active Transport via Low-Traffic Corridors",
                action="Choose cycling, walking, or shared public transit for trips under 5 km.",
                explanation=(
                    "Air quality is currently in a moderate range. Choosing active mobility eliminates direct motor emissions "
                    "and improves cardiovascular health without severe pollution exposure penalties."
                ),
                triggering_rule="RULE_ACTIVE_TRANSPORT_FAVORABLE",
                impact_dimension=ImpactDimension.EMISSION_REDUCTION,
                qualitative_benefit="Saves approximately 150–200 g CO2 per kilometer compared to private petrol vehicles.",
                action_label="Plan Sustainable Route",
            )
        )

    # 3. Indoor Air & Low-Cost Playbook Rules
    if aqi >= 150:
        items.append(
            RecommendationItem(
                id="rec_indoor_ventilation_timing",
                category=RecommendationCategory.INDOOR_AIR,
                priority=PriorityLevel.HIGH,
                title="Avoid Early Morning Window Ventilation; Practice Timed Afternoon Flushes",
                action="Keep windows sealed between 06:00 and 10:00 AM. If ventilation is required, perform a brief 10-minute cross-ventilation flush between 13:30 and 15:00.",
                explanation=(
                    "Nighttime ground radiative cooling produces a thermal inversion layer that traps ground-level pollution until noon. "
                    "Opening windows during early morning allows highly toxic fine particulate matter into living quarters."
                ),
                triggering_rule="RULE_THERMAL_INVERSION_VENTILATION",
                impact_dimension=ImpactDimension.EXPOSURE_REDUCTION,
                qualitative_benefit="Prevents indoor PM2.5 spikes from matching hazardous outdoor concentrations.",
                caveat="Do not seal rooms completely indefinitely without periodic CO2 flushing or mechanical ventilation.",
                action_label="View Indoor Air Protocol",
            )
        )

    # Cooking & Indoor particulate rule
    items.append(
        RecommendationItem(
            id="rec_indoor_cooking_exhaust",
            category=RecommendationCategory.INDOOR_AIR,
            priority=PriorityLevel.MEDIUM,
            title="Deploy Kitchen Exhaust & Damp-Dusting to Suppress Indoor Spikes",
            action="Run the range hood or window exhaust fan 2 minutes before and 5 minutes after cooking. Use damp microfiber cloths rather than dry sweeping.",
            explanation=(
                "Domestic frying and sautéing oils can generate indoor PM2.5 concentrations exceeding 200 µg/m³. "
                "Dry brooming resuspends coarse dust (PM10). Damp mopping captures settled particles effectively."
            ),
            triggering_rule="RULE_INDOOR_SOURCE_MITIGATION",
            impact_dimension=ImpactDimension.EXPOSURE_REDUCTION,
            qualitative_benefit="Maintains indoor particulate levels 40–70% lower than unmitigated indoor environments.",
            caveat="Zero equipment cost behavior change suitable for renters and budget-conscious households.",
            action_label="Review Kitchen Checklist",
        )
    )

    # Sort items by priority: HIGH -> MEDIUM -> LOW
    priority_order = {PriorityLevel.HIGH: 0, PriorityLevel.MEDIUM: 1, PriorityLevel.LOW: 2}
    items.sort(key=lambda x: priority_order[x.priority])

    # Return top 3-4 priority actions
    return items[:4]
