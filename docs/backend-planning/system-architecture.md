# System Architecture — IDEAGO (MultiGenius)

## 1. Overview

IDEAGO is a visual ideation platform with four fixed responsibilities:
1. **Canvas management** — freeform drawing, text, shapes, image overlay, annotation
2. **Asset management** — upload, storage, retrieval, markup
3. **AI agent orchestration** — multi-agent collaboration with summary-first output
4. **Structured project export** — context-preserving ZIP/folder package

The backend is organized around these responsibilities as independent modules — not around UI screen layout. UI panel placement may change; module boundaries do not.

---

## 2. High-Level Architecture

```
Client (Tablet / Mobile Web)
        │
        ▼
  ┌─────────────────┐
  │  FastAPI App    │  ← REST API, JWT auth, async handlers
  └────────┬────────┘
           │
  ┌────────┴──────────────────────────────────┐
  │                  Core Layer               │
  │  ProjectService  CanvasService            │
  │  AssetService    EventLogService          │
  └────────┬──────────────────────────────────┘
           │
  ┌────────┴──────────────────┐
  │         AI Layer          │  ← Isolated. Reads Core; never writes to core tables.
  │  AgentOrchestrator        │
  │  ContextBuilder           │
  │  SummaryFormatter         │
  └────────┬──────────────────┘
           │
  ┌────────┴──────────────────┐
  │      Export Engine        │  ← Reads from Core + AI Layer output; generates ZIP
  └────────┬──────────────────┘
           │
  ┌────────┴──────────────────┐
  │   Task Queue (Celery)     │  ← Async jobs: export generation, Detail View, AI calls
  └────────┬──────────────────┘
           │
  ┌────────┴──────────────────┐
  │  PostgreSQL  │  Object    │
  │  (metadata)  │  Storage   │  ← S3-compatible; all binary files stored here
  └──────────────┴────────────┘
```

---

## 3. Module Breakdown

### 3.1 Project Module
Manages project lifecycle: create, read, update, archive.

- Project creation requires no title — title is nullable by design
- Auto-title: triggered lazily on user request or after first substantive canvas action; never forced at project creation
- `purpose_note`: free-text field for informal project intent — used as seed for AI context
- Agent configuration is project-scoped and managed separately

**Fixed**: A project without a title must be creatable. Auto-title must be optional and non-blocking.

### 3.2 Canvas Module
Manages canvas state as structured, machine-readable data.

- Canvas state stored as JSONB (full snapshot) + relational element records
- Element types: `stroke`, `text`, `shape`, `image_overlay`
- Image overlays reference Asset IDs — binary files never stored in canvas state
- Annotations on uploaded images stored as canvas elements (layer on top), never embedded in the original file
- Undo support: event diff stack (last N events); not full-state copies
- Snapshots created: on manual save, every 5 minutes (configurable), before every export

**Fixed**: Canvas data must be structurally exportable independent of AI output. The original uploaded image must remain unmodified.

### 3.3 Asset Module
Manages user file uploads.

- Accepts: PNG, JPG, WEBP, PDF (page extraction later)
- All files stored in object storage (S3-compatible); DB holds metadata only
- Returns: `asset_id`, `storage_url`, `thumbnail_url`
- Assets are project-scoped — no cross-project sharing in MVP
- Privacy: presigned URLs with expiry; no public permanent URLs

**Fixed**: File data never enters the database. Original uploads are immutable.

### 3.4 Event Log Module
Records every meaningful user action as structured, machine-readable events.

- Schema: `{ event_id, project_id, user_id, event_type, payload, sequence_num, created_at }`
- Append-only — no UPDATE or DELETE
- `event_type` examples:
  - `canvas.element.added`, `canvas.element.moved`, `canvas.snapshot.saved`
  - `agent.query.sent`, `agent.response.received`
  - `asset.uploaded`, `asset.placed_on_canvas`
  - `detail_view.triggered`, `export.initiated`
- Used by: AI context builder, Project Summary screen, Export package (history.json)

