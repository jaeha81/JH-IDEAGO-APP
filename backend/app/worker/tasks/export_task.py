"""
Export package generation Celery task.
Triggered by: POST /projects/:id/export

Package structure:
  {slug}_{date}/
    export-manifest.json
    project-summary.md
    agents.md
    canvas-data.json
    history.json
    instructions.md
    uploads/
    visualization/
"""
import uuid
import json
import zipfile
import io
import asyncio
from datetime import datetime, timedelta, timezone
from slugify import slugify

from app.worker.celery_app import celery_app
from app.database import AsyncSessionLocal
from app.core.storage import StorageClient


@celery_app.task(bind=True, max_retries=1, default_retry_delay=30, name="export.build")
def build_export(self, export_id: str, options: dict):
    asyncio.get_event_loop().run_until_complete(_run(export_id, options))


async def _run(export_id: str, options: dict):
    from sqlalchemy import select
    from app.models.export import ExportRecord
    from app.models.project import Project
    from app.models.agent import Agent
    from app.models.ai import AgentResponse, DetailViewResult
    from app.models.event import ProjectEvent
    from app.models.canvas import CanvasSnapshot
    from app.models.asset import UploadedAsset
    from app.config import settings

    storage = StorageClient()

    async with AsyncSessionLocal() as db:
        rec_result = await db.execute(
            select(ExportRecord).where(ExportRecord.id == uuid.UUID(export_id))
        )
        record = rec_result.scalar_one_or_none()
        if not record or record.status not in ("pending", "building"):
            return

        record.status = "building"
        await db.commit()

        try:
            project_result = await db.execute(select(Project).where(Project.id == record.project_id))
            project = project_result.scalar_one()

            agents_result = await db.execute(
                select(Agent).where(Agent.project_id == project.id).order_by(Agent.display_order)
            )
            agents = agents_result.scalars().all()

            snapshot_result = await db.execute(
                select(CanvasSnapshot)
                .where(CanvasSnapshot.project_id == project.id)
                .order_by(CanvasSnapshot.snapshot_num.desc())
                .limit(1)
            )
            snapshot = snapshot_result.scalar_one_or_none()

            events_result = await db.execute(
                select(ProjectEvent)
                .where(ProjectEvent.project_id == project.id)
                .order_by(ProjectEvent.sequence_num.asc())
            )
            events = events_result.scalars().all()

            assets_result = await db.execute(
                select(UploadedAsset).where(UploadedAsset.project_id == project.id)
            )
            assets = assets_result.scalars().all()

            dv_results = []
            if options.get("include_detail_views", True):
                dv_result = await db.execute(
                    select(DetailViewResult)
                    .where(DetailViewResult.project_id == project.id, DetailViewResult.status == "completed")
                    .order_by(DetailViewResult.created_at.asc())
                )
                dv_results = dv_result.scalars().all()

            responses_result = await db.execute(
                select(AgentResponse, Agent)
                .join(Agent, AgentResponse.agent_id == Agent.id, isouter=True)
                .where(AgentResponse.project_id == project.id)
                .order_by(AgentResponse.created_at.asc())
            )
            responses = responses_result.all()

            # --- Assemble ZIP ---
            zip_buffer = io.BytesIO()
            slug = slugify(project.title or "untitled-project")
            date_str = datetime.now(timezone.utc).strftime("%Y%m%d")
            folder = f"{slug}_{date_str}"

            with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:

                # 1. project-summary.md
                zf.writestr(f"{folder}/project-summary.md", _build_summary(project, agents))

                # 2. agents.md
                zf.writestr(f"{folder}/agents.md", _build_agents_md(agents, responses))

                # 3. canvas-data.json
                canvas_data = snapshot.state_json if snapshot else {"version": 1, "elements": []}
                zf.writestr(f"{folder}/canvas-data.json", json.dumps(canvas_data, indent=2, ensure_ascii=False))

                # 4. history.json
                history = _build_history(project.id, events)
                zf.writestr(f"{folder}/history.json", json.dumps(history, indent=2, ensure_ascii=False))

                # 5. instructions.md
                user_notes = options.get("notes") or ""
                zf.writestr(f"{folder}/instructions.md", _build_instructions(user_notes))

                # 6. uploads/ — download from object storage
                upload_names = []
                for asset in assets:
                    try:
                        data = await storage.download_bytes(asset.storage_key)
                        filename = f"{asset.id}_{asset.original_name}"
                        zf.writestr(f"{folder}/uploads/{filename}", data)
                        upload_names.append(filename)
                    except Exception:
                        pass  # best-effort; log in manifest

                # 7. visualization/ — download Detail View results
                dv_names = []
                for dv in dv_results:
                    if dv.storage_key:
                        try:
                            data = await storage.download_bytes(dv.storage_key)
                            ext = "txt" if dv.result_type == "structured_data" else "png"
                            fname = f"detail-view-{dv.id}.{ext}"
                            zf.writestr(f"{folder}/visualization/{fname}", data)
                            dv_names.append(fname)
                        except Exception:
                            pass

                # 8. export-manifest.json (last — knows what's included)
                manifest = {
                    "schema_version": "1.0",
                    "export_id": export_id,
                    "project_id": str(project.id),
                    "project_title": project.title,
                    "exported_at": datetime.now(timezone.utc).isoformat(),
                    "canvas_snapshot_num": snapshot.snapshot_num if snapshot else None,
                    "included": {
                        "project_summary": True,
                        "agents": True,
                        "canvas_data": snapshot is not None,
                        "history": bool(events),
                        "instructions": True,
                        "uploads": upload_names,
                        "visualization": dv_names,
                        "canvas_renders": False,
                    },
                    "agent_count": len(agents),
                    "event_count": len(events),
                    "upload_count": len(upload_names),
                    "detail_view_count": len(dv_names),
                }
                zf.writestr(f"{folder}/export-manifest.json", json.dumps(manifest, indent=2, ensure_ascii=False))

            zip_bytes = zip_buffer.getvalue()

            # Upload ZIP
            storage_key = f"exports/{project.id}/{export_id}.zip"
            download_url = await storage.upload_zip(storage_key, zip_bytes)

            record.status = "completed"
            record.storage_key = storage_key
            record.download_url = download_url
            record.included_snapshot_id = snapshot.id if snapshot else None
            record.export_manifest = manifest
            record.completed_at = datetime.now(timezone.utc)
            record.expires_at = datetime.now(timezone.utc) + timedelta(hours=settings.EXPORT_DOWNLOAD_EXPIRY_HOURS)
            await db.commit()

            # Log event
            from app.models.event import ProjectEvent
            from sqlalchemy import func
            seq_res = await db.execute(
                select(func.coalesce(func.max(ProjectEvent.sequence_num), 0))
                .where(ProjectEvent.project_id == project.id)
            )
            event = ProjectEvent(
                id=uuid.uuid4(),
                project_id=project.id,
                event_type="export.completed",
                payload={"export_id": export_id},
                sequence_num=seq_res.scalar() + 1,
            )
            db.add(event)
            await db.commit()

        except Exception as exc:
            record.status = "failed"
            record.error_message = str(exc)
            await db.commit()
            raise


