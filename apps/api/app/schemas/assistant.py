"""AI Assistant schemas with strict grounding constraints."""

from typing import List, Optional
from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: str = Field(..., description="'user' or 'assistant'")
    content: str = Field(..., max_length=1500)


class AssistantChatRequest(BaseModel):
    question: str = Field(..., min_length=2, max_length=1000)
    history: List[ChatMessage] = Field(default_factory=list, max_length=20)
    location_name: str = Field("Delhi", max_length=100)
    current_aqi: Optional[float] = Field(None, ge=0.0, le=1000.0)
    current_pm2_5: Optional[float] = Field(None, ge=0.0, le=1500.0)
    weather_summary: Optional[str] = Field(None, max_length=250)
    family_context: Optional[str] = Field(None, max_length=250)
    data_source: Optional[str] = Field(None, max_length=150)


class AssistantChatResponse(BaseModel):
    answer: str
    mode: str = "gemini_grounded"  # "gemini_grounded" or "rule_based_fallback"
    grounded_facts: List[str] = Field(default_factory=list)
    suggested_actions: List[str] = Field(default_factory=list)
    follow_up_questions: List[str] = Field(default_factory=list)
    confidence_level: str = "High (Grounded in Verified Environmental Readings)"
    disclaimer: str = "Informational guidance only. Not medical diagnosis."
