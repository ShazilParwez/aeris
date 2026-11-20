"""Time-Series Chronological Splitting and Preprocessing."""

import pandas as pd
from typing import Tuple
from ml.feature_engineering import FEATURE_COLUMNS, TARGET_COLUMN


def chronological_train_test_split(
    df: pd.DataFrame,
    test_ratio: float = 0.20,
) -> Tuple[pd.DataFrame, pd.DataFrame, pd.Series, pd.Series, pd.Series, pd.Series]:
    """Splits dataset strictly by chronological order to prevent future information leakage."""
    n = len(df)
    split_idx = int(n * (1.0 - test_ratio))

    train_df = df.iloc[:split_idx].copy()
    test_df = df.iloc[split_idx:].copy()

    X_train = train_df[FEATURE_COLUMNS]
    y_train = train_df[TARGET_COLUMN]

    X_test = test_df[FEATURE_COLUMNS]
    y_test = test_df[TARGET_COLUMN]

    # Also keep persistence baseline for comparison: future PM2.5 predicted by pm2_5_lag0
    y_test_persistence = test_df["pm2_5_lag0"]
    y_train_persistence = train_df["pm2_5_lag0"]

    return X_train, X_test, y_train, y_test, y_train_persistence, y_test_persistence
