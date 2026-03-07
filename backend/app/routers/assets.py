from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.core.auth import get_current_user
from app.models.user import User
from app.services.asset_service import AssetService

router = APIRouter()


@router.post("/{project_id}/assets", response_model=dict)
async def upload_asset(
    project_id: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await AssetService(db).upload(current_user.id, project_id, file)


@router.get("/{project_id}/assets", response_model=dict)
async def list_assets(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await AssetService(db).list(current_user.id, project_id)


@router.get("/{project_id}/assets/{asset_id}/url", response_model=dict)
async def refresh_asset_url(
    project_id: str,
    asset_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await AssetService(db).refresh_url(current_user.id, project_id, asset_id)
