// Core domain types — aligned with backend API contracts (Step 8 schema)
// All field names mirror the backend response shapes exactly.
// When swapping mock → real API, these types should require no changes.

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface AuthUser {
  user_id: string;
  email: string;
  display_name: string | null;
}

export interface TokenPair {
  access_token: string;
  token_type: "bearer";
}

// ─── Projects ─────────────────────────────────────────────────────────────────

export interface Project {
  project_id: string;
  title: string | null;        // nullable — valid to create without title
  auto_title: boolean;
  status: "active" | "archived";
  purpose_note: string | null;
  created_at: string;          // ISO 8601
  updated_at: string;
  agents: Agent[];
  canvas_last_saved: string | null;
  export_count: number;
}

export interface ProjectSummary {
  project_id: string;
  title: string | null;
  status: "active" | "archived";
  created_at: string;
  updated_at: string;
  agent_count: number;
}

// ─── Agents ───────────────────────────────────────────────────────────────────

export interface Agent {
  agent_id: string;
  role_label: string;          // free text — no enum, user-defined
  display_order: number;
  is_active: boolean;
}

// ─── AI / Agent Responses ─────────────────────────────────────────────────────

export interface AgentQueryResponse {
  query_id: string;            // groups all agent responses from one query
  responses: AgentResponse[];
}

export interface AgentResponse {
  response_id: string;
  query_id: string;            // same query_id for all agents in one call
  agent_id: string;
  agent_role_label: string;
  user_query: string;
  summary_text: string;        // always displayed — summary-first principle
  has_full_reasoning: boolean; // "See More" available if true
  created_at: string;
}

export interface AgentFullReasoning {
  response_id: string;
  query_id: string;
  agent_id: string;
  agent_role_label: string;
  summary_text: string;
  full_reasoning: string;
  token_count: number | null;
  model_used: string | null;
  created_at: string;
}

// ─── Canvas ───────────────────────────────────────────────────────────────────

// Stroke element data
export interface StrokeData {
  points: [number, number][];
  color: string;
  width: number;
  opacity: number;
  tool: "pen" | "brush";
}

// Text element data
export interface TextData {
  content: string;
  font_size: number;
  font_family: string;
  color: string;
}

// Shape element data
export interface ShapeData {
  shape_type: "rect" | "circle" | "arrow" | "line";
  width: number;
  height: number;
  fill: string;
  stroke_color: string;
  stroke_width: number;
}

// Image overlay annotation
export interface AnnotationArrow {
  type: "arrow";
  from: [number, number];
  to: [number, number];
}

export interface AnnotationNote {
  type: "note";
  position: [number, number];
  text: string;
}

export type Annotation = AnnotationArrow | AnnotationNote;

// Image overlay element data
export interface ImageOverlayData {
  asset_id: string;
  width: number;
  height: number;
  rotation: number;
  annotations: Annotation[];
}

export type CanvasElementType = "stroke" | "text" | "shape" | "image_overlay";
export type CanvasElementData = StrokeData | TextData | ShapeData | ImageOverlayData;

export interface CanvasElement {
  id: string;
  type: CanvasElementType;
  data: CanvasElementData;
  z_index: number;
  position_x: number;
  position_y: number;
}

export interface CanvasState {
  version: 1;
  width: number;
  height: number;
  background: string;
  elements: CanvasElement[];
}

export interface CanvasSnapshot {
  snapshot_id: string;
  snapshot_num: number;
  state_json: CanvasState;
  trigger: "auto" | "manual" | "pre_export";
  created_at: string;
}

// ─── Assets ───────────────────────────────────────────────────────────────────

export interface UploadedAsset {
  asset_id: string;
  original_name: string;
  mime_type: string;
  storage_url: string;         // presigned — expires
  thumbnail_url: string | null;
  file_size_bytes: number;
  uploaded_at: string;
}

// ─── Detail View ──────────────────────────────────────────────────────────────

export interface DetailViewResult {
  result_id: string;
  result_type: "image";
  status: "pending" | "completed" | "failed";
  storage_url: string | null;  // null while pending
  user_prompt: string | null;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
}

// ─── Export ───────────────────────────────────────────────────────────────────

export interface ExportRecord {
  export_id: string;
  status: "pending" | "building" | "completed" | "failed";
  download_url: string | null; // presigned — 24h expiry
  created_at: string;
  completed_at: string | null;
  expires_at: string | null;
  manifest: ExportManifest | null;
  error_message: string | null;
}

export interface ExportManifest {
  schema_version: "1.0";
  export_id: string;
  project_id: string;
  project_title: string;
  exported_at: string;
  exported_by: string;
  canvas_snapshot_num: number;
  included: {
    project_summary: boolean;
    agents: boolean;
    canvas_data: boolean;
    history: boolean;
    instructions: boolean;
    uploads: string[];
    visualization: string[];
    canvas_renders: boolean;
  };
  agent_count: number;
  event_count: number;
  upload_count: number;
  detail_view_count: number;
}

// ─── Events ───────────────────────────────────────────────────────────────────

export interface ProjectEvent {
  event_id: string;
  project_id: string;
  user_id: string | null;
  event_type: string;          // namespace.action — e.g. "canvas.snapshot.saved"
  payload: Record<string, unknown>;
  sequence_num: number;
  created_at: string;
}

// ─── API Envelope ─────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  error?: string;
  meta?: {
    total: number;
    page: number;
    per_page: number;
  };
}

// ─── UI-only types ────────────────────────────────────────────────────────────
// These types are used only in the frontend and have no backend equivalent.

export type DrawingTool =
  | "select"
  | "pen"
  | "brush"
  | "eraser"
  | "text"
  | "rect"
  | "circle"
  | "arrow"
  | "line"
  | "move"
  | "zoom_in"
  | "zoom_out";

export interface ToolbarState {
  activeTool: DrawingTool;
  activeColor: string;
  strokeWidth: number;
  zoom: number;
}

export interface AgentPanelState {
  isOpen: boolean;
  queryInput: string;
  isQuerying: boolean;
  expandedResponseId: string | null; // which response has full reasoning shown
}
