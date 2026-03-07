# MVP Scope — IDEAGO (MultiGenius)

## 1. Defining MVP

The MVP must validate the core product proposition:
> A user can start a rough visual idea, work with customizable AI agents, and produce a structured, shareable project package — without knowing exactly what they want to make at the start.

MVP is **not** a stripped-down demo. It must fully deliver these four capabilities:
1. Canvas-based visual ideation with image upload and annotation
2. Customizable AI agent collaboration with summary-first output
3. Structured project export as a usable handoff package
4. Machine-readable action logging throughout

Anything that compromises these four is not a valid MVP cut.

---

## 2. MVP Features (Must Build)

### Project Management
- [x] Create project without a title (nullable title is valid)
- [x] Set project title manually
- [x] Trigger auto-title generation (explicit user action)
- [x] Set `purpose_note` (free text, optional)
- [x] List own projects
- [x] Archive project

### Agent Configuration
- [x] Add 1–N agents with user-defined `role_label` (free text)
- [x] Edit agent `role_label`
- [x] Reorder agents (display_order)
- [x] Soft-delete (deactivate) agents
- [x] Add/edit agents mid-project (not only at setup)

### Canvas
- [x] Pen/brush stroke with color selection
- [x] Eraser
- [x] Text input on canvas
- [x] Basic shapes (rect, circle, arrow, line)
- [x] Select and move elements
- [x] Copy and cut elements
- [x] Zoom in/out
- [x] Manual save (full canvas state PUT)
- [x] Auto-save snapshot every 5 minutes
- [x] Canvas snapshot history (last 20)

### Image Upload and Markup
- [x] Upload image (PNG, JPG, WEBP) — up to 20MB
- [x] Place uploaded image on canvas as overlay element
- [x] Draw annotations on top of uploaded image (arrows, notes, highlights)
- [x] Original uploaded file is never modified
- [x] Multiple images per canvas

### AI Agent Interaction
- [x] Send query to all active agents
- [x] Send query to selected subset of agents
- [x] Receive summary-first response per agent (always populated)
- [x] "See More" to retrieve full reasoning
- [x] Agent interaction history (paginated)
- [x] Clarification hint in response (when conditions met)

### Detail View
- [x] Trigger on-demand only (explicit user action)
- [x] Returns generated image result
- [x] Async generation with polling
- [x] Multiple results per project (versioned)
- [x] View list of past Detail View results

### Export
- [x] Generate structured ZIP package
- [x] Package includes: `export-manifest.json`, `project-summary.md`, `agents.md`, `canvas-data.json`, `history.json`, `instructions.md`, `uploads/`, `visualization/`
- [x] Async generation with polling
- [x] Presigned download URL (24-hour expiry)
- [x] Export history list

### Event Log
- [x] All meaningful user actions logged as structured events
- [x] Read event log via API (for Project Summary screen)
- [x] Events consumed by AI context builder
- [x] Events included in export as `history.json`

### Auth
- [x] Register and login (email + password)
- [x] JWT authentication
- [x] Project ownership enforcement on all endpoints

---

## 3. Deferred Features (LATER Phase)

### Multi-device / Collaboration
- Real-time multi-user canvas sync (requires WebSocket + CRDT or OT)
- Shared project links with permission levels (viewer/editor)
- Presence indicators (who is viewing/editing)

**Why deferred**: Requires fundamental architectural additions (WebSocket layer, conflict resolution). Single-user experience must be validated first.

---

### Canvas Rendering
- Server-side canvas render to PNG (requires headless browser or canvas render service)
- Canvas PNG included in export package

**Why deferred**: Requires Puppeteer/Playwright or a dedicated render service. Not worth the infrastructure complexity for MVP.

---

### Advanced Export Formats
- PDF export
- Interactive HTML viewer
- Multi-version diff export (compare two export snapshots)

**Why deferred**: Additional format conversion adds complexity with unclear user demand in MVP.

---

### Resumable File Upload
- Chunked multipart upload for large files
- Upload resume after network interruption

**Why deferred**: Standard multipart upload covers most use cases. Resumable upload requires significant additional implementation.

---

### Agent Configuration Depth
- Per-agent model selection (different Claude model per agent)
- Per-agent temperature/parameter tuning
- Per-agent system prompt injection by user
- Agent memory across projects

**Why deferred**: Increases configuration complexity. MVP validates the core concept of user-defined role labels first.

---

### Undo/Redo System
- Full client-side undo/redo stack
- Server-persisted undo history

**Why deferred**: Undo is primarily a canvas-client concern. Event-diff approach requires careful design. MVP relies on snapshot history for recovery.

---

### Auto-Save Conflict Detection
- Multi-device canvas conflict resolution
- Merge conflict UI

**Why deferred**: Requires real-time sync infrastructure. MVP documents single-session assumption.

---

### Rate Limiting and Quota System
- Per-user daily token budgets
- Per-project agent query limits
- Usage dashboard

**Why deferred from full implementation**: Must have basic rate limiting pre-launch (see risk R-08). Full quota system with user-facing dashboard is LATER.

---

### Social and Sharing
- Public project gallery
- Project sharing via link
- Export sharing (public download link)

**Why deferred**: Out of scope for initial product validation.

---

### Notification System
- Email/push notifications for export completion
- Async job progress notifications

**Why deferred**: Polling (client-side) is sufficient for MVP. Notification infrastructure adds complexity.

---

### Project Templates
- Predefined project templates with pre-configured agents
- Template library

**Why deferred**: Useful for onboarding but not core to product validation.

---

## 4. What Must NOT Be Built Yet

These are explicitly out of scope and must not be started during MVP implementation:

| Feature | Why Not |
|---|---|
| WebSocket / real-time canvas sync | Wrong time — single-user must work perfectly first |
| Headless browser canvas renderer | Infrastructure complexity not justified yet |
| Agent-to-agent conversation output | Violates product philosophy — agents are independent |
| Persistent agent memory across projects | Adds statefulness before single-project behavior is validated |
| Per-agent model or parameter configuration | Complexity without validated user need |
| Public project gallery | Trust and moderation concerns before product is stable |
| PDF export | Additional format work before ZIP is validated |
| Mobile native app | Web first — tablet-responsive web is the target |
| LLM fine-tuning or custom model hosting | Out of scope entirely |

---

## 5. Pre-Launch Blockers (Must Complete Before Public Access)

Even if these are not "MVP features," they are required before exposing the product to real users:

| Blocker | Reason |
|---|---|
| Per-user LLM rate limiting | Unbounded costs (R-08) |
| File access control with ownership validation | Sensitive file security (R-14) |
| Privacy disclosure / ToS for LLM data transmission | Legal requirement (R-15) |
| HTTPS on all endpoints | Basic security |
| Input validation and max size limits | Prevent abuse |

---

## 6. MVP Success Criteria

The MVP is complete when a user can:

1. Create a project (with or without a title)
2. Configure 2+ AI agents with custom role labels
3. Draw on the canvas, upload an image, and annotate it
4. Ask the agents a question and receive a clear, role-specific summary response
5. Optionally trigger Detail View and receive a visual result
6. Export the project and receive a ZIP package that a stranger could understand and act on without access to IDEAGO
