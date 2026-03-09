import uuid
from datetime import datetime, timedelta, timezone
from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.asset import UploadedAsset
from app.services.project_service import ProjectService
from app.services.event_service import EventService
from app.core.storage import StorageClient
from app.core.exceptions import NotFoundError, UnsupportedMediaTypeError, PayloadTooLargeError
from app.config import settings

ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_BYTES = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024


class AssetService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.storage = StorageClient()

    async def upload(self, user_id: uuid.UUID, project_id: str, file: UploadFile) -> dict:
        project = await ProjectService(self.db).get_owned(user_id, project_id)

        if file.content_type not in ALLOWED_MIME_TYPES:
            raise UnsupportedMediaTypeError(
                f"Unsupported file type: {file.content_type}. Allowed: {', '.join(sorted(ALLOWED_MIME_TYPES))}"
            )

        content = await file.read()
        if len(content) > MAX_BYTES:
            raise PayloadTooLargeError(f"File exceeds {settings.MAX_UPLOAD_SIZE_MB}MB limit")

        asset_id = uuid.uuid4()
        ext = file.filename.rsplit(".", 1)[-1] if file.filename and "." in file.filename else "bin"
        storage_key = f"projects/{project.id}/uploads/{asset_id}.{ext}"

        url = await self.storage.upload(storage_key, content, file.content_type)

        asset = UploadedAsset(
            id=asset_id,
            project_id=project.id,
            original_name=file.filename,
            mime_type=file.content_type,
            storage_key=storage_key,
            storage_url=url,
            file_size_bytes=len(content),
        )
        self.db.add(asset)
        await self.db.flush()
        await EventService(self.db).log(
            project.id, user_id, "asset.uploaded",
            {"asset_id": str(asset.id), "filename": file.filename, "mime_type": file.content_type, "file_size_bytes": len(content)}
        )

        return {"data": _asset_out(asset)}

    async def list(self, user_id: uuid.UUID, project_id: str) -> dict:
        project = await ProjectService(self.db).get_owned(user_id, project_id)
        result = await self.db.execute(
            select(UploadedAsset).where(UploadedAsset.project_id == project.id).order_by(UploadedAsset.uploaded_at.desc())
        )
        return {"data": [_asset_out(a) for a in result.scalars().all()]}

    async def refresh_url(self, user_id: uuid.UUID, project_id: str, asset_id: str) -> dict:
        project = await ProjectService(self.db).get_owned(user_id, project_id)
        result = await self.db.execute(
            select(UploadedAsset).where(UploadedAsset.id == uuid.UUID(asset_id), UploadedAsset.project_id == project.id)
        )
        asset = result.scalar_one_or_none()
        if not asset:
            raise NotFoundError("Asset not found")

        url = await self.storage.presign(asset.storage_key)
        asset.storage_url = url
        expires_at = datetime.now(timezone.utc) + timedelta(seconds=settings.STORAGE_PRESIGN_EXPIRY_SECONDS)
        return {"data": {"asset_id": str(asset.id), "url": url, "expires_at": expires_at.isoformat()}}


def _asset_out(asset: UploadedAsset) -> dict:
    return {
        "asset_id": str(asset.id),
        "original_name": asset.original_name,
        "mime_type": asset.mime_type,
        "storage_url": asset.storage_url,
        "thumbnail_url": asset.thumbnail_url,
        "file_size_bytes": asset.file_size_bytes,
        "uploaded_at": asset.uploaded_at.isoformat(),
    }
