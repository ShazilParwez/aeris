"""Unit and Integration tests for Ask AERIS (GenAI & Deterministic Fallback)."""

from app.schemas.assistant import AssistantChatRequest
from app.ai.assistant import _deterministic_rule_based_reply


def test_deterministic_fallback_child_query():
    req = AssistantChatRequest(
        question="Can my 7-year-old child play outside this afternoon?",
        location_name="Delhi",
        current_aqi=310.0,
        current_pm2_5=240.0,
    )
    res = _deterministic_rule_based_reply(req)
    assert res.mode == "rule_based_fallback"
    assert len(res.grounded_facts) >= 2
    assert len(res.suggested_actions) >= 1
    assert "child" in res.answer.lower() or "strenuous" in res.answer.lower()


def test_deterministic_fallback_cooking_query():
    req = AssistantChatRequest(
        question="How can I reduce smoke and pollution while cooking indoors?",
        location_name="Delhi",
        current_aqi=250.0,
    )
    res = _deterministic_rule_based_reply(req)
    assert "exhaust" in res.answer.lower() or "kitchen" in res.answer.lower()
    assert len(res.follow_up_questions) >= 2


def test_excessively_long_input_safety():
    long_question = "Explain air pollution " + ("safely " * 150)
    req = AssistantChatRequest(
        question=long_question[:990],
        location_name="Delhi",
        current_aqi=180.0,
    )
    res = _deterministic_rule_based_reply(req)
    assert res.answer is not None
    assert len(res.answer) > 50
