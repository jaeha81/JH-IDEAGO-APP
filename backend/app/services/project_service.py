import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.models.project import Project
from app.models.agent import Agent
from app.models.canvas import CanvasSnapshot
from app.models.export import ExportRecord
from app.schemas.project import ProjectCreate, ProjectUpdate
from app.core.exceptions import NotFoundError, ForbiddenError


class ProjectService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_owned(self, user_id: uuid.UUID, project_id: str) -> Project:
        result = await self.db.execute(
            select(Project).where(Project.id == uuid.UUID(project_id))
        )
        project = result.scalar_one_or_none()
        if not project:
            raise NotFoundError("Project not found")
        if project.user_id != user_id:
            raise ForbiddenError("Not your project")
        return project

    async def create(self, user_id: uuid.UUID, body: ProjectCreate) -> dict:
        project = Project(
            id=uuid.uuid4(),
            user_id=user_id,
            title=body.title,
            auto_title=False,
        )
        self.db.add(project)
        await self.db.flush()
        return {"data": _project_create_out(project)}

    async def list(self, user_id: uuid.UUID, page: int, per_page: int, status: str) -> dict:
        query = select(Project).where(Project.user_id == user_id, Project.status == status)
        total_result = await self.db.execute(select(func.count()).select_from(query.subquery()))
        total = total_result.scalar()

        result = await self.db.execute(
            query.order_by(Project.updated_at.desc()).offset((page - 1) * per_page).limit(per_page)
        )
        projects = result.scalars().all()

        items = []
        for p in projects:
            agent_count_result = await self.db.execute(
                select(func.count()).where(Agent.project_id == p.id, Agent.is_active == True)
            )
            items.append({
                "project_id": str(p.id),
                "title": p.title,
                "status": p.status,
                "created_at": p.created_at.isoformat(),
                "updated_at": p.updated_at.isoformat(),
                "agent_count": agent_count_result.scalar(),
            })

        return {"data": items, "meta": {"total": total, "page": page, "per_page": per_page}}

    async def get(self, user_id: uuid.UUID, project_id: str) -> dict:
        project = await self.get_owned(user_id, project_id)

        agents_result = await self.db.execute(
            select(Agent).where(Agent.project_id == project.id).order_by(Agent.display_order)
        )
        agents = agents_result.scalars().all()

        last_snapshot_result = await self.db.execute(
            select(CanvasSnapshot.created_at)
            .where(CanvasSnapshot.project_id == project.id)
            .order_by(CanvasSnapshot.snapshot_num.desc())
            .limit(1)
        )
        last_saved = last_snapshot_result.scalar_one_or_none()

        export_count_result = await self.db.execute(
            select(func.count()).where(ExportRecord.project_id == project.id)
        )

        return {
            "data": {
                "project_id": str(project.id),
                "title": project.title,
                "auto_title": project.auto_title,
                "status": project.status,
                "purpose_note": project.purpose_note,
                "created_at": project.created_at.isoformat(),
                "updated_at": project.updated_at.isoformat(),
                "agents": [
                    {"agent_id": str(a.id), "role_label": a.role_label, "display_order": a.display_order, "is_active": a.is_active}
                    for a in agents
                ],
                "canvas_last_saved": last_saved.isoformat() if last_saved else None,
                "export_count": export_count_result.scalar(),
            }
        }

    async def update(self, user_id: uuid.UUID, project_id: str, body: ProjectUpdate) -> dict:
        project = await self.get_owned(user_id, project_id)
        if body.title is not None:
            project.title = body.title
        if body.purpose_note is not None:
            project.purpose_note = body.purpose_note
        if body.status is not None:
            project.status = body.status
        await self.db.flush()
        return await self.get(user_id, project_id)


def _project_create_out(project: Project) -> dict:
    return {
        "project_id": str(project.id),
        "title": project.title,
        "auto_title": project.auto_title,
        "status": project.status,
        "created_at": project.created_at.isoformat() if project.created_at else None,
    }
