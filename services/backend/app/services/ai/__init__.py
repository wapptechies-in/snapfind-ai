"""
SnapFind AI service package.
"""

from app.services.ai.engine import DetectedFace, FaceEngine, ModelInfo
from app.services.ai.insightface_engine import InsightFaceEngine, get_face_engine
from app.services.ai.quality import evaluate_face_quality
from app.services.ai.service import process_photo_for_faces, search_faces_by_selfie
from app.services.ai.vector_search import search_event_faces

__all__ = [
    "DetectedFace",
    "FaceEngine",
    "ModelInfo",
    "InsightFaceEngine",
    "get_face_engine",
    "evaluate_face_quality",
    "process_photo_for_faces",
    "search_faces_by_selfie",
    "search_event_faces",
]

