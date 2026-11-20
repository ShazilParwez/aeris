"""AI Assistant schemas with strict grounding constraints."""

from typing import List, Optional
from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: str = Field(..., description="'user' or 'assistant'")
    content: str = Field(..., max_length=1500)


class AssistantChatRequest(BaseModel):
    question: str = Field(..., min_length=2, max_length=1000)
    history: List[ChatMessage] = Field(default_factory=list)
    location_name: str = "Delhi"
    current_aqi: Optional[float] = None
    current_pm2_5: Optional[float] = None
    weather_summary: Optional[str] = None
    family_context: Optional[str] = None


class AssistantChatResponse(BaseModel):
    answer: str
    mode: str = "gemini_grounded"  # "gemini_grounded" or "rule_based_fallback"
    grounded_facts: List[str] = Field(default_factory=list)
    suggested_actions: List[str] = Field(default_factory=list)
    follow_up_questions: List[str] = Field(default_factory=list)
    confidence_level: str = "High (Grounded in Verified Environmental Readings)"
    disclaimer: str = "Informational guidance only. Not medical diagnosis."
