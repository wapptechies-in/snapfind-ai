"""
Pydantic schemas for async search background jobs.
"""

from typing import Any
from pydantic import BaseModel, ConfigDict, Field, AliasChoices, model_validator


class SearchJobOut(BaseModel):
    jobId: str = Field(..., validation_alias=AliasChoices("jobId", "job_id"))
    job_id: str | None = None
    eventId: str = Field(..., validation_alias=AliasChoices("eventId", "event_id"))
    event_id: str | None = None
    guestId: str | None = Field(None, validation_alias=AliasChoices("guestId", "guest_id"))
    guest_id: str | None = None
    status: str  # queued, processing, completed, failed
    progressPercent: int = Field(0, validation_alias=AliasChoices("progressPercent", "progress_percent"))
    progress_percent: int | None = None
    totalMatches: int = Field(0, validation_alias=AliasChoices("totalMatches", "total_matches"))
    total_matches: int | None = None
    strongMatches: list[dict[str, Any]] = Field(default_factory=list, validation_alias=AliasChoices("strongMatches", "strong_matches"))
    strong_matches: list[dict[str, Any]] = Field(default_factory=list)
    possibleMatches: list[dict[str, Any]] = Field(default_factory=list, validation_alias=AliasChoices("possibleMatches", "possible_matches"))
    possible_matches: list[dict[str, Any]] = Field(default_factory=list)
    errorMessage: str | None = Field(None, validation_alias=AliasChoices("errorMessage", "error_message"))
    error_message: str | None = None
    createdAt: str = Field(..., validation_alias=AliasChoices("createdAt", "created_at"))
    created_at: str | None = None
    completedAt: str | None = Field(None, validation_alias=AliasChoices("completedAt", "completed_at"))
    completed_at: str | None = None

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    @model_validator(mode="after")
    def sync_aliases(self) -> "SearchJobOut":
        val_id = self.jobId or self.job_id
        self.jobId = val_id
        self.job_id = val_id

        val_event = self.eventId or self.event_id
        self.eventId = val_event
        self.event_id = val_event

        val_guest = self.guestId or self.guest_id
        self.guestId = val_guest
        self.guest_id = val_guest

        val_prog = self.progressPercent if self.progressPercent is not None else (self.progress_percent or 0)
        self.progressPercent = val_prog
        self.progress_percent = val_prog

        val_tot = self.totalMatches if self.totalMatches is not None else (self.total_matches or 0)
        self.totalMatches = val_tot
        self.total_matches = val_tot

        val_strong = self.strongMatches or self.strong_matches
        self.strongMatches = val_strong
        self.strong_matches = val_strong

        val_possible = self.possibleMatches or self.possible_matches
        self.possibleMatches = val_possible
        self.possible_matches = val_possible

        val_err = self.errorMessage or self.error_message
        self.errorMessage = val_err
        self.error_message = val_err

        val_created = self.createdAt or self.created_at
        self.createdAt = val_created
        self.created_at = val_created

        val_completed = self.completedAt or self.completed_at
        self.completedAt = val_completed
        self.completed_at = val_completed

        return self

