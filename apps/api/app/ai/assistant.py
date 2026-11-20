"""Ask AERIS - Context-Grounded AI Assistant.

Integrates Google Gen AI SDK (Gemini) when configured with GEMINI_API_KEY.
Provides an exceptional, deterministic, rule-grounded environmental expert assistant
when GEMINI_API_KEY is not configured or offline.
"""

from typing import List, Optional
from app.core.config import settings
from app.schemas.assistant import AssistantChatRequest, AssistantChatResponse


def _deterministic_rule_based_reply(req: AssistantChatRequest) -> AssistantChatResponse:
    q_lower = req.question.lower()
    aqi_str = f"AQI {round(req.current_aqi)}" if req.current_aqi else "current air quality"
    pm25_str = f"{round(req.current_pm2_5, 1)} µg/m³ PM2.5" if req.current_pm2_5 else "elevated particulates"

    facts = [
        f"Location: {req.location_name}",
        f"Current condition: {aqi_str} ({pm25_str})",
        "Source: Open-Meteo Atmospheric Forecast System",
    ]

    actions = []
    follow_ups = []

    if any(k in q_lower for k in ["child", "kid", "baby", "school"]):
        answer = (
            f"In {req.location_name} under {aqi_str}, children should avoid strenuous outdoor physical activities and playground play. "
            "Because children breathe more air per kilogram of body weight than adults and their pulmonary defense mechanisms are still developing, "
            "exposure to fine particulate matter (PM2.5) during smog spikes significantly triggers bronchial irritation and asthma flare-ups. "
            "If school commutes require outdoor walking, ensure your child wears an appropriately sized, well-fitted particulate respirator (N95 or certified child-size filtration mask)."
        )
        actions = [
            "Keep school drop-offs enclosed (car with recirculation or bus with closed windows)",
            "Request school management to conduct physical education sessions indoors",
            "Maintain an air purifier in your child's bedroom during nighttime sleep",
        ]
        follow_ups = [
            "What type of mask fits children safely?",
            "When is the least polluted time for outdoor school activities?",
            "How do I clean indoor air in our bedroom?",
        ]

    elif any(k in q_lower for k in ["walk", "exercise", "run", "jog", "workout", "cycling"]):
        answer = (
            f"With {req.location_name}'s {aqi_str}, morning outdoor exercise (06:00 - 09:30) carries high respiratory risk. "
            "During winter mornings, radiative ground cooling traps pollution within a low boundary layer. "
            "Running or cycling increases minute ventilation by 3x to 5x, bypassing upper nasal filtration and lodging toxic particulates deep in the alveolar tissue. "
            "We strongly advise moving your workout indoors to a room with an operating air purifier. If outdoor walking is necessary, reschedule to the early afternoon "
            "(13:00 - 15:30) when solar surface heating temporarily disperses particulates."
        )
        actions = [
            "Switch to indoor bodyweight training, yoga, or indoor treadmill workouts",
            "Reschedule essential outdoor walking to the 13:00–15:30 cleaner window",
            "Avoid deep breathing alongside vehicular traffic arteries",
        ]
        follow_ups = [
            "What is the best time today to go for a brief walk?",
            "Should I wear an N95 mask while walking?",
            "How does exercise increase pollution inhalation?",
        ]

    elif any(k in q_lower for k in ["cook", "kitchen", "smoke", "frying"]):
        answer = (
            "Indoor cooking—particularly frying with high-temperature oils, dry roasting spices, or gas combustion—can generate indoor PM2.5 "
            "concentrations exceeding 200–300 µg/m³ inside the kitchen. To minimize indoor accumulation without letting outdoor smog inside: "
            "1) Turn on the range hood / kitchen exhaust 2 minutes before igniting burners and keep it running 5 minutes after. "
            "2) Keep internal doors to living areas and bedrooms closed while cooking. "
            "3) Prefer covered boiling, steaming, or electric induction over high-heat open-flame frying."
        )
        actions = [
            "Keep kitchen exhaust on during and 5 minutes after cooking",
            "Isolate the kitchen from bedrooms by closing internal doors",
            "Wipe kitchen counters with damp microfiber cloths to capture soot",
        ]
        follow_ups = [
            "Do gas stoves release nitrogen dioxide inside homes?",
            "How does kitchen ventilation affect outdoor smog entry?",
            "What are the best low-cost indoor air cleaning hacks?",
        ]

    elif any(k in q_lower for k in ["window", "ventilate", "ventilation", "open"]):
        answer = (
            f"Under {req.location_name}'s {aqi_str}, avoid opening windows during early morning or late evening hours. "
            "Winter atmospheric inversions are strongest at dawn and dusk, concentrating diesel soot and biomass smoke near window level. "
            "However, houses should not remain hermetically sealed indefinitely due to carbon dioxide (CO2) and indoor volatile organic buildup. "
            "The safest approach is a short 10-to-15 minute cross-ventilation 'air flush' between 13:30 and 15:00 when ambient particulate density is relatively lower, "
            "followed by running indoor HEPA filtration on high for 30 minutes."
        )
        actions = [
            "Keep windows firmly closed between 06:00 and 10:00 AM",
            "Conduct a single 10-minute flush during the early afternoon solar peak",
            "Operate indoor air purifiers immediately following ventilation",
        ]
        follow_ups = [
            "How long should I run an air purifier after opening windows?",
            "What happens to indoor CO2 levels when windows stay shut?",
            "Is opening windows safe during rainfall?",
        ]

    elif any(k in q_lower for k in ["cycle", "metro", "bus", "car", "commute", "transport"]):
        answer = (
            f"When evaluating commute options under {req.location_name}'s {aqi_str}, AERIS analyzes the crucial tradeoff between emissions and personal exposure: "
            "While cycling eliminates direct vehicle emissions, riding next to roadway traffic during a smog spike subjects your lungs to extreme particulate doses "
            "due to heavy physical exertion. In contrast, taking the Electric Metro or an air-conditioned bus achieves high carbon reduction while offering "
            "enclosed, filtered air that cuts personal particulate exposure by ~50% to 65%."
        )
        actions = [
            "Prioritize the Metro / electric train over roadside cycling during severe smog",
            "If driving a car, keep windows shut and set AC to internal recirculation",
            "Wear an N95 respirator during walking legs to and from transit stations",
        ]
        follow_ups = [
            "How much CO2 does taking the Metro save over a car?",
            "Does car AC filter out fine PM2.5 particulates?",
            "What is the exposure difference between cycling and taking the bus?",
        ]

    elif any(k in q_lower for k in ["why", "pm2.5", "pm10", "inversion", "dangerous"]):
        answer = (
            "PM2.5 refers to fine particulate matter with an aerodynamic diameter smaller than 2.5 micrometers—roughly 30 times smaller than the width of a human hair. "
            "Because of their microscopic scale, these particles bypass nasal hairs and mucous membranes, traveling deep into the pulmonary alveoli and penetrating "
            "directly into the bloodstream. During winter, shallow boundary layer heights (temperature inversions) prevent vertical air mixing, trapping smoke, "
            "vehicle exhaust, and industrial emissions near the ground like a lid on a pot."
        )
        actions = [
            "Monitor hourly forecasts rather than looking only at 24-hour averages",
            "Use certified particulate respirators rather than cloth or surgical masks",
            "Minimize high-intensity outdoor cardio during stagnant weather",
        ]
        follow_ups = [
            "Why is winter smog worse than summer pollution?",
            "What is a temperature inversion?",
            "How does humidity affect air quality?",
        ]

    else:
        answer = (
            f"AERIS is monitoring {req.location_name}'s air quality (currently {aqi_str}, {pm25_str}). "
            "To navigate winter air pollution effectively, focus on three actionable levers today: "
            "1) Protect: Shift high-ventilation outdoor activities to the afternoon cleaner window or indoors. "
            "2) Shield: Keep windows sealed in the morning and utilize kitchen exhaust while cooking. "
            "3) Decarbonize safely: Choose filtered public transit (Metro/train) rather than strenuous roadside cycling under heavy smog."
        )
        actions = [
            "Check the Cleaner Day Planner to optimize today's schedule",
            "Review the Indoor Air Playbook for room-by-room protections",
            "Compare your commute in the Sustainable Routine Optimizer",
        ]
        follow_ups = [
            "Can my child play outside today?",
            "What is the cleanest time for a walk?",
            "How should I ventilate my home?",
        ]

    return AssistantChatResponse(
        answer=answer,
        mode="rule_based_fallback",
        grounded_facts=facts,
        suggested_actions=actions,
        follow_up_questions=follow_ups,
        confidence_level="High (Deterministic Environmental Rule Engine)",
        disclaimer="Advisories are educational and behavioral risk estimates. Not medical diagnostic advice.",
    )


