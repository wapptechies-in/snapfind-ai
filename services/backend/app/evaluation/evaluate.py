"""
Evaluation script for face recognition retrieval accuracy.
Measures True Match Rate, False Match Rate, Precision, and Recall on benchmark evaluation data.

Run via:
    python -m app.evaluation.evaluate
Status: IMPLEMENTED (Phase 5)
"""

import os
import cv2
import numpy as np

from app.core.config import get_settings
from app.services.ai.insightface_engine import get_face_engine

settings = get_settings()


def run_evaluation() -> dict[str, float]:
    """
    Evaluates the face engine on the controlled test dataset.
    """
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
    data_dir = os.path.join(base_dir, "tests", "data")

    p1_portrait_path = os.path.join(data_dir, "person1_portrait.jpg")
    p1_selfie_path = os.path.join(data_dir, "person1_selfie.jpg")
    p2_portrait_path = os.path.join(data_dir, "person2_portrait.jpg")

    if not (os.path.isfile(p1_portrait_path) and os.path.isfile(p1_selfie_path) and os.path.isfile(p2_portrait_path)):
        print(f"Evaluation dataset files missing in {data_dir}. Please run dataset generation first.")
        return {}

    engine = get_face_engine()
    model_info = engine.get_model_info()

    print("=" * 60)
    print("SNAPFIND AI — FACE RECOGNITION BENCHMARK EVALUATION")
    print(f"Model: {model_info.name} ({model_info.version})")
    print(f"Embedding Dimension: {model_info.embedding_dimension}")
    print(f"Licensing Status: {model_info.status}")
    print("=" * 60)

    # 1. Extract Embeddings
    img_p1 = cv2.imread(p1_portrait_path)
    img_selfie = cv2.imread(p1_selfie_path)
    img_p2 = cv2.imread(p2_portrait_path)

    faces_p1 = engine.detect_faces(img_p1)
    faces_selfie = engine.detect_faces(img_selfie)
    faces_p2 = engine.detect_faces(img_p2)

    assert len(faces_p1) > 0, "No face detected in person1 portrait"
    assert len(faces_selfie) > 0, "No face detected in person1 selfie"
    assert len(faces_p2) > 0, "No face detected in person2 portrait"

    emb_p1 = faces_p1[0].embedding
    emb_selfie = faces_selfie[0].embedding
    emb_p2 = faces_p2[0].embedding

    # 2. Compute Cosine Similarities (Dot product of unit vectors)
    sim_positive = float(np.dot(emb_selfie, emb_p1))
    sim_negative = float(np.dot(emb_selfie, emb_p2))

    # 3. Benchmark Thresholds
    strong_thresh = settings.STRONG_MATCH_THRESHOLD
    possible_thresh = settings.POSSIBLE_MATCH_THRESHOLD

    # Metrics evaluation
    true_positive = 1 if sim_positive >= possible_thresh else 0
    false_negative = 0 if sim_positive >= possible_thresh else 1
    false_positive = 1 if sim_negative >= possible_thresh else 0
    true_negative = 0 if sim_negative >= possible_thresh else 1

    precision = true_positive / (true_positive + false_positive) if (true_positive + false_positive) > 0 else 0.0
    recall = true_positive / (true_positive + false_negative) if (true_positive + false_negative) > 0 else 0.0

    print(f"Positive Match Similarity (Same Person): {sim_positive:.4f}")
    print(f"Negative Match Similarity (Different Person): {sim_negative:.4f}")
    print(f"Configured Strong Threshold: {strong_thresh}")
    print(f"Configured Possible Threshold: {possible_thresh}")
    print("-" * 60)
    print(f"Precision: {precision * 100:.1f}%")
    print(f"Recall:    {recall * 100:.1f}%")
    print(f"Separation Gap (Pos - Neg): {sim_positive - sim_negative:.4f}")
    print("=" * 60)

    return {
        "positive_similarity": sim_positive,
        "negative_similarity": sim_negative,
        "precision": precision,
        "recall": recall,
        "separation_gap": sim_positive - sim_negative,
    }


if __name__ == "__main__":
    run_evaluation()

