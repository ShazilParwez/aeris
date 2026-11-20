"""Historical Environmental Data Loader for Delhi Winter Smog."""

import os
import json
import httpx
import pandas as pd
from datetime import datetime


def fetch_historical_delhi_data(
    start_date: str = "2024-11-01",
    end_date: str = "2024-12-15",
    cache_path: str = "ml/data/delhi_historical_smog.csv",
) -> pd.DataFrame:
    """Fetches real historical air quality and weather data for Delhi or loads cached copy."""
    if os.path.exists(cache_path):
        df = pd.read_csv(cache_path)
        df["time"] = pd.to_datetime(df["time"])
        return df

    # Fetch from Open-Meteo Air Quality
    aq_url = "https://air-quality-api.open-meteo.com/v1/air-quality"
    aq_params = {
        "latitude": 28.6139,
        "longitude": 77.2090,
        "start_date": start_date,
        "end_date": end_date,
        "hourly": ["pm2_5", "pm10", "carbon_monoxide"],
        "timezone": "Asia/Kolkata",
    }

    # Fetch from Open-Meteo Weather Archive
    weather_url = "https://archive-api.open-meteo.com/v1/archive"
    weather_params = {
        "latitude": 28.6139,
        "longitude": 77.2090,
        "start_date": start_date,
        "end_date": end_date,
        "hourly": ["temperature_2m", "relative_humidity_2m", "wind_speed_10m"],
        "timezone": "Asia/Kolkata",
    }

    with httpx.Client(timeout=15.0) as client:
        aq_res = client.get(aq_url, params=aq_params)
        w_res = client.get(weather_url, params=weather_params)

        if aq_res.status_code != 200 or w_res.status_code != 200:
            raise RuntimeError(f"Failed to fetch historical data: AQ={aq_res.status_code}, W={w_res.status_code}")

        aq_json = aq_res.json()
        w_json = w_res.json()

    times = aq_json["hourly"]["time"]
    df = pd.DataFrame(
        {
            "time": pd.to_datetime(times),
            "pm2_5": aq_json["hourly"]["pm2_5"],
            "pm10": aq_json["hourly"]["pm10"],
            "carbon_monoxide": aq_json["hourly"]["carbon_monoxide"],
            "temperature_2m": w_json["hourly"]["temperature_2m"],
            "relative_humidity_2m": w_json["hourly"]["relative_humidity_2m"],
            "wind_speed_10m": w_json["hourly"]["wind_speed_10m"],
        }
    )

    # Clean & sort chronologically
    df = df.sort_values("time").reset_index(drop=True)

    # Impute missing with forward fill then backward fill
    df = df.ffill().bfill()

    # Save cache
    os.makedirs(os.path.dirname(cache_path), exist_ok=True)
    df.to_csv(cache_path, index=False)
    return df
