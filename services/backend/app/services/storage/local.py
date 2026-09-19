"""
Local filesystem Storage Provider fallback for SnapFind AI.
Stores objects in a local directory structure.
Status: IMPLEMENTED (Phase 6)
"""

import os
from pathlib import Path
from typing import Any

from app.services.storage.base import StorageProvider


class LocalStorageProvider(StorageProvider):
    """Local filesystem storage provider for testing and offline environments."""

    def __init__(self, base_dir: str = "media_storage", base_url: str = "/static/media"):
        self.base_dir = Path(base_dir).resolve()
        self.base_url = base_url.rstrip("/")
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def _get_path(self, key: str) -> Path:
        return self.base_dir / key

    def generate_presigned_upload_url(
        self,
        key: str,
        content_type: str,
        expires_in: int = 3600,
    ) -> dict[str, Any]:
        target = self._get_path(key)
        target.parent.mkdir(parents=True, exist_ok=True)
        return {
            "upload_url": f"/api/v1/storage/upload?key={key}",
            "method": "PUT",
            "headers": {"Content-Type": content_type},
            "expires_in": expires_in,
            "key": key,
        }

    def generate_presigned_download_url(
        self,
        key: str,
        expires_in: int = 3600,
        filename: str | None = None,
        inline: bool = False,
    ) -> str:
        return f"/api/v1/storage/file/{key}"

    def object_exists(self, key: str) -> bool:
        return self._get_path(key).is_file()

    def get_object_metadata(self, key: str) -> dict[str, Any]:
        path = self._get_path(key)
        if not path.is_file():
            raise FileNotFoundError(f"Local file '{key}' does not exist")
        stat = path.stat()
        return {
            "size": stat.st_size,
            "content_type": "image/jpeg",
            "etag": f"local-{stat.st_mtime}",
        }

    def get_object_bytes(self, key: str) -> bytes:
        path = self._get_path(key)
        if not path.is_file():
            raise FileNotFoundError(f"Local file '{key}' does not exist")
        return path.read_bytes()

    def put_object_bytes(
        self,
        key: str,
        data: bytes,
        content_type: str = "image/jpeg",
    ) -> None:
        path = self._get_path(key)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)

    def delete_object(self, key: str) -> bool:
        path = self._get_path(key)
        if path.is_file():
            path.unlink()
        return True

    def delete_objects(self, keys: list[str]) -> bool:
        for k in keys:
            self.delete_object(k)
        return True
