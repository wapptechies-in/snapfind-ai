"""
Face quality evaluation module.
Filters out blurry, tiny, or low-confidence face detections before embedding generation.

Status: IMPLEMENTED (Phase 5)
"""

import cv2
import numpy as np

from app.core.config import get_settings
from app.services.ai.engine import DetectedFace

settings = get_settings()


def evaluate_face_quality(
    image: np.ndarray,
    face: DetectedFace,
    min_score: float | None = None,
    min_size: int | None = None,
    blur_threshold: float | None = None,
) -> tuple[bool, float, str | None]:
    """
    Evaluates quality of a detected face.
    Returns (is_acceptable, quality_score, rejection_reason).
    """
    min_score = min_score if min_score is not None else settings.FACE_DETECTION_THRESHOLD
    min_size = min_size if min_size is not None else settings.MIN_FACE_SIZE
    blur_threshold = blur_threshold if blur_threshold is not None else settings.MAX_BLUR_THRESHOLD

    # 1. Detection confidence check
    if face.detection_score < min_score:
        return False, round(face.detection_score, 3), f"Low detection confidence ({face.detection_score:.2f} < {min_score})"

    # 2. Face dimensions check
    x1, y1, x2, y2 = face.bbox
    w = max(0, x2 - x1)
    h = max(0, y2 - y1)

    if w < min_size or h < min_size:
        return False, 0.2, f"Face size too small ({w}x{h} < {min_size}px)"

    # 3. Safe crop bounds
    img_h, img_w = image.shape[:2]
    cx1 = max(0, min(x1, img_w - 1))
    cy1 = max(0, min(y1, img_h - 1))
    cx2 = max(cx1 + 1, min(x2, img_w))
    cy2 = max(cy1 + 1, min(y2, img_h))

    crop = image[cy1:cy2, cx1:cx2]
    if crop.size == 0:
        return False, 0.0, "Empty face crop"

    # Convert to grayscale for sharpness & exposure analysis
    if len(crop.shape) == 3 and crop.shape[2] == 3:
        gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
    else:
        gray = crop

    # 4. Exposure & Brightness check
    mean_brightness = float(np.mean(gray))
    if mean_brightness < 15.0:
        return False, 0.15, "Face severely underexposed"
    if mean_brightness > 245.0:
        return False, 0.15, "Face severely overexposed"

    # 5. Blur detection using Laplacian variance
    laplacian_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    if laplacian_var < blur_threshold:
        return False, 0.3, f"Face too blurry (variance {laplacian_var:.1f} < {blur_threshold})"

    # 6. Composite quality score (normalized 0.0 to 1.0)
    sharpness_factor = min(1.0, laplacian_var / 250.0)
    size_factor = min(1.0, (w * h) / (120.0 * 120.0))
    conf_factor = face.detection_score

    composite_score = float(np.clip(
        0.4 * conf_factor + 0.35 * sharpness_factor + 0.25 * size_factor,
        0.0,
        1.0
    ))

    return True, round(composite_score, 3), None
