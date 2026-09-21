"""
Storage Provider Factory.
Instantiates and provides singleton StorageProvider instances.
Status: IMPLEMENTED (Phase 6)
"""

from functools import lru_cache

from app.core.config import get_settings
from app.services.storage.base import StorageProvider
from app.services.storage.local import LocalStorageProvider
from app.services.storage.s3 import S3StorageProvider


@lru_cache
def get_storage_provider() -> StorageProvider:
    """Instantiate and cache configured StorageProvider singleton."""
    settings = get_settings()
    provider_name = settings.STORAGE_PROVIDER.lower().strip()

    if provider_name in ("minio", "s3", "r2"):
        return S3StorageProvider(
            bucket_name=settings.STORAGE_BUCKET_NAME,
            endpoint_url=settings.STORAGE_ENDPOINT_URL,
            public_endpoint_url=settings.STORAGE_PUBLIC_ENDPOINT_URL,
            access_key=settings.STORAGE_ACCESS_KEY,
            secret_key=settings.STORAGE_SECRET_KEY,
            region_name=settings.STORAGE_REGION,
        )
    elif provider_name == "local":
        return LocalStorageProvider()
    else:
        return S3StorageProvider(
            bucket_name=settings.STORAGE_BUCKET_NAME,
            endpoint_url=settings.STORAGE_ENDPOINT_URL,
            public_endpoint_url=settings.STORAGE_PUBLIC_ENDPOINT_URL,
            access_key=settings.STORAGE_ACCESS_KEY,
            secret_key=settings.STORAGE_SECRET_KEY,
            region_name=settings.STORAGE_REGION,
        )

