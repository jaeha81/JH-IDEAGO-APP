// API service: Detail View
// MOCK → REAL: flip USE_MOCK = false.
// Detail View is ON-DEMAND ONLY — never auto-generated or auto-displayed.
// Status polling: call getDetailView() until status === "completed" | "failed".

import { api } from "@/lib/api";
import { authHeaders } from "@/lib/services/auth";
import { MOCK_DETAIL_VIEW_RESULT } from "@/lib/mock/workspace";
import type { ApiResponse, DetailViewResult } from "@/types";

const USE_MOCK = true;

export interface TriggerDetailViewInput {
  user_prompt?: string;
}

export async function triggerDetailView(
  projectId: string,
  input: TriggerDetailViewInput = {},
): Promise<DetailViewResult> {
  if (USE_MOCK) {
    await delay(400);
    return {
      result_id: "detail-" + Date.now(),
      result_type: "image",
      status: "pending", // stays pending until Celery worker is wired (Step 10)
      storage_url: null,
      user_prompt: input.user_prompt ?? null,
      error_message: null,
      created_at: new Date().toISOString(),
      completed_at: null,
    };
  }
  const res = await api.post<ApiResponse<DetailViewResult>>(
    `/projects/${projectId}/detail-view`,
    input,
    { headers: authHeaders() },
  );
  return res.data;
}

export async function getDetailView(
  projectId: string,
  resultId: string,
): Promise<DetailViewResult> {
  if (USE_MOCK) {
    await delay(200);
    return { ...MOCK_DETAIL_VIEW_RESULT, result_id: resultId };
  }
  const res = await api.get<ApiResponse<DetailViewResult>>(
    `/projects/${projectId}/detail-view/${resultId}`,
    { headers: authHeaders() },
  );
  return res.data;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
