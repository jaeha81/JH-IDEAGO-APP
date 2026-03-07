from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.project import Project
from app.models.canvas import CanvasElement
from app.models.event import ProjectEvent
from app.models.ai import AgentResponse
from app.config import settings


class ContextBuilder:
    """
    Builds compressed context strings for LLM calls.
    Never sends raw JSONB canvas state or full event log.
    Token budget target: ~1050 tokens total input context.
    """

    def __init__(self, db: AsyncSession):
        self.db = db

    async def build(self, project: Project, agent_role: str, user_query: str) -> tuple[str, int, int]:
        """
        Returns: (context_string, first_event_seq, last_event_seq)
        """
        canvas_summary = await self._canvas_summary(project.id)
        event_summary, seq_start, seq_end = await self._event_summary(project.id)
        prior_responses = await self._prior_responses(project.id)

        context = f"""Project: "{project.title or 'Untitled project'}"
Purpose: {project.purpose_note or "Not specified"}

Canvas summary:
{canvas_summary}

Recent activity:
{event_summary}

Previous agent guidance (summaries):
{prior_responses}"""

        return context, seq_start, seq_end

    async def _canvas_summary(self, project_id) -> str:
        result = await self.db.execute(
            select(CanvasElement.element_type, CanvasElement.element_data)
            .where(CanvasElement.project_id == project_id, CanvasElement.deleted_at == None)
        )
        elements = result.all()

        counts: dict[str, int] = {}
        image_count = 0
        text_samples: list[str] = []
        annotated_images = 0

        for el_type, el_data in elements:
            counts[el_type] = counts.get(el_type, 0) + 1
            if el_type == "text" and len(text_samples) < 2:
                content = el_data.get("content", "")
                if content:
                    text_samples.append(f'"{content[:40]}"')
            if el_type == "image_overlay":
                image_count += 1
                if el_data.get("annotations"):
                    annotated_images += 1

        parts = []
        if counts.get("stroke"):
            parts.append(f"{counts['stroke']} pen/brush strokes")
        if counts.get("text"):
            sample = f" (includes: {', '.join(text_samples)})" if text_samples else ""
            parts.append(f"{counts['text']} text note(s){sample}")
        if counts.get("shape"):
            parts.append(f"{counts['shape']} shape(s)")
        if image_count:
            ann = f", {annotated_images} with annotations" if annotated_images else ""
            parts.append(f"{image_count} uploaded image(s){ann}")

        return "Canvas contains: " + (", ".join(parts) if parts else "empty canvas")

    async def _event_summary(self, project_id) -> tuple[str, int, int]:
        result = await self.db.execute(
            select(ProjectEvent)
            .where(ProjectEvent.project_id == project_id)
            .order_by(ProjectEvent.sequence_num.desc())
            .limit(settings.AI_CONTEXT_MAX_EVENTS)
        )
        events = list(reversed(result.scalars().all()))

        if not events:
            return "No activity recorded yet.", 0, 0

        seq_start = events[0].sequence_num
        seq_end = events[-1].sequence_num

        lines = []
        for e in events:
            line = _format_event(e)
            if line:
                lines.append(f"- {line}")

        return "\n".join(lines) if lines else "No significant activity.", seq_start, seq_end

    async def _prior_responses(self, project_id) -> str:
        result = await self.db.execute(
            select(AgentResponse)
            .where(AgentResponse.project_id == project_id)
            .order_by(AgentResponse.created_at.desc())
            .limit(3)
        )
        responses = list(reversed(result.scalars().all()))
        if not responses:
            return "None yet."
        lines = [f"- [response] {r.summary_text[:100]}..." for r in responses]
        return "\n".join(lines)


def _format_event(event: ProjectEvent) -> str:
    t = event.event_type
    p = event.payload
    mapping = {
        "project.created": "Project created",
        "project.title.set": lambda: f"Title set to: \"{p.get('title', '')}\"",
        "project.title.auto_generated": lambda: f"Auto-title generated: \"{p.get('title', '')}\"",
        "agent.added": lambda: f"Agent added: \"{p.get('role_label', '')}\"",
        "agent.role.updated": lambda: f"Agent role updated to: \"{p.get('role_label', '')}\"",
        "agent.deactivated": "Agent removed",
        "canvas.element.added": lambda: f"Canvas element added: {p.get('element_type', '')}",
        "canvas.element.moved": "Canvas element moved",
        "canvas.snapshot.saved": "Canvas saved",
        "asset.uploaded": lambda: f"Image uploaded: \"{p.get('filename', '')}\"",
        "asset.placed_on_canvas": "Image placed on canvas",
        "agent.query.sent": lambda: f"Query sent to agents: \"{p.get('query', '')[:60]}\"",
        "detail_view.triggered": "Detail View requested",
        "detail_view.completed": "Detail View completed",
        "export.initiated": "Export initiated",
        "export.completed": "Export completed",
    }
    handler = mapping.get(t)
    if handler is None:
        return ""
    return handler() if callable(handler) else handler
