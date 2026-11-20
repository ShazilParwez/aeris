"""Environmental data schemas for AERIS with scientific provenance."""

from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field


class AQICategory(str, Enum):
    GOOD = "Good"
    MODERATE = "Moderate"
    UNHEALTHY_SENSITIVE = "Unhealthy for Sensitive Groups"
    UNHEALTHY = "Unhealthy"
    VERY_UNHEALTHY = "Very Unhealthy"
    HAZARDOUS = "Hazardous"


def aqi_to_category(aqi: float) -> AQICategory:
    """Classifies standard US EPA AQI into official category."""
    if aqi <= 50:
        return AQICategory.GOOD
    elif aqi <= 100:
        return AQICategory.MODERATE
    elif aqi <= 150:
        return AQICategory.UNHEALTHY_SENSITIVE
    elif aqi <= 200:
        return AQICategory.UNHEALTHY
    elif aqi <= 300:
        return AQICategory.VERY_UNHEALTHY
    else:
        return AQICategory.HAZARDOUS


class LocationItem(BaseModel):
    id: Optional[int] = None
    name: str
    country: str
    admin1: Optional[str] = None
    latitude: float
    longitude: float
    timezone: str = "UTC"


class PollutantBreakdown(BaseModel):
    pm2_5: Optional[float] = Field(None, description="PM2.5 particulate matter (µg/m³)")
    pm10: Optional[float] = Field(None, description="PM10 particulate matter (µg/m³)")
    nitrogen_dioxide: Optional[float] = Field(None, description="NO2 (µg/m³)")
    sulphur_dioxide: Optional[float] = Field(None, description="SO2 (µg/m³)")
    ozone: Optional[float] = Field(None, description="O3 (µg/m³)")
    carbon_monoxide: Optional[float] = Field(None, description="CO (µg/m³)")


class WeatherSummary(BaseModel):
    temperature_c: Optional[float] = None
    relative_humidity_pct: Optional[float] = None
    wind_speed_kmh: Optional[float] = None
    wind_direction_deg: Optional[float] = None
    precipitation_mm: Optional[float] = None
    weather_code: Optional[int] = None


class DataProvenance(BaseModel):
    provider: str = "Open-Meteo Air Quality & Weather API"
    model_or_measured: str = "Numerical Atmospheric Model (CAMS European Ensemble / NOAA GFS)"
    standard_label: str = "U.S. AQI — model-based estimate"
    indian_standard_note: str = (
        "Note for Indian users: Displayed values represent U.S. EPA AQI methodology. "
        "India CPCB National AQI (NAQI) uses distinct 24-hr sub-index breakpoints, "
        "weighting criteria, and different reporting categories. Do not conflate U.S. AQI with CPCB AQI."
    )
    timestamp_utc: str
    fetch_time_utc: str
    is_demo_fixture: bool = False
    disclaimer: str = (
        "Advisories are educational and behavioral risk estimates. Not medical diagnostic advice."
    )


class CurrentConditions(BaseModel):
    aqi: float
    category: AQICategory
    dominant_pollutant: str = "PM2.5"
    pollutants: PollutantBreakdown
    weather: WeatherSummary
    summary_text: str


class HourlyForecastPoint(BaseModel):
    time_iso: str
    aqi: float
    category: AQICategory
    pm2_5: Optional[float] = None
    pm10: Optional[float] = None
    temperature_c: Optional[float] = None
    relative_humidity_pct: Optional[float] = None
    wind_speed_kmh: Optional[float] = None
    is_cleaner_window: bool = False


class CleanerWindow(BaseModel):
    start_time: str
    end_time: str
    avg_aqi: float
    avg_pm2_5: float
    category: AQICategory
    suitability: str
    guidance: str


class AirQualityResponse(BaseModel):
    location: LocationItem
    current: CurrentConditions
    hourly_forecast: List[HourlyForecastPoint]
    cleaner_windows: List[CleanerWindow]
    provenance: DataProvenance
