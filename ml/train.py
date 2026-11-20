"""Model Training Pipeline for Delhi Winter Smog PM2.5 Prediction."""

import os
import json
from datetime import datetime, timezone
import joblib
import numpy as np
from sklearn.ensemble import HistGradientBoostingRegressor, RandomForestRegressor
from sklearn.linear_model import Ridge
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.inspection import permutation_importance

from ml.data_loader import fetch_historical_delhi_data
from ml.feature_engineering import create_features_and_target, FEATURE_COLUMNS, TARGET_COLUMN
from ml.preprocessing import chronological_train_test_split
from ml.evaluate import compute_regression_metrics


def train_and_select_best_model(
    data_path: str = "ml/data/delhi_historical_smog.csv",
    output_dir: str = "ml/artifacts",
) -> dict:
    """Trains candidate models, compares against persistence baseline, and exports best artifact."""
    os.makedirs(output_dir, exist_ok=True)

    # 1. Fetch / Load historical data
    print("Loading historical environmental data...")
    raw_df = fetch_historical_delhi_data(cache_path=data_path)
    start_date = str(raw_df["time"].min())
    end_date = str(raw_df["time"].max())

    # 2. Engineer features
    print("Engineering lag, rolling, and temporal features...")
    featured_df = create_features_and_target(raw_df)

    # 3. Chronological train/test split
    X_train, X_test, y_train, y_test, _, y_test_persistence = chronological_train_test_split(featured_df, test_ratio=0.20)
    print(f"Total samples: {len(featured_df)} (Train: {len(X_train)}, Test: {len(X_test)})")

    # 4. Evaluate Persistence Baseline
    persistence_metrics = compute_regression_metrics(y_test, y_test_persistence)
    print(f"Baseline (Persistence) Metrics: {persistence_metrics}")

    # 5. Candidate Models
    candidates = {
        "Random_Forest": Pipeline([
            ("regressor", RandomForestRegressor(n_estimators=100, max_depth=7, random_state=42, n_jobs=1)),
        ]),
        "Ridge_Regression": Pipeline([
            ("scaler", StandardScaler()),
            ("regressor", Ridge(alpha=10.0)),
        ]),
    }

    best_name = None
    best_pipeline = None
    best_metrics = None
    lowest_mae = float("inf")

    model_evaluations = {}

    for name, pipeline in candidates.items():
        print(f"Training {name}...")
        pipeline.fit(X_train, y_train)
        preds = pipeline.predict(X_test)
        metrics = compute_regression_metrics(y_test, preds)
        model_evaluations[name] = metrics
        print(f"  {name} -> MAE: {metrics['mae']}, RMSE: {metrics['rmse']}, R2: {metrics['r2']}")

        if metrics["mae"] < lowest_mae:
            lowest_mae = metrics["mae"]
            best_name = name
            best_pipeline = pipeline
            best_metrics = metrics

    print(f"\nWinning Model: {best_name} with MAE {best_metrics['mae']} vs Persistence MAE {persistence_metrics['mae']}")

    # 6. Feature Importance via Permutation Importance on held-out test set
    perm_imp = permutation_importance(best_pipeline, X_test, y_test, n_repeats=5, random_state=42)
    feature_importances = []
    sorted_importances_idx = perm_imp.importances_mean.argsort()[::-1]

    feature_descriptions = {
        "pm2_5_lag0": "Current PM2.5 concentration at forecast origin time",
        "pm2_5_lag1": "PM2.5 concentration 1 hour prior",
        "pm2_5_lag2": "PM2.5 concentration 2 hours prior",
        "pm2_5_lag3": "PM2.5 concentration 3 hours prior",
        "pm2_5_lag6": "PM2.5 concentration 6 hours prior",
        "pm2_5_lag12": "PM2.5 concentration 12 hours prior",
        "pm2_5_lag24": "PM2.5 concentration 24 hours prior (diurnal cycle)",
        "pm10_lag0": "Coarse particulate matter concentration",
        "pm10_lag1": "Coarse particulate concentration 1 hour prior",
        "temp_lag0": "Surface ambient temperature (inversion proxy)",
        "humidity_lag0": "Relative humidity (secondary aerosol formation)",
        "wind_lag0": "Surface wind speed (atmospheric dispersion)",
        "pm2_5_roll_mean_6h": "6-hour rolling average particulate trend",
        "pm2_5_roll_std_6h": "6-hour rolling particulate volatility",
        "pm2_5_roll_mean_24h": "24-hour background baseline pollution load",
        "hour_sin": "Cyclical diurnal solar/traffic phase (sine component)",
        "hour_cos": "Cyclical diurnal solar/traffic phase (cosine component)",
        "dayofweek": "Weekly commercial/traffic pattern index",
    }

    for idx in sorted_importances_idx[:10]:
        feat = FEATURE_COLUMNS[idx]
        feature_importances.append(
            {
                "feature": feat,
                "importance": round(float(perm_imp.importances_mean[idx]), 4),
                "description": feature_descriptions.get(feat, "Engineered atmospheric predictor"),
            }
        )

    # 7. Residual standard deviation for empirical 90% confidence intervals
    test_preds = best_pipeline.predict(X_test)
    residuals = y_test - test_preds
    residual_std = float(np.std(residuals))

    # 8. Save artifacts
    model_artifact_path = os.path.join(output_dir, "delhi_pm25_model.joblib")
    metadata_artifact_path = os.path.join(output_dir, "delhi_pm25_metadata.json")

    joblib.dump(best_pipeline, model_artifact_path)

    metadata = {
        "model_name": best_name,
        "target_variable": TARGET_COLUMN,
        "target_horizon_hours": 3,
        "dataset_source": "Open-Meteo Air Quality (CAMS/Copernicus Atmospheric Reanalysis) & Weather Archive for Delhi, India",
        "start_date": start_date,
        "end_date": end_date,
        "total_samples": len(featured_df),
        "train_samples": len(X_train),
        "test_samples": len(X_test),
        "features_used": FEATURE_COLUMNS,
        "evaluation_metrics": best_metrics,
        "baseline_metrics": persistence_metrics,
        "all_model_evaluations": model_evaluations,
        "feature_importances": feature_importances,
        "residual_std": round(residual_std, 2),
        "limitations": [
            "Model is calibrated specifically on Delhi winter atmospheric stagnation regimes and cannot be generalized to coastal or maritime climates without retraining.",
            "Predictions reflect atmospheric reanalysis and numerical model outputs rather than direct continuous FEM/BAM ground monitor sensors.",
            "Extreme episodic stubble burning or sudden localized fireworks spikes outside historical training distributions may cause under-prediction.",
            "Forecast horizon is strictly 3 hours ahead (t+3). Extrapolations beyond this horizon require autoregressive compounding.",
        ],
        "created_at_utc": datetime.now(timezone.utc).isoformat(),
    }

    with open(metadata_artifact_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    print(f"Artifacts successfully saved to {model_artifact_path} and {metadata_artifact_path}")
    return metadata


if __name__ == "__main__":
    train_and_select_best_model()
