"""
Application configuration.

Reads settings from environment variables (and a local .env file if
present). Never hard-code secrets here — this file only defines the
*names* and *defaults* of settings; real values come from the environment.

Status: IMPLEMENTED
"""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # --- General ---
    APP_NAME: str = "SnapFind AI API"
    ENVIRONMENT: str = "development"

    # --- Server ---
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000

    # --- Database ---
    DATABASE_URL: str = "postgresql://snapfind_user:snapfind_password@localhost:54320/snapfind_ai"

    # --- Security & Auth (Phase 2) ---
    SECRET_KEY: str = "snapfind-secret-jwt-key-for-dev-only-change-in-prod-2026"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # --- CORS ---
    # Comma-separated list of allowed origins, e.g.
    # "http://localhost:5173,http://localhost:5174"
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:5174"

    # --- Phase 5 AI & Vector Search Configuration ---
    AI_MODEL_NAME: str = "insightface"
    AI_MODEL_VERSION: str = "buffalo_s"
    FACE_EMBEDDING_DIMENSION: int = 512
    FACE_DETECTION_THRESHOLD: float = 0.60
    MIN_FACE_SIZE: int = 30
    MAX_BLUR_THRESHOLD: float = 15.0
    STRONG_MATCH_THRESHOLD: float = 0.55
    POSSIBLE_MATCH_THRESHOLD: float = 0.38
    TOP_K: int = 50

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    """Cached settings instance — import this, not Settings() directly."""
    return Settings()
