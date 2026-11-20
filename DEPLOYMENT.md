# AERIS — Production Deployment Guide

AERIS is architected as a modular, decoupled full-stack platform:
- **Frontend:** Next.js 14 App Router (React 18, Tailwind CSS, Lucide icons, Recharts)
- **Backend:** FastAPI (Python 3.11+, Pydantic v2, scikit-learn classical ML pipeline, Google Gen AI SDK)

---

## 1. Environment Configuration

### Backend (`apps/api/.env`)
| Variable | Description | Default / Example | Required |
| :--- | :--- | :--- | :--- |
| `GEMINI_API_KEY` | Google Gemini API key for GenAI Ask AERIS | `""` (Empty string triggers deterministic rule-based fallback) | Optional |
| `GEMINI_MODEL` | Gemini model identifier | `gemini-2.5-flash` | Optional |
| `CORS_ORIGINS` | Permitted client origins for cross-origin requests | `http://localhost:3000,http://127.0.0.1:3000` | Recommended |
| `CACHE_TTL_SECONDS` | In-memory cache TTL for Open-Meteo forecasts | `300` (5 minutes) | Optional |

### Frontend (`apps/web/.env.local`)
| Variable | Description | Default / Example | Required |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | Base URL for FastAPI backend endpoints | `http://localhost:8000/api/v1` | Required |

---

## 2. Docker Deployment (Recommended for Local / VPS)

### Quickstart with Docker Compose:
```bash
# 1. Clone repository
git clone https://github.com/aeris-climate/aeris.git
cd aeris

# 2. Configure environment (optional)
cp apps/api/.env.example apps/api/.env
# Set GEMINI_API_KEY if desired

# 3. Build and launch services
docker compose up --build -d

# 4. Verify service health
docker compose ps
curl http://localhost:8000/health
curl http://localhost:3000/
```

Services will be accessible at:
- **Frontend Web UI:** `http://localhost:3000`
- **Backend API & Swagger:** `http://localhost:8000/docs`
- **Health Probes:** `http://localhost:8000/health` and `http://localhost:8000/api/v1/health`

---

## 3. Cloud Deployment Topologies

### Topology A: Vercel (Frontend) + Google Cloud Run (Backend)

#### Backend on Cloud Run:
```bash
# 1. Build and push container to Google Artifact Registry
gcloud builds submit --tag gcr.io/$PROJECT_ID/aeris-api -f apps/api/Dockerfile .

# 2. Deploy to Cloud Run
gcloud run deploy aeris-api \
  --image gcr.io/$PROJECT_ID/aeris-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GEMINI_MODEL=gemini-2.5-flash \
  --set-secrets GEMINI_API_KEY=GEMINI_API_KEY:latest
```

#### Frontend on Vercel:
1. Connect Git repository to Vercel.
2. Set Root Directory to `apps/web`.
3. Configure Environment Variable:
   - `NEXT_PUBLIC_API_URL`: `https://aeris-api-<hash>-uc.a.run.app/api/v1`
4. Deploy.

---

## 4. Production Resilience & Security Checklist

1. **Deterministic Fallback:** If `GEMINI_API_KEY` is omitted, AERIS automatically runs its deterministic environmental rule engine without failing or crashing.
2. **Model Persistence:** Pre-trained Huber Regressor artifact (`delhi_pm25_model.joblib`) is baked directly into the container image, ensuring 0 runtime training latency and immediate startup (<500ms).
3. **Rate Limiting:** Backend limits `/assistant/chat` and `/ml/predict` to 30 requests/minute per client IP to mitigate automated resource scraping.
4. **Input Boundaries:** All coordinates, time-horizons, and transport parameters are strictly bounded with Pydantic v2 schemas to reject adversarial queries with HTTP 422.
5. **Sanitized Errors:** Internal server errors produce sanitized JSON responses without exposing Python stack traces or server paths.
