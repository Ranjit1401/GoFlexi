from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.routes import auth, users, agents, destinations, recommendations, copilot

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Voyara — Personalized Dynamic Tour Planning & Tour Operations Platform API",
    docs_url="/docs",
    openapi_url="/openapi.json"
)

# Configure CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
)

# Health endpoint
@app.get(
    "/api/health",
    tags=["System"],
    summary="Health check endpoint"
)
def health_check():
    """Returns service health status."""
    return {"status": "ok"}


# Mount API routers under /api
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(users.router, prefix=settings.API_V1_STR)
app.include_router(agents.router, prefix=settings.API_V1_STR)
app.include_router(destinations.router, prefix=settings.API_V1_STR)
app.include_router(recommendations.router, prefix=settings.API_V1_STR)
app.include_router(copilot.router, prefix=settings.API_V1_STR)