# --- Artifact builders ---

def _build_summary(project, agents) -> str:
    agent_lines = "\n".join(f"- {a.role_label}" for a in agents) or "- No agents configured"
    return f"""# Project Summary: {project.title or "Untitled Project"}

**Created**: {project.created_at.strftime("%Y-%m-%d") if project.created_at else "Unknown"}
**Purpose**: {project.purpose_note or "Not specified"}
**Status**: {project.status}

## Agent Configuration
{agent_lines}

## How to Use This Package
1. Read this file for project context
2. Review `canvas-data.json` for the full canvas structure
3. Open `uploads/` to see reference images and materials
4. Read `agents.md` for AI guidance that shaped this project
5. Review `history.json` for the full decision trail
6. See `visualization/` for Detail View outputs
7. Read `instructions.md` for handoff notes

---
*Generated by IDEAGO (MultiGenius)*
"""


def _build_agents_md(agents, responses) -> str:
    lines = ["# Agent Configuration\n"]
    for agent in agents:
        status = "active" if agent.is_active else "deactivated"
        lines.append(f"## Agent: {agent.role_label}")
        lines.append(f"**Status**: {status}\n")

        agent_responses = [r for r in responses if r.AgentResponse.agent_id == agent.id]
        lines.append(f"**Total queries responded**: {len(agent_responses)}\n")

        for row in agent_responses[-5:]:  # last 5 interactions
            r = row.AgentResponse
            lines.append(f"**Query** ({r.created_at.strftime('%Y-%m-%d %H:%M') if r.created_at else ''}):")
            lines.append(f"> {r.user_query}\n")
            lines.append(f"**Summary**: {r.summary_text}\n")

        lines.append("---\n")
    return "\n".join(lines)


def _build_history(project_id, events) -> dict:
    return {
        "project_id": str(project_id),
        "event_count": len(events),
        "events": [
            {
                "sequence_num": e.sequence_num,
                "event_type": e.event_type,
                "timestamp": e.created_at.isoformat() if e.created_at else None,
                "payload": e.payload,
            }
            for e in events
        ],
    }


def _build_instructions(user_notes: str) -> str:
    return f"""# Handoff Instructions

## Notes from the Creator
{user_notes if user_notes else "No notes provided."}

## How to Use This Package
1. `project-summary.md` — Start here for project context
2. `canvas-data.json` — Full structured canvas state (machine-readable)
3. `uploads/` — Original reference images and uploaded files
4. `agents.md` — AI agent roles and their contributions
5. `history.json` — Complete decision trail (every meaningful action)
6. `visualization/` — Detail View outputs (refined visual interpretations)
7. `export-manifest.json` — Machine-readable index of this package

## Package Format
IDEAGO Export v1.0 — generated by IDEAGO (MultiGenius)
This package is self-contained and usable without access to IDEAGO.
"""
