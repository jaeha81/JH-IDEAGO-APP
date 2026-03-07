from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.core.auth import get_current_user
from app.models.user import User
from app.schemas.canvas import CanvasSaveRequest
from app.services.canvas_service import CanvasService

router = APIRouter()


@router.get("/{project_id}/canvas", response_model=dict)
async def get_canvas(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await CanvasService(db).get_latest(current_user.id, project_id)


@router.put("/{project_id}/canvas", response_model=dict)
async def save_canvas(
    project_id: str,
    body: CanvasSaveRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await CanvasService(db).save(current_user.id, project_id, body)


@router.get("/{project_id}/canvas/snapshots", response_model=dict)
async def list_snapshots(
    project_id: str,
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await CanvasService(db).list_snapshots(current_user.id, project_id, limit)
