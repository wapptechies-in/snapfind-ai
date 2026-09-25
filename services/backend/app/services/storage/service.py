"""
Storage Service: high-level orchestration for keys, derivatives, and URLs.
Status: IMPLEMENTED (Phase 6)
"""

import hashlib
import io
import logging
import os
from typing import Any
from PIL import Image, ImageDraw, ImageFont, ImageOps

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

    def delete_event_objects(self, event_id: str) -> None:
        """Delete all storage objects (originals, web, thumbnails) belonging to an event."""
        prefix = f"events/{event_id}/"
        self.provider.delete_prefix(prefix)

    def apply_watermark(
        self,
        img: Image.Image,
        text: str = "SNAPFIND AI",
        opacity: int = 50,
    ) -> Image.Image:
        """
        Applies a clean diagonal semi-transparent watermark pattern
        and a subtle bottom-right attribution mark.
        """
        orig_mode = img.mode
        rgba_img = img.convert("RGBA")
        w, h = rgba_img.size

        overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        draw = ImageDraw.Draw(overlay)

        # Attempt to load clean font
        try:
            font_size = max(18, int(h / 24))
            font = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", font_size)
        except Exception:
            try:
                font = ImageFont.truetype("arial.ttf", 28)
            except Exception:
                font = ImageFont.load_default()

        # 1. Subtle diagonal repeating watermark text
        tile_w = max(240, int(w / 4))
        tile_h = max(120, int(h / 6))
        txt_img = Image.new("RGBA", (tile_w, tile_h), (0, 0, 0, 0))
        txt_draw = ImageDraw.Draw(txt_img)
        txt_draw.text((20, 20), text, fill=(255, 255, 255, opacity), font=font)
        rotated_txt = txt_img.rotate(30, expand=True, resample=Image.Resampling.BILINEAR)

        rw, rh = rotated_txt.size
        for x in range(0, w, rw + 40):
            for y in range(0, h, rh + 40):
                overlay.paste(rotated_txt, (x, y), rotated_txt)

        # 2. Sleek bottom-right copyright badge
        badge_text = f"© {text} • Protected Preview"
        try:
            badge_font = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", max(14, int(h / 36)))
        except Exception:
            badge_font = font

        bx = max(10, w - max(280, int(w * 0.3)))
        by = max(10, h - max(36, int(h * 0.05)))
        draw.text((bx + 1, by + 1), badge_text, fill=(0, 0, 0, 160), font=badge_font)
        draw.text((bx, by), badge_text, fill=(255, 255, 255, 200), font=badge_font)

        watermarked = Image.alpha_composite(rgba_img, overlay)
        return watermarked.convert(orig_mode if orig_mode in ("RGB", "L") else "RGB")

    def get_photo_bytes(
        self,
        photo: Photo,
        variant: str = "web",
        apply_watermark: bool = False,
        watermark_text: str = "SNAPFIND AI",
    ) -> bytes | None:
        """
        Fetch binary bytes for a photo variant from storage provider or file paths.
        Optionally applies watermarking overlay on the fly.
        """
        keys_to_try = []
        if variant == "original":
            keys_to_try = [photo.original_storage_key, photo.storage_key, photo.web_storage_key]
        elif variant == "thumbnail":
            keys_to_try = [photo.thumbnail_storage_key, photo.web_storage_key, photo.original_storage_key]
        else:  # web
            keys_to_try = [photo.web_storage_key, photo.original_storage_key, photo.storage_key]

        data: bytes | None = None
        for k in keys_to_try:
            if not k:
                continue
            if not k.startswith("http://") and not k.startswith("https://"):
                try:
                    data = self.provider.get_object_bytes(k)
                    if data:
                        break
                except Exception as err:
                    logger.debug(f"Could not get bytes for key {k}: {err}")

        # Fallback to local file path if stored in url
        if not data and photo.url and os.path.isfile(photo.url):
            try:
                with open(photo.url, "rb") as f:
                    data = f.read()
            except Exception as e:
                logger.debug(f"Could not read local file path {photo.url}: {e}")

        # Fallback to HTTP fetch if URL is an external mock/remote URL
        if not data and photo.url and photo.url.startswith("http"):
            try:
                import urllib.request
                req = urllib.request.Request(photo.url, headers={"User-Agent": "SnapFind/1.0"})
                with urllib.request.urlopen(req, timeout=5) as response:
                    data = response.read()
            except Exception as e:
                logger.debug(f"Could not download HTTP url {photo.url}: {e}")

        if not data:
            return None

        if apply_watermark:
            try:
                with Image.open(io.BytesIO(data)) as img:
                    wm_img = self.apply_watermark(img, text=watermark_text)
                    buf = io.BytesIO()
                    wm_img.save(buf, format="JPEG", quality=85, optimize=True)
                    return buf.getvalue()
            except Exception as e:
                logger.warning(f"Watermark application failed: {e}")
                return data

        return data


