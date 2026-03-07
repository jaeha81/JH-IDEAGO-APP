from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.core.auth import get_current_user
from app.models.user import User
from app.services.event_service import EventService

router = APIRouter()


@router.get("/{project_id}/events", response_model=dict)
async def list_events(
    project_id: str,
    since: str | None = Query(None),
    until: str | None = Query(None),
    event_type: str | None = Query(None),
    limit: int = Query(100, ge=1, le=500),
    page: int = Query(1, ge=1),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await EventService(db).list(current_user.id, project_id, since, until, event_type, limit, page)
