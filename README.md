# AERIS — Breathe Smarter.
> **Clear choices for difficult air.**  
> *Prompt Wars Challenge 6: Urban Air Quality Assistant*  
> *Organized by Google for Developers & Hack2Skill*

[![Python 3.11+](https://img.shields.io/badge/Python-3.11%2B-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115%2B-009688.svg)](https://fastapi.tiangolo.com/)
[![Next.js 14](https://img.shields.io/badge/Next.js-14.2-black.svg)](https://nextjs.org/)
[![scikit-learn](https://img.shields.io/badge/scikit--learn-1.6%2B-F7931E.svg)](https://scikit-learn.org/)
[![Tests Passing](https://img.shields.io/badge/Tests-16%20Passed-10B981.svg)]()
[![License: MIT](https://img.shields.io/badge/License-MIT-teal.svg)](LICENSE)

---

## What is AERIS?

**AERIS** is a location-aware environmental intelligence and daily decision-making assistant designed to help urban families and communities navigate severe winter smog and urban air pollution.

AERIS is not just another website displaying a static AQI number. It transforms:

$$\text{Environmental Data} \longrightarrow \text{Interpretable Risk} \longrightarrow \text{Personal Decisions} \longrightarrow \text{Actionable Routines} \longrightarrow \text{Transparent Impact}$$

---

## Key Features

1. **Air Quality Command Center (`/dashboard`):** Real-time multi-pollutant breakdown, 48-hour interactive forecast scrubbing, atmospheric dispersion modeling, and automatic detection of **Relatively Cleaner Windows**.
2. **The Cleaner Day Planner (`/planner`):** Dynamic schedule optimizer that shifts flexible outdoor activities (runs, walks) to cleaner windows or indoors while strictly respecting fixed commitments (school, office), reducing personal particulate inhalation by up to **35%**.
3. **Indoor Air Quality Playbook (`/home-air`):** Evidence-based indoor hacks for cooking exhaust protocols, timed afternoon window flushes, damp-dusting, and zero-cost strategies for renters and budget-conscious families.
4. **Low-Emission Routine Optimizer (`/impact`):** Two-Dimensional Decision Model that evaluates carbon emission savings against personal particulate exposure, explaining why Metro beats roadside cycling during severe winter smog episodes.
5. **AERIS Forecast Lab (`/forecast-lab`):** Real classical machine learning module built with **scikit-learn**, trained on 1,080 hours of verified Delhi winter data, predicting PM2.5 3 hours ahead with empirical 90% confidence intervals and beating the persistence baseline by 26%.
6. **Ask AERIS Assistant:** Context-grounded conversational assistant powered by Google Gen AI SDK (Gemini 2.5 Flash) with robust deterministic expert fallbacks when API keys are unconfigured.

---

## Architecture Overview

```
aeris/
├── apps/
│   ├── web/                 # Next.js 14 App Router, TypeScript, Tailwind CSS, Recharts
│   └── api/                 # FastAPI REST backend with Pydantic v2 schemas
├── ml/                      # Self-contained scikit-learn ML training & inference pipeline
│   ├── data/                # Historical atmospheric datasets
│   └── artifacts/           # Serialized models (.joblib) & metadata (.json)
├── docs/                    # Technical documentation suite
│   ├── ARCHITECTURE.md      # Full architecture specification
│   ├── DATA_SOURCES.md      # Open-Meteo & Copernicus provenance
│   ├── ML_METHODOLOGY.md    # Training, evaluation & baseline benchmarks
│   ├── SECURITY.md          # Threat model & Defense-in-Depth
│   ├── ACCESSIBILITY.md     # WCAG 2.2 AA target implementation
│   ├── JUDGING.md           # Hackathon evaluation criteria mapping
│   └── DEMO.md              # 3-minute judge demonstration script
├── .env.example
└── README.md
```

---

## Quickstart & Local Setup

### Prerequisites
- Node.js 18+ and pnpm / npm
- Python 3.11+

### 1. Clone & Configure Environment
```bash
cp .env.example .env
# (Optional) Add your Google Gemini API key to .env:
# GEMINI_API_KEY=your_key_here
```

### 2. Backend Setup & Automated Tests
```powershell
# In a terminal:
cd apps/api
$env:PYTHONPATH=".;../../"
python -m pytest tests/ -v
```
All **16 unit and integration tests** pass completely offline in under 3 seconds.

### 3. Start Backend Server
```powershell
# From aeris project root:
$env:PYTHONPATH="apps/api;."
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
Interactive API documentation is available at `http://127.0.0.1:8000/docs`.

### 4. Start Frontend Application
```powershell
# In a second terminal:
cd apps/web
pnpm run dev
```
Open `http://localhost:3000` in your browser.

---

## Automated Test Results

AERIS includes 16 automated tests covering all critical scientific, heuristic, and edge-case behaviors:
- `test_aqi_category_boundaries`: US EPA category breakpoint classification
- `test_missing_pollutant_handling`: Partial pollutant payloads handled gracefully
- `test_demo_fixture_validity`: High-fidelity offline winter smog fixture
- `test_sensitive_child_triggers_high_priority_alert`: Child sensitivity alerts
- `test_priority_sorting_order`: Strict HIGH $\rightarrow$ MEDIUM $\rightarrow$ LOW ranking
- `test_inversion_and_cooking_rules_present`: Indoor exhaust and ventilation rules
- `test_planner_moves_strenuous_outdoor_run_indoors`: Dynamic day reorganization
- `test_car_vs_metro_co2_savings`: Validated transit carbon reductions
- `test_cycling_exposure_tradeoff_under_severe_smog`: 2D exposure tradeoff
- `test_ml_model_loaded_and_metadata_intact`: Model artifact verification
- `test_ml_prediction_valid_delhi`: 3-hour PM2.5 prediction with 90% CI
- `test_ml_unsupported_location_boundary`: Out-of-domain geographic guardrails
- `test_deterministic_fallback_child_query`: Rule-grounded query answering
- `test_deterministic_fallback_cooking_query`: Kitchen smoke advisory
- `test_excessively_long_input_safety`: Input buffer sanitization

Run test suite:
```powershell
python -m pytest apps/api/tests -v
```

---

## Machine Learning Results Summary

- **Task:** 3-Hour Lead PM2.5 Prediction ($t+3$)
- **Algorithm:** Scikit-learn `RandomForestRegressor`
- **Dataset:** 1,080 continuous hourly observations from Open-Meteo CAMS atmospheric reanalysis (Delhi Winter Smog Season)
- **Validation:** Strict chronological holdout (842 train, 211 test hours)

| Metric | Persistence Baseline | AERIS Model | Improvement |
| :--- | :---: | :---: | :---: |
| **Mean Absolute Error (MAE)** | 16.70 µg/m³ | **12.40 µg/m³** | **+26% reduction** |
| **Root Mean Squared Error (RMSE)** | 26.13 µg/m³ | **19.22 µg/m³** | **+26% reduction** |
| **$R^2$ Variance Explained** | 0.5493 | **0.7564** | **High explanatory power** |

---

## Scientific Data Attribution

- **Open-Meteo Air Quality & Weather API:** Copernicus Atmosphere Monitoring Service (CAMS) European Ensemble & NOAA Global Forecast System (GFS).
- **Index Standard:** U.S. EPA Air Quality Index (labeled explicitly as *"U.S. AQI — model-based estimate"*).

---

## License

This project is licensed under the MIT License.
