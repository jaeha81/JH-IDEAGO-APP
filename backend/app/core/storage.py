import asyncio
import functools
from typing import Optional
import boto3
from botocore.config import Config
from fastapi import HTTPException

from app.config import settings


class StorageClient:
    """
    S3-compatible object storage abstraction.
    boto3 is synchronous — all calls are dispatched to a thread executor
    to avoid blocking the asyncio event loop.
    Local dev: MinIO (http://localhost:9000)
    Production: AWS S3 / Cloudflare R2 / Backblaze B2

    If STORAGE_ACCESS_KEY is not set, all operations raise HTTP 503.
    This allows the app to run without storage (file upload/AI image features disabled).
    """

    def __init__(self):
        if not settings.storage_enabled:
            self._client = None
            self._bucket = settings.STORAGE_BUCKET_NAME
            return

        # endpoint_url=None → standard AWS S3
        # endpoint_url="https://..." → MinIO / Cloudflare R2 / Backblaze B2
        self._client = boto3.client(
            "s3",
            endpoint_url=settings.STORAGE_ENDPOINT_URL or None,
            aws_access_key_id=settings.STORAGE_ACCESS_KEY,
            aws_secret_access_key=settings.STORAGE_SECRET_KEY,
            config=Config(signature_version="s3v4"),
        )
        self._bucket = settings.STORAGE_BUCKET_NAME

    def _require_storage(self):
        """Raises HTTP 503 if storage is not configured."""
        if not self._client:
            raise HTTPException(
                status_code=503,
                detail="File storage is not configured. Set STORAGE_ACCESS_KEY and STORAGE_SECRET_KEY to enable file uploads.",
            )

    async def _run(self, func, *args, **kwargs):
        """Run a synchronous boto3 call in a thread pool executor."""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            None, functools.partial(func, *args, **kwargs)
        )

    async def upload(self, key: str, data: bytes, content_type: str) -> str:
        """Upload bytes and return a presigned URL."""
        self._require_storage()
        await self._run(
            self._client.put_object,
            Bucket=self._bucket,
            Key=key,
            Body=data,
            ContentType=content_type,
        )
        return await self.presign(key)

    async def presign(self, key: str, expiry: int | None = None) -> str:
        """Generate a presigned GET URL."""
        self._require_storage()
        expiry = expiry or settings.STORAGE_PRESIGN_EXPIRY_SECONDS
        url = await self._run(
            self._client.generate_presigned_url,
            "get_object",
            Params={"Bucket": self._bucket, "Key": key},
            ExpiresIn=expiry,
        )
        return url

    async def download_bytes(self, key: str) -> bytes:
        """Download object and return raw bytes."""
        self._require_storage()
        response = await self._run(
            self._client.get_object, Bucket=self._bucket, Key=key
        )
        # response["Body"].read() is also sync — wrap it
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, response["Body"].read)

    async def upload_zip(self, key: str, data: bytes) -> str:
        """Upload a ZIP file and return a long-lived presigned download URL."""
        self._require_storage()
        await self._run(
            self._client.put_object,
            Bucket=self._bucket,
            Key=key,
            Body=data,
            ContentType="application/zip",
        )
        return await self.presign(
            key, expiry=settings.EXPORT_DOWNLOAD_EXPIRY_HOURS * 3600
        )
