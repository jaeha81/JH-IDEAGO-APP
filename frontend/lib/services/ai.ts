// API service: AI / Agent queries
// MOCK → REAL: flip USE_MOCK = false.
// Summary-first principle: summary_text is always displayed first;
//   full_reasoning requires a separate "See More" fetch.

import { api } from "@/lib/api";
import {
  MOCK_AGENT_QUERY_RESPONSE,
  MOCK_FULL_REASONING,
  MOCK_RESPONSE_HISTORY,
} from "@/lib/mock/workspace";
import type {
  ApiResponse,
  AgentQueryResponse,
  AgentFullReasoning,
  AgentResponse,
} from "@/types";

const USE_MOCK = false;

export interface QueryAgentsInput {
  user_query: string;
  context_hint?: string;
}

// POST /projects/{id}/agents/query
// Synchronous in MVP — waits for all agents to respond.
export async function queryAgents(
  projectId: string,
  input: QueryAgentsInput,
): Promise<AgentQueryResponse> {
  if (USE_MOCK) {
    await delay(1800); // simulate LLM latency
    return {
      ...MOCK_AGENT_QUERY_RESPONSE,
      responses: MOCK_AGENT_QUERY_RESPONSE.responses.map((r) => ({
        ...r,
        user_query: input.user_query,
        created_at: new Date().toISOString(),
      })),
    };
  }
  const res = await api.post<ApiResponse<AgentQueryResponse>>(
    `/projects/${projectId}/agents/query`,
    input,
  );
  return res.data;
}

// GET /projects/{id}/agents/responses/{query_id}/{agent_id}/full
// Fetches full_reasoning for a single response — shown on "See More" click.
export async function getFullReasoning(
  projectId: string,
  queryId: string,
  agentId: string,
): Promise<AgentFullReasoning> {
  if (USE_MOCK) {
    await delay(300);
    return { ...MOCK_FULL_REASONING, query_id: queryId, agent_id: agentId };
  }
  const res = await api.get<ApiResponse<AgentFullReasoning>>(
    `/projects/${projectId}/agents/responses/${queryId}/${agentId}/full`,
  );
  return res.data;
}

// GET /projects/{id}/agents/responses
// Lists paginated agent response history for a project.
export async function listResponses(
  projectId: string,
  page = 1,
  perPage = 20,
): Promise<{ responses: AgentResponse[]; total: number }> {
  if (USE_MOCK) {
    await delay(200);
    return { responses: MOCK_RESPONSE_HISTORY, total: MOCK_RESPONSE_HISTORY.length };
  }
  const res = await api.get<ApiResponse<AgentResponse[]>>(
    `/projects/${projectId}/agents/responses?page=${page}&per_page=${perPage}`,
  );
  return {
    responses: res.data,
    total: res.meta?.total ?? res.data.length,
  };
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
