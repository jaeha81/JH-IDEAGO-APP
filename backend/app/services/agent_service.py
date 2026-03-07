import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.agent import Agent
from app.schemas.agent import AgentCreate, AgentUpdate
from app.services.project_service import ProjectService
from app.services.event_service import EventService
from app.core.exceptions import NotFoundError


class AgentService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def add(self, user_id: uuid.UUID, project_id: str, body: AgentCreate) -> dict:
        project = await ProjectService(self.db).get_owned(user_id, project_id)
        agent = Agent(
            id=uuid.uuid4(),
            project_id=project.id,
            role_label=body.role_label,
            display_order=body.display_order,
        )
        self.db.add(agent)
        await self.db.flush()
        await EventService(self.db).log(project.id, user_id, "agent.added", {"agent_id": str(agent.id), "role_label": agent.role_label})
        return {"data": _agent_out(agent)}

    async def list(self, user_id: uuid.UUID, project_id: str) -> dict:
        project = await ProjectService(self.db).get_owned(user_id, project_id)
        result = await self.db.execute(
            select(Agent).where(Agent.project_id == project.id).order_by(Agent.display_order)
        )
        return {"data": [_agent_out(a) for a in result.scalars().all()]}

    async def update(self, user_id: uuid.UUID, project_id: str, agent_id: str, body: AgentUpdate) -> dict:
        project = await ProjectService(self.db).get_owned(user_id, project_id)
        agent = await self._get_agent(project.id, agent_id)

        if body.role_label is not None:
            agent.role_label = body.role_label
        if body.display_order is not None:
            agent.display_order = body.display_order
        await self.db.flush()
        await EventService(self.db).log(project.id, user_id, "agent.role.updated", {"agent_id": agent_id, "role_label": agent.role_label})
        return {"data": _agent_out(agent)}

    async def deactivate(self, user_id: uuid.UUID, project_id: str, agent_id: str) -> dict:
        project = await ProjectService(self.db).get_owned(user_id, project_id)
        agent = await self._get_agent(project.id, agent_id)
        agent.is_active = False
        await self.db.flush()
        await EventService(self.db).log(project.id, user_id, "agent.deactivated", {"agent_id": agent_id})
        return {"data": {"agent_id": agent_id, "is_active": False}}

    async def _get_agent(self, project_id: uuid.UUID, agent_id: str) -> Agent:
        result = await self.db.execute(
            select(Agent).where(Agent.id == uuid.UUID(agent_id), Agent.project_id == project_id)
        )
        agent = result.scalar_one_or_none()
        if not agent:
            raise NotFoundError("Agent not found")
        return agent


def _agent_out(agent: Agent) -> dict:
    return {
        "agent_id": str(agent.id),
        "project_id": str(agent.project_id),
        "role_label": agent.role_label,
        "display_order": agent.display_order,
        "is_active": agent.is_active,
        "created_at": agent.created_at.isoformat(),
    }
