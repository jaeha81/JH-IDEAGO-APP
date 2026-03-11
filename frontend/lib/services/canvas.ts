// API service: Canvas
// Canvas save is a full-state PUT (not partial) — always send the complete CanvasState.

import { api } from "@/lib/api";
import type { ApiResponse, CanvasState, CanvasSnapshot } from "@/types";

const USE_MOCK = false;

export async function getLatestCanvas(projectId: string): Promise<CanvasSnapshot | null> {
  if (USE_MOCK) {
    await delay(250);
    return null;
  }
  const res = await api.get<ApiResponse<CanvasSnapshot | null>>(
    `/projects/${projectId}/canvas`,
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
      snapshot_num: 1,
      trigger: input.trigger ?? "manual",
      saved_at: new Date().toISOString(),
    };
  }
  // Backend uses PUT (full-state replace, not partial patch)
  const res = await api.put<ApiResponse<SaveCanvasResult>>(
    `/projects/${projectId}/canvas`,
    { state_json: input.state_json, trigger: input.trigger ?? "manual" },
  );
  return res.data;
}

export async function listSnapshots(
  projectId: string,
  limit = 20,
): Promise<CanvasSnapshot[]> {
  if (USE_MOCK) {
    await delay(200);
    return [];
  }
  const res = await api.get<ApiResponse<CanvasSnapshot[]>>(
    `/projects/${projectId}/canvas/snapshots?limit=${limit}`,
  );
  return res.data;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
