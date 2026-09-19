"""
InsightFace engine implementation.
Wraps InsightFace FaceAnalysis for RetinaFace detection and ArcFace 512-d embedding generation.

Status: IMPLEMENTED (Phase 5)
License: Non-Commercial / Research Use Only (Pretrained buffalo_s weights)
Status: DEVELOPMENT / TEST ONLY
"""

import logging
from typing import Any
import numpy as np
from insightface.app import FaceAnalysis

from app.core.config import get_settings
from app.services.ai.engine import DetectedFace, FaceEngine, ModelInfo

logger = logging.getLogger("snapfind.ai")
settings = get_settings()

_engine_instance: FaceEngine | None = None


class InsightFaceEngine(FaceEngine):
    """
    Concrete FaceEngine using InsightFace (RetinaFace detector + ArcFace 512-d embedder).
    """

    def __init__(self, model_name: str = "buffalo_s"):
        self.model_name = model_name
        self.version = settings.AI_MODEL_VERSION
        self.dimension = settings.FACE_EMBEDDING_DIMENSION
        logger.info(f"Initializing InsightFaceEngine with model '{model_name}' on CPU...")

        # Initialize FaceAnalysis on CPU
        self.app = FaceAnalysis(
            name=self.model_name,
            providers=["CPUExecutionProvider"],
        )
        self.app.prepare(ctx_id=0, det_size=(640, 640))
        logger.info("InsightFaceEngine initialized and ready.")

    def detect_faces(self, image: np.ndarray) -> list[DetectedFace]:
        """
        Detect faces in image (BGR format).
        Returns list of DetectedFace objects with bounding boxes and L2-normalized embeddings.
        """
        faces = self.app.get(image)
        detected: list[DetectedFace] = []

        for idx, face in enumerate(faces):
            bbox = [int(v) for v in face.bbox]
            score = float(face.det_score) if hasattr(face, "det_score") else 1.0

            landmarks = None
            if hasattr(face, "kps") and face.kps is not None:
                landmarks = face.kps.tolist()

            # Extract 512-dimensional embedding and ensure L2 unit normalization
            embedding = None
            if hasattr(face, "normed_embedding") and face.normed_embedding is not None:
                embedding = face.normed_embedding.astype(np.float32)
            elif hasattr(face, "embedding") and face.embedding is not None:
                raw = face.embedding.astype(np.float32)
                norm = np.linalg.norm(raw)
                embedding = raw / norm if norm > 0 else raw

            detected.append(
                DetectedFace(
                    bbox=bbox,
                    detection_score=score,
                    landmarks=landmarks,
                    face_index=idx,
                    embedding=embedding,
                )
            )

        return detected

    def generate_embedding(self, image: np.ndarray, face: DetectedFace) -> np.ndarray:
        """Return normalized embedding for face."""
        if face.embedding is not None:
            return face.embedding

        # Fallback: re-run detection for single face crop if embedding was missing
        detected = self.detect_faces(image)
        if detected and detected[0].embedding is not None:
            return detected[0].embedding

        raise ValueError("Could not extract facial embedding vector.")

    def get_model_info(self) -> ModelInfo:
        return ModelInfo(
            name="insightface",
            version=self.version,
            embedding_dimension=self.dimension,
            license="Non-commercial / Research Use Only (InsightFace Model Zoo)",
            commercial_cleared=False,
            status="DEVELOPMENT / TEST ONLY",
        )


def get_face_engine() -> FaceEngine:
    """Singleton getter ensuring the AI model is loaded only once and reused."""
    global _engine_instance
    if _engine_instance is None:
        _engine_instance = InsightFaceEngine(model_name=settings.AI_MODEL_VERSION)
    return _engine_instance
