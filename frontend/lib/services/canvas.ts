// API service: Canvas
// MOCK → REAL: flip USE_MOCK = false.
// Canvas save is a full-state PUT (not partial) — always send the complete CanvasState.

import { api } from "@/lib/api";
import { authHeaders } from "@/lib/services/auth";
import { MOCK_CANVAS_STATE } from "@/lib/mock/workspace";
import type { ApiResponse, CanvasState, CanvasSnapshot } from "@/types";

const USE_MOCK = true;

export async function getLatestCanvas(projectId: string): Promise<CanvasSnapshot | null> {
  if (USE_MOCK) {
    await delay(250);
    return {
      snapshot_id: "snap-001",
      snapshot_num: 12,
      state_json: MOCK_CANVAS_STATE,
      trigger: "manual",
      created_at: "2026-01-15T14:30:00Z",
    };
  }
  const res = await api.get<ApiResponse<CanvasSnapshot | null>>(
    `/projects/${projectId}/canvas`,
    { headers: authHeaders() },
  );
  return res.data;
}

export interface SaveCanvasInput {
  state_json: CanvasState;
  trigger?: "manual" | "auto";
}

export interface SaveCanvasResult {
  snapshot_id: string;
  snapshot_num: number;
  trigger: string;
  saved_at: string;
}

export async function saveCanvas(
  projectId: string,
  input: SaveCanvasInput,
): Promise<SaveCanvasResult> {
  if (USE_MOCK) {
    await delay(300);
    return {
      snapshot_id: "snap-" + Date.now(),
      snapshot_num: 13,
      trigger: input.trigger ?? "manual",
      saved_at: new Date().toISOString(),
    };
  }
  const res = await api.post<ApiResponse<SaveCanvasResult>>(
    `/projects/${projectId}/canvas`,
    { state_json: input.state_json },
    { headers: authHeaders() },
  );
  return res.data;
}

export async function listSnapshots(
  projectId: string,
  limit = 20,
): Promise<CanvasSnapshot[]> {
  if (USE_MOCK) {
    await delay(200);
    return [
      {
        snapshot_id: "snap-001",
        snapshot_num: 12,
        state_json: MOCK_CANVAS_STATE,
        trigger: "manual",
        created_at: "2026-01-15T14:30:00Z",
      },
    ];
  }
  const res = await api.get<ApiResponse<CanvasSnapshot[]>>(
    `/projects/${projectId}/canvas/snapshots?limit=${limit}`,
    { headers: authHeaders() },
  );
  return res.data;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
