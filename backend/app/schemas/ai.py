from datetime import datetime
from pydantic import BaseModel


class AgentQueryRequest(BaseModel):
    query: str
    agent_ids: list[str] | None = None
    context_hint: str | None = None


class AgentResponseItem(BaseModel):
    agent_id: str
    role_label: str
    summary_text: str
    has_full_reasoning: bool


class AgentQueryResponse(BaseModel):
    query_id: str
    responses: list[AgentResponseItem]
    clarification_hint: str | None = None
    responded_at: datetime


class AgentFullReasoning(BaseModel):
    query_id: str
    agent_id: str
    role_label: str
    full_reasoning: str


class AgentResponseHistory(BaseModel):
    query_id: str
    agent_id: str
    role_label: str
    summary_text: str
    has_full_reasoning: bool
    created_at: datetime


class DetailViewRequest(BaseModel):
    user_prompt: str | None = None
    snapshot_id: str | None = None


class DetailViewOut(BaseModel):
    result_id: str
    status: str
    result_type: str
    storage_url: str | None = None
    error_message: str | None = None
    created_at: datetime
    completed_at: datetime | None = None


class AutoTitleResponse(BaseModel):
    project_id: str
    title: str
    auto_title: bool = True
