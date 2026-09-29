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
    SEED_DEV_DATA: bool | None = None  # None = True in development only, False in production/staging

    # --- Trial Deliverable Edition Configuration ---
    TRIAL_EDITION_MODE: bool = True
    TRIAL_STORAGE_LIMIT_BYTES: int = 9 * 1024 * 1024 * 1024  # 9.0 GB hard limit (prevents Cloudflare R2 charges)

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
    # "http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:3000,null"
    CORS_ORIGINS: str = (
        "http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:3000,null"
    )

    # --- Phase 5 AI & Vector Search Configuration ---
    AI_MODEL_NAME: str = "insightface"
    AI_MODEL_VERSION: str = "buffalo_s"
    FACE_EMBEDDING_DIMENSION: int = 512
    FACE_DETECTION_THRESHOLD: float = 0.55
    MIN_FACE_SIZE: int = 25
    MAX_BLUR_THRESHOLD: float = 10.0
    STRONG_MATCH_THRESHOLD: float = 0.50
    POSSIBLE_MATCH_THRESHOLD: float = 0.32
    TOP_K: int = 500

    # --- Cloud Photo Storage & CDN Configuration ---
    STORAGE_PROVIDER: str = "minio"  # minio, s3, r2, local
    STORAGE_ENDPOINT_URL: str | None = "http://localhost:9000"
    STORAGE_PUBLIC_ENDPOINT_URL: str | None = "http://localhost:9000"
    STORAGE_ACCESS_KEY: str = "minioadmin"
    STORAGE_SECRET_KEY: str = "minioadmin"
    STORAGE_BUCKET_NAME: str = "snapfind-photos"
    STORAGE_REGION: str = "us-east-1"
    STORAGE_CDN_URL: str | None = None  # e.g. https://cdn.yourdomain.com or CloudFront distribution
    CLOUDFLARE_R2_ACCOUNT_ID: str | None = None
    MAX_UPLOAD_SIZE_MB: int = 50
    PRESIGNED_URL_EXPIRE_SECONDS: int = 3600

    # --- Phase 7 Redis & Celery Background Processing ---
    REDIS_URL: str = "redis://localhost:6379/0"
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/1"
    CELERY_WORKER_CONCURRENCY: int = 4
    JOB_STALE_TIMEOUT_MINUTES: int = 30
    THUMBNAIL_MAX_WIDTH: int = 400
    THUMBNAIL_MAX_HEIGHT: int = 400
    WEB_IMAGE_MAX_WIDTH: int = 1920
    WEB_IMAGE_MAX_HEIGHT: int = 1920
    # --- WhatsApp Messaging Service Configuration ---
    FRONTEND_BASE_URL: str = "http://localhost:5173"
    WHATSAPP_PROVIDER: str = "mock"  # mock, twilio, meta
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_WHATSAPP_NUMBER: str = "+14155238886"
    META_WHATSAPP_TOKEN: str = ""
    META_WHATSAPP_PHONE_ID: str = ""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    @property
    def should_seed_dev_data(self) -> bool:
        if self.SEED_DEV_DATA is not None:
            return self.SEED_DEV_DATA
        return self.ENVIRONMENT.lower() == "development"


@lru_cache
def get_settings() -> Settings:
    """Cached settings instance — import this, not Settings() directly."""
    return Settings()


settings = get_settings()