async def ask_aeris(req: AssistantChatRequest) -> AssistantChatResponse:
    """Answers user queries with Gemini if API key configured, otherwise deterministic expert rules."""
    if not settings.GEMINI_API_KEY:
        return _deterministic_rule_based_reply(req)

    # If GEMINI_API_KEY is present, call Google Gen AI SDK
    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=settings.GEMINI_API_KEY)

        system_instruction = (
            "You are AERIS, an elite, calm, and scientifically grounded urban air quality and environmental intelligence assistant. "
            "Translate environmental data into actionable, personalized, and practical guidance for urban families navigating winter smog. "
            "STRICT RULES:\n"
            "1. DO NOT invent or hallucinate numerical AQI, pollutant concentrations, or weather readings. You must STRICTLY stick to the verified facts provided in the context.\n"
            "2. DO NOT provide medical diagnosis or prescribe medications. Provide behavioral risk reduction guidance.\n"
            "3. Clearly explain the two-dimensional tradeoff between emissions reduction and personal exposure (e.g. cycling on high AQI days saves carbon but increases toxic inhalation).\n"
            "4. Keep your answer concise, practical, highly structured, and empathetic.\n"
            "5. Include 2-3 specific suggested action bullets and 2-3 follow-up question ideas."
        )

        context_prompt = (
            f"VERIFIED ENVIRONMENTAL CONTEXT:\n"
            f"- City: {req.location_name}\n"
            f"- Current AQI: {req.current_aqi or 'N/A'}\n"
            f"- Current PM2.5: {req.current_pm2_5 or 'N/A'} µg/m³\n"
            f"- Weather: {req.weather_summary or 'Winter atmospheric conditions'}\n"
            f"- Family Context: {req.family_context or 'General household'}\n\n"
            f"USER QUESTION: {req.question}"
        )

        response = await client.aio.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=context_prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.3,
            ),
        )

        ans_text = response.text or "Guidance generated based on current atmospheric conditions."

        facts = [
            f"Location: {req.location_name}",
            f"Verified AQI: {req.current_aqi or 'Available in dashboard'}",
            f"Model: {settings.GEMINI_MODEL} with grounded environmental context",
        ]

        return AssistantChatResponse(
            answer=ans_text,
            mode="gemini_grounded",
            grounded_facts=facts,
            suggested_actions=[
                "Check the Cleaner Day Planner to reorganize affected activities",
                "Review the Indoor Air Playbook for ventilation recommendations",
            ],
            follow_up_questions=[
                "How does the afternoon cleaner window compare to morning hours?",
                "What mask certification is recommended for PM2.5?",
            ],
            confidence_level="High (Gemini Model-Grounded with Live Parameters)",
            disclaimer="Advisories are educational and behavioral risk estimates. Not medical diagnostic advice.",
        )
    except Exception as exc:
        # Graceful fallback to deterministic rule engine if Gemini encounters error/rate limit/timeout
        print(f"[AERIS Assistant] Gemini API error ({type(exc).__name__}): {exc}. Falling back to deterministic expert rules.")
        fallback = _deterministic_rule_based_reply(req)
        fallback.confidence_level = "High (Deterministic Rule-Based Fallback Active)"
        return fallback
