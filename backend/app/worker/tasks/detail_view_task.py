"""
Detail View generation Celery task.
Triggered by: POST /projects/:id/detail-view
Flow:
  1. Load DetailViewResult record (status=pending)
  2. Load triggering canvas snapshot
  3. Call Anthropic API with canvas summary as context
  4. Store result image/description to object storage
  5. Update DetailViewResult to status=completed
"""
import uuid
import asyncio
from datetime import datetime, timezone

from app.worker.celery_app import celery_app
from app.database import AsyncSessionLocal
from app.core.storage import StorageClient


@celery_app.task(bind=True, max_retries=2, default_retry_delay=10, name="detail_view.generate")
def generate_detail_view(self, result_id: str):
    # asyncio.run() creates a fresh event loop — required in Celery workers (Python 3.10+)
    asyncio.run(_run(result_id))


async def _run(result_id: str):
    from sqlalchemy import select
    from app.models.ai import DetailViewResult
    from app.models.canvas import CanvasSnapshot
    from app.services.context_builder import ContextBuilder
    from app.models.project import Project
    import anthropic

    from app.config import settings
    client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
    storage = StorageClient()

    async with AsyncSessionLocal() as db:
        result_row = await db.execute(
            select(DetailViewResult).where(DetailViewResult.id == uuid.UUID(result_id))
        )
        dv = result_row.scalar_one_or_none()
        if not dv or dv.status != "pending":
            return

        try:
            # Note: no intermediate "processing" status — schema only allows pending|completed|failed
            project_row = await db.execute(select(Project).where(Project.id == dv.project_id))
            project = project_row.scalar_one()

            # Get canvas state summary for context
            ctx_builder = ContextBuilder(db)
            context_str, _, _ = await ctx_builder.build(project, "", "")

            user_guidance = f"\n\nUser guidance: {dv.user_prompt}" if dv.user_prompt else ""

            prompt = f"""You are analyzing a visual ideation canvas from IDEAGO.

{context_str}{user_guidance}

Task: Produce a structured, clean interpretation of what this canvas represents.
Describe the visual layout, key components, relationships, and any patterns you observe.
Format as a clear, professional brief that a designer or developer could act on.

Keep it concrete. Maximum 400 words."""

            response = await client.messages.create(
                model="claude-sonnet-4-6",
                max_tokens=600,
                messages=[{"role": "user", "content": prompt}],
            )

            description = response.content[0].text.strip()

            # Store as text artifact in object storage
            storage_key = f"projects/{dv.project_id}/detail-views/{dv.id}.txt"
            await storage.upload(storage_key, description.encode("utf-8"), "text/plain")
            url = await storage.presign(storage_key)

            dv.storage_key = storage_key
            dv.storage_url = url
            dv.result_type = "structured_data"
            dv.result_json = {"description": description}
            dv.status = "completed"
            dv.completed_at = datetime.now(timezone.utc)

            from app.models.event import ProjectEvent
            from sqlalchemy import func
            seq_result = await db.execute(
                select(func.coalesce(func.max(ProjectEvent.sequence_num), 0))
                .where(ProjectEvent.project_id == dv.project_id)
            )
            next_seq = seq_result.scalar() + 1
            event = ProjectEvent(
                id=uuid.uuid4(),
                project_id=dv.project_id,
                event_type="detail_view.completed",
                payload={"result_id": result_id},
                sequence_num=next_seq,
            )
            db.add(event)
            await db.commit()

        except Exception as exc:
            dv.status = "failed"
            dv.error_message = str(exc)
            await db.commit()
            raise
