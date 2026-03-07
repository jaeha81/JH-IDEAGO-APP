import uuid
import asyncio
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import anthropic

from app.models.agent import Agent
from app.models.ai import AgentResponse
from app.schemas.ai import AgentQueryRequest
from app.services.project_service import ProjectService
from app.services.event_service import EventService
from app.services.context_builder import ContextBuilder
from app.core.exceptions import NotFoundError
from app.config import settings

client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)

SYSTEM_PROMPT_TEMPLATE = """You are an AI collaborator in the IDEAGO visual ideation platform.

Your role in this project: {role_label}

Project context:
{context}

Instructions:
- Respond from the perspective of your assigned role.
- Be direct and specific. Avoid generic advice.
- Structure your response with these exact markers:

SUMMARY: [2-4 sentences maximum — concise, actionable]
FULL REASONING: [detailed explanation of your thinking]

- Do not simulate a debate with other agents. Respond independently.
- Do not refer to yourself as an AI. Speak as the role you have been assigned."""


class AIService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def query(self, user_id: uuid.UUID, project_id: str, body: AgentQueryRequest) -> dict:
        project = await ProjectService(self.db).get_owned(user_id, project_id)

        # Determine which agents respond
        agent_query = select(Agent).where(Agent.project_id == project.id, Agent.is_active == True)
        if body.agent_ids:
            agent_query = agent_query.where(Agent.id.in_([uuid.UUID(aid) for aid in body.agent_ids]))
        agents_result = await self.db.execute(agent_query)
        agents = agents_result.scalars().all()

        if not agents:
            return {"data": {"query_id": str(uuid.uuid4()), "responses": [], "clarification_hint": None, "responded_at": datetime.now(timezone.utc).isoformat()}}

        # Build shared context once
        ctx_builder = ContextBuilder(self.db)
        context_str, seq_start, seq_end = await ctx_builder.build(project, "", body.query)

        # Log query event
        await EventService(self.db).log(
            project.id, user_id, "agent.query.sent",
            {"agent_ids": [str(a.id) for a in agents], "query": body.query}
        )

        # Parallel LLM calls
        tasks = [
            self._call_agent(agent, context_str, body.query, project.id, seq_start, seq_end)
            for agent in agents
        ]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        responses = []
        query_id = str(uuid.uuid4())
        responded_at = datetime.now(timezone.utc)

        for agent, result in zip(agents, results):
            if isinstance(result, Exception):
                responses.append({
                    "agent_id": str(agent.id),
                    "role_label": agent.role_label,
                    "summary_text": f"[{agent.role_label} did not respond — timeout or error]",
                    "has_full_reasoning": False,
                })
            else:
                db_response, summary, has_full = result
                # Reuse the same query_id across all agent responses for this query
                responses.append({
                    "agent_id": str(agent.id),
                    "role_label": agent.role_label,
                    "summary_text": summary,
                    "has_full_reasoning": has_full,
                })

        await EventService(self.db).log(project.id, user_id, "agent.response.received", {"query_id": query_id, "agent_count": len(responses)})

        clarification_hint = self._clarification_hint(project, body.query)

        return {
            "data": {
                "query_id": query_id,
                "responses": responses,
                "clarification_hint": clarification_hint,
                "responded_at": responded_at.isoformat(),
            }
        }

    async def _call_agent(
        self,
        agent: Agent,
        context_str: str,
        user_query: str,
        project_id: uuid.UUID,
        seq_start: int,
        seq_end: int,
    ) -> tuple:
        system_prompt = SYSTEM_PROMPT_TEMPLATE.format(role_label=agent.role_label, context=context_str)

        try:
            response = await asyncio.wait_for(
                client.messages.create(
                    model="claude-sonnet-4-6",
                    max_tokens=settings.AI_MAX_OUTPUT_TOKENS,
                    system=system_prompt,
                    messages=[{"role": "user", "content": user_query}],
                ),
                timeout=settings.AI_AGENT_TIMEOUT_SECONDS,
            )
        except asyncio.TimeoutError:
            raise TimeoutError(f"Agent {agent.role_label} timed out")

        full_text = response.content[0].text
        summary, full_reasoning = _parse_response(full_text)

        db_response = AgentResponse(
            id=uuid.uuid4(),
            project_id=project_id,
            agent_id=agent.id,
            user_query=user_query,
            summary_text=summary,
            full_reasoning=full_reasoning,
            token_count=response.usage.input_tokens + response.usage.output_tokens,
            model_used=response.model,
            context_event_seq_start=seq_start,
            context_event_seq_end=seq_end,
        )
        self.db.add(db_response)
        await self.db.flush()

        return db_response, summary, full_reasoning is not None

    async def get_full_reasoning(self, user_id: uuid.UUID, project_id: str, query_id: str, agent_id: str) -> dict:
        project = await ProjectService(self.db).get_owned(user_id, project_id)
        result = await self.db.execute(
            select(AgentResponse).where(
                AgentResponse.agent_id == uuid.UUID(agent_id),
                AgentResponse.project_id == project.id,
            ).order_by(AgentResponse.created_at.desc()).limit(1)
        )
        response = result.scalar_one_or_none()
        if not response:
            raise NotFoundError("Response not found")

        agent_result = await self.db.execute(select(Agent).where(Agent.id == response.agent_id))
        agent = agent_result.scalar_one_or_none()

        return {
            "data": {
                "query_id": query_id,
                "agent_id": agent_id,
                "role_label": agent.role_label if agent else "Unknown",
                "full_reasoning": response.full_reasoning or response.summary_text,
            }
        }

    async def list_responses(self, user_id: uuid.UUID, project_id: str, page: int, per_page: int, agent_id: str | None) -> dict:
        project = await ProjectService(self.db).get_owned(user_id, project_id)
        query = select(AgentResponse, Agent).join(Agent, AgentResponse.agent_id == Agent.id, isouter=True).where(AgentResponse.project_id == project.id)
        if agent_id:
            query = query.where(AgentResponse.agent_id == uuid.UUID(agent_id))
        query = query.order_by(AgentResponse.created_at.desc()).offset((page - 1) * per_page).limit(per_page)
        result = await self.db.execute(query)
        rows = result.all()
        return {
            "data": [
                {
                    "agent_id": str(r.AgentResponse.agent_id),
                    "role_label": r.Agent.role_label if r.Agent else "Unknown",
                    "summary_text": r.AgentResponse.summary_text,
                    "has_full_reasoning": r.AgentResponse.full_reasoning is not None,
                    "created_at": r.AgentResponse.created_at.isoformat(),
                }
                for r in rows
            ]
        }

    async def generate_title(self, user_id: uuid.UUID, project_id: str) -> dict:
        project = await ProjectService(self.db).get_owned(user_id, project_id)
        ctx_builder = ContextBuilder(self.db)
        context_str, _, _ = await ctx_builder.build(project, "", "")

        response = await client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=50,
            messages=[{
                "role": "user",
                "content": f"Based on this project context, generate a concise project title (3-7 words). Return only the title, nothing else.\n\n{context_str}"
            }],
        )
        title = response.content[0].text.strip().strip('"').strip("'")
        project.title = title
        project.auto_title = True
        await self.db.flush()
        await EventService(self.db).log(project.id, user_id, "project.title.auto_generated", {"title": title})
        return {"data": {"project_id": project_id, "title": title, "auto_title": True}}

    def _clarification_hint(self, project, query: str) -> str | None:
        if not project.purpose_note and len(query.split()) < 5:
            return "Your agents would benefit from knowing more about your project's purpose. Consider adding a purpose note."
        return None


def _parse_response(text: str) -> tuple[str, str | None]:
    if "SUMMARY:" in text and "FULL REASONING:" in text:
        parts = text.split("FULL REASONING:", 1)
        summary_part = parts[0].replace("SUMMARY:", "").strip()
        full_reasoning = parts[1].strip()
        return summary_part, full_reasoning
    # Fallback: take first 3 sentences
    sentences = text.split(". ")
    summary = ". ".join(sentences[:3]).strip()
    if not summary.endswith("."):
        summary += "."
    return summary, text if len(text) > len(summary) + 20 else None
