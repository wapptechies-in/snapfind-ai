"""
Abstract Storage Provider interface for SnapFind AI.
Defines the contract for object storage operations (S3, MinIO, R2, or Local).
Status: IMPLEMENTED (Phase 6)
"""

from abc import ABC, abstractmethod
from typing import Any


class StorageProvider(ABC):
    """Abstract interface for object storage operations."""

    @abstractmethod
    def generate_presigned_upload_url(
        self,
        key: str,
        content_type: str,
        expires_in: int = 3600,
    ) -> dict[str, Any]:
        """
        Generate a presigned PUT URL allowing clients to upload directly.
        Returns a dictionary with `upload_url`, `method`, `headers`, and `expires_in`.
        """
        pass

    @abstractmethod
    def generate_presigned_download_url(
        self,
        key: str,
        expires_in: int = 3600,
        filename: str | None = None,
        inline: bool = False,
    ) -> str:
        """
        Generate a short-lived presigned GET URL for viewing or downloading an object.
        If inline is False and filename is given, triggers attachment download.
        """
        pass

    @abstractmethod
    def object_exists(self, key: str) -> bool:
        """Check whether an object exists in the storage bucket."""
        pass

    @abstractmethod
    def get_object_metadata(self, key: str) -> dict[str, Any]:
        """
        Retrieve object metadata such as size, content_type, and etag.
        Raises FileNotFoundError if object does not exist.
        """
        pass

    @abstractmethod
    def get_object_bytes(self, key: str) -> bytes:
        """
        Fetch and return the binary content of the specified object.
        Raises FileNotFoundError if object does not exist.
        """
        pass

    @abstractmethod
    def put_object_bytes(
        self,
        key: str,
        data: bytes,
        content_type: str = "image/jpeg",
    ) -> None:
        """Upload raw binary bytes directly to the storage bucket."""
        pass

    @abstractmethod
    def delete_object(self, key: str) -> bool:
        """Delete an object from storage. Returns True if deleted or already absent."""
        pass

    @abstractmethod
    def delete_objects(self, keys: list[str]) -> bool:
        """Batch delete multiple objects from storage."""
        pass

    @abstractmethod
    def delete_prefix(self, prefix: str) -> bool:
        """Delete all objects matching a key prefix from storage."""
        pass

