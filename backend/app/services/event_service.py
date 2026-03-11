from __future__ import annotations  # defer annotation evaluation — fixes list[X] shadowed by method name

import uuid
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.models.event import ProjectEvent
from app.core.exceptions import NotFoundError, ForbiddenError
from app.services.project_service import ProjectService


class EventService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def log(
        self,
        project_id: uuid.UUID,
        user_id: uuid.UUID,
        event_type: str,
        payload: dict,
    ) -> ProjectEvent:
        # Get next sequence_num
        result = await self.db.execute(
            select(func.coalesce(func.max(ProjectEvent.sequence_num), 0))
            .where(ProjectEvent.project_id == project_id)
        )
        next_seq = result.scalar() + 1

        event = ProjectEvent(
            id=uuid.uuid4(),
            project_id=project_id,
            user_id=user_id,
            event_type=event_type,
            payload=payload,
            sequence_num=next_seq,
        )
        self.db.add(event)
        await self.db.flush()
        return event

    async def list(
        self,
        user_id: uuid.UUID,
        project_id: str,
        since: str | None,
        until: str | None,
        event_type: str | None,
        limit: int,
        page: int,
    ) -> dict:
        project = await ProjectService(self.db).get_owned(user_id, project_id)

        query = select(ProjectEvent).where(ProjectEvent.project_id == project.id)
        if event_type:
            query = query.where(ProjectEvent.event_type == event_type)
        if since:
            query = query.where(ProjectEvent.created_at >= datetime.fromisoformat(since))
        if until:
            query = query.where(ProjectEvent.created_at <= datetime.fromisoformat(until))

        total_result = await self.db.execute(select(func.count()).select_from(query.subquery()))
        total = total_result.scalar()

        query = query.order_by(ProjectEvent.sequence_num.asc()).offset((page - 1) * limit).limit(limit)
        result = await self.db.execute(query)
        events = result.scalars().all()

        return {
            "data": [
                {
                    "event_id": str(e.id),
                    "event_type": e.event_type,
                    "payload": e.payload,
                    "sequence_num": e.sequence_num,
                    "created_at": e.created_at.isoformat(),
                }
                for e in events
            ],
            "meta": {"total": total, "page": page, "limit": limit},
        }

    async def get_recent(self, project_id: uuid.UUID, limit: int = 30) -> list[ProjectEvent]:
        result = await self.db.execute(
            select(ProjectEvent)
            .where(ProjectEvent.project_id == project_id)
            .order_by(ProjectEvent.sequence_num.desc())
            .limit(limit)
        )
        events = result.scalars().all()
        return list(reversed(events))
