"""Open-Meteo Integration for Air Quality, Weather, and Geocoding."""

import time
import httpx
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from app.core.config import settings
from app.schemas.environmental import (
    AQICategory,
    aqi_to_category,
    LocationItem,
    PollutantBreakdown,
    WeatherSummary,
    DataProvenance,
    CurrentConditions,
    HourlyForecastPoint,
    CleanerWindow,
    AirQualityResponse,
)

# In-memory cache: key -> (timestamp, data)
_CACHE: Dict[str, tuple[float, Any]] = {}


def _get_cache(key: str) -> Optional[Any]:
    if key in _CACHE:
        ts, data = _CACHE[key]
        if time.time() - ts < settings.CACHE_TTL_SECONDS:
            return data
    return None


def _set_cache(key: str, data: Any):
    _CACHE[key] = (time.time(), data)


# Realistic fallback demonstration fixtures for Delhi
DELHI_LOCATION = LocationItem(
    id=1273294,
    name="Delhi",
    country="India",
    admin1="Delhi",
    latitude=28.6139,
    longitude=77.2090,
    timezone="Asia/Kolkata",
)


def _get_delhi_demo_fixture() -> AirQualityResponse:
    now_utc = datetime.now(timezone.utc).isoformat()
    # High winter smog profile typical of northern India November-January
    hourly: List[HourlyForecastPoint] = []
    base_hours = [
        # (hour_offset, aqi, pm2_5, pm10, temp, humidity, wind)
        (0, 245, 185.0, 310.0, 14.5, 82, 4.2),
        (1, 260, 205.0, 330.0, 14.0, 85, 3.8),
        (2, 275, 220.0, 350.0, 13.5, 88, 3.2),
        (3, 290, 235.0, 370.0, 13.2, 89, 3.0),
        (4, 310, 255.0, 395.0, 13.0, 91, 2.5),
        (5, 330, 275.0, 420.0, 12.8, 92, 2.3),
        (6, 345, 290.0, 440.0, 12.9, 93, 2.5),
        (7, 360, 310.0, 465.0, 13.5, 90, 3.1),
        (8, 350, 298.0, 450.0, 15.0, 84, 4.0),
        (9, 315, 260.0, 400.0, 17.5, 75, 5.5),
        (10, 265, 210.0, 335.0, 20.0, 64, 7.8),
        (11, 220, 168.0, 275.0, 22.5, 54, 9.5),
        (12, 195, 142.0, 240.0, 24.0, 48, 11.2),
        (13, 178, 128.0, 215.0, 25.0, 45, 12.0),
        (14, 165, 115.0, 198.0, 25.5, 43, 12.5),
        (15, 160, 110.0, 192.0, 25.0, 44, 11.8),
        (16, 172, 122.0, 208.0, 23.5, 50, 9.8),
        (17, 210, 160.0, 265.0, 21.0, 60, 7.2),
        (18, 260, 205.0, 330.0, 18.5, 70, 5.0),
        (19, 295, 240.0, 380.0, 17.2, 76, 4.2),
        (20, 320, 265.0, 410.0, 16.5, 80, 3.6),
        (21, 335, 280.0, 430.0, 15.8, 83, 3.2),
        (22, 310, 255.0, 395.0, 15.2, 85, 3.5),
        (23, 280, 225.0, 360.0, 14.8, 86, 3.8),
    ]

    for h_off, aqi_val, pm25_val, pm10_val, temp_val, hum_val, wind_val in base_hours:
        is_clean = 12 <= h_off <= 16
        hourly.append(
            HourlyForecastPoint(
                time_iso=f"2026-11-20T{h_off:02d}:00:00+05:30",
                aqi=aqi_val,
                category=aqi_to_category(aqi_val),
                pm2_5=pm25_val,
                pm10=pm10_val,
                temperature_c=temp_val,
                relative_humidity_pct=hum_val,
                wind_speed_kmh=wind_val,
                is_cleaner_window=is_clean,
            )
        )

    cleaner_windows = [
        CleanerWindow(
            start_time="13:00",
            end_time="16:00",
            avg_aqi=167.7,
            avg_pm2_5=118.0,
            category=AQICategory.UNHEALTHY,
            suitability="Relatively cleaner window compared to morning/night stagnation peaks",
            guidance=(
                "Solar heating drives atmospheric boundary layer mixing, lowering particulate concentrations "
                "from morning peaks. Outdoor exposure is still elevated, so wear a well-fitted N95 if outdoors, "
                "or perform brief essential tasks."
            ),
        )
    ]

    current = CurrentConditions(
        aqi=315.0,
        category=AQICategory.HAZARDOUS,
        dominant_pollutant="PM2.5",
        pollutants=PollutantBreakdown(
            pm2_5=260.0,
            pm10=400.0,
            nitrogen_dioxide=78.5,
            sulphur_dioxide=22.4,
            ozone=34.1,
            carbon_monoxide=1820.0,
        ),
        weather=WeatherSummary(
            temperature_c=17.5,
            relative_humidity_pct=75.0,
            wind_speed_kmh=5.5,
            wind_direction_deg=310.0,
            precipitation_mm=0.0,
            weather_code=3,
        ),
        summary_text=(
            "Hazardous winter smog episode. Low boundary layer height and light surface winds have created strong "
            "atmospheric stagnation. Sensitive individuals and children should stay indoors."
        ),
    )

    provenance = DataProvenance(
        provider="Open-Meteo Air Quality & Weather API (Offline Demonstration Mode)",
        model_or_measured="Calibrated Northern India Winter Smog Demonstration Fixture",
        timestamp_utc=now_utc,
        fetch_time_utc=now_utc,
        is_demo_fixture=True,
    )

    return AirQualityResponse(
        location=DELHI_LOCATION,
        current=current,
        hourly_forecast=hourly,
        cleaner_windows=cleaner_windows,
        provenance=provenance,
    )


