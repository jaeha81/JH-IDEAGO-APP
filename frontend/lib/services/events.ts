import { api } from "@/lib/api";
import type { ApiResponse, ProjectEvent } from "@/types";

export async function listEvents(
  projectId: string,
  page = 1,
  perPage = 100,
): Promise<{ events: ProjectEvent[]; total: number }> {
  const res = await api.get<ApiResponse<ProjectEvent[]>>(
    `/projects/${projectId}/events?page=${page}&per_page=${perPage}`,
  );
  return {
    events: res.data,
    total: res.meta?.total ?? res.data.length,
  };
}
