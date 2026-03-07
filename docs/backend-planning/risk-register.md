# Risk Register — IDEAGO (MultiGenius)

## Risk Severity Scale
- **HIGH**: Can block launch or cause data loss
- **MEDIUM**: Degrades experience or increases cost significantly
- **LOW**: Manageable; monitor and address in later phase

---

## 1. Technical Risks

### R-01 | Canvas State Sync Conflicts
**Severity**: HIGH

**Description**: The client holds a canvas state in memory and sends full-state PUTs on save. If a user has the project open on two devices simultaneously (or a tab crashes mid-save), the server may overwrite a more recent state with an older one.

**Affected**: `PUT /projects/:id/canvas`, `canvas_snapshots` table

**Mitigation**:
- Include `last_known_snapshot_num` in PUT body; server rejects if server has a higher snapshot_num
- Snapshot before overwrite; never delete previous snapshots
- Display a conflict warning in UI (frontend concern, but backend must return conflict error)
- Multi-device real-time sync is deferred to LATER — MVP assumes single active session

**Status**: No mitigation implemented in MVP. Must be documented as known limitation.

---

### R-02 | Object Storage Availability
**Severity**: HIGH

**Description**: All uploaded files, export ZIPs, and Detail View outputs depend on object storage. If storage is unavailable, uploads fail and exports cannot be generated.

**Affected**: Upload endpoint, Export Engine, Detail View

**Mitigation**:
- Use S3-compatible storage with multi-AZ redundancy in production
- Implement upload retry with exponential backoff (3 attempts)
- Export jobs: if storage write fails, mark export as `failed` with `error_message`
- Do not cache presigned URLs beyond their expiry — always refresh

---

### R-03 | Large Canvas State Size
**Severity**: MEDIUM

**Description**: A canvas with hundreds of strokes, large stroke point arrays, and multiple images can produce a `state_json` JSONB document exceeding several MB. This impacts save latency, snapshot storage costs, and export generation time.

**Affected**: `canvas_snapshots.state_json`, export `canvas-data.json`

**Mitigation**:
- Set client-side stroke point reduction (simplify point arrays before sending)
- Set server-side JSONB size limit per save: reject if > 10MB with clear error
- Auto-snapshot pruning: keep last 20 auto + all manual; delete older autos
- In export, warn in manifest if canvas data exceeds 5MB

---

### R-04 | PostgreSQL JSONB Query Performance at Scale
**Severity**: LOW (MVP), MEDIUM (scale)

**Description**: Querying inside `canvas_elements.element_data` JSONB will be slow at scale without targeted GIN indexes.

**Mitigation**:
- Add GIN index on `element_data` only if specific queries require it (do not pre-optimize)
- Primary queries use relational columns (`element_type`, `project_id`, `z_index`)
- At scale: consider migrating hot-path canvas queries to a dedicated canvas microservice

---

## 2. Product-Architecture Conflicts

### R-05 | Detail View Scope Creep
**Severity**: MEDIUM

**Description**: "Detail View" is deliberately vague in the product spec — it could mean: AI image refinement, 3D preview, structured output, comparison mode. Each interpretation requires a different backend implementation. Building too broadly now wastes resources; building too narrowly blocks future expansion.

**Current decision**: MVP Detail View = AI-generated image output from canvas snapshot + optional user prompt.

**Risk**: If product direction shifts to 3D preview or structured data output, the `detail_view_results` schema and generation pipeline both change significantly.

**Mitigation**:
- `result_type` field in schema supports `image` and `structured_data` (extensible)
- Detail View generation is isolated in its own module — swap implementation without touching other modules
- Do not hard-code the generation method in the export engine — reference by `result_type`

---

### R-06 | Visualization Logic Ownership Ambiguity
**Severity**: MEDIUM

**Description**: The product spec states: "The core visualization logic belongs to the platform itself, not only to AI agents." This is a strong product principle but creates architectural ambiguity — what exactly is platform-level visualization vs AI-generated output?

