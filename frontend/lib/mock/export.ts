// Mock data: export records and manifest.

import type { ExportRecord, ExportManifest } from "@/types";

export const MOCK_EXPORT_RECORDS: ExportRecord[] = [
  {
    export_id: "export-001",
    status: "completed",
    download_url: "#", // presigned URL — placeholder in mock
    created_at: "2026-01-15T14:50:00Z",
    completed_at: "2026-01-15T14:50:45Z",
    expires_at: "2026-01-16T14:50:45Z",
    manifest: {
      schema_version: "1.0",
      export_id: "export-001",
      project_id: "proj-001",
      project_title: "Mobile App Redesign",
      exported_at: "2026-01-15T14:50:45Z",
      exported_by: "designer@example.com",
      canvas_snapshot_num: 12,
      included: {
        project_summary: true,
        agents: true,
        canvas_data: true,
        history: true,
        instructions: true,
        uploads: ["asset-001", "asset-002"],
        visualization: ["detail-001"],
        canvas_renders: false,
      },
      agent_count: 3,
      event_count: 42,
      upload_count: 2,
      detail_view_count: 1,
    },
    error_message: null,
  },
  {
    export_id: "export-002",
    status: "failed",
    download_url: null,
    created_at: "2026-01-12T10:20:00Z",
    completed_at: null,
    expires_at: null,
    manifest: null,
    error_message: "Storage service unavailable during export assembly.",
  },
];

export const MOCK_EXPORT_MANIFEST_PREVIEW: ExportManifest = {
  schema_version: "1.0",
  export_id: "export-new",
  project_id: "proj-001",
  project_title: "Mobile App Redesign",
  exported_at: new Date().toISOString(),
  exported_by: "designer@example.com",
  canvas_snapshot_num: 13,
  included: {
    project_summary: true,
    agents: true,
    canvas_data: true,
    history: true,
    instructions: true,
    uploads: ["asset-001", "asset-002"],
    visualization: [],
    canvas_renders: false,
  },
  agent_count: 3,
  event_count: 47,
  upload_count: 2,
  detail_view_count: 0,
};

// Expected ZIP file contents — shown in export preview panel
export const EXPORT_FILE_TREE = [
  { name: "export-manifest.json", description: "Export metadata and index" },
  { name: "project-summary.md", description: "Project title, purpose, agent config" },
  { name: "agents.md", description: "Agent roles and response history" },
  { name: "canvas-data.json", description: "Full canvas state (JSONB)" },
  { name: "history.json", description: "Append-only project event log" },
  { name: "instructions.md", description: "Handoff notes and usage guide" },
  { name: "uploads/", description: "Original uploaded assets", isFolder: true },
  { name: "visualization/", description: "Detail View results (if requested)", isFolder: true },
];
