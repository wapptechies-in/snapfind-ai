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


import logging
import socket
from urllib.parse import urlparse

logger = logging.getLogger("snapfind.storage")


def _is_endpoint_reachable(endpoint_url: str | None, default_host: str | None = None) -> bool:
    """Fast check whether storage endpoint is responsive (timeout 0.5s)."""
    target_url = endpoint_url
    if not target_url and default_host:
        target_url = f"https://{default_host}:443"

    if not target_url:
        return False
    try:
        parsed = urlparse(target_url)
        host = parsed.hostname or "localhost"
        port = parsed.port or (443 if parsed.scheme == "https" else 80)
        with socket.create_connection((host, port), timeout=0.5):
            return True
    except Exception:
        return False


@lru_cache
def get_storage_provider() -> StorageProvider:
    """Instantiate and cache configured StorageProvider singleton with graceful fallback."""
    settings = get_settings()
    provider_name = settings.STORAGE_PROVIDER.lower().strip()

    if provider_name in ("minio", "s3", "r2"):
        endpoint_url = settings.STORAGE_ENDPOINT_URL
        public_endpoint_url = settings.STORAGE_PUBLIC_ENDPOINT_URL
        region = settings.STORAGE_REGION or "us-east-1"

        # Special handling for Cloudflare R2
        if provider_name == "r2":
            region = "auto"
            if settings.CLOUDFLARE_R2_ACCOUNT_ID and not endpoint_url:
                endpoint_url = f"https://{settings.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com"
                public_endpoint_url = public_endpoint_url or endpoint_url

        # Fast reachability check
        aws_host = f"s3.{region}.amazonaws.com" if provider_name == "s3" and not endpoint_url else None
        if not _is_endpoint_reachable(endpoint_url, default_host=aws_host):
            logger.info(
                f"Storage endpoint '{endpoint_url or aws_host}' is offline. Gracefully falling back to LocalStorageProvider."
            )
            return LocalStorageProvider()

        try:
            return S3StorageProvider(
                bucket_name=settings.STORAGE_BUCKET_NAME,
                endpoint_url=endpoint_url,
                public_endpoint_url=public_endpoint_url,
                access_key=settings.STORAGE_ACCESS_KEY,
                secret_key=settings.STORAGE_SECRET_KEY,
                region_name=region,
                cdn_url=settings.STORAGE_CDN_URL,
            )
        except Exception as e:
            logger.warning(
                f"Could not connect to S3/R2/MinIO endpoint ({e}). Gracefully falling back to LocalStorageProvider."
            )
            return LocalStorageProvider()
    elif provider_name == "local":
        return LocalStorageProvider()
    else:
        try:
            return S3StorageProvider(
                bucket_name=settings.STORAGE_BUCKET_NAME,
                endpoint_url=settings.STORAGE_ENDPOINT_URL,
                public_endpoint_url=settings.STORAGE_PUBLIC_ENDPOINT_URL,
                access_key=settings.STORAGE_ACCESS_KEY,
                secret_key=settings.STORAGE_SECRET_KEY,
                region_name=settings.STORAGE_REGION,
                cdn_url=settings.STORAGE_CDN_URL,
            )
        except Exception as e:
            logger.warning(
                f"Could not connect to S3/MinIO ({e}). Gracefully falling back to LocalStorageProvider."
            )
            return LocalStorageProvider()