**Risk**: If all visualization is routed through the AI module, the platform becomes fully AI-dependent. If platform-level visualization is built separately, it increases implementation scope significantly.

**Current interpretation**:
- Platform-level visualization = canvas rendering, element layout, structural summary of canvas content
- AI-level visualization = Detail View image generation, agent guidance on visual structure
- These are separate modules that do not depend on each other

**Mitigation**: Document this boundary explicitly. Revisit at LATER phase when visualization requirements are clearer.

---

### R-07 | Agent Role Label as Sole Behavior Differentiator
**Severity**: MEDIUM

**Description**: Agent behavior is entirely determined by `role_label` (free text). There is no other configuration — no temperature, no model selection per agent, no system prompt injection beyond the role. This keeps the system simple but limits behavioral differentiation between agents.

**Risk**: If users set vague role labels (e.g., "Agent 1"), all agents produce nearly identical output. The feature loses value without user effort.

**Mitigation**:
- Prompt engineering: the system prompt explicitly instructs the agent to interpret and embody the role
- No backend fix for vague user input — this is a UX problem (onboarding hints)
- Do not add per-agent system prompt configuration in MVP — increases complexity and attack surface

---

## 3. Token and Cost Risks

### R-08 | Unbounded LLM API Costs
**Severity**: HIGH

**Description**: Each agent query = N LLM API calls. A project with 5 agents + high query frequency = very high token spend. No rate limiting is implemented in MVP.

**Risk**: A single user can trigger hundreds of dollars in API costs without controls.

**Mitigation (MVP)**:
- Log every call: `agent_responses.token_count`, `agent_responses.model_used`
- Set hard per-query token limits (max 2000 output tokens per agent)
- Allow user to select which agents respond per query (already in API contract)
- Rate limiting: **must be implemented before public launch** even if not in initial MVP — flagged as pre-launch blocker

**Pre-launch requirement**: Implement per-user daily token budget or per-project query limits before public access.

---

### R-09 | Context Window Overflow
**Severity**: MEDIUM

**Description**: The compressed context strategy may still produce contexts that exceed model limits for projects with extensive history and long purpose notes.

**Mitigation**:
- Hard cap on context construction: if compressed context exceeds 2000 tokens, truncate event summary first, then prior response summaries
- Log context token count per query for monitoring
- Never truncate the user's query or the role label

---

### R-10 | Auto-Title Triggering Unexpected Costs
**Severity**: LOW

**Description**: Auto-title generation is one LLM call per trigger. If the frontend calls it frequently (e.g., on every keystroke delay), costs accumulate.

**Mitigation**:
- Auto-title endpoint is rate-limited to once per 30 seconds per project
- Frontend should not auto-trigger — only on explicit user action

---

## 4. Mobile and Tablet Compatibility Risks

### R-11 | Large File Upload on Mobile
**Severity**: MEDIUM

**Description**: Mobile browsers have unreliable behavior for large file uploads (network interruptions, memory limits). A 10MB image upload that fails mid-stream results in a bad UX.

**Affected**: `POST /assets`

**Mitigation**:
- Server accepts multipart upload; returns clear error on failure (no partial asset records)
- Set max file size: 20MB MVP (configurable)
- **Do not implement resumable chunked upload in MVP** — document as known limitation
- Frontend should validate file size client-side before upload attempt

---

### R-12 | Canvas State Size on Low-Memory Mobile Devices
**Severity**: MEDIUM

**Description**: The canvas JSONB state sent from mobile client may be large. Parsing and sending large JSON payloads on low-memory devices can cause browser crashes or OOM errors.

**Affected**: `PUT /canvas` (client-side mostly; server must handle gracefully)

**Mitigation**:
- Server: reject payload > 10MB with 413 response
- Frontend: implement stroke point simplification before serialization
- Canvas auto-save frequency should be reduced on mobile (frontend concern)

---

