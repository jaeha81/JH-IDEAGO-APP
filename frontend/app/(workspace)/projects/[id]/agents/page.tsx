"use client";

// Agents page — /projects/[id]/agents
// Full management: list, add, toggle active, remove agents.
// Full response history paginated.
// Inline query input (same flow as AgentPanel but full-width).

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { Input } from "@/components/ui/Input";
import {
  listAgents,
  createAgent,
  updateAgent,
  deactivateAgent,
} from "@/lib/services/agents";
import { listResponses, queryAgents } from "@/lib/services/ai";
import type { Agent, AgentResponse } from "@/types";

const PER_PAGE = 20;

export default function AgentsPage() {
  const { id: projectId } = useParams<{ id: string }>();

  // ── Agents state ──────────────────────────────────────────────────────────
  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentsLoading, setAgentsLoading] = useState(true);
  const [agentsError, setAgentsError] = useState<string | null>(null);
  const [newRoleLabel, setNewRoleLabel] = useState("");
  const [isAddingAgent, setIsAddingAgent] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // ── Query state ───────────────────────────────────────────────────────────
  const [queryInput, setQueryInput] = useState("");
  const [isQuerying, setIsQuerying] = useState(false);
  const [queryError, setQueryError] = useState<string | null>(null);

  // ── Response history state ────────────────────────────────────────────────
  const [responses, setResponses] = useState<AgentResponse[]>([]);
  const [responsesTotal, setResponsesTotal] = useState(0);
  const [responsesPage, setResponsesPage] = useState(1);
  const [responsesLoading, setResponsesLoading] = useState(true);
  const [responsesError, setResponsesError] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // ── Initial load ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!projectId) return;

    listAgents(projectId)
      .then(setAgents)
      .catch((err) =>
        setAgentsError(
          err instanceof Error ? err.message : "Failed to load agents",
        ),
      )
      .finally(() => setAgentsLoading(false));

    listResponses(projectId, 1, PER_PAGE)
      .then(({ responses: r, total }) => {
        setResponses(r);
        setResponsesTotal(total);
      })
      .catch((err) =>
        setResponsesError(
          err instanceof Error ? err.message : "Failed to load responses",
        ),
      )
      .finally(() => setResponsesLoading(false));
  }, [projectId]);

  // ── Agent actions ─────────────────────────────────────────────────────────
  const handleToggle = async (agent: Agent) => {
    if (!projectId) return;
    try {
      const updated = await updateAgent(projectId, agent.agent_id, {
        is_active: !agent.is_active,
      });
      setAgents((prev) =>
        prev.map((a) => (a.agent_id === updated.agent_id ? updated : a)),
      );
    } catch (err) {
      console.error("Toggle failed:", err);
    }
  };

  const handleRemove = async (agentId: string) => {
    if (!projectId) return;
    try {
      await deactivateAgent(projectId, agentId);
      setAgents((prev) => prev.filter((a) => a.agent_id !== agentId));
    } catch (err) {
      console.error("Remove failed:", err);
    }
  };

  const handleAddAgent = async () => {
    if (!projectId || !newRoleLabel.trim() || isAddingAgent) return;
    setIsAddingAgent(true);
    setAddError(null);
    try {
      const nextOrder =
        agents.length > 0
          ? Math.max(...agents.map((a) => a.display_order)) + 1
          : 1;
      const created = await createAgent(projectId, {
        role_label: newRoleLabel.trim(),
        display_order: nextOrder,
      });
      setAgents((prev) => [...prev, created]);
      setNewRoleLabel("");
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Failed to add agent");
    } finally {
      setIsAddingAgent(false);
    }
  };

  // ── Query action ──────────────────────────────────────────────────────────
  const handleQuery = async () => {
    if (!projectId || !queryInput.trim() || isQuerying) return;
    setIsQuerying(true);
    setQueryError(null);
    const query = queryInput.trim();
    setQueryInput("");
    try {
      const { responses: newResponses } = await queryAgents(projectId, {
        user_query: query,
      });
      setResponses((prev) => [...newResponses, ...prev]);
      setResponsesTotal((t) => t + newResponses.length);
    } catch (err) {
      setQueryError(err instanceof Error ? err.message : "Query failed");
    } finally {
      setIsQuerying(false);
    }
  };

  // ── Load more ─────────────────────────────────────────────────────────────
  const handleLoadMore = async () => {
    if (!projectId || isLoadingMore) return;
    const nextPage = responsesPage + 1;
    setIsLoadingMore(true);
    try {
      const { responses: more } = await listResponses(
        projectId,
        nextPage,
        PER_PAGE,
      );
      setResponses((prev) => [...prev, ...more]);
      setResponsesPage(nextPage);
    } catch {
      // silent — user can retry
    } finally {
      setIsLoadingMore(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-8 py-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <h1 className="text-2xl font-semibold text-white">Agents</h1>

        {/* ── Agent list ────────────────────────────────────────────────── */}
        <Card>
          <p className="section-label mb-3">
            Agent Configuration ({agents.length})
          </p>

          {agentsLoading ? (
            <div className="flex justify-center py-6">
              <Spinner />
            </div>
          ) : agentsError ? (
            <p className="text-danger text-sm">{agentsError}</p>
          ) : agents.length === 0 ? (
            <p className="text-text-muted text-sm py-3">
              No agents yet. Add one below.
            </p>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {agents
                .slice()
                .sort((a, b) => a.display_order - b.display_order)
                .map((agent) => (
                  <li
                    key={agent.agent_id}
                    className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs text-text-muted w-5 text-right shrink-0">
                        {agent.display_order}
                      </span>
                      <span className="text-sm text-white truncate">
                        {agent.role_label}
                      </span>
                      {!agent.is_active && (
                        <Badge variant="default">Inactive</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggle(agent)}
                      >
                        {agent.is_active ? "Deactivate" : "Activate"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemove(agent.agent_id)}
                      >
                        Remove
                      </Button>
                    </div>
                  </li>
                ))}
            </ul>
          )}

          {/* Add agent */}
          <div className="flex gap-3 mt-4 pt-4 border-t border-border">
            <Input
              placeholder="New agent role label…"
              value={newRoleLabel}
              onChange={(e) => setNewRoleLabel(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && !isAddingAgent && handleAddAgent()
              }
              disabled={isAddingAgent}
              className="flex-1"
            />
            <Button
              onClick={handleAddAgent}
              loading={isAddingAgent}
              disabled={!newRoleLabel.trim()}
            >
              Add Agent
            </Button>
          </div>
          {addError && (
            <p className="text-danger text-xs mt-2">{addError}</p>
          )}
        </Card>

        {/* ── Query input ───────────────────────────────────────────────── */}
        <Card>
          <p className="section-label mb-3">Query Agents</p>
          <div className="flex gap-3">
            <Input
              placeholder="Ask your agents anything about this project…"
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && !isQuerying && handleQuery()
              }
              disabled={isQuerying}
              className="flex-1"
            />
            <Button
              onClick={handleQuery}
              loading={isQuerying}
              disabled={!queryInput.trim()}
            >
              Ask
            </Button>
          </div>
          {queryError && (
            <p className="text-danger text-xs mt-2">{queryError}</p>
          )}
          {isQuerying && (
            <p className="text-text-muted text-xs mt-2">
              Querying agents — this may take a moment…
            </p>
          )}
        </Card>

        {/* ── Response history ──────────────────────────────────────────── */}
        <div>
          <p className="section-label mb-3">
            Response History ({responsesTotal})
          </p>

          {responsesLoading ? (
            <div className="flex justify-center py-8">
              <Spinner size="lg" />
            </div>
          ) : responsesError ? (
            <p className="text-danger text-sm">{responsesError}</p>
          ) : responses.length === 0 ? (
            <div className="text-center py-8 text-text-muted text-sm">
              No responses yet. Send a query above to see results here.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {responses.map((r) => (
                <div
                  key={r.response_id}
                  className="px-4 py-3 rounded-xl bg-surface border border-border"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-white uppercase tracking-wider">
                      {r.agent_role_label}
                    </span>
                    <span className="text-xs text-text-muted">
                      {new Date(r.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-text-muted mb-2 leading-relaxed">
                    Q: {r.user_query}
                  </p>
                  <p className="text-sm text-white leading-relaxed">
                    {r.summary_text}
                  </p>
                  {r.has_full_reasoning && (
                    <p className="text-xs text-text-muted mt-2 italic">
                      Full reasoning available — open canvas to expand.
                    </p>
                  )}
                </div>
              ))}

              {responses.length < responsesTotal && (
                <Button
                  variant="ghost"
                  onClick={handleLoadMore}
                  loading={isLoadingMore}
                  className="w-full mt-2"
                >
                  Load More
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
