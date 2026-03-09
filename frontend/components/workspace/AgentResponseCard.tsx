"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import type { AgentResponse, AgentFullReasoning } from "@/types";
import { getFullReasoning } from "@/lib/services/ai";

interface AgentResponseCardProps {
  response: AgentResponse;
  projectId: string;
  isExpanded: boolean;
  onToggleExpand: (responseId: string) => void;
}

export function AgentResponseCard({
  response,
  projectId,
  isExpanded,
  onToggleExpand,
}: AgentResponseCardProps) {
  const [fullReasoning, setFullReasoning] = useState<AgentFullReasoning | null>(null);
  const [isLoadingFull, setIsLoadingFull] = useState(false);

  const handleSeeMore = async () => {
    if (!isExpanded) {
      // Expand: load full reasoning if not already loaded
      if (!fullReasoning && response.has_full_reasoning) {
        setIsLoadingFull(true);
        try {
          const data = await getFullReasoning(projectId, response.query_id, response.agent_id);
          setFullReasoning(data);
        } catch (err) {
          console.error("Failed to load full reasoning", err);
        } finally {
          setIsLoadingFull(false);
        }
      }
    }
    onToggleExpand(response.response_id);
  };

  return (
    <div className="rounded-2xl bg-surface-raised border border-border overflow-hidden">
      {/* Agent label */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
        <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
          {response.agent_role_label}
        </span>
        <span className="text-[10px] text-text-muted">
          {new Date(response.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>

      {/* Summary — always visible (summary-first principle) */}
      <div className="px-4 py-3">
        <p className="text-sm text-white leading-relaxed">{response.summary_text}</p>
      </div>

      {/* Full reasoning — lazy loaded on "See More" */}
      {isExpanded && (
        <div className="px-4 pb-4">
          <hr className="border-border mb-3" />
          {isLoadingFull ? (
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <Spinner size="sm" />
              <span>Loading full reasoning…</span>
            </div>
          ) : fullReasoning ? (
            <div className="space-y-2">
              <p className="section-label">Full Reasoning</p>
              <div className="text-sm text-text-secondary whitespace-pre-wrap leading-relaxed font-mono text-[12px]">
                {fullReasoning.full_reasoning}
              </div>
              {fullReasoning.token_count && (
                <p className="text-[10px] text-text-muted mt-2">
                  {fullReasoning.token_count} tokens · {fullReasoning.model_used ?? "unknown model"}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-text-muted">Could not load full reasoning.</p>
          )}
        </div>
      )}

      {/* See More / See Less toggle */}
      {response.has_full_reasoning && (
        <div className="px-4 pb-3">
          <button
            onClick={handleSeeMore}
            className="text-[11px] text-text-secondary hover:text-white underline underline-offset-2 transition-colors"
          >
            {isExpanded ? "See less" : "See more"}
          </button>
        </div>
      )}
    </div>
  );
}