### R-13 | API Contract Device-Layout Dependency
**Severity**: LOW

**Description**: If the API contracts inadvertently encode layout assumptions (e.g., "returns data for the left panel"), responsive layout changes require API changes.

**Current status**: API contracts are explicitly UI-agnostic (see api-contracts.md section 12). All layout decisions are frontend responsibilities.

**Mitigation**: Continue enforcing UI-agnostic contract discipline in all future API additions.

---

## 5. Privacy and Security Risks

### R-14 | Uploaded File Access Control
**Severity**: HIGH

**Description**: User-uploaded files (potentially sensitive: floor plans, personal sketches, confidential documents) must be accessible only to the project owner.

**Mitigation**:
- All file access via presigned URLs with 1-hour expiry (no permanent public URLs)
- Storage key format includes `project_id` — server validates project ownership before generating presigned URL
- No direct public bucket access
- Cross-project asset sharing: explicitly blocked at API layer in MVP

---

### R-15 | LLM Data Transmission
**Severity**: MEDIUM

**Description**: User canvas content (element summaries, notes, purpose notes, queries) is sent to the Anthropic Claude API. Users may include sensitive information in their canvas or queries.

**Mitigation**:
- Document in privacy policy / terms of service that AI features send data to third-party LLM provider
- Do not send raw uploaded file content to LLM (only descriptions)
- Do not send user PII beyond what is in the canvas/query text
- Use Anthropic's API with data processing agreements in production

---

### R-16 | Export Package Exposure
**Severity**: MEDIUM

**Description**: Export ZIPs contain all project data including uploaded files. If a presigned URL leaks, the entire project data is accessible.

**Mitigation**:
- Presigned URL expiry: 24 hours (configurable, default)
- Export storage key includes `export_id` (UUID) — not guessable
- No export listing endpoint that exposes download URLs to non-owners
- Consider adding optional password protection to export ZIP in LATER phase

---

### R-17 | JWT Token Theft
**Severity**: MEDIUM

**Description**: Stateless JWT tokens cannot be revoked before expiry.

**Mitigation**:
- Short access token expiry: 1 hour
- Refresh token mechanism: LATER phase
- HTTPS enforced on all endpoints
- Token does not contain sensitive user data beyond `user_id`

---

## 6. Summary Table

| ID | Risk | Severity | MVP Mitigation | Pre-launch Blocker? |
|---|---|---|---|---|
| R-01 | Canvas sync conflict | HIGH | Document as limitation | No (single session assumed) |
| R-02 | Object storage unavailability | HIGH | Retry + error handling | No |
| R-03 | Large canvas state size | MEDIUM | Size limit + pruning | No |
| R-04 | JSONB query performance | LOW | Index on demand | No |
| R-05 | Detail View scope creep | MEDIUM | Extensible schema | No |
| R-06 | Visualization ownership | MEDIUM | Document boundary | No |
| R-07 | Vague agent role labels | MEDIUM | UX/onboarding | No |
| R-08 | Unbounded LLM costs | HIGH | Logging + token limits | **YES** |
| R-09 | Context overflow | MEDIUM | Hard truncation cap | No |
| R-10 | Auto-title cost | LOW | Rate limiting | No |
| R-11 | Mobile file upload | MEDIUM | Size limit + client validation | No |
| R-12 | Mobile canvas size | MEDIUM | Server size limit | No |
| R-13 | API layout coupling | LOW | UI-agnostic contract discipline | No |
| R-14 | File access control | HIGH | Presigned URLs + ownership check | **YES** |
| R-15 | LLM data transmission | MEDIUM | ToS disclosure | **YES** |
| R-16 | Export URL exposure | MEDIUM | Short expiry + UUID key | No |
| R-17 | JWT theft | MEDIUM | Short expiry + HTTPS | No |

**Pre-launch blockers**: R-08 (rate limiting), R-14 (file access control), R-15 (ToS/privacy disclosure)
