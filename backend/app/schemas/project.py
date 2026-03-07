from datetime import datetime
from pydantic import BaseModel


class ProjectCreate(BaseModel):
    title: str | None = None
    auto_generate_title: bool = False


class ProjectUpdate(BaseModel):
    title: str | None = None
    purpose_note: str | None = None
    status: str | None = None


class AgentBrief(BaseModel):
    agent_id: str
    role_label: str
    display_order: int
    is_active: bool


class ProjectSummary(BaseModel):
    project_id: str
    title: str | None
    status: str
    created_at: datetime
    updated_at: datetime
    agent_count: int


class ProjectDetail(BaseModel):
    project_id: str
    title: str | None
    auto_title: bool
    status: str
    purpose_note: str | None
    created_at: datetime
    updated_at: datetime
    agents: list[AgentBrief]
    canvas_last_saved: datetime | None
    export_count: int
