"""Feature Engineering for 3-Hour PM2.5 Forecasting."""

import numpy as np
import pandas as pd
from typing import Tuple, List

FEATURE_COLUMNS: List[str] = [
    "pm2_5_lag0",
    "pm2_5_lag1",
    "pm2_5_lag2",
    "pm2_5_lag3",
    "pm2_5_lag6",
    "pm2_5_lag12",
    "pm2_5_lag24",
    "pm10_lag0",
    "pm10_lag1",
    "temp_lag0",
    "humidity_lag0",
    "wind_lag0",
    "pm2_5_roll_mean_6h",
    "pm2_5_roll_std_6h",
    "pm2_5_roll_mean_24h",
    "hour_sin",
    "hour_cos",
    "dayofweek",
]

TARGET_COLUMN: str = "target_pm2_5_lead3"


def create_features_and_target(df: pd.DataFrame) -> pd.DataFrame:
    """Transforms raw time-series into strictly chronologically aligned features and 3-hour lead target."""
    data = df.copy()
    data = data.sort_values("time").reset_index(drop=True)

    # Current readings at origin t
    data["pm2_5_lag0"] = data["pm2_5"]
    data["pm10_lag0"] = data["pm10"]
    data["temp_lag0"] = data["temperature_2m"]
    data["humidity_lag0"] = data["relative_humidity_2m"]
    data["wind_lag0"] = data["wind_speed_10m"]

    # Historical lag features (strictly <= t)
    for lag in [1, 2, 3, 6, 12, 24]:
        data[f"pm2_5_lag{lag}"] = data["pm2_5"].shift(lag)

    data["pm10_lag1"] = data["pm10"].shift(1)

    # Rolling statistics based only on historical window (closed='left' or shift(1))
    data["pm2_5_roll_mean_6h"] = data["pm2_5"].rolling(window=6, min_periods=3).mean()
    data["pm2_5_roll_std_6h"] = data["pm2_5"].rolling(window=6, min_periods=3).std().fillna(0.0)
    data["pm2_5_roll_mean_24h"] = data["pm2_5"].rolling(window=24, min_periods=6).mean()

    # Temporal cyclical features
    hour = data["time"].dt.hour
    data["hour_sin"] = np.sin(2 * np.pi * hour / 24.0)
    data["hour_cos"] = np.cos(2 * np.pi * hour / 24.0)
    data["dayofweek"] = data["time"].dt.dayofweek

    # Target: 3 hours ahead (t+3)
    data[TARGET_COLUMN] = data["pm2_5"].shift(-3)

    # Drop edge rows containing NaNs
    data = data.dropna().reset_index(drop=True)
    return data
