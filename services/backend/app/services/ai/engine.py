"""
FaceEngine abstraction layer.
Defines the interface for face detection and embedding generation,
allowing commercial or alternative models to be substituted transparently.

Status: IMPLEMENTED (Phase 5)
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any
import numpy as np


@dataclass
class DetectedFace:
    """Represents a face detected within an image."""
    bbox: list[int]  # [x1, y1, x2, y2]
    detection_score: float
    landmarks: list[list[float]] | None = None
    face_index: int = 0
    embedding: np.ndarray | None = None  # Normalized 512-d embedding
    quality_score: float = 1.0
    quality_reason: str | None = None


@dataclass
class ModelInfo:
    """Metadata regarding the active face recognition model."""
    name: str
    version: str
    embedding_dimension: int
    license: str
    commercial_cleared: bool
    status: str


class FaceEngine(ABC):
    """Abstract interface for face analysis engines."""

    @abstractmethod
    def detect_faces(self, image: np.ndarray) -> list[DetectedFace]:
        """
        Detect all faces in a BGR/RGB image.
        Returns a list of DetectedFace objects.
        """
        pass

    @abstractmethod
    def generate_embedding(self, image: np.ndarray, face: DetectedFace) -> np.ndarray:
        """
        Extract and return a normalized embedding vector for the detected face.
        """
        pass

    @abstractmethod
    def get_model_info(self) -> ModelInfo:
        """Return model metadata, license, and commercial clearance status."""
        pass

