from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings

from app.api.routes import (
    auth,
    users,
    agents,
    destinations,
    recommendations,
    copilot,
    travel_search,
    trip_wizard,
    trips,
    agent_operations,
    payments,
)


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=(
        "GoFlexi — Personalized Dynamic Tour Planning "
        "& Tour Operations Platform API"
    ),
    docs_url="/docs",
    openapi_url="/openapi.json",
)


# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://go-flexi-bay.vercel.app",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# HEALTH CHECK
# =========================================================

@app.get(
    "/api/health",
    tags=["System"],
    summary="Health check endpoint",
)
def health_check():
    return {
        "status": "ok"
    }


# =========================================================
# API ROUTERS
# =========================================================

app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(users.router, prefix=settings.API_V1_STR)
app.include_router(agents.router, prefix=settings.API_V1_STR)
app.include_router(destinations.router, prefix=settings.API_V1_STR)
app.include_router(recommendations.router, prefix=settings.API_V1_STR)
app.include_router(recommendations.explore_router, prefix=settings.API_V1_STR)
app.include_router(copilot.router, prefix=settings.API_V1_STR)
app.include_router(travel_search.router, prefix=settings.API_V1_STR)
app.include_router(trip_wizard.router, prefix=settings.API_V1_STR)
app.include_router(trips.router, prefix=settings.API_V1_STR)
app.include_router(agent_operations.router, prefix=settings.API_V1_STR)
app.include_router(payments.router, prefix=settings.API_V1_STR)