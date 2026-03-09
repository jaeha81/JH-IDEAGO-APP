import uuid
import json
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update

from app.models.canvas import CanvasSnapshot, CanvasElement
from app.schemas.canvas import CanvasSaveRequest
from app.services.project_service import ProjectService
from app.services.event_service import EventService
from app.core.exceptions import NotFoundError, PayloadTooLargeError
from app.config import settings

MAX_CANVAS_BYTES = settings.CANVAS_MAX_PAYLOAD_MB * 1024 * 1024


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

        state = body.state_json.model_dump()

        # Validate canvas payload size (R-03: reject if > CANVAS_MAX_PAYLOAD_MB)
        state_bytes = len(json.dumps(state, ensure_ascii=False).encode("utf-8"))
        if state_bytes > MAX_CANVAS_BYTES:
            raise PayloadTooLargeError(
                f"Canvas state exceeds {settings.CANVAS_MAX_PAYLOAD_MB}MB limit "
                f"({state_bytes // (1024*1024)}MB received)"
            )

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

        # Sync canvas_elements table so ContextBuilder can query element counts/types
        await self._sync_elements(project.id, snapshot.id, body.state_json.elements)

        await EventService(self.db).log(
            project.id, user_id, "canvas.snapshot.saved",
            {"snapshot_id": str(snapshot.id), "trigger": "manual"}
        )

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

    async def create_snapshot(
        self,
        project_id: uuid.UUID,
        state: dict,
        trigger: str = "auto",
    ) -> CanvasSnapshot:
        """Internal method: called by export task and auto-save worker."""
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

    async def _sync_elements(
        self,
        project_id: uuid.UUID,
        snapshot_id: uuid.UUID,
        elements: list,
    ) -> None:
        """
        Sync canvas_elements table from the saved snapshot.
        Strategy (MVP): soft-delete all existing active elements for this project,
        then insert new records from the snapshot.
        This keeps canvas_elements current so ContextBuilder always reflects
        the latest saved state.
        """
        now = datetime.now(timezone.utc)

        # Soft-delete all currently active elements for this project
        await self.db.execute(
            update(CanvasElement)
            .where(CanvasElement.project_id == project_id, CanvasElement.deleted_at == None)
            .values(deleted_at=now)
        )

        # Insert new elements from snapshot
        for el in elements:
            # el is a CanvasElement schema object (already validated by Pydantic)
            el_dict = el if isinstance(el, dict) else el.model_dump()
            asset_id = None
            if el_dict.get("type") == "image_overlay":
                raw_asset_id = el_dict.get("data", {}).get("asset_id")
                if raw_asset_id:
                    try:
                        asset_id = uuid.UUID(raw_asset_id)
                    except (ValueError, AttributeError):
                        pass

            canvas_el = CanvasElement(
                id=uuid.uuid4(),
                project_id=project_id,
                snapshot_id=snapshot_id,
                element_type=el_dict.get("type", "unknown"),
                element_data=el_dict.get("data", {}),
                position_x=el_dict.get("position_x", 0.0),
                position_y=el_dict.get("position_y", 0.0),
                z_index=el_dict.get("z_index", 0),
                asset_id=asset_id,
            )
            self.db.add(canvas_el)

        await self.db.flush()

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
