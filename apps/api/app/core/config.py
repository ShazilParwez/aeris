"""AERIS Core Configuration Module."""

import os
from typing import List
from pydantic import BaseModel
from dotenv import load_dotenv

# Load local environment if available
load_dotenv()


class Settings(BaseModel):
    PROJECT_NAME: str = "AERIS - Urban Air Quality Intelligence"
    API_V1_STR: str = "/api/v1"
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]
    OPEN_METEO_AIR_QUALITY_URL: str = "https://air-quality-api.open-meteo.com/v1/air-quality"
    OPEN_METEO_WEATHER_URL: str = "https://api.open-meteo.com/v1/forecast"
    OPEN_METEO_GEOCODING_URL: str = "https://geocoding-api.open-meteo.com/v1/search"
    CACHE_TTL_SECONDS: int = 300  # 5 minutes in-memory cache for API calls


settings = Settings()
