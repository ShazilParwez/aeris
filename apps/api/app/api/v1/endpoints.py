"""AERIS API v1 Endpoints Router."""

from typing import List, Optional
from fastapi import APIRouter, Query, HTTPException, Depends
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


@router.post("/assistant/chat", response_model=AssistantChatResponse)
async def chat_assistant(req: AssistantChatRequest):
    return await ask_aeris(req)


@router.get("/ml/status", response_model=MLStatusResponse)
async def ml_status():
    return registry.get_status()


@router.post("/ml/predict", response_model=MLPredictionResponse)
async def ml_predict(req: MLPredictionRequest):
    return registry.predict_3h(
        city=req.city,
        pm2_5_history=req.recent_pm2_5_history,
        weather=req.current_weather,
    )
