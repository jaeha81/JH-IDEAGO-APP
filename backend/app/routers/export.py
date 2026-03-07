from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.core.auth import get_current_user
from app.models.user import User
from app.schemas.export import ExportRequest
from app.services.export_service import ExportService

router = APIRouter()


@router.post("/{project_id}/export", response_model=dict)
async def initiate_export(
    project_id: str,
    body: ExportRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await ExportService(db).initiate(current_user.id, project_id, body)


@router.get("/{project_id}/export/{export_id}", response_model=dict)
async def get_export(
    project_id: str,
    export_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await ExportService(db).get(current_user.id, project_id, export_id)


@router.get("/{project_id}/export", response_model=dict)
async def list_exports(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await ExportService(db).list(current_user.id, project_id)
