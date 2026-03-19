import time
import asyncio
from typing import Dict

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.core.auth import get_current_user
from app.models.user import User
from app.schemas.ai import AgentQueryRequest
from app.services.ai_service import AIService

router = APIRouter()

# ── In-memory per-user rate limiter for auto-title ───────────────────────────
# Tracks last invocation time per user_id. Stateless across worker processes,
# which is acceptable for this low-frequency endpoint in MVP.
_autotitle_store: Dict[str, float] = {}
_autotitle_lock = asyncio.Lock()


async def _rate_limit_autotitle(
    current_user: User = Depends(get_current_user),
) -> User:
    """Dependency that enforces AUTOTITLE_RATE_LIMIT_SECONDS between calls."""
    from app.config import settings

    key = str(current_user.id)
    now = time.monotonic()

    async with _autotitle_lock:
        last_call = _autotitle_store.get(key, 0.0)
        elapsed = now - last_call
        limit = settings.AUTOTITLE_RATE_LIMIT_SECONDS

        if elapsed < limit:
            wait = int(limit - elapsed) + 1
            raise HTTPException(
                status_code=429,
                detail=f"Rate limit: wait {wait}s before auto-titling again.",
                headers={"Retry-After": str(wait)},
            )

        _autotitle_store[key] = now

    return current_user


# ── Routes ────────────────────────────────────────────────────────────────────


@router.post("/{project_id}/agents/query", response_model=dict)
async def query_agents(
    project_id: str,
    body: AgentQueryRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await AIService(db).query(current_user.id, project_id, body)


@router.get(
    "/{project_id}/agents/responses/{query_id}/full/{agent_id}", response_model=dict
)
async def get_full_reasoning(
    project_id: str,
    query_id: str,
    agent_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await AIService(db).get_full_reasoning(
        current_user.id, project_id, query_id, agent_id
    )


@router.get("/{project_id}/agents/responses", response_model=dict)
async def list_responses(
    project_id: str,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    agent_id: str | None = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await AIService(db).list_responses(
        current_user.id, project_id, page, per_page, agent_id
    )


@router.post("/{project_id}/auto-title", response_model=dict)
async def auto_title(
    project_id: str,
    current_user: User = Depends(_rate_limit_autotitle),
    db: AsyncSession = Depends(get_db),
):
    return await AIService(db).generate_title(current_user.id, project_id)
