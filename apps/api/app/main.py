"""AERIS FastAPI Application Entry Point."""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.api.v1.endpoints import router as api_v1_router
from ml.model_registry import registry

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Location-aware environmental intelligence & daily decision-making assistant.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Middleware with explicit configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    # Preload and verify ML model status at startup
    status = registry.get_status()
    print(f"[AERIS Startup] ML Model Loaded: {status.is_available} ({status.model_type})")
    print(f"[AERIS Startup] Gemini Configured: {bool(settings.GEMINI_API_KEY)}")


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # Safe error response: do not expose internal stack traces in production
    return JSONResponse(
        status_code=500,
        content={
            "error": "InternalServerError",
            "message": "An unexpected error occurred while processing the environmental intelligence request.",
        },
    )


# Mount versioned API router
app.include_router(api_v1_router, prefix=settings.API_V1_STR)


@app.get("/")
async def root():
    return {
        "name": "AERIS Urban Air Quality Intelligence Platform",
        "tagline": "Breathe Smarter. Clear choices for difficult air.",
        "api_docs": "/docs",
        "api_v1": settings.API_V1_STR,
    }