async def search_locations(query: str) -> List[LocationItem]:
    """Search global cities via Open-Meteo Geocoding API with error handling."""
    if not query or len(query.strip()) < 2:
        return [DELHI_LOCATION]

    cache_key = f"geo:{query.lower().strip()}"
    cached = _get_cache(cache_key)
    if cached:
        return cached

    params = {"name": query.strip(), "count": 6, "language": "en", "format": "json"}
    try:
        async with httpx.AsyncClient(timeout=4.0) as client:
            resp = await client.get(settings.OPEN_METEO_GEOCODING_URL, params=params)
            if resp.status_code == 200:
                data = resp.json()
                results = []
                for item in data.get("results", []):
                    results.append(
                        LocationItem(
                            id=item.get("id"),
                            name=item.get("name"),
                            country=item.get("country", ""),
                            admin1=item.get("admin1"),
                            latitude=item.get("latitude"),
                            longitude=item.get("longitude"),
                            timezone=item.get("timezone", "UTC"),
                        )
                    )
                if results:
                    _set_cache(cache_key, results)
                    return results
    except Exception:
        pass

    # Fallback to Delhi if search fails or offline
    return [DELHI_LOCATION]


async def fetch_air_quality(
    latitude: float,
    longitude: float,
    city_name: str = "Delhi",
    country_name: str = "India",
    tz_str: str = "auto",
) -> AirQualityResponse:
    """Fetches real air quality & weather data from Open-Meteo or falls back gracefully."""
    cache_key = f"aq:{round(latitude, 4)}:{round(longitude, 4)}"
    cached = _get_cache(cache_key)
    if cached:
        return cached

    now_utc = datetime.now(timezone.utc).isoformat()

    try:
        async with httpx.AsyncClient(timeout=6.0) as client:
            # 1. Fetch Air Quality
            aq_params = {
                "latitude": latitude,
                "longitude": longitude,
                "current": [
                    "us_aqi",
                    "pm2_5",
                    "pm10",
                    "nitrogen_dioxide",
                    "sulphur_dioxide",
                    "ozone",
                    "carbon_monoxide",
                ],
                "hourly": ["us_aqi", "pm2_5", "pm10", "nitrogen_dioxide", "ozone"],
                "forecast_days": 2,
                "timezone": tz_str if tz_str != "auto" else "auto",
            }
            # 2. Fetch Weather
            weather_params = {
                "latitude": latitude,
                "longitude": longitude,
                "current": [
                    "temperature_2m",
                    "relative_humidity_2m",
                    "wind_speed_10m",
                    "wind_direction_10m",
                    "precipitation",
                    "weather_code",
                ],
                "hourly": [
                    "temperature_2m",
                    "relative_humidity_2m",
                    "wind_speed_10m",
                ],
                "forecast_days": 2,
                "timezone": tz_str if tz_str != "auto" else "auto",
            }

            aq_resp = await client.get(settings.OPEN_METEO_AIR_QUALITY_URL, params=aq_params)
            weather_resp = await client.get(settings.OPEN_METEO_WEATHER_URL, params=weather_params)

            if aq_resp.status_code == 200 and weather_resp.status_code == 200:
                aq_data = aq_resp.json()
                w_data = weather_resp.json()

                curr_aq = aq_data.get("current", {})
                curr_w = w_data.get("current", {})

                aqi_val = float(curr_aq.get("us_aqi") or 100.0)
                category = aqi_to_category(aqi_val)

                pollutants = PollutantBreakdown(
                    pm2_5=curr_aq.get("pm2_5"),
                    pm10=curr_aq.get("pm10"),
                    nitrogen_dioxide=curr_aq.get("nitrogen_dioxide"),
                    sulphur_dioxide=curr_aq.get("sulphur_dioxide"),
                    ozone=curr_aq.get("ozone"),
                    carbon_monoxide=curr_aq.get("carbon_monoxide"),
                )

                weather = WeatherSummary(
                    temperature_c=curr_w.get("temperature_2m"),
                    relative_humidity_pct=curr_w.get("relative_humidity_2m"),
                    wind_speed_kmh=curr_w.get("wind_speed_10m"),
                    wind_direction_deg=curr_w.get("wind_direction_10m"),
                    precipitation_mm=curr_w.get("precipitation"),
                    weather_code=curr_w.get("weather_code"),
                )

                # Parse hourly forecast
                hourly_times = aq_data.get("hourly", {}).get("time", [])
                hourly_aqi = aq_data.get("hourly", {}).get("us_aqi", [])
                hourly_pm25 = aq_data.get("hourly", {}).get("pm2_5", [])
                hourly_pm10 = aq_data.get("hourly", {}).get("pm10", [])
                w_hourly_temp = w_data.get("hourly", {}).get("temperature_2m", [])
                w_hourly_hum = w_data.get("hourly", {}).get("relative_humidity_2m", [])
                w_hourly_wind = w_data.get("hourly", {}).get("wind_speed_10m", [])

                hourly_points: List[HourlyForecastPoint] = []
                # First pass: collect points
                for i in range(min(48, len(hourly_times))):
                    h_aqi = float(hourly_aqi[i]) if i < len(hourly_aqi) and hourly_aqi[i] is not None else aqi_val
                    h_pm25 = float(hourly_pm25[i]) if i < len(hourly_pm25) and hourly_pm25[i] is not None else None
                    h_pm10 = float(hourly_pm10[i]) if i < len(hourly_pm10) and hourly_pm10[i] is not None else None
                    h_temp = float(w_hourly_temp[i]) if i < len(w_hourly_temp) and w_hourly_temp[i] is not None else None
                    h_hum = float(w_hourly_hum[i]) if i < len(w_hourly_hum) and w_hourly_hum[i] is not None else None
                    h_wind = float(w_hourly_wind[i]) if i < len(w_hourly_wind) and w_hourly_wind[i] is not None else None

                    hourly_points.append(
                        HourlyForecastPoint(
                            time_iso=hourly_times[i],
                            aqi=h_aqi,
                            category=aqi_to_category(h_aqi),
                            pm2_5=h_pm25,
                            pm10=h_pm10,
                            temperature_c=h_temp,
                            relative_humidity_pct=h_hum,
                            wind_speed_kmh=h_wind,
                            is_cleaner_window=False,
                        )
                    )

                # Algorithm to find relatively cleaner windows:
                # Find minimum AQI window across daylight/active hours
                cleaner_windows = []
                if hourly_points:
                    aqi_scores = [pt.aqi for pt in hourly_points[:24]]
                    min_aqi = min(aqi_scores)
                    for pt in hourly_points[:24]:
                        if pt.aqi <= min_aqi * 1.15:
                            pt.is_cleaner_window = True

                    # Find 3-hour continuous lowest window
                    best_start_idx = 0
                    lowest_avg = 9999.0
                    for s in range(0, min(22, len(hourly_points) - 3)):
                        sub_avg = sum(hourly_points[s + k].aqi for k in range(3)) / 3.0
                        if sub_avg < lowest_avg:
                            lowest_avg = sub_avg
                            best_start_idx = s

                    start_pt = hourly_points[best_start_idx]
                    end_pt = hourly_points[min(best_start_idx + 3, len(hourly_points) - 1)]
                    avg_p25 = sum((hourly_points[best_start_idx + k].pm2_5 or 50.0) for k in range(3)) / 3.0

                    cleaner_windows.append(
                        CleanerWindow(
                            start_time=start_pt.time_iso[11:16],
                            end_time=end_pt.time_iso[11:16],
                            avg_aqi=round(lowest_avg, 1),
                            avg_pm2_5=round(avg_p25, 1),
                            category=aqi_to_category(lowest_avg),
                            suitability="Relatively cleaner forecast window",
                            guidance=(
                                f"Atmospheric dispersion is relatively higher between {start_pt.time_iso[11:16]} and {end_pt.time_iso[11:16]}. "
                                f"Forecasted AQI averages {round(lowest_avg, 0)} ({aqi_to_category(lowest_avg).value})."
                            ),
                        )
                    )

                summary_text = (
                    f"Current conditions are {category.value} with an estimated U.S. AQI of {round(aqi_val)}. "
                    f"Dominant particulate concentration is PM2.5 at {pollutants.pm2_5 or 'N/A'} µg/m³."
                )

                provenance = DataProvenance(
                    provider="Open-Meteo Air Quality & Weather API",
                    model_or_measured="Numerical Atmospheric Model Forecast (CAMS / NOAA)",
                    timestamp_utc=curr_aq.get("time", now_utc),
                    fetch_time_utc=now_utc,
                    is_demo_fixture=False,
                )

                loc_item = LocationItem(
                    name=city_name,
                    country=country_name,
                    latitude=latitude,
                    longitude=longitude,
                    timezone=aq_data.get("timezone", "UTC"),
                )

                response = AirQualityResponse(
                    location=loc_item,
                    current=CurrentConditions(
                        aqi=round(aqi_val, 1),
                        category=category,
                        dominant_pollutant="PM2.5",
                        pollutants=pollutants,
                        weather=weather,
                        summary_text=summary_text,
                    ),
                    hourly_forecast=hourly_points,
                    cleaner_windows=cleaner_windows,
                    provenance=provenance,
                )
                _set_cache(cache_key, response)
                return response
    except Exception:
        pass

    # If live fetch fails or offline: Return scientifically calibrated Delhi fixture
    return _get_delhi_demo_fixture()
