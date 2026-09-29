"""
AI Pydantic schemas: photo processing, facial search results, and model information.
Status: IMPLEMENTED (Phase 5)
"""

from pydantic import BaseModel, ConfigDict, Field


class PhotoProcessResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True, protected_namespaces=())

    photo_id: str = Field(..., alias="photoId")
    event_id: str = Field(..., alias="eventId")
    faces_detected: int = Field(..., alias="facesDetected")
    faces_embedded: int = Field(..., alias="facesEmbedded")
    faces_rejected: int = Field(..., alias="facesRejected")
    model_name: str = Field(..., alias="modelName")
    model_version: str = Field(..., alias="modelVersion")


class FaceMatchOut(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    event_id: str = Field(..., alias="eventId")
    filename: str
    url: str
    thumbnail_url: str = Field(..., alias="thumbnailUrl")
    width: int | None = None
    height: int | None = None
    uploaded_at: str = Field(..., alias="uploadedAt")
    match_confidence: int = Field(..., alias="matchConfidence")
    similarity: float


class FaceSearchResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    event_id: str = Field(..., alias="eventId")
    token: str
    total_matches: int = Field(..., alias="totalMatches")
    strong_matches: list[FaceMatchOut] = Field(default_factory=list, alias="strongMatches")
    possible_matches: list[FaceMatchOut] = Field(default_factory=list, alias="possibleMatches")


class ModelInfoOut(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    name: str
    version: str
    embedding_dimension: int = Field(..., alias="embeddingDimension")
    license: str
    commercial_cleared: bool = Field(..., alias="commercialCleared")
    status: str

