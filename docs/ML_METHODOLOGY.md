# Classical Machine Learning Methodology

AERIS features a self-contained classical machine learning module built with **scikit-learn** (`aeris/ml/`).

## 1. Forecasting Objective

- **Target Task:** Predict ground-level PM2.5 concentration approximately **three hours ahead ($t+3$)** using only historical and meteorological features available at forecast origin time $t$.
- **Target Variable:** `target_pm2_5_lead3` (shifted backward by 3 hours chronologically).
- **Target Location:** Delhi, India (Winter atmospheric stagnation regime).

---

## 2. Dataset Provenance

- **Source:** Open-Meteo CAMS Atmospheric Reanalysis and Weather Archive for Delhi, India.
- **Period:** November 1, 2024 to December 15, 2024 (1,080 continuous hourly observations).
- **Domain Context:** Peak winter smog season characterized by shallow atmospheric boundary layers, low surface wind speeds, and nocturnal radiation inversions.

---

## 3. Feature Engineering Pipeline

All features strictly use observations available at or prior to origin time $t$:

### A. Particulate History (Lags)
- $PM_{2.5}(t)$, $PM_{2.5}(t-1)$, $PM_{2.5}(t-2)$, $PM_{2.5}(t-3)$, $PM_{2.5}(t-6)$, $PM_{2.5}(t-12)$, $PM_{2.5}(t-24)$
- $PM_{10}(t)$, $PM_{10}(t-1)$

### B. Rolling Atmospheric Trends
- `pm2_5_roll_mean_6h`: 6-hour moving average
- `pm2_5_roll_std_6h`: 6-hour moving standard deviation (volatility proxy)
- `pm2_5_roll_mean_24h`: 24-hour diurnal baseline load

### C. Meteorological Dispersion Predictors
- Surface temperature ($T_0$): proxy for nocturnal radiation cooling
- Relative humidity ($RH_0$): proxy for secondary particulate aerosol formation
- Wind speed ($WS_0$): proxy for horizontal particulate dispersion

### D. Cyclical Temporal Encoding
- $\sin(2\pi \cdot \text{hour}/24)$, $\cos(2\pi \cdot \text{hour}/24)$
- Day of week (0 to 6)

---

## 4. Validation & Leakage Prevention

- **Chronological Split:** First 80% (842 hours) for training, final 20% (211 hours) strictly held out for evaluation.
- **No Random Shuffling:** Random cross-validation is invalid for time-series forecasting because it leaks future temporal patterns into past training splits.
- **Persistence Baseline:** In atmospheric forecasting, a model is only scientifically useful if it outperforms persistence ($PM_{2.5}(t+3) \approx PM_{2.5}(t)$).

---

## 5. Model Benchmarking Results (Held-Out Test Set)

| Model | MAE (µg/m³) | RMSE (µg/m³) | $R^2$ Score | Status |
| :--- | :---: | :---: | :---: | :---: |
| **Persistence Baseline** | 16.70 | 26.13 | 0.5493 | Baseline Benchmark |
| **Ridge Regression** | 13.08 | 19.56 | 0.7475 | Linear Baseline |
| **Random Forest Regressor** | **12.40** | **19.22** | **0.7564** | **Selected Winning Model** |

The selected **Random Forest Regressor** achieves a **26% reduction in Mean Absolute Error** compared to the persistence baseline and explains **75.6% of target variance ($R^2 = 0.7564$)**.

---

## 6. Uncertainty Estimation

AERIS computes empirical 90% confidence intervals based on held-out test residual standard deviation ($\sigma_{\text{resid}} = 19.2\text{ µg/m}^3$):

$$\text{Interval}_{90\%} = [\hat{y} - 1.645 \cdot \sigma_{\text{resid}}, \, \hat{y} + 1.645 \cdot \sigma_{\text{resid}}]$$

AERIS refuses to output fake confidence scores such as "99% accurate".

---

## 7. Model Limitations

1. **Geographic Specificity:** Calibrated on Delhi's winter continental stagnation regime. Running this model on maritime or coastal cities (e.g. Mumbai, London) is blocked at the API level to maintain scientific integrity.
2. **Episodic Anomalies:** Unforeseen localized fireworks or episodic biomass burning spikes outside historical distributions may result in under-prediction.
3. **Horizon Fixedness:** Strictly validated for a 3-hour lead horizon ($t+3$).
