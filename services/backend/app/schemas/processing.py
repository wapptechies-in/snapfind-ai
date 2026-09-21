"""
Processing schemas: Pydantic models for background processing jobs, pipeline status, and controls.
Status: IMPLEMENTED (Phase 7)
"""

from datetime import datetime
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field


class ProcessingStageOut(BaseModel):
    name: str
    status: Literal["Completed", "Processing", "Waiting", "Failed"]
    detail: str | None = None

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class ProcessingJobOut(BaseModel):
    id: str
    event_id: str = Field(alias="eventId")
    photo_id: str | None = Field(default=None, alias="photoId")
    job_type: str = Field(alias="jobType")
    status: str
    celery_task_id: str | None = Field(default=None, alias="celeryTaskId")
    total_items: int = Field(default=0, alias="totalItems")
    processed_items: int = Field(default=0, alias="processedItems")
    failed_items: int = Field(default=0, alias="failedItems")
    attempt_count: int = Field(default=0, alias="attemptCount")
    error_message: str | None = Field(default=None, alias="errorMessage")
    started_at: datetime | None = Field(default=None, alias="startedAt")
    completed_at: datetime | None = Field(default=None, alias="completedAt")
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class ProcessingStatusResponse(BaseModel):
    event_id: str = Field(alias="eventId")
    status: str
    total_photos: int = Field(default=0, alias="totalPhotos")
    processed: int = 0
    remaining: int = 0
    failed: int = 0
    progress_percent: int = Field(default=0, alias="progressPercent")
    current_stage: str = Field(default="Idle", alias="currentStage")
    stages: list[ProcessingStageOut] = []
    current_job_id: str | None = Field(default=None, alias="currentJobId")
    active_jobs: list[ProcessingJobOut] = Field(default=[], alias="activeJobs")

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class ProcessingActionResponse(BaseModel):
    success: bool
    message: str
    job_id: str | None = Field(default=None, alias="jobId")
    dispatched_count: int = Field(default=0, alias="dispatchedCount")

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

