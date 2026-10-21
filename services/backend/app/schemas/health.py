"""
Health check schemas.
Status: IMPLEMENTED (Phase 4)
"""

from pydantic import BaseModel


class HealthOut(BaseModel):
    status: str = "ok"
    service: str = "snapfind-api"
    version: str = "0.2.0"
    database: str = "connected"
    redis: str = "unconfigured"
    environment: str = "development"
