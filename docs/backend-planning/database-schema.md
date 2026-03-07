# Database Schema — IDEAGO (MultiGenius)

## 1. Entity Map

```
users
  └── projects
        ├── agents                (per project, user-defined role labels)
        ├── canvas_snapshots      (versioned full canvas state)
        ├── canvas_elements       (queryable individual elements)
        ├── uploaded_assets       (file metadata; binaries in object storage)
        ├── agent_responses       (AI output; append-only)
        ├── detail_view_results   (generated visual outputs; stored as assets)
        ├── export_records        (export job history and download links)
        └── project_events        (append-only structured action log)
```

---

## 2. Table Definitions

### `users`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
email           TEXT UNIQUE NOT NULL
display_name    TEXT
created_at      TIMESTAMPTZ DEFAULT now()
updated_at      TIMESTAMPTZ DEFAULT now()
```

---

### `projects`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
title           TEXT                          -- nullable: valid to have no title
auto_title      BOOLEAN DEFAULT false         -- true = title was AI-generated
status          TEXT NOT NULL DEFAULT 'active'  -- active | archived
purpose_note    TEXT                          -- informal intent note; used as AI context seed
created_at      TIMESTAMPTZ DEFAULT now()
updated_at      TIMESTAMPTZ DEFAULT now()
```

**Design notes**:
- `title` is nullable. Project creation must succeed without a title.
- `auto_title` distinguishes user-set vs system-generated titles.
- `purpose_note` is a free-text field with no enforced format. It is an AI context hint, not a form field.

---

### `agents`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE
role_label      TEXT NOT NULL                 -- user-defined free text; no enum
display_order   INTEGER NOT NULL DEFAULT 0
is_active       BOOLEAN NOT NULL DEFAULT true -- soft delete; history preserved
created_at      TIMESTAMPTZ DEFAULT now()
updated_at      TIMESTAMPTZ DEFAULT now()
```

**Design notes**:
- No hardcoded role types. `role_label` is exactly what the user typed.
- Soft delete (`is_active = false`) preserves `agent_responses` linkage.
- `display_order` allows UI reordering independently of data integrity.

---

### `canvas_snapshots`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE
snapshot_num    INTEGER NOT NULL              -- monotonically increasing per project
state_json      JSONB NOT NULL               -- complete canvas state at this point in time
trigger         TEXT NOT NULL DEFAULT 'auto' -- auto | manual | pre_export
created_at      TIMESTAMPTZ DEFAULT now()

UNIQUE (project_id, snapshot_num)
```

**Design notes**:
- Full snapshot (not diff) for reliable restore at any point.
- Auto snapshots: every 5 minutes while project is active.
- `pre_export` snapshots are always kept; auto snapshots pruned after threshold (keep last 20).
- Manual saves are always kept.

---

### `canvas_elements`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE
snapshot_id     UUID REFERENCES canvas_snapshots(id) ON DELETE SET NULL
element_type    TEXT NOT NULL                -- stroke | text | shape | image_overlay
element_data    JSONB NOT NULL              -- type-specific schema (see below)
position_x      FLOAT NOT NULL DEFAULT 0
position_y      FLOAT NOT NULL DEFAULT 0
z_index         INTEGER NOT NULL DEFAULT 0
asset_id        UUID REFERENCES uploaded_assets(id) ON DELETE SET NULL
created_at      TIMESTAMPTZ DEFAULT now()
deleted_at      TIMESTAMPTZ                  -- soft delete; supports undo
```

**`element_data` schemas by type**:

```json
// stroke
{ "points": [[x,y], ...], "color": "#000000", "width": 2, "opacity": 1.0, "tool": "pen" }

// text
{ "content": "...", "font_size": 16, "font_family": "sans-serif", "color": "#000000" }

// shape
{ "shape_type": "rect|circle|arrow|line", "width": 120, "height": 80, "fill": "#fff", "stroke_color": "#000", "stroke_width": 1 }

// image_overlay
{
  "asset_id": "uuid",
  "width": 400, "height": 300,
  "rotation": 0,
  "annotations": [
    { "type": "arrow|highlight|note", "data": {...} }
  ]
}
```

**Design notes**:
- Annotations on uploaded images are stored inline in `element_data.annotations` — the original uploaded file is never modified.
- `asset_id` is redundant for `image_overlay` (also in `element_data`) but is a FK for fast relational queries.
- `deleted_at` enables undo: soft-deleted elements can be restored.

---

### `uploaded_assets`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE
original_name   TEXT NOT NULL
mime_type       TEXT NOT NULL               -- image/jpeg | image/png | image/webp | ...
storage_key     TEXT NOT NULL UNIQUE        -- object storage path
storage_url     TEXT NOT NULL               -- presigned URL (refreshed on request)
thumbnail_key   TEXT
thumbnail_url   TEXT
file_size_bytes BIGINT NOT NULL
uploaded_at     TIMESTAMPTZ DEFAULT now()
```

**Design notes**:
- File binary never stored in DB.
- `storage_key` format: `projects/{project_id}/uploads/{uuid}.{ext}`
- `storage_url` is presigned with expiry. A `GET /assets/:id/url` endpoint refreshes it.
- No cross-project asset access.

---

