"""Model Training and Calibration Pipeline for Delhi Winter PM2.5 Prediction.

Features:
1. 3-way chronological split (Train, Validation, Test) with a 3-hour embargo gap.
2. Candidate models: Persistence, Ridge, HuberRegressor, RandomForest.
3. Model selection based on validation set error.
4. Empirical interval calibration on validation residuals (Q05, Q95).
5. Rigorous test evaluation: MAE, RMSE, R2, and measured test coverage rate.
"""

import os
import json
from datetime import datetime, timezone
import joblib
import numpy as np
from sklearn.linear_model import Ridge, HuberRegressor
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.inspection import permutation_importance

from ml.data_loader import fetch_historical_delhi_data
from ml.feature_engineering import create_features_and_target, FEATURE_COLUMNS, TARGET_COLUMN
from ml.preprocessing import chronological_3way_split
from ml.evaluate import compute_regression_metrics


def train_and_select_best_model(
    data_path: str = "ml/data/delhi_historical_smog.csv",
    output_dir: str = "ml/artifacts",
) -> dict:
    """Trains candidate models, calibrates residual intervals, benchmarks against persistence, and exports best artifact."""
    os.makedirs(output_dir, exist_ok=True)

    # 1. Fetch / Load historical data
    print("Loading historical atmospheric data...")
    raw_df = fetch_historical_delhi_data(cache_path=data_path)
    start_date = str(raw_df["time"].min())
    end_date = str(raw_df["time"].max())

    # 2. Engineer features
    print("Engineering lag, rolling, and temporal features...")
    featured_df = create_features_and_target(raw_df)

    # 3. Chronological 3-way split with 3-hour embargo gap
    train_df, val_df, test_df = chronological_3way_split(
        featured_df, train_ratio=0.70, val_ratio=0.15, horizon_gap=3
    )

    X_train, y_train = train_df[FEATURE_COLUMNS], train_df[TARGET_COLUMN]
    X_val, y_val = val_df[FEATURE_COLUMNS], val_df[TARGET_COLUMN]
    X_test, y_test = test_df[FEATURE_COLUMNS], test_df[TARGET_COLUMN]

    print(
        f"Dataset Split (Total: {len(featured_df)}): "
        f"Train={len(X_train)} ({train_df['time'].min()} to {train_df['time'].max()}), "
        f"Val={len(X_val)} ({val_df['time'].min()} to {val_df['time'].max()}), "
        f"Test={len(X_test)} ({test_df['time'].min()} to {test_df['time'].max()})"
    )

    # 4. Persistence baseline on test set
    y_test_persistence = test_df["pm2_5_lag0"]
    persistence_metrics = compute_regression_metrics(y_test, y_test_persistence)
    print(f"Test Persistence Baseline -> MAE: {persistence_metrics['mae']}, RMSE: {persistence_metrics['rmse']}, R2: {persistence_metrics['r2']}")

    # 5. Candidate Models
    candidates = {
        "Huber_Regressor": Pipeline([
            ("scaler", StandardScaler()),
            ("regressor", HuberRegressor(max_iter=500, epsilon=1.35)),
        ]),
        "Ridge_Regression": Pipeline([
            ("scaler", StandardScaler()),
            ("regressor", Ridge(alpha=100.0)),
        ]),
        "Random_Forest": Pipeline([
            ("regressor", RandomForestRegressor(n_estimators=100, max_depth=7, random_state=42, n_jobs=1)),
        ]),
    }

    best_name = None
    best_pipeline = None
    lowest_val_mae = float("inf")
    model_evaluations = {}

    for name, pipeline in candidates.items():
        print(f"Training {name} on train set...")
        pipeline.fit(X_train, y_train)
        val_preds = pipeline.predict(X_val)
        val_mae = float(np.mean(np.abs(y_val - val_preds)))
        print(f"  {name} Validation MAE: {val_mae:.2f}")

        test_preds = pipeline.predict(X_test)
        t_metrics = compute_regression_metrics(y_test, test_preds)
        model_evaluations[name] = {
            "val_mae": round(val_mae, 2),
            "test_metrics": t_metrics,
        }

        if val_mae < lowest_val_mae:
            lowest_val_mae = val_mae
            best_name = name
            best_pipeline = pipeline

    print(f"\nWinning Model Selected by Validation Error: {best_name} (Val MAE: {lowest_val_mae:.2f})")

    # 6. Empirical Interval Calibration on Validation Residuals
    val_preds = best_pipeline.predict(X_val)
    val_residuals = y_val - val_preds
    q05 = float(np.percentile(val_residuals, 5))
    q95 = float(np.percentile(val_residuals, 95))
    print(f"Calibrated Validation Residual Quantiles (Nominal 90% target): Q05={q05:.2f}, Q95={q95:.2f}")

    # 7. Final Test Evaluation and Coverage Measurement
    test_preds = best_pipeline.predict(X_test)
    test_metrics = compute_regression_metrics(y_test, test_preds)
    test_residuals = y_test - test_preds
    test_lower = test_preds + q05
    test_upper = test_preds + q95
    measured_coverage = float(np.mean((y_test >= test_lower) & (y_test <= test_upper)) * 100.0)

    print(f"Final Test Metrics for {best_name}:")
    print(f"  MAE: {test_metrics['mae']} µg/m³ vs Persistence {persistence_metrics['mae']} µg/m³")
    print(f"  RMSE: {test_metrics['rmse']} µg/m³ vs Persistence {persistence_metrics['rmse']} µg/m³")
    print(f"  R2: {test_metrics['r2']} vs Persistence {persistence_metrics['r2']}")
    print(f"  Empirical Test Set Interval Coverage: {measured_coverage:.1f}%")

    # 8. Feature Importance via Permutation Importance on held-out test set
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

    for idx in sorted_importances_idx[:8]:
        feat = FEATURE_COLUMNS[idx]
        feature_importances.append(
            {
                "feature": feat,
                "importance": round(float(perm_imp.importances_mean[idx]), 4),
                "description": feature_descriptions.get(feat, "Engineered atmospheric predictor"),
            }
        )

    # 9. Save artifacts
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
        "val_samples": len(X_val),
        "test_samples": len(X_test),
        "features_used": FEATURE_COLUMNS,
        "evaluation_metrics": test_metrics,
        "baseline_metrics": persistence_metrics,
        "all_model_evaluations": model_evaluations,
        "feature_importances": feature_importances,
        "interval_calibration": {
            "method": "Empirical validation residual quantiles (Q05, Q95) with measured test coverage",
            "q05_offset": round(q05, 2),
            "q95_offset": round(q95, 2),
            "measured_test_coverage_pct": round(measured_coverage, 1),
            "nominal_target_pct": 90.0,
        },
        "limitations": [
            "Model is calibrated specifically on Delhi winter continental stagnation regimes and cannot be generalized to coastal or maritime climates without retraining.",
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
