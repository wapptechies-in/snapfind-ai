"""
Storage Service: high-level orchestration for keys, derivatives, and URLs.
Status: IMPLEMENTED (Phase 6)
"""

import hashlib
import io
import logging
import os
from typing import Any
from PIL import Image, ImageOps

from app.core.config import get_settings
from app.models.photo import Photo
from app.services.storage.base import StorageProvider
from app.services.storage.factory import get_storage_provider

logger = logging.getLogger("snapfind.storage.service")
settings = get_settings()


def sanitize_filename(filename: str) -> str:
    """Sanitize filename to keep alphanumeric, dashes, dots, and underscores."""
    base = os.path.basename(filename)
    clean = "".join(c for c in base if c.isalnum() or c in (".", "_", "-")).strip()
    return clean or "photo.jpg"


class StorageService:
    """Orchestrates photo keys, derivatives generation, presigned URLs, and binary retrieval."""

    def __init__(self, provider: StorageProvider | None = None):
        self.provider = provider or get_storage_provider()

    # --- Structured Key Helpers ---

    @staticmethod
    def build_original_key(event_id: str, photo_id: str, filename: str) -> str:
        safe_name = sanitize_filename(filename)
        return f"events/{event_id}/originals/{photo_id}/{safe_name}"

    @staticmethod
    def build_web_key(event_id: str, photo_id: str) -> str:
        return f"events/{event_id}/web/{photo_id}.jpg"

    @staticmethod
    def build_thumbnail_key(event_id: str, photo_id: str) -> str:
        return f"events/{event_id}/thumbnails/{photo_id}.jpg"

    # --- Checksum and Metadata ---

    @staticmethod
    def compute_sha256(data: bytes) -> str:
        """Compute hex SHA-256 checksum of raw binary data."""
        return hashlib.sha256(data).hexdigest()

    # --- Derivative Generation ---

    def create_and_store_derivatives(
        self,
        event_id: str,
        photo_id: str,
        original_bytes: bytes,
    ) -> dict[str, Any]:
        """
        Processes original image bytes:
        1. Corrects EXIF orientation.
        2. Measures original dimensions (width, height).
        3. Generates web preview (max 1920px, JPEG quality 85).
        4. Generates thumbnail (max 400px, JPEG quality 80).
        5. Uploads web & thumbnail to storage.
        Returns dictionary with metadata and keys.
        """
        with Image.open(io.BytesIO(original_bytes)) as img:
            # Transpose according to EXIF orientation
            img = ImageOps.exif_transpose(img)
            orig_width, orig_height = img.size

            # Ensure RGB
            if img.mode not in ("RGB", "L"):
                img = img.convert("RGB")

            # 1. Web Preview (max 1920x1920)
            web_img = img.copy()
            web_img.thumbnail((1920, 1920), Image.Resampling.LANCZOS)
            web_buf = io.BytesIO()
            web_img.save(web_buf, format="JPEG", quality=85, optimize=True)
            web_bytes = web_buf.getvalue()

            # 2. Thumbnail (max 400x400)
            thumb_img = img.copy()
            thumb_img.thumbnail((400, 400), Image.Resampling.LANCZOS)
            thumb_buf = io.BytesIO()
            thumb_img.save(thumb_buf, format="JPEG", quality=80, optimize=True)
            thumb_bytes = thumb_buf.getvalue()

        web_key = self.build_web_key(event_id, photo_id)
        thumb_key = self.build_thumbnail_key(event_id, photo_id)

        # Upload derivatives directly to storage
        self.provider.put_object_bytes(web_key, web_bytes, content_type="image/jpeg")
        self.provider.put_object_bytes(thumb_key, thumb_bytes, content_type="image/jpeg")

        return {
            "width": orig_width,
            "height": orig_height,
            "web_storage_key": web_key,
            "thumbnail_storage_key": thumb_key,
            "file_size": len(original_bytes),
            "checksum": self.compute_sha256(original_bytes),
        }

    # --- Presigned URLs for Photos ---

    def get_photo_url(
        self,
        photo: Photo,
        variant: str = "web",
        download: bool = False,
        expires_in: int | None = None,
    ) -> str:
        """
        Generate short-lived presigned GET URL for viewing or downloading a photo.
        Variants: 'original', 'web', 'thumbnail'.
        """
        ttl = expires_in or settings.PRESIGNED_URL_EXPIRE_SECONDS

        if variant == "original":
            key = photo.original_storage_key or photo.original_key or photo.storage_key
            filename = photo.original_filename or photo.filename
            inline = not download
        elif variant == "thumbnail":
            key = (
                photo.thumbnail_storage_key
                or photo.thumbnail_key
                or photo.web_storage_key
                or photo.original_storage_key
                or photo.storage_key
            )
            filename = f"thumb_{photo.id}.jpg"
            inline = not download
        else:  # 'web'
            key = (
                photo.web_storage_key
                or photo.web_image_key
                or photo.original_storage_key
                or photo.storage_key
            )
            filename = f"web_{photo.id}.jpg"
            inline = not download

        # Fallback to stored URL if key is absent
        if not key:
            if variant == "thumbnail" and photo.thumbnail_url:
                return photo.thumbnail_url
            return photo.url or ""

        # If key is already an external HTTP URL, return directly
        if key.startswith("http://") or key.startswith("https://"):
            return key

        return self.provider.generate_presigned_download_url(
            key=key,
            expires_in=ttl,
            filename=filename if download else None,
            inline=inline,
        )

    def delete_photo_objects(self, photo: Photo) -> None:
        """Delete original, web, and thumbnail objects associated with photo."""
        keys_to_delete = [
            k
            for k in (
                photo.original_storage_key,
                photo.web_storage_key,
                photo.thumbnail_storage_key,
                photo.storage_key,
                photo.thumbnail_key,
                photo.web_image_key,
                photo.original_key,
            )
            if k and not k.startswith("http://") and not k.startswith("https://")
        ]
        unique_keys = list(set(keys_to_delete))
        if unique_keys:
            self.provider.delete_objects(unique_keys)
