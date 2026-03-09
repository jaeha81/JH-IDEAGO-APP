// API service: Agents
// MOCK → REAL: flip USE_MOCK = false.

import { api } from "@/lib/api";
import { authHeaders } from "@/lib/services/auth";
import { MOCK_PROJECT_DETAIL } from "@/lib/mock/projects";
import type { Agent, ApiResponse } from "@/types";

const USE_MOCK = true;

export async function listAgents(projectId: string): Promise<Agent[]> {
  if (USE_MOCK) {
    await delay(150);
    return MOCK_PROJECT_DETAIL.agents;
  }
  const res = await api.get<ApiResponse<Agent[]>>(`/projects/${projectId}/agents`, {
    headers: authHeaders(),
  });
  return res.data;
}

export interface CreateAgentInput {
  role_label: string;
  display_order: number;
}

export async function createAgent(
  projectId: string,
  input: CreateAgentInput,
): Promise<Agent> {
  if (USE_MOCK) {
    await delay(200);
    return {
      agent_id: "agent-" + Date.now(),
      role_label: input.role_label,
      display_order: input.display_order,
      is_active: true,
    };
  }
  const res = await api.post<ApiResponse<Agent>>(
    `/projects/${projectId}/agents`,
    input,
    { headers: authHeaders() },
  );
  return res.data;
}

export interface UpdateAgentInput {
  role_label?: string;
  display_order?: number;
  is_active?: boolean;
}

export async function updateAgent(
  projectId: string,
  agentId: string,
  input: UpdateAgentInput,
): Promise<Agent> {
  if (USE_MOCK) {
    await delay(150);
    const base = MOCK_PROJECT_DETAIL.agents.find((a) => a.agent_id === agentId);
    return { ...(base ?? MOCK_PROJECT_DETAIL.agents[0]), ...input };
  }
  const res = await api.patch<ApiResponse<Agent>>(
    `/projects/${projectId}/agents/${agentId}`,
    input,
    { headers: authHeaders() },
  );
  return res.data;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
