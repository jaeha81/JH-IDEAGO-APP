# API Contracts — IDEAGO (MultiGenius)

## 1. Design Principles

- All endpoints are **UI-layout-agnostic** — they do not assume panel position, screen layout, or device type
- Contracts are stable even if Figma layout changes
- `[MVP]` = required for initial launch; `[LATER]` = explicitly deferred
- Standard response envelope: `{ data, error, meta }`
- Base path: `/api/v1`
- All endpoints require `Authorization: Bearer <token>` unless marked otherwise

---

## 2. Auth

### `POST /auth/register`  `[MVP]`
```
Body:   { email: string, password: string, display_name?: string }
200:    { data: { user_id, email, access_token } }
409:    email already registered
```

### `POST /auth/login`  `[MVP]`
```
Body:   { email: string, password: string }
200:    { data: { access_token, user_id } }
401:    invalid credentials
```

---

## 3. Projects

### `POST /projects`  `[MVP]`
Create a new project. Title is optional — a project without a title is valid.
```
Body:
{
  title?: string,               // null = user has not set a title yet
  auto_generate_title?: boolean // if true, title will be generated asynchronously
}

200:
{
  data: {
    project_id: string,
    title: string | null,
    auto_title: boolean,
    status: "active",
    created_at: string
  }
}
```

### `GET /projects`  `[MVP]`
```
Query:  page=1, per_page=20, status=active|archived
200:    { data: [ProjectSummary], meta: { total, page, per_page } }

ProjectSummary: { project_id, title, status, created_at, updated_at, agent_count }
```

### `GET /projects/:project_id`  `[MVP]`
```
200:
{
  data: {
    project_id, title, auto_title, status, purpose_note,
    created_at, updated_at,
    agents: [Agent],
    canvas_last_saved: string | null,
    export_count: integer
  }
}
404:    project not found or not owned by caller
```

### `PATCH /projects/:project_id`  `[MVP]`
Partial update — title, purpose_note, or status.
```
Body:   { title?: string, purpose_note?: string, status?: "active"|"archived" }
200:    { data: ProjectDetail }
```

### `DELETE /projects/:project_id`  `[LATER]`
Soft archive with 30-day file retention before hard delete.

---

## 4. Agents

### `POST /projects/:project_id/agents`  `[MVP]`
```
Body:   { role_label: string, display_order?: integer }
200:    { data: Agent }

Agent: { agent_id, project_id, role_label, display_order, is_active, created_at }
```
Note: `role_label` is stored exactly as entered. No normalization, no enum validation.

### `GET /projects/:project_id/agents`  `[MVP]`
```
200:    { data: [Agent] }  // ordered by display_order
```

### `PATCH /projects/:project_id/agents/:agent_id`  `[MVP]`
```
Body:   { role_label?: string, display_order?: integer }
200:    { data: Agent }
```

### `DELETE /projects/:project_id/agents/:agent_id`  `[MVP]`
Soft delete — sets `is_active: false`. Preserves response history.
```
200:    { data: { agent_id, is_active: false } }
```

---

## 5. Canvas

### `GET /projects/:project_id/canvas`  `[MVP]`
Get the latest canvas snapshot.
```
200:
{
  data: {
    snapshot_id: string,
    snapshot_num: integer,
    state_json: CanvasState,
    trigger: "auto"|"manual"|"pre_export",
    created_at: string
  }
}
```

### `PUT /projects/:project_id/canvas`  `[MVP]`
Save current canvas state (full replacement — client sends complete state).
```
Body:   { state_json: CanvasState }
200:    { data: { snapshot_id, snapshot_num, trigger: "manual", saved_at: string } }
```

**CanvasState schema**:
```json
{
  "version": 1,
  "width": 2560,
  "height": 1920,
  "background": "#FFFFFF",
  "elements": [
    {
      "id": "uuid",
      "type": "stroke",
      "data": { "points": [[x,y]], "color": "#000", "width": 2, "opacity": 1.0 },
      "z_index": 0,
      "position_x": 0,
      "position_y": 0
    },
    {
      "id": "uuid",
      "type": "image_overlay",
      "data": {
        "asset_id": "uuid",
        "width": 400, "height": 300, "rotation": 0,
        "annotations": [{ "type": "arrow", "data": { "from": [x,y], "to": [x2,y2] } }]
      },
      "z_index": 2
    }
  ]
}
```

### `GET /projects/:project_id/canvas/snapshots`  `[MVP]`
```
Query:  limit=20
200:    { data: [{ snapshot_id, snapshot_num, trigger, created_at }] }
```

### `GET /projects/:project_id/canvas/snapshots/:snapshot_id`  `[LATER]`
Restore or inspect a historical snapshot.

---

## 6. Assets (Upload + Retrieval)

### `POST /projects/:project_id/assets`  `[MVP]`
Upload a file. Client adds it to canvas as an `image_overlay` element via a subsequent canvas PUT.
```
Content-Type: multipart/form-data
Body:   file=<binary>

200:
{
  data: {
    asset_id: string,
    original_name: string,
    mime_type: string,
    storage_url: string,      // presigned; use immediately
    thumbnail_url: string | null,
    file_size_bytes: integer,
    uploaded_at: string
  }
}
413:    file too large (limit: 20MB MVP)
415:    unsupported media type
```

### `GET /projects/:project_id/assets`  `[MVP]`
```
200:    { data: [AssetMeta] }
```

