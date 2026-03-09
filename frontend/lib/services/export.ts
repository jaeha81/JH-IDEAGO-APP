// API service: Export
// MOCK → REAL: flip USE_MOCK = false.
// Export is a structured handoff package, NOT a simple file download.
// Status polling: call getExport() every ~3s until status === "completed" | "failed".

import { api } from "@/lib/api";
import { authHeaders } from "@/lib/services/auth";
import { MOCK_EXPORT_RECORDS } from "@/lib/mock/export";
import type { ApiResponse, ExportRecord } from "@/types";

const USE_MOCK = true;

export interface InitiateExportInput {
  include_history?: boolean;
  include_detail_views?: boolean;
  notes?: string;
}

export async function initiateExport(
  projectId: string,
  input: InitiateExportInput = {},
): Promise<ExportRecord> {
  if (USE_MOCK) {
    await delay(400);
    return {
      export_id: "export-" + Date.now(),
      status: "pending",
      download_url: null,
      created_at: new Date().toISOString(),
      completed_at: null,
      expires_at: null,
      manifest: null,
      error_message: null,
    };
  }
  const res = await api.post<ApiResponse<ExportRecord>>(
    `/projects/${projectId}/exports`,
    input,
    { headers: authHeaders() },
  );
  return res.data;
}

export async function getExport(
  projectId: string,
  exportId: string,
): Promise<ExportRecord> {
  if (USE_MOCK) {
    await delay(200);
    const found = MOCK_EXPORT_RECORDS.find((e) => e.export_id === exportId);
    return found ?? MOCK_EXPORT_RECORDS[0];
  }
  const res = await api.get<ApiResponse<ExportRecord>>(
    `/projects/${projectId}/exports/${exportId}`,
    { headers: authHeaders() },
  );
  return res.data;
}

export async function listExports(projectId: string): Promise<ExportRecord[]> {
  if (USE_MOCK) {
    await delay(200);
    return MOCK_EXPORT_RECORDS;
  }
  const res = await api.get<ApiResponse<ExportRecord[]>>(
    `/projects/${projectId}/exports`,
    { headers: authHeaders() },
  );
  return res.data;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
