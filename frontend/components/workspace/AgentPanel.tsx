"use client";

import { useState, useRef, useEffect } from "react";
import { AgentResponseCard } from "./AgentResponseCard";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import type { AgentResponse, AgentPanelState } from "@/types";
import { queryAgents } from "@/lib/services/ai";

interface AgentPanelProps {
  projectId: string;
  initialResponses?: AgentResponse[];
  isOpen: boolean;
  onClose?: () => void;
}

export function AgentPanel({ projectId, initialResponses = [], isOpen, onClose }: AgentPanelProps) {
  const [state, setState] = useState<AgentPanelState>({
    isOpen,
    queryInput: "",
    isQuerying: false,
    expandedResponseId: null,
  });
  const [responses, setResponses] = useState<AgentResponse[]>(initialResponses);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const responseListRef = useRef<HTMLDivElement>(null);

  // Scroll to latest response when new ones arrive
  useEffect(() => {
    if (responses.length > 0 && responseListRef.current) {
      responseListRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [responses.length]);

  const handleQuery = async () => {
    const query = state.queryInput.trim();
    if (!query || state.isQuerying) return;

    setState((s) => ({ ...s, isQuerying: true }));
    setError(null);

    try {
      const result = await queryAgents(projectId, { user_query: query });
      // Prepend new responses (most recent first)
      setResponses((prev) => [...result.responses, ...prev]);
      setState((s) => ({ ...s, queryInput: "", isQuerying: false }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Query failed");
      setState((s) => ({ ...s, isQuerying: false }));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleQuery();
    }
  };

  const toggleExpand = (responseId: string) => {
    setState((s) => ({
      ...s,
      expandedResponseId: s.expandedResponseId === responseId ? null : responseId,
    }));
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="flex flex-col w-full flex-1 bg-surface">
      {/* Panel header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <p className="section-label">Agents</p>
        <button
          onClick={() => { setState((s) => ({ ...s, isOpen: false })); onClose?.(); }}
          className="text-text-muted hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5"
          aria-label="Collapse agent panel"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M4 3l6 4-6 4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* Query input */}
      <div className="px-3 py-3 border-b border-border shrink-0">
        <div className="flex flex-col gap-2">
          <textarea
            ref={inputRef}
            value={state.queryInput}
            onChange={(e) => setState((s) => ({ ...s, queryInput: e.target.value }))}
            onKeyDown={handleKeyDown}
            placeholder="Ask all agents a question… (Enter to send)"
            rows={2}
            disabled={state.isQuerying}
            className={[
              "w-full rounded-xl px-3 py-2.5 text-sm resize-none",
              "bg-surface-raised border border-border text-white placeholder:text-text-muted",
              "focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-border-strong",
              "disabled:opacity-40",
            ].join(" ")}
          />
          <Button
            onClick={handleQuery}
            disabled={!state.queryInput.trim() || state.isQuerying}
            loading={state.isQuerying}
            size="sm"
            className="w-full"
          >
            {state.isQuerying ? "Querying agents…" : "Ask agents"}
          </Button>
        </div>
        {error && <p className="text-xs text-danger mt-2">{error}</p>}
      </div>

      {/* Response list */}
      <div
        ref={responseListRef}
        className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-3"
      >
        {state.isQuerying && (
          <div className="flex items-center gap-2 text-sm text-text-secondary p-3">
            <Spinner size="sm" />
            <span>Agents are thinking…</span>
          </div>
        )}

        {responses.length === 0 && !state.isQuerying && (
          <div className="flex flex-col items-center justify-center flex-1 gap-2 py-12 text-center">
            <p className="text-2xl select-none">🤖</p>
            <p className="text-sm text-text-secondary">No responses yet</p>
            <p className="text-xs text-text-muted max-w-[180px]">
              Ask a question above and all agents will respond simultaneously.
            </p>
          </div>
        )}

        {responses.map((r) => (
          <AgentResponseCard
            key={r.response_id}
            response={r}
            projectId={projectId}
            isExpanded={state.expandedResponseId === r.response_id}
            onToggleExpand={toggleExpand}
          />
        ))}
      </div>
    </div>
  );
}