**Fixed**: This is core platform infrastructure, not optional telemetry. It is the source of truth for project history.

### 3.5 AI Agent Module (Isolated)
Orchestrates LLM calls for user-defined agents.

- Agents have no hardcoded types — `role_label` is free text set by user
- On query: builds compressed context from recent event log → sends parallel LLM calls per agent → returns summary-first responses
- `summary_text` always returned; `full_reasoning` stored separately and retrieved on "See More"
- AI module reads EventLog and Canvas snapshots but has no write access to core tables
- AI responses stored in `agent_responses` table (AI Layer), not merged into canvas or project

**Fixed**: Agent roles are user-defined text. The system must not impose personas, hardcoded specializations, or silently simplify agent behavior.

### 3.6 Detail View Module (On-Demand)
Generates cleaned visual interpretation of current canvas state.

- Triggered only on explicit user request — never auto-generated
- Input: canvas snapshot + optional user prompt
- Output: image result stored as a generated asset in object storage
- Multiple results per project; each versioned by creation time
- Generation is async (Celery job); client polls for completion

**Fixed**: Detail View is optional and on-demand. Must never auto-open or auto-generate.

### 3.7 Export Engine
Assembles a complete, context-preserving project package.

- Reads from: Project, Canvas, Asset, EventLog, Agent, DetailView modules
- Generates: ZIP file with structured folder (see export-structure.md)
- Export is a point-in-time snapshot — not a live link
- Export runs as async Celery job; client polls for download URL
- Export does not require AI to be running — all content comes from stored data

**Fixed**: Export is not a file download. It must be usable by a developer, designer, or contractor who has never seen IDEAGO.

---

## 4. Fixed vs UI-Changeable

| Concern | Fixed (Backend must honor) | UI-Changeable (layout only) |
|---|---|---|
| Agent role labels | User-defined text; stored and honored exactly | Panel placement, visual style |
| Canvas data | Stored as structured JSON | Canvas toolbar layout |
| Image annotations | Stored on canvas layer; original file untouched | Annotation toolbar position |
| Detail View | Optional, explicit trigger only | Modal vs drawer vs side panel |
| Export contents | All 7 artifact types must be present | Export screen visual layout |
| Event log | Append-only, structured, never pruned (MVP) | Not directly surfaced in UI |
| Auto-title | Available but never forced | Input field placement on setup screen |
| Agent responses | Summary always returned; full reasoning on request | Expand/collapse UI behavior |

---

## 5. Technology Stack

| Component | Choice | Notes |
|---|---|---|
| API Framework | FastAPI (Python 3.11+) | Async, Pydantic v2, auto OpenAPI |
| Database | PostgreSQL 15+ | JSONB for canvas state; relational for everything else |
| Object Storage | S3-compatible (MinIO dev / AWS S3 prod) | All binary files |
| AI Provider | Anthropic Claude API | Primary; parallel agent calls via async |
| Task Queue | Celery + Redis | Async export, Detail View, slow AI calls |
| Auth | JWT (stateless, RS256) | Tablet/mobile compatible |
| Schema Validation | Pydantic v2 | Request/response contract enforcement |
| Migrations | Alembic | Version-controlled schema migrations |

---

## 6. Key Architecture Decisions

1. **Canvas as JSONB + element records**: Fast full-state reads via JSONB; queryable discrete elements via relational rows. Hybrid approach.
2. **Event log is append-only**: No UPDATE/DELETE on `project_events`. Immutable audit trail.
3. **AI module has no write access to core tables**: AI output goes to `agent_responses` only; never merged into canvas or project records.
4. **Export is always async**: Even small exports run as background jobs to avoid blocking the API.
5. **Files never in DB**: Object storage for all binaries; DB holds metadata and storage keys only.
6. **Detail View output is a stored asset**: Treated identically to an uploaded file — stored in object storage, referenced by metadata in DB.
7. **Presigned URLs with expiry**: All file access goes through time-limited signed URLs; no permanent public URLs.
