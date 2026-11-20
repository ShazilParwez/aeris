"""AERIS API v1 Endpoints Router."""

import time
from typing import List, Optional, Dict
from collections import defaultdict
from fastapi import APIRouter, Query, HTTPException, Depends, Request
from pydantic import BaseModel

from app.core.config import settings
from app.schemas.environmental import LocationItem, AirQualityResponse
from app.schemas.profiles import LifestyleProfile
from app.schemas.recommendations import RecommendationItem
from app.schemas.planner import PlannerOptimizeRequest, PlannerOptimizeResponse
from app.schemas.impact import TransportComparisonRequest, TransportComparisonResponse
from app.schemas.assistant import AssistantChatRequest, AssistantChatResponse
from app.schemas.ml import MLStatusResponse, MLPredictionRequest, MLPredictionResponse

from app.integrations.open_meteo import search_locations, fetch_air_quality
from app.recommendations.engine import generate_recommendations
from app.planning.optimizer import optimize_schedule
from app.impact.calculator import compare_transport_impact
from app.ai.assistant import ask_aeris
from ml.model_registry import registry

router = APIRouter()

# Rate limiter: IP -> list of request timestamps within the last 60 seconds
_RATE_LIMITS: Dict[str, List[float]] = defaultdict(list)
MAX_REQUESTS_PER_MINUTE = 30


def check_rate_limit(request: Request):
    client_ip = request.client.host if request.client else "127.0.0.1"
    now = time.time()
    cutoff = now - 60.0
    # Clean timestamps older than 60s
    timestamps = [t for t in _RATE_LIMITS[client_ip] if t > cutoff]
    if len(timestamps) >= MAX_REQUESTS_PER_MINUTE:
        raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded: maximum 30 requests per minute allowed on this endpoint.",
        )
    timestamps.append(now)
    _RATE_LIMITS[client_ip] = timestamps


class HealthResponse(BaseModel):
    status: str
    version: str
    service: str
    gemini_configured: bool
    ml_model_loaded: bool


@router.get("/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(
        status="healthy",
        version="1.0.0",
        service="AERIS Environmental Intelligence API",
        gemini_configured=bool(settings.GEMINI_API_KEY),
        ml_model_loaded=bool(registry.model is not None),
    )


@router.get("/locations/search", response_model=List[LocationItem])
async def search_cities(q: str = Query(..., min_length=1, max_length=100)):
    return await search_locations(q)


@router.get("/air-quality", response_model=AirQualityResponse)
async def get_air_quality(
    lat: float = Query(..., ge=-90.0, le=90.0),
    lon: float = Query(..., ge=-180.0, le=180.0),
    city: str = Query("Delhi", max_length=100),
    country: str = Query("India", max_length=100),
    tz: str = Query("auto", max_length=50),
):
    return await fetch_air_quality(latitude=lat, longitude=lon, city_name=city, country_name=country, tz_str=tz)


class RecommendationRequest(BaseModel):
    air_quality: AirQualityResponse
    profile: Optional[LifestyleProfile] = None


@router.post("/recommendations", response_model=List[RecommendationItem])
async def get_recommendations(req: RecommendationRequest):
    return generate_recommendations(air_quality=req.air_quality, profile=req.profile)


@router.post("/planner/optimize", response_model=PlannerOptimizeResponse)
async def optimize_planner(req: PlannerOptimizeRequest):
    # Fetch forecast for requested coordinates
    aq = await fetch_air_quality(
        latitude=req.latitude,
        longitude=req.longitude,
        city_name="Selected Location",
    )
    return optimize_schedule(request=req, hourly_forecast=aq.hourly_forecast)


@router.post("/impact/compare", response_model=TransportComparisonResponse)
async def compare_transport(req: TransportComparisonRequest):
    return compare_transport_impact(req)


@router.post("/assistant/chat", response_model=AssistantChatResponse, dependencies=[Depends(check_rate_limit)])
async def chat_assistant(req: AssistantChatRequest):
    return await ask_aeris(req)


@router.get("/ml/status", response_model=MLStatusResponse)
async def ml_status():
    return registry.get_status()


@router.post("/ml/predict", response_model=MLPredictionResponse, dependencies=[Depends(check_rate_limit)])
async def ml_predict(req: MLPredictionRequest):
    return registry.predict_3h(
        city=req.city,
        pm2_5_history=req.recent_pm2_5_history,
        weather=req.current_weather,
    )
