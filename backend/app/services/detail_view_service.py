import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.ai import DetailViewResult
from app.schemas.ai import DetailViewRequest
from app.services.project_service import ProjectService
from app.services.event_service import EventService
from app.services.canvas_service import CanvasService
from app.core.exceptions import NotFoundError


class DetailViewService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def trigger(self, user_id: uuid.UUID, project_id: str, body: DetailViewRequest) -> dict:
        project = await ProjectService(self.db).get_owned(user_id, project_id)

        # Get snapshot to attach to
        canvas_service = CanvasService(self.db)
        snapshot_data = await canvas_service.get_latest(user_id, project_id)
        snapshot_id = snapshot_data["data"]["snapshot_id"] if snapshot_data.get("data") else None

        result = DetailViewResult(
            id=uuid.uuid4(),
            project_id=project.id,
            triggering_snapshot_id=uuid.UUID(snapshot_id) if snapshot_id else None,
            result_type="image",
            user_prompt=body.user_prompt,
            status="pending",
        )
        self.db.add(result)
        await self.db.flush()
        await EventService(self.db).log(project.id, user_id, "detail_view.triggered", {"result_id": str(result.id)})

        # Enqueue async generation task
        # detail_view_tasks.generate.delay(str(result.id))  # Celery task — wire up when Celery is configured

        return {
            "data": {
                "result_id": str(result.id),
                "status": result.status,
                "created_at": result.created_at.isoformat() if result.created_at else None,
            }
        }

    async def get(self, user_id: uuid.UUID, project_id: str, result_id: str) -> dict:
        project = await ProjectService(self.db).get_owned(user_id, project_id)
        result = await self.db.execute(
            select(DetailViewResult).where(
                DetailViewResult.id == uuid.UUID(result_id),
                DetailViewResult.project_id == project.id,
            )
        )
        dv = result.scalar_one_or_none()
        if not dv:
            raise NotFoundError("Detail View result not found")
        return {"data": _dv_out(dv)}

    async def list(self, user_id: uuid.UUID, project_id: str) -> dict:
        project = await ProjectService(self.db).get_owned(user_id, project_id)
        result = await self.db.execute(
            select(DetailViewResult)
            .where(DetailViewResult.project_id == project.id)
            .order_by(DetailViewResult.created_at.desc())
        )
        return {"data": [_dv_out(dv) for dv in result.scalars().all()]}


def _dv_out(dv: DetailViewResult) -> dict:
    return {
        "result_id": str(dv.id),
        "status": dv.status,
        "result_type": dv.result_type,
        "storage_url": dv.storage_url,
        "error_message": dv.error_message,
        "created_at": dv.created_at.isoformat() if dv.created_at else None,
        "completed_at": dv.completed_at.isoformat() if dv.completed_at else None,
    }
