# IDEAGO (MultiGenius)

> Empowering your ideas with multi-genius collaboration

A tablet-first visual ideation platform. Users sketch, write, upload references, and collaborate with customizable AI agents to turn rough ideas into structured, shareable project packages.

---

## Repository Structure

```
JH IDEAGO/
├── frontend/           # Next.js 14 + TypeScript — tablet-first web UI
├── backend/            # FastAPI + PostgreSQL — REST API and business logic
├── docs/               # All design documents (source of truth)
│   ├── product/        # Feature map, master plan, key features
│   ├── backend-planning/  # Architecture, schema, API contracts, export
│   ├── figma/          # Screen list, UI changelog, Figma prompts
│   └── legal-ip/       # IP and legal checklist
├── docker-compose.yml  # Local dev services: PostgreSQL, Redis, MinIO
└── .gitignore
```

## Quick Start (Local Development)

### 1. Start infrastructure

```bash
docker compose up -d
```

Starts: PostgreSQL (5432), Redis (6379), MinIO (9000 / console 9001).

### 2. Backend

```bash
cd backend
cp .env.example .env       # edit ANTHROPIC_API_KEY
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
```

API: http://localhost:8000 | Docs: http://localhost:8000/docs

### 3. Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

App: http://localhost:3000

### 4. Celery Worker (for export and detail view)

```bash
cd backend
celery -A app.worker.celery_app worker --loglevel=info
```

---

## APK Build (Android)

IDEAGO is packaged as a native Android APK using [Capacitor](https://capacitorjs.com). The Next.js frontend is exported as a static site, wrapped in a native WebView.

### Prerequisites
- Node.js 18+
- Android Studio (with Android SDK 33+)
- Java 17+

### Build Steps

```bash
# 1. Install dependencies
cd frontend && npm install

# 2. Build & sync (Next.js static export → Android project)
npm run cap:sync

# 3. Open in Android Studio
npm run cap:open
# Then: Build → Generate Signed Bundle/APK

# OR: Quick debug APK via script
cd .. && bash scripts/build-apk.sh
```

See [APK Build Guide](docs/APK-BUILD-GUIDE.md) for detailed instructions.

---

## Plugin System

IDEAGO supports installable feature plugins. Plugins are loaded from GitHub at runtime.

```
plugins/
├── registry/
│   └── index.json          # Official plugin registry
├── ai-provider/            # Multi AI provider switcher
├── export-tools/           # Advanced export formats  
└── template-pack/          # Project templates
```

### Install a Plugin (in-app)
1. Open IDEAGO → Settings → Plugins
2. Browse available plugins or paste a GitHub URL
3. Tap Install — plugin loads instantly (no app restart)

### Develop a Plugin
See [plugins/README.md](plugins/README.md) for the plugin development guide.

Plugin constraints: ≤50KB bundle, ≤200ms boot time, 0 API calls on init.

---

## Core Product Principles

| Principle | What it means |
|---|---|
| Canvas-first | The canvas is the primary workspace. Agent panel supports it. |
| Summary-first agents | Agents return concise responses. Full reasoning on demand only. |
| Detail View is optional | Never auto-opens. Triggered explicitly by the user. |
| Upload + Markup is core | Not a bonus feature. Users sketch on top of real images. |
| Export is a handoff package | A ZIP a developer, designer, or contractor can use without IDEAGO. |
| Event log is immutable | All user actions are append-only structured events. |

---

## Document Index

| File | Purpose |
|---|---|
| [IDEAGO_KEY_FEATURE_SUMMARY.md](docs/product/IDEAGO_KEY_FEATURE_SUMMARY.md) | Current feature baseline |
| [IDEAGO_FEATURE_MAP.md](docs/product/IDEAGO_FEATURE_MAP.md) | Screen → Feature → Backend responsibility map |
| [system-architecture.md](docs/backend-planning/system-architecture.md) | System architecture and module breakdown |
| [database-schema.md](docs/backend-planning/database-schema.md) | All table definitions |
| [api-contracts.md](docs/backend-planning/api-contracts.md) | Full API contract reference |
| [mvp-scope.md](docs/backend-planning/mvp-scope.md) | MVP feature checklist and success criteria |
| [export-structure.md](docs/backend-planning/export-structure.md) | Export ZIP package format |
| [ai-orchestration-strategy.md](docs/backend-planning/ai-orchestration-strategy.md) | Agent query flow and context building |
| [SCREEN_LIST.md](docs/figma/SCREEN_LIST.md) | All screens and implementation priority |
| [REPO_STRUCTURE.md](docs/REPO_STRUCTURE.md) | Folder responsibility guide |

---

## 📊 개발 현황 <!-- jh-progress -->

| 항목 | 내용 |
|------|------|
| **진행률** | `████████████████░░░░` **80%** |
| **레포** | [JH-IDEAGO](https://github.com/jaeha81/JH-IDEAGO) |

> 진행률: 80%
