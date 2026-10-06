"""
S3 Storage Provider for SnapFind AI.
Compatible with MinIO, AWS S3, and Cloudflare R2 using boto3.
Status: IMPLEMENTED (Phase 6)
"""

import logging
import time
from typing import Any
import boto3
from botocore.client import Config
from botocore.exceptions import ClientError

from app.services.storage.base import StorageProvider

logger = logging.getLogger("snapfind.storage.s3")

# Global thread-safe in-memory cache for presigned download URLs to eliminate HMAC signature CPU overhead
_URL_CACHE: dict[str, tuple[str, float]] = {}


class S3StorageProvider(StorageProvider):
    """Boto3-based S3 Storage Provider supporting MinIO, AWS S3, and Cloudflare R2."""

    def __init__(
        self,
        bucket_name: str,
        endpoint_url: str | None = None,
        public_endpoint_url: str | None = None,
        access_key: str | None = None,
        secret_key: str | None = None,
        region_name: str = "us-east-1",
        cdn_url: str | None = None,
    ):
        self.bucket_name = bucket_name
        self.endpoint_url = endpoint_url
        self.public_endpoint_url = public_endpoint_url or endpoint_url
        self.access_key = access_key
        self.secret_key = secret_key
        self.region_name = region_name
        self.cdn_url = cdn_url.rstrip("/") if cdn_url else None

        client_config = Config(
            signature_version="s3v4",
            s3={"addressing_style": "path"},
            retries={"max_attempts": 3, "mode": "standard"},
        )

        self.client = boto3.client(
            "s3",
            endpoint_url=self.endpoint_url,
            aws_access_key_id=self.access_key,
            aws_secret_access_key=self.secret_key,
            region_name=self.region_name,
            config=client_config,
        )

        self._ensure_bucket_and_cors()

    def _ensure_bucket_and_cors(self) -> None:
        """Create bucket if it doesn't exist and configure permissive CORS for direct client uploads."""
        try:
            self.client.head_bucket(Bucket=self.bucket_name)
        except ClientError as err:
            error_code = err.response.get("Error", {}).get("Code", "")
            if error_code in ("404", "NoSuchBucket"):
                logger.info(f"Creating bucket '{self.bucket_name}'...")
                try:
                    create_kwargs: dict[str, Any] = {"Bucket": self.bucket_name}
                    if self.region_name != "us-east-1":
                        create_kwargs["CreateBucketConfiguration"] = {
                            "LocationConstraint": self.region_name
                        }
                    self.client.create_bucket(**create_kwargs)
                    logger.info(f"Bucket '{self.bucket_name}' created successfully.")
                except Exception as create_err:
                    logger.warning(f"Could not auto-create bucket '{self.bucket_name}': {create_err}")
            else:
                logger.warning(f"HeadBucket check returned error: {err}")

        # Set CORS policy so browser direct uploads succeed
        try:
            cors_config = {
                "CORSRules": [
                    {
                        "AllowedHeaders": ["*"],
                        "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
                        "AllowedOrigins": ["*"],
                        "ExposeHeaders": ["ETag", "x-amz-request-id"],
                        "MaxAgeSeconds": 3600,
                    }
                ]
            }
            self.client.put_bucket_cors(Bucket=self.bucket_name, CORSConfiguration=cors_config)
        except Exception as cors_err:
            # MinIO handles CORS natively via MINIO_API_CORS_ALLOW_ORIGIN
            logger.debug(f"Bucket CORS policy notice: {cors_err}")

    def generate_presigned_upload_url(
        self,
        key: str,
        content_type: str,
        expires_in: int = 3600,
    ) -> dict[str, Any]:
        """Generate presigned PUT URL for direct client binary upload."""
        params = {
            "Bucket": self.bucket_name,
            "Key": key,
            "ContentType": content_type,
        }
        url = self.client.generate_presigned_url(
            ClientMethod="put_object",
            Params=params,
            ExpiresIn=expires_in,
            HttpMethod="PUT",
        )

        return {
            "upload_url": url,
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
        """Generate short-lived presigned GET URL for viewing or downloading."""
        if self.cdn_url and inline and not filename:
            clean_key = key.lstrip("/")
            return f"{self.cdn_url}/{clean_key}"

        cache_key = f"{key}:{filename}:{inline}:{expires_in}"
        now = time.time()
        cached = _URL_CACHE.get(cache_key)
        if cached and cached[1] > now + 300:
            return cached[0]

        params: dict[str, Any] = {
            "Bucket": self.bucket_name,
            "Key": key,
        }
        if filename:
            disposition = "inline" if inline else "attachment"
            # Sanitize filename for content-disposition header
            safe_name = filename.replace('"', "").replace("\n", "").replace("\r", "")
            params["ResponseContentDisposition"] = f'{disposition}; filename="{safe_name}"'

        url = self.client.generate_presigned_url(
            ClientMethod="get_object",
            Params=params,
            ExpiresIn=expires_in,
        )

        _URL_CACHE[cache_key] = (url, now + expires_in)
        if len(_URL_CACHE) > 5000:
            # Clean expired entries when cache grows
            expired_keys = [k for k, v in _URL_CACHE.items() if v[1] <= now + 300]
            for k in expired_keys:
                _URL_CACHE.pop(k, None)

        return url

    def object_exists(self, key: str) -> bool:
        """Check whether object exists in bucket."""
        try:
            self.client.head_object(Bucket=self.bucket_name, Key=key)
            return True
        except ClientError as e:
            if e.response.get("Error", {}).get("Code") in ("404", "NoSuchKey"):
                return False
            logger.warning(f"Error checking object existence for '{key}': {e}")
            return False

    def get_object_metadata(self, key: str) -> dict[str, Any]:
        """Retrieve size, content_type, and etag of an object."""
        try:
            resp = self.client.head_object(Bucket=self.bucket_name, Key=key)
            return {
                "size": resp.get("ContentLength", 0),
                "content_type": resp.get("ContentType", "image/jpeg"),
                "etag": resp.get("ETag", "").strip('"'),
                "last_modified": resp.get("LastModified"),
            }
        except ClientError as e:
            if e.response.get("Error", {}).get("Code") in ("404", "NoSuchKey"):
                raise FileNotFoundError(f"Object '{key}' not found in bucket '{self.bucket_name}'")
            raise

    def get_object_bytes(self, key: str) -> bytes:
        """Fetch and return binary content of an object."""
        try:
            resp = self.client.get_object(Bucket=self.bucket_name, Key=key)
            return resp["Body"].read()
        except ClientError as e:
            if e.response.get("Error", {}).get("Code") in ("404", "NoSuchKey"):
                raise FileNotFoundError(f"Object '{key}' not found in bucket '{self.bucket_name}'")
            raise

    def put_object_bytes(
        self,
        key: str,
        data: bytes,
        content_type: str = "image/jpeg",
    ) -> None:
        """Upload raw bytes to bucket."""
        self.client.put_object(
            Bucket=self.bucket_name,
            Key=key,
            Body=data,
            ContentType=content_type,
        )

    def delete_object(self, key: str) -> bool:
        """Delete an object from bucket."""
        try:
            self.client.delete_object(Bucket=self.bucket_name, Key=key)
            return True
        except ClientError as e:
            logger.warning(f"Error deleting object '{key}': {e}")
            return False

    def delete_objects(self, keys: list[str]) -> bool:
        """Delete multiple objects from bucket."""
        if not keys:
            return True
        try:
            self.client.delete_objects(
                Bucket=self.bucket_name,
                Delete={"Objects": [{"Key": k} for k in keys], "Quiet": True},
            )
            return True
        except ClientError as e:
            logger.warning(f"Error batch deleting objects: {e}")
            return False

    def delete_prefix(self, prefix: str) -> bool:
        """Delete all objects matching a key prefix from bucket."""
        try:
            paginator = self.client.get_paginator("list_objects_v2")
            for page in paginator.paginate(Bucket=self.bucket_name, Prefix=prefix):
                if "Contents" in page:
                    keys = [{"Key": obj["Key"]} for obj in page["Contents"]]
                    if keys:
                        self.client.delete_objects(
                            Bucket=self.bucket_name,
                            Delete={"Objects": keys, "Quiet": True},
                        )
            return True
        except Exception as e:
            logger.warning(f"Error deleting prefix '{prefix}': {e}")
            return False
