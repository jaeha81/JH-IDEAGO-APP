// API service: Projects
// MOCK → REAL: flip USE_MOCK = false. All function signatures stay the same.

import { api } from "@/lib/api";
import { authHeaders } from "@/lib/services/auth";
import { MOCK_PROJECTS, MOCK_PROJECT_DETAIL } from "@/lib/mock/projects";
import type { ApiResponse, Project, ProjectSummary } from "@/types";

const USE_MOCK = true;

export async function listProjects(): Promise<ProjectSummary[]> {
  if (USE_MOCK) {
    await delay(300);
    return MOCK_PROJECTS;
  }
  const res = await api.get<ApiResponse<ProjectSummary[]>>("/projects", {
    headers: authHeaders(),
  });
  return res.data;
}

export async function getProject(projectId: string): Promise<Project> {
  if (USE_MOCK) {
    await delay(200);
    return { ...MOCK_PROJECT_DETAIL, project_id: projectId };
  }
  const res = await api.get<ApiResponse<Project>>(`/projects/${projectId}`, {
    headers: authHeaders(),
  });
  return res.data;
}

export interface CreateProjectInput {
  title?: string;
  purpose_note?: string;
  agents: { role_label: string; display_order: number }[];
}

export async function createProject(input: CreateProjectInput): Promise<Project> {
  if (USE_MOCK) {
    await delay(400);
    const newId = "proj-" + Date.now();
    return {
      project_id: newId,
      title: input.title ?? null,
      auto_title: !input.title,
      status: "active",
      purpose_note: input.purpose_note ?? null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      agents: input.agents.map((a, i) => ({
        agent_id: `agent-${newId}-${i}`,
        role_label: a.role_label,
        display_order: a.display_order,
        is_active: true,
      })),
      canvas_last_saved: null,
      export_count: 0,
    };
  }
  const res = await api.post<ApiResponse<Project>>("/projects", input, {
    headers: authHeaders(),
  });
  return res.data;
}

export interface UpdateProjectInput {
  title?: string | null;
  purpose_note?: string | null;
  status?: "active" | "archived";
}

export async function updateProject(
  projectId: string,
  input: UpdateProjectInput,
): Promise<Project> {
  if (USE_MOCK) {
    await delay(200);
    return { ...MOCK_PROJECT_DETAIL, ...input, project_id: projectId };
  }
  const res = await api.patch<ApiResponse<Project>>(`/projects/${projectId}`, input, {
    headers: authHeaders(),
  });
  return res.data;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
