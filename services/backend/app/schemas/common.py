"""
Common shared Pydantic schemas.
Status: IMPLEMENTED (Phase 4)
"""

from typing import Generic, TypeVar
from pydantic import BaseModel, Field

T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    items: list[T]
    total: int = Field(..., description="Total number of items matching filter")
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)
    total_pages: int = Field(default=1, ge=0)


class MessageResponse(BaseModel):
    message: str
    ok: bool = True

