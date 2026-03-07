from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.core.auth import get_current_user
from app.models.user import User
from app.schemas.ai import DetailViewRequest
from app.services.detail_view_service import DetailViewService

router = APIRouter()


@router.post("/{project_id}/detail-view", response_model=dict)
async def trigger_detail_view(
    project_id: str,
    body: DetailViewRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await DetailViewService(db).trigger(current_user.id, project_id, body)


@router.get("/{project_id}/detail-view/{result_id}", response_model=dict)
async def get_detail_view(
    project_id: str,
    result_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await DetailViewService(db).get(current_user.id, project_id, result_id)


@router.get("/{project_id}/detail-view", response_model=dict)
async def list_detail_views(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await DetailViewService(db).list(current_user.id, project_id)
