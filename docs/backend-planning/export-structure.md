# Export Structure — IDEAGO (MultiGenius)

## 1. What Export Is (and Is Not)

Export is **not** a simple file download.

It is a structured, context-preserving project package that must be usable by a developer, designer, contractor, or collaborator who has **never seen IDEAGO** and has no access to the platform.

The package must:
- Explain what the project is and what it is for
- Preserve the thinking process, not just the final output
- Include all visual artifacts (canvas, uploads, detail views)
- Document the AI agent configuration and their contributions
- Be structurally consistent so tools can parse it programmatically

---

## 2. Package Folder Structure

```
{project_title_slug}_{export_date}/
├── export-manifest.json        ← machine-readable package index
├── project-summary.md          ← human-readable project overview
├── agents.md                   ← agent configuration and interaction summary
├── canvas-data.json            ← structured canvas state (all elements)
├── history.json                ← structured event log (machine-readable)
├── instructions.md             ← handoff notes and recommended next steps
├── uploads/                    ← original uploaded files (unmodified)
│   ├── {asset_id}_{original_name}
│   └── ...
├── visualization/              ← Detail View outputs
│   ├── detail-view-{result_id}.png
│   └── ...
└── canvas-renders/             ← rendered PNG of canvas at export time (LATER)
    └── canvas-snapshot.png
```

---

## 3. File Responsibilities

### `export-manifest.json`
Machine-readable index of the entire package. Required for any tool that parses the export.

```json
{
  "schema_version": "1.0",
  "export_id": "uuid",
  "project_id": "uuid",
  "project_title": "...",
  "exported_at": "2024-01-15T10:30:00Z",
  "exported_by": "user@example.com",
  "canvas_snapshot_num": 42,
  "included": {
    "project_summary": true,
    "agents": true,
    "canvas_data": true,
    "history": true,
    "instructions": true,
    "uploads": ["uuid_reference.jpg", "uuid_sketch.png"],
    "visualization": ["detail-view-uuid.png"],
    "canvas_renders": false
  },
  "agent_count": 3,
  "event_count": 187,
  "upload_count": 2,
  "detail_view_count": 1
}
```

### `project-summary.md`
Human-readable overview. No technical jargon. Readable by a client or contractor.

```markdown
# Project Summary: {title}

**Created**: 2024-01-10
**Last Updated**: 2024-01-15
**Purpose**: {purpose_note or "Not specified"}

## What This Project Is
{AI-generated or user-written description of the project intent}

## Current Status
{status — active / archived / handoff-ready}

## Key Decisions Made
- ...

## Recommended Next Steps
- ...

## Agent Configuration
- Agent 1 (Architect): ...
- Agent 2 (UX Critic): ...
```

### `agents.md`
Documents every agent in the project and their interaction history.

```markdown
# Agent Configuration

## Agent: {role_label}
**ID**: uuid
**Status**: active | deactivated

### Interaction Summary
Total queries: 12

**Query (2024-01-12 14:30)**:
> What structure does this layout suggest?

**Response Summary**:
The layout suggests a three-panel hierarchy with...

[Full reasoning available in agent_responses table — not included in export for brevity]

---
```

### `canvas-data.json`
Structured representation of the canvas state at export time. Machine-readable.

```json
{
  "schema_version": 1,
  "snapshot_id": "uuid",
  "snapshot_num": 42,
  "canvas": {
    "width": 2560,
    "height": 1920,
    "background": "#FFFFFF"
  },
  "elements": [
    {
      "id": "uuid",
      "type": "stroke",
      "z_index": 0,
      "position": { "x": 100, "y": 200 },
      "data": { "points": [[100, 200], [101, 201]], "color": "#000000", "width": 2 }
    },
    {
      "id": "uuid",
      "type": "image_overlay",
      "z_index": 3,
      "position": { "x": 300, "y": 150 },
      "data": {
        "asset_id": "uuid",
        "asset_filename": "reference.jpg",
        "asset_path": "uploads/uuid_reference.jpg",
        "width": 400, "height": 300, "rotation": 0,
        "annotations": [
          { "type": "arrow", "from": [310, 160], "to": [500, 250] },
          { "type": "note", "position": [400, 200], "text": "This part needs rethinking" }
        ]
      }
    }
  ]
}
```

### `history.json`
Structured event log derived from `project_events`. Machine-readable. Preserves the thinking process.

```json
{
  "project_id": "uuid",
  "event_count": 187,
  "events": [
    {
      "sequence_num": 1,
      "event_type": "project.created",
      "timestamp": "2024-01-10T09:00:00Z",
      "payload": {}
    },
    {
      "sequence_num": 14,
      "event_type": "asset.uploaded",
      "timestamp": "2024-01-10T09:15:00Z",
      "payload": { "asset_id": "uuid", "filename": "reference.jpg" }
    },
    {
      "sequence_num": 35,
      "event_type": "agent.query.sent",
      "timestamp": "2024-01-10T09:22:00Z",
      "payload": { "query": "what structure does this suggest?" }
    }
  ]
}
```

### `instructions.md`
Human-readable handoff notes. Written by user (optional) + appended context.

```markdown
# Handoff Instructions

## Notes from the Creator
{user-provided notes from export screen, or "No notes provided"}

## How to Use This Package
1. Read `project-summary.md` for context
2. Open `canvas-data.json` or `uploads/` to see visual artifacts
3. Read `agents.md` to understand AI guidance that shaped this project
4. Review `history.json` for the full decision trail
5. Use `visualization/` for refined visual outputs

## Package Format Version
IDEAGO Export v1.0 — generated by IDEAGO (MultiGenius)
```

---

## 4. How Export Differs from Simple File Download

| Simple Download | IDEAGO Export |
|---|---|
| Returns a file | Returns a structured package |
| No context | Full project context included |
| Requires platform to interpret | Usable without IDEAGO |
| Snapshot of output | Snapshot of thinking process |
| No agent history | Agent roles and responses documented |
| No event trail | history.json preserves full decision trail |

---

## 5. What Is NOT Included in MVP Export

| Excluded | Reason |
|---|---|
| Full `full_reasoning` per agent response | Too verbose; summary is sufficient for handoff |
| Canvas rendered as PNG | Requires headless browser or canvas render service; deferred |
| PDF export | Additional format conversion; deferred |
| Interactive HTML viewer | Out of scope for MVP |
| Multi-version diff export | Only point-in-time snapshot in MVP |

---

## 6. Export Generation Process (Backend)

1. Client calls `POST /projects/:id/export`
2. Celery job created with `status = pending`
3. Job steps (sequential):
   a. Create `pre_export` canvas snapshot
   b. Read project metadata → generate `project-summary.md`
   c. Read agents + responses → generate `agents.md`
   d. Serialize canvas snapshot → `canvas-data.json`
   e. Serialize event log → `history.json`
   f. Copy uploaded asset files from object storage → `uploads/`
   g. Copy detail view result files → `visualization/`
   h. Generate `instructions.md` (append user notes if provided)
   i. Assemble `export-manifest.json`
   j. ZIP all files
   k. Upload ZIP to object storage
   l. Update `export_records`: `status = completed`, presigned download URL
4. Client polls `GET /export/:export_id` until `status = completed`
5. Client receives presigned download URL (valid 24 hours)

---

## 7. Privacy and Security Constraints

- Export ZIP is stored in object storage under `exports/{project_id}/{export_id}.zip`
- Download URL is presigned with 24-hour expiry
- No export is publicly accessible without the presigned URL
- Export is scoped to project owner in MVP (no share links)
- User-uploaded files are copied into the ZIP — no references to internal storage URLs