### `agent_responses`
```sql
id                          UUID PRIMARY KEY DEFAULT gen_random_uuid()
project_id                  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE
agent_id                    UUID REFERENCES agents(id) ON DELETE SET NULL
user_query                  TEXT NOT NULL
summary_text                TEXT NOT NULL    -- always returned; default display
full_reasoning              TEXT             -- "See More" content; may be null
token_count                 INTEGER
model_used                  TEXT
context_event_seq_start     BIGINT           -- sequence_num range used for context
context_event_seq_end       BIGINT
created_at                  TIMESTAMPTZ DEFAULT now()
```

**Design notes**:
- Append-only. No updates to past responses.
- `summary_text` is always populated — no empty summaries.
- `full_reasoning` is stored separately and retrieved only on "See More" request.
- `context_event_seq_start/end` records which portion of the event log was used to build this response's context.

---

### `detail_view_results`
```sql
id                      UUID PRIMARY KEY DEFAULT gen_random_uuid()
project_id              UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE
triggering_snapshot_id  UUID REFERENCES canvas_snapshots(id) ON DELETE SET NULL
result_type             TEXT NOT NULL DEFAULT 'image'   -- image | structured_data
storage_key             TEXT                            -- object storage path for image result
storage_url             TEXT
result_json             JSONB                           -- for structured_data type
user_prompt             TEXT                            -- optional context at trigger time
status                  TEXT NOT NULL DEFAULT 'pending' -- pending | completed | failed
error_message           TEXT                            -- set on failure
created_at              TIMESTAMPTZ DEFAULT now()
completed_at            TIMESTAMPTZ
```

**Design notes**:
- No row created until user explicitly triggers Detail View. This enforces the optional/on-demand rule at the data layer.
- Multiple results per project are allowed and versioned by `created_at`.
- Treated as an asset: stored in object storage, referenced by metadata here.

---

### `export_records`
```sql
id                      UUID PRIMARY KEY DEFAULT gen_random_uuid()
project_id              UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE
status                  TEXT NOT NULL DEFAULT 'pending' -- pending | building | completed | failed
storage_key             TEXT                            -- ZIP file in object storage
download_url            TEXT                            -- presigned download URL
included_snapshot_id    UUID REFERENCES canvas_snapshots(id) ON DELETE SET NULL
export_manifest         JSONB                           -- what was included
error_message           TEXT
created_at              TIMESTAMPTZ DEFAULT now()
completed_at            TIMESTAMPTZ
expires_at              TIMESTAMPTZ                     -- download URL expiry
```

---

### `project_events`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE
user_id         UUID REFERENCES users(id) ON DELETE SET NULL
event_type      TEXT NOT NULL
payload         JSONB NOT NULL DEFAULT '{}'
sequence_num    BIGINT NOT NULL               -- monotonically increasing per project
created_at      TIMESTAMPTZ DEFAULT now()

UNIQUE (project_id, sequence_num)
```

**Append-only constraint**: Application code must never UPDATE or DELETE rows in this table.

**Event type vocabulary** (partial, extensible):

| Category | event_type |
|---|---|
| Project | `project.created`, `project.title.set`, `project.title.auto_generated`, `project.archived` |
| Agent | `agent.added`, `agent.role.updated`, `agent.deactivated` |
| Canvas | `canvas.element.added`, `canvas.element.moved`, `canvas.element.deleted`, `canvas.snapshot.saved` |
| Asset | `asset.uploaded`, `asset.placed_on_canvas` |
| AI | `agent.query.sent`, `agent.response.received` |
| Detail View | `detail_view.triggered`, `detail_view.completed` |
| Export | `export.initiated`, `export.completed` |

**Example payload shapes**:
```json
// canvas.element.added
{ "element_id": "uuid", "element_type": "stroke", "tool": "pen", "color": "#000" }

// agent.query.sent
{ "agent_ids": ["uuid1", "uuid2"], "query": "what structure does this suggest?" }

// asset.uploaded
{ "asset_id": "uuid", "filename": "reference.jpg", "mime_type": "image/jpeg", "file_size_bytes": 204800 }

// export.initiated
{ "export_id": "uuid", "include_history": true }
```

---

## 3. Versioning and Snapshot Strategy

| What | Strategy | Retention |
|---|---|---|
| Canvas state | Full JSONB snapshot | Keep last 20 auto + all manual + all pre_export |
| Canvas elements | Soft delete (`deleted_at`) | Never hard-deleted in MVP |
| Event log | Append-only, immutable | Never pruned in MVP |
| Agent responses | Append-only | Retained indefinitely |
| Detail View results | Stored as assets | Retained; user can review history |
| Export records | Job record + presigned URL | URL expires; record retained |

---

## 4. Key Indexes

```sql
-- Fast canvas element queries
CREATE INDEX idx_canvas_elements_project ON canvas_elements(project_id)
  WHERE deleted_at IS NULL;

-- Event log ordered reads (critical for AI context builder)
CREATE INDEX idx_project_events_project_seq ON project_events(project_id, sequence_num);

-- Agent response history
CREATE INDEX idx_agent_responses_project_time ON agent_responses(project_id, created_at DESC);

-- Snapshot history
CREATE INDEX idx_canvas_snapshots_project_num ON canvas_snapshots(project_id, snapshot_num DESC);

-- Asset lookups
CREATE INDEX idx_uploaded_assets_project ON uploaded_assets(project_id);
```

---

## 5. Migration Strategy

- Alembic for all schema migrations; no manual SQL in production
- Each migration: forward + rollback script required
- JSONB schema changes: additive only in MVP (no field renames mid-flight)
- `canvas_elements.element_data` schema versioned via `element_data.schema_version` field (added lazily)
