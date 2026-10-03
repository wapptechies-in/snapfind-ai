"""
Local filesystem Storage Provider fallback for SnapFind AI.
Stores objects in a local directory structure.
Status: IMPLEMENTED (Phase 6)
"""

import os
from pathlib import Path
from typing import Any

from app.services.storage.base import StorageProvider


BACKEND_DIR = Path(__file__).resolve().parent.parent.parent.parent
DEFAULT_MEDIA_DIR = BACKEND_DIR / "media_storage"


class LocalStorageProvider(StorageProvider):
    """Local filesystem storage provider for testing and offline environments."""

    def __init__(self, base_dir: str | Path | None = None, base_url: str = "/static/media"):
        self.base_dir = Path(base_dir).resolve() if base_dir else DEFAULT_MEDIA_DIR
        self.base_url = base_url.rstrip("/")
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def _get_path(self, key: str) -> Path:
        clean_key = str(key).lstrip("/\\")
        return self.base_dir / clean_key

    def _get_public_base(self) -> str:
        render_url = os.getenv("RENDER_EXTERNAL_URL")
        if render_url:
            base = render_url.rstrip("/")
            if base.startswith("http://"):
                base = "https://" + base[len("http://"):]
            return base

        from app.core.config import get_settings
        st = get_settings()
        if st.STORAGE_PUBLIC_ENDPOINT_URL and "localhost" not in st.STORAGE_PUBLIC_ENDPOINT_URL and "127.0.0.1" not in st.STORAGE_PUBLIC_ENDPOINT_URL:
            return st.STORAGE_PUBLIC_ENDPOINT_URL.rstrip("/")

        return "http://127.0.0.1:8000"

    def generate_presigned_upload_url(
        self,
        key: str,
        content_type: str,
        expires_in: int = 3600,
    ) -> dict[str, Any]:
        clean_key = str(key).lstrip("/\\")
        target = self._get_path(clean_key)
        target.parent.mkdir(parents=True, exist_ok=True)
        base = self._get_public_base()
        return {
            "upload_url": f"{base}/api/v1/storage/upload?key={clean_key}",
            "method": "PUT",
            "headers": {"Content-Type": content_type},
            "expires_in": expires_in,
            "key": clean_key,
        }

    def generate_presigned_download_url(
        self,
        key: str,
        expires_in: int = 3600,
        filename: str | None = None,
        inline: bool = False,
    ) -> str:
        clean_key = str(key).lstrip("/\\")
        base = self._get_public_base()
        return f"{base}/api/v1/storage/file/{clean_key}"

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

    def delete_prefix(self, prefix: str) -> bool:
        prefix_path = self._get_path(prefix)
        if prefix_path.is_dir():
            import shutil
            shutil.rmtree(prefix_path, ignore_errors=True)
        return True

