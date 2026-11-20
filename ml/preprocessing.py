"""Time-Series Chronological 3-Way Splitting with Embargo Gap.

Ensures strict separation between Training, Validation (for hyperparameter tuning & interval calibration),
and Held-Out Test sets with an embargo gap to completely prevent target overlap or future information leakage.
"""

import pandas as pd
from typing import Tuple
from ml.feature_engineering import FEATURE_COLUMNS, TARGET_COLUMN


def chronological_3way_split(
    df: pd.DataFrame,
    train_ratio: float = 0.70,
    val_ratio: float = 0.15,
    horizon_gap: int = 3,
) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """Splits time-series chronologically into Train, Validation, and Test sets with gap.
    
    Args:
        df: Chronologically sorted featured dataframe.
        train_ratio: Ratio for training set (default 0.70).
        val_ratio: Ratio for validation set (default 0.15).
        horizon_gap: Number of hours to drop between sets to prevent target overlap (default 3 for t+3).
    """
    n = len(df)
    train_end = int(n * train_ratio)
    val_start = train_end + horizon_gap
    val_end = val_start + int(n * val_ratio)
    test_start = val_end + horizon_gap

    train_df = df.iloc[:train_end].copy().reset_index(drop=True)
    val_df = df.iloc[val_start:val_end].copy().reset_index(drop=True)
    test_df = df.iloc[test_start:].copy().reset_index(drop=True)

    return train_df, val_df, test_df