### `GET /projects/:project_id/assets/:asset_id/url`  `[MVP]`
Refresh presigned URL (call when URL has expired).
```
200:    { data: { asset_id, url, expires_at } }
```

### `DELETE /projects/:project_id/assets/:asset_id`  `[LATER]`
Check canvas references first; reject if still in use.

---

## 7. AI Agent Interaction

### `POST /projects/:project_id/agents/query`  `[MVP]`
Send a user query to one or more agents. Returns summary-first responses.

This endpoint is synchronous for MVP. If p95 latency exceeds 8s, move to async (see `/query/async`).
```
Body:
{
  query: string,
  agent_ids?: [string],    // subset of active agents; omit = all active agents respond
  context_hint?: string    // optional extra context from user (not required)
}

200:
{
  data: {
    query_id: string,
    responses: [
      {
        agent_id: string,
        role_label: string,
        summary_text: string,        // always present; default display
        has_full_reasoning: boolean  // true = "See More" is available
      }
    ],
    responded_at: string
  }
}
```

### `GET /projects/:project_id/agents/responses/:query_id/full/:agent_id`  `[MVP]`
Retrieve full reasoning for a specific agent's response. Triggered only by "See More".
```
200:
{
  data: {
    query_id: string,
    agent_id: string,
    role_label: string,
    full_reasoning: string
  }
}
```

### `GET /projects/:project_id/agents/responses`  `[MVP]`
Paginated history of all agent interactions.
```
Query:  page=1, per_page=20, agent_id?
200:    { data: [{ query_id, agent_id, role_label, summary_text, has_full_reasoning, created_at }], meta: { total } }
```

### `POST /projects/:project_id/agents/query/async`  `[LATER]`
Async version returning a `job_id` for polling. Activate when sync latency is unacceptable.

---

## 8. Auto-Title Generation

### `POST /projects/:project_id/auto-title`  `[MVP]`
Trigger AI auto-title generation from current project context (event log + canvas state).
```
Body:   {}
200:    { data: { project_id, title: string, auto_title: true } }
```
Note: This is always an explicit user action — never called automatically by the system.

---

## 9. Detail View

### `POST /projects/:project_id/detail-view`  `[MVP]`
Trigger Detail View generation. Always async — never blocks the canvas.
```
Body:
{
  user_prompt?: string,    // optional user guidance
  snapshot_id?: string     // default: latest snapshot
}

200:
{
  data: {
    result_id: string,
    status: "pending",
    created_at: string
  }
}
```

### `GET /projects/:project_id/detail-view/:result_id`  `[MVP]`
Poll for result status.
```
200:
{
  data: {
    result_id: string,
    status: "pending"|"completed"|"failed",
    result_type: "image",
    storage_url?: string,    // present only when status = "completed"
    error_message?: string,  // present only when status = "failed"
    completed_at?: string
  }
}
```

### `GET /projects/:project_id/detail-view`  `[MVP]`
List all Detail View results for this project.
```
200:    { data: [DetailViewSummary] }
DetailViewSummary: { result_id, status, result_type, storage_url, created_at, completed_at }
```

---

## 10. Export

### `POST /projects/:project_id/export`  `[MVP]`
Initiate export package generation. Always async.
```
Body:
{
  include_history?: boolean,        // default: true
  include_detail_views?: boolean,   // default: true
  notes?: string                    // appended to instructions.md in the package
}

200:
{
  data: {
    export_id: string,
    status: "pending",
    created_at: string
  }
}
```

### `GET /projects/:project_id/export/:export_id`  `[MVP]`
Poll for export status and download URL.
```
200:
{
  data: {
    export_id: string,
    status: "pending"|"building"|"completed"|"failed",
    download_url?: string,   // present when completed; presigned, expires in 24h
    expires_at?: string,
    manifest?: ExportManifest,
    error_message?: string
  }
}
```

### `GET /projects/:project_id/export`  `[MVP]`
List export history.
```
200:    { data: [ExportRecord] }
ExportRecord: { export_id, status, created_at, completed_at, expires_at }
```

---

## 11. Event Log (Read-Only via API)

### `GET /projects/:project_id/events`  `[MVP]`
Read the project event log (for Project Summary screen and debugging).
```
Query:  since?, until?, event_type?, limit=100, page=1
200:    { data: [ProjectEvent], meta: { total } }
ProjectEvent: { event_id, event_type, payload, sequence_num, created_at }
```

Events are written internally by all other services. There is no external event-write endpoint.

---

## 12. UI-Agnostic Contract Notes

These endpoints make no assumptions about UI layout:

| Endpoint | Why UI-agnostic |
|---|---|
| `POST /agents/query` | Does not know where the agent panel is positioned |
| `PUT /canvas` | Accepts full canvas state regardless of tool layout |
| `POST /assets` | Upload handling does not depend on UI button placement |
| `POST /detail-view` | Does not control how the result is displayed or where |
| `POST /export` | Generates full package regardless of export screen layout |
| `GET /events` | Structured data; display is purely a frontend concern |

---

## 13. Standard Error Envelope

```json
{
  "data": null,
  "error": {
    "code": "AGENT_NOT_FOUND",
    "message": "No active agent with that ID exists in this project.",
    "detail": null
  },
  "meta": {}
}
```

| HTTP Status | When |
|---|---|
| 400 | Malformed request body |
| 401 | Missing or invalid token |
| 403 | Caller does not own this resource |
| 404 | Resource not found |
| 413 | File too large |
| 415 | Unsupported file type |
| 422 | Validation error (Pydantic) |
| 500 | Unexpected server error |
