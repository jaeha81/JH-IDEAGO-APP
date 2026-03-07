from datetime import datetime
from pydantic import BaseModel


class AgentCreate(BaseModel):
    role_label: str
    display_order: int = 0


class AgentUpdate(BaseModel):
    role_label: str | None = None
    display_order: int | None = None


class AgentOut(BaseModel):
    agent_id: str
    project_id: str
    role_label: str
    display_order: int
    is_active: bool
    created_at: datetime
