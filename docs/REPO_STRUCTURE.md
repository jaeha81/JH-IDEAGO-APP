# IDEAGO Repository Structure — Folder Responsibility Guide

This document explains what each folder is for and what belongs (or does not belong) in it.

---

## Root

```
JH IDEAGO/
├── frontend/
├── backend/
├── docs/
├── docker-compose.yml    # Infrastructure for local dev only
├── .gitignore
└── README.md
```

**Rule**: The root contains only project-level configuration and infrastructure. No source code lives here.

---

## `frontend/`

**Stack**: Next.js 14 (App Router) + TypeScript + Tailwind CSS

**Purpose**: The user-facing web application. Tablet-first, responsive.

```
frontend/
├── app/               # Next.js App Router — pages and layouts
├── components/        # Reusable UI components
│   ├── canvas/        # Canvas-specific components (Step 9)
│   ├── agent/         # Agent panel components (Step 9)
│   ├── upload/        # Upload and markup components (Step 9)
│   └── ui/            # Generic UI primitives (Step 9)
├── lib/
│   └── api.ts         # Typed HTTP client — talks to backend only
├── types/
│   └── index.ts       # Domain types — must stay in sync with API contracts
└── public/            # Static assets
```

**Responsibility boundaries**:
- All data fetching goes through `lib/api.ts`
- No direct database access
- No AI calls — all AI is backend-only
- Canvas rendering state is client-side; canvas data persistence is backend
- Screen layout is UI-changeable; feature responsibility is not

**What does NOT belong here**:
- Business logic (belongs in backend services)
- File storage (belongs in object storage via backend)
- AI orchestration (belongs in `backend/app/ai/`)

---

## `backend/`

**Stack**: FastAPI + PostgreSQL + SQLAlchemy (async) + Celery + Redis

**Purpose**: REST API, business logic, data persistence, AI orchestration, export engine.

```
backend/
├── app/
│   ├── main.py           # FastAPI app — router registration only
│   ├── config.py         # All settings (pydantic-settings)
│   ├── database.py       # Async engine + session factory
│   ├── core/             # Shared infrastructure
│   │   ├── auth.py       # JWT — get_current_user dependency
│   │   ├── exceptions.py # Typed HTTP exceptions
│   │   └── storage.py    # S3/MinIO abstraction
│   ├── models/           # SQLAlchemy ORM models
│   ├── routers/          # FastAPI route handlers (thin — delegate to services)
│   ├── schemas/          # Pydantic request/response schemas
│   ├── services/         # Business logic (one class per domain)
│   └── worker/           # Celery app + async background tasks
├── alembic/              # Database migrations
│   └── versions/         # One file per migration — never edit existing files
└── requirements.txt
```

### Module ownership (from system-architecture.md)

| Module | Files | Writes to |
|---|---|---|
| projects | `models/project.py`, `services/project_service.py` | `projects` table |
| agents | `models/agent.py`, `services/agent_service.py` | `agents` table |
| canvas | `models/canvas.py`, `services/canvas_service.py` | `canvas_snapshots`, `canvas_elements` |
| assets | `models/asset.py`, `services/asset_service.py` | `uploaded_assets`, object storage |
| events | `models/event.py`, `services/event_service.py` | `project_events` (append-only) |
| **ai** | `services/ai_service.py`, `services/context_builder.py` | `agent_responses` only — **never writes to core tables** |
| detail_view | `models/ai.py` (DetailViewResult), `services/detail_view_service.py` | `detail_view_results`, object storage |
| export | `models/export.py`, `services/export_service.py` | `export_records`, object storage |

**AI isolation rule**: The AI module reads from `project_events`, `canvas_snapshots`, and project/agent metadata. It never writes to any of those tables.

**Event log rule**: `project_events` is append-only. No UPDATE or DELETE is ever issued against this table.

---

## `docs/`

Source of truth for all product decisions. Read before modifying any code.

```
docs/
├── product/
│   ├── IDEAGO_KEY_FEATURE_SUMMARY.md   # Feature baseline (read first)
│   ├── IDEAGO_FEATURE_MAP.md           # Screen → Feature → Backend map (authoritative)
│   └── IDEAGO_MASTER_PLAN.md
├── backend-planning/
│   ├── system-architecture.md          # Module boundaries and tech stack
│   ├── database-schema.md              # All table definitions
│   ├── api-contracts.md                # Full API contract reference
│   ├── export-structure.md             # Export ZIP package format
│   ├── ai-orchestration-strategy.md    # Agent query flow
│   ├── mvp-scope.md                    # What to build / what to defer
│   └── risk-register.md
├── figma/
│   ├── SCREEN_LIST.md                  # All screens and overlays
│   ├── FIGMA_PROMPT.md                 # Figma design system prompt
│   └── UI_CHANGELOG.md                 # Design decisions log
├── legal-ip/
└── REPO_STRUCTURE.md                   # This file
```

**Rule**: UI layout decisions live in `docs/figma/`. Backend contracts live in `docs/backend-planning/`. Neither overrides the other.

---

## `docker-compose.yml`

Local development infrastructure only. Not used in production.

| Service | Port | Purpose |
|---|---|---|
| PostgreSQL | 5432 | Primary database |
| Redis | 6379 | Celery broker + result backend |
| MinIO | 9000 / 9001 | S3-compatible object storage + console |

Backend and frontend run directly on the host (not in Docker) for faster hot reload during development.

---

## What Is Intentionally Empty

| Path | Reason |
|---|---|
| `frontend/components/` | UI components — implemented in Step 9 |
| `backend/alembic/versions/` | Migrations generated in Step 8 |
| `backend/app/worker/tasks/` | Task implementations done progressively with features |
| `frontend/app/(routes)/` | Screen routes — implemented in Step 9 |
