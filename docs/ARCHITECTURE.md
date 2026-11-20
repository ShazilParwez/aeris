# AERIS Architecture Specification

## 1. System Overview

AERIS is a location-aware environmental intelligence and daily decision-making platform designed to help urban families navigate severe winter smog and urban air pollution.

Rather than presenting isolated, passive AQI metrics, AERIS implements an end-to-end action pipeline:

```
[ Atmospheric Data & Numerical Forecasts ]
                    │
                    ▼
[ Interpretable Risk & Dispersion Assessment ]
                    │
                    ▼
[ Personalized Decision & Constraint Rules ]
                    │
                    ▼
[ Actionable Routines & Day Optimization ]
                    │
                    ▼
[ Transparent Two-Dimensional Impact Models ]
```

---

## 2. Monorepo Structure

```
aeris/
├── apps/
│   ├── web/                     # Next.js 14 App Router, TypeScript, Tailwind CSS
│   │   ├── app/
│   │   │   ├── page.tsx         # Product introduction & city search
│   │   │   ├── dashboard/       # Command Center (48h timeline, cleaner windows)
│   │   │   ├── planner/         # Cleaner Day Planner (schedule optimizer)
│   │   │   ├── home-air/        # Indoor Air Quality Playbook (checklist & hacks)
│   │   │   ├── impact/          # Low-Emission Routine Optimizer (2D tradeoff)
│   │   │   ├── forecast-lab/    # Classical ML Forecast Lab (3h lead model)
│   │   │   ├── about/           # Methodology, Standards & Judging Alignment
│   │   │   ├── layout.tsx       # Root layout with Navbar, Footer & Ask AERIS
│   │   │   └── globals.css      # Dark theme tokens, accessible focus rings
│   │   ├── components/          # Reusable accessible components
│   │   ├── lib/                 # Typed API client and TypeScript contracts
│   │   └── package.json
│   └── api/                     # FastAPI, Python 3.11+, Pydantic v2
│       ├── app/
│       │   ├── core/            # Configuration & settings
│       │   ├── schemas/         # Pydantic request/response models
│       │   ├── integrations/    # Open-Meteo Air Quality, Weather & Geocoding
│       │   ├── recommendations/ # Deterministic prioritization engine
│       │   ├── planning/        # Day schedule optimizer
│       │   ├── impact/          # 2D transport impact calculator
│       │   ├── ai/              # Ask AERIS (Gemini + Rule-based fallback)
│       │   └── api/v1/          # REST route handlers
│       └── tests/               # 16 unit & integration tests (pytest)
├── ml/                          # Classical Machine Learning Module
│   ├── data/                    # Historical atmospheric datasets
│   ├── artifacts/               # Serialized models (.joblib) & metadata (.json)
│   ├── data_loader.py           # Historical CAMS reanalysis data loader
│   ├── feature_engineering.py   # Lags, rolling statistics, cyclical features
│   ├── preprocessing.py         # Chronological train/test split
│   ├── train.py                 # Training pipeline & baseline comparison
│   ├── evaluate.py              # Regression metrics (MAE, RMSE, R²)
│   ├── predict.py               # 3h inference with empirical uncertainty
│   └── model_registry.py        # Model artifact registry & lifecycle
├── docs/                        # Complete technical documentation suite
├── .env.example
└── README.md
```

---

## 3. Communication Contracts

All client-server interactions adhere to strict JSON schemas defined via Pydantic v2 on the backend and mapped to TypeScript interfaces on the frontend.

| Route | Method | Purpose |
| :--- | :--- | :--- |
| `/api/v1/health` | GET | Service status, Gemini flag, ML model status |
| `/api/v1/locations/search` | GET | Debounced geocoding search for global cities |
| `/api/v1/air-quality` | GET | Current multi-pollutant readings & 48h forecast |
| `/api/v1/recommendations` | POST | Prioritized behavioral guidance for household |
| `/api/v1/planner/optimize` | POST | Reorganizes routine around cleaner dispersion windows |
| `/api/v1/impact/compare` | POST | Two-dimensional transport emission vs exposure tradeoff |
| `/api/v1/assistant/chat` | POST | Grounded Ask AERIS assistant (Gemini + fallback) |
| `/api/v1/ml/status` | GET | Trained model metadata, baseline metrics & limitations |
| `/api/v1/ml/predict` | POST | 3-hour lead PM2.5 prediction with 90% CI |
