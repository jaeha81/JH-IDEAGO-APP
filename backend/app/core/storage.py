import boto3
from botocore.exceptions import ClientError
from botocore.config import Config

from app.config import settings


class StorageClient:
    def __init__(self):
        self._client = boto3.client(
            "s3",
            endpoint_url=settings.STORAGE_ENDPOINT_URL,
            aws_access_key_id=settings.STORAGE_ACCESS_KEY,
            aws_secret_access_key=settings.STORAGE_SECRET_KEY,
            config=Config(signature_version="s3v4"),
        )
        self._bucket = settings.STORAGE_BUCKET_NAME

    async def upload(self, key: str, data: bytes, content_type: str) -> str:
        self._client.put_object(
            Bucket=self._bucket,
            Key=key,
            Body=data,
            ContentType=content_type,
        )
        return await self.presign(key)

    async def presign(self, key: str, expiry: int | None = None) -> str:
        expiry = expiry or settings.STORAGE_PRESIGN_EXPIRY_SECONDS
        url = self._client.generate_presigned_url(
            "get_object",
            Params={"Bucket": self._bucket, "Key": key},
            ExpiresIn=expiry,
        )
        return url

    async def download_bytes(self, key: str) -> bytes:
        response = self._client.get_object(Bucket=self._bucket, Key=key)
        return response["Body"].read()

    async def upload_zip(self, key: str, data: bytes) -> str:
        self._client.put_object(
            Bucket=self._bucket,
            Key=key,
            Body=data,
            ContentType="application/zip",
        )
        return await self.presign(key, expiry=settings.EXPORT_DOWNLOAD_EXPIRY_HOURS * 3600)
