from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.core.auth import get_current_user
from app.models.user import User
from app.schemas.agent import AgentCreate, AgentUpdate, AgentOut
from app.services.agent_service import AgentService

router = APIRouter()


@router.post("/{project_id}/agents", response_model=dict)
async def add_agent(
    project_id: str,
    body: AgentCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await AgentService(db).add(current_user.id, project_id, body)


@router.get("/{project_id}/agents", response_model=dict)
async def list_agents(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await AgentService(db).list(current_user.id, project_id)


@router.patch("/{project_id}/agents/{agent_id}", response_model=dict)
async def update_agent(
    project_id: str,
    agent_id: str,
    body: AgentUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await AgentService(db).update(current_user.id, project_id, agent_id, body)


@router.delete("/{project_id}/agents/{agent_id}", response_model=dict)
async def deactivate_agent(
    project_id: str,
    agent_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await AgentService(db).deactivate(current_user.id, project_id, agent_id)
