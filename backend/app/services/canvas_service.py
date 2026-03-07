import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.models.canvas import CanvasSnapshot
from app.schemas.canvas import CanvasSaveRequest
from app.services.project_service import ProjectService
from app.services.event_service import EventService
from app.core.exceptions import NotFoundError


class CanvasService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_latest(self, user_id: uuid.UUID, project_id: str) -> dict:
        project = await ProjectService(self.db).get_owned(user_id, project_id)
        result = await self.db.execute(
            select(CanvasSnapshot)
            .where(CanvasSnapshot.project_id == project.id)
            .order_by(CanvasSnapshot.snapshot_num.desc())
            .limit(1)
        )
        snapshot = result.scalar_one_or_none()
        if not snapshot:
            return {"data": None}
        return {"data": _snapshot_out(snapshot)}

    async def save(self, user_id: uuid.UUID, project_id: str, body: CanvasSaveRequest) -> dict:
        project = await ProjectService(self.db).get_owned(user_id, project_id)

        # Validate payload size (rough check on element count)
        state = body.state_json.model_dump()

        next_num = await self._next_snapshot_num(project.id)
        snapshot = CanvasSnapshot(
            id=uuid.uuid4(),
            project_id=project.id,
            snapshot_num=next_num,
            state_json=state,
            trigger="manual",
        )
        self.db.add(snapshot)
        await self.db.flush()
        await EventService(self.db).log(project.id, user_id, "canvas.snapshot.saved", {"snapshot_id": str(snapshot.id), "trigger": "manual"})

        return {
            "data": {
                "snapshot_id": str(snapshot.id),
                "snapshot_num": snapshot.snapshot_num,
                "trigger": snapshot.trigger,
                "saved_at": snapshot.created_at.isoformat() if snapshot.created_at else None,
            }
        }

    async def list_snapshots(self, user_id: uuid.UUID, project_id: str, limit: int) -> dict:
        project = await ProjectService(self.db).get_owned(user_id, project_id)
        result = await self.db.execute(
            select(CanvasSnapshot)
            .where(CanvasSnapshot.project_id == project.id)
            .order_by(CanvasSnapshot.snapshot_num.desc())
            .limit(limit)
        )
        snapshots = result.scalars().all()
        return {
            "data": [
                {
                    "snapshot_id": str(s.id),
                    "snapshot_num": s.snapshot_num,
                    "trigger": s.trigger,
                    "created_at": s.created_at.isoformat(),
                }
                for s in snapshots
            ]
        }

    async def create_snapshot(self, project_id: uuid.UUID, state: dict, trigger: str = "auto") -> CanvasSnapshot:
        next_num = await self._next_snapshot_num(project_id)
        snapshot = CanvasSnapshot(
            id=uuid.uuid4(),
            project_id=project_id,
            snapshot_num=next_num,
            state_json=state,
            trigger=trigger,
        )
        self.db.add(snapshot)
        await self.db.flush()
        return snapshot

    async def _next_snapshot_num(self, project_id: uuid.UUID) -> int:
        result = await self.db.execute(
            select(func.coalesce(func.max(CanvasSnapshot.snapshot_num), 0))
            .where(CanvasSnapshot.project_id == project_id)
        )
        return result.scalar() + 1


def _snapshot_out(snapshot: CanvasSnapshot) -> dict:
    return {
        "snapshot_id": str(snapshot.id),
        "snapshot_num": snapshot.snapshot_num,
        "state_json": snapshot.state_json,
        "trigger": snapshot.trigger,
        "created_at": snapshot.created_at.isoformat(),
    }
