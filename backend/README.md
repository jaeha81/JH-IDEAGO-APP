# IDEAGO Backend

FastAPI + PostgreSQL backend for IDEAGO (MultiGenius).

## Stack

- **Framework**: FastAPI (Python 3.11+)
- **Database**: PostgreSQL 15+ with SQLAlchemy 2.0 (async)
- **Migrations**: Alembic
- **Object Storage**: S3-compatible (MinIO local / AWS S3 prod)
- **AI**: Anthropic Claude API
- **Task Queue**: Celery + Redis

## Setup

```bash
cp .env.example .env
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Start local services first (see root `docker-compose.yml`), then:

```bash
alembic upgrade head
uvicorn app.main:app --reload
```

API runs at `http://localhost:8000`. Docs at `/docs`.

## Module Structure

```
app/
  main.py           # FastAPI entry point — router registration only
  config.py         # All settings via pydantic-settings
  database.py       # Async SQLAlchemy engine + session factory

  core/
    auth.py         # JWT token handling, get_current_user dependency
    exceptions.py   # NotFoundError, ForbiddenError, etc.
    storage.py      # Object storage (S3/MinIO) abstraction

  models/           # SQLAlchemy ORM models (one file per domain entity)
  routers/          # FastAPI routers (one file per module)
  schemas/          # Pydantic request/response schemas
  services/         # Business logic (one class per module)

  worker/
    celery_app.py   # Celery configuration
    tasks/          # Async background tasks (export, detail view)

alembic/
  env.py            # Alembic migration environment
  versions/         # Migration scripts
```

## Module Boundaries (from system-architecture.md)

| Module | Responsibility |
|---|---|
| `projects` | Project lifecycle — create, read, update, archive |
| `agents` | Agent configuration per project — user-defined role labels |
| `canvas` | Canvas state (JSONB snapshot) + element records |
| `assets` | File upload metadata; binary files in object storage |
| `events` | Append-only structured event log — source of truth for project history |
| `ai` | Agent orchestration — context build, parallel LLM calls, summary-first response |
| `detail_view` | On-demand visualization generation (async Celery job) |
| `export` | ZIP package assembly (async Celery job) — handoff pipeline, not file download |

The AI module reads from core tables but has no write access to them. All AI output goes to `agent_responses` only.

## Running the Worker

```bash
celery -A app.worker.celery_app worker --loglevel=info
```
