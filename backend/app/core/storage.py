import asyncio
import functools
import boto3
from botocore.config import Config

from app.config import settings


class StorageClient:
    """
    S3-compatible object storage abstraction.
    boto3 is synchronous — all calls are dispatched to a thread executor
    to avoid blocking the asyncio event loop.
    Local dev: MinIO (http://localhost:9000)
    Production: AWS S3 (update STORAGE_ENDPOINT_URL or leave blank for AWS)
    """

    def __init__(self):
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

    async def _run(self, func, *args, **kwargs):
        """Run a synchronous boto3 call in a thread pool executor."""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            None, functools.partial(func, *args, **kwargs)
        )

    async def upload(self, key: str, data: bytes, content_type: str) -> str:
        """Upload bytes and return a presigned URL."""
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
        response = await self._run(
            self._client.get_object, Bucket=self._bucket, Key=key
        )
        # response["Body"].read() is also sync — wrap it
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, response["Body"].read)

    async def upload_zip(self, key: str, data: bytes) -> str:
        """Upload a ZIP file and return a long-lived presigned download URL."""
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
