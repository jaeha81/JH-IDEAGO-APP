from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.core.auth import get_current_user
from app.models.user import User
from app.schemas.ai import AgentQueryRequest
from app.services.ai_service import AIService

router = APIRouter()


@router.post("/{project_id}/agents/query", response_model=dict)
async def query_agents(
    project_id: str,
    body: AgentQueryRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await AIService(db).query(current_user.id, project_id, body)


@router.get("/{project_id}/agents/responses/{query_id}/full/{agent_id}", response_model=dict)
async def get_full_reasoning(
    project_id: str,
    query_id: str,
    agent_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await AIService(db).get_full_reasoning(current_user.id, project_id, query_id, agent_id)


@router.get("/{project_id}/agents/responses", response_model=dict)
async def list_responses(
    project_id: str,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    agent_id: str | None = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await AIService(db).list_responses(current_user.id, project_id, page, per_page, agent_id)


@router.post("/{project_id}/auto-title", response_model=dict)
async def auto_title(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await AIService(db).generate_title(current_user.id, project_id)
