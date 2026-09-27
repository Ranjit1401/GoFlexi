from typing import List, Union, Optional
from pathlib import Path
import json
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
_ENV_FILE = _BACKEND_DIR / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(str(_ENV_FILE), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    PROJECT_NAME: str = "GoFlexi API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"

    DATABASE_URL: str = "postgresql+psycopg://YOUR_NEON_CONNECTION_STRING"
    SECRET_KEY: str = "GoFlexi-super-secret-key-phase1-production-jwt-token-security-32bytes"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    RAPIDAPI_KEY: str = ""
    RAPIDAPI_HOST: str = "sky-scrapper.p.rapidapi.com"

    # SerpApi Live Flight & Hotel Search
    SERPAPI_API_KEY: str = ""
    SERPAPI_KEY: str = ""

    @property
    def serpapi_key(self) -> str:
        return (self.SERPAPI_API_KEY or self.SERPAPI_KEY or "").strip()

    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    CORS_ORIGIN_REGEX: str = r"^https?://(localhost|127\.0\.0\.1)(:[0-9]+)?$"

    # Phase 5B: Data Ingestion API Credentials
    GEONAMES_USERNAME: Optional[str] = None
    OPENTRIPMAP_API_KEY: str = ""

    # Phase 6: Real AI Trip Co-Pilot (Groq LLM)
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.3-70b-versatile"

    @property
    def groq_key(self) -> str:
        import os
        return (self.GROQ_API_KEY or os.environ.get("GROQ_API_KEY") or "").strip()

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            if v.startswith("[") and v.endswith("]"):
                try:
                    return json.loads(v)
                except Exception:
                    pass
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return v
        return [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:5174",
            "http://127.0.0.1:5174",
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        ]


settings = Settings()
