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

    # --- Database (PLANNED — connection is configured, no tables yet) ---
    DATABASE_URL: str = "postgresql://snapfind_user:snapfind_password@localhost:5432/snapfind_ai"

    # --- Security (PLANNED — auth is not implemented in Phase 1) ---
    SECRET_KEY: str = "dev-only-placeholder-change-me"

    # --- CORS ---
    # Comma-separated list of allowed origins, e.g.
    # "http://localhost:5173,http://localhost:5174"
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:5174"

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
