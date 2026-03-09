import uuid
import json
import zipfile
import io
from datetime import datetime, timedelta, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.export import ExportRecord
from app.schemas.export import ExportRequest
from app.services.project_service import ProjectService
from app.services.event_service import EventService
from app.core.exceptions import NotFoundError
from app.config import settings


class ExportService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def initiate(self, user_id: uuid.UUID, project_id: str, body: ExportRequest) -> dict:
        project = await ProjectService(self.db).get_owned(user_id, project_id)

        record = ExportRecord(
            id=uuid.uuid4(),
            project_id=project.id,
            status="pending",
        )
        self.db.add(record)
        await self.db.flush()
        await EventService(self.db).log(project.id, user_id, "export.initiated", {"export_id": str(record.id)})

        # Enqueue export assembly via Celery
        # TODO(Step 10): Ensure Redis + Celery worker are running before enabling.
        # Uncomment when worker is confirmed live:
        # from app.worker.tasks.export_task import build_export
        # build_export.delay(str(record.id), body.model_dump())
        # PLACEHOLDER: export stays "pending" until task is wired up

        return {
            "data": {
                "export_id": str(record.id),
                "status": record.status,
                "created_at": record.created_at.isoformat() if record.created_at else None,
            }
        }

    async def get(self, user_id: uuid.UUID, project_id: str, export_id: str) -> dict:
        project = await ProjectService(self.db).get_owned(user_id, project_id)
        result = await self.db.execute(
            select(ExportRecord).where(
                ExportRecord.id == uuid.UUID(export_id),
                ExportRecord.project_id == project.id,
            )
        )
        record = result.scalar_one_or_none()
        if not record:
            raise NotFoundError("Export record not found")
        return {"data": _export_out(record)}

    async def list(self, user_id: uuid.UUID, project_id: str) -> dict:
        project = await ProjectService(self.db).get_owned(user_id, project_id)
        result = await self.db.execute(
            select(ExportRecord)
            .where(ExportRecord.project_id == project.id)
            .order_by(ExportRecord.created_at.desc())
        )
        return {"data": [_export_brief(r) for r in result.scalars().all()]}


def _export_out(record: ExportRecord) -> dict:
    return {
        "export_id": str(record.id),
        "status": record.status,
        "download_url": record.download_url,
        "expires_at": record.expires_at.isoformat() if record.expires_at else None,
        "manifest": record.export_manifest,
        "error_message": record.error_message,
        "created_at": record.created_at.isoformat() if record.created_at else None,
        "completed_at": record.completed_at.isoformat() if record.completed_at else None,
    }


def _export_brief(record: ExportRecord) -> dict:
    return {
        "export_id": str(record.id),
        "status": record.status,
        "created_at": record.created_at.isoformat() if record.created_at else None,
        "completed_at": record.completed_at.isoformat() if record.completed_at else None,
        "expires_at": record.expires_at.isoformat() if record.expires_at else None,
    }
