"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export interface AgentDraft {
  id: string; // client-side only key for list management
  role_label: string;
  display_order: number;
}

interface AgentRoleInputProps {
  agents: AgentDraft[];
  onChange: (agents: AgentDraft[]) => void;
  maxAgents?: number;
}

export function AgentRoleInput({ agents, onChange, maxAgents = 6 }: AgentRoleInputProps) {
  const addAgent = () => {
    if (agents.length >= maxAgents) return;
    onChange([
      ...agents,
      {
        id: crypto.randomUUID(),
        role_label: "",
        display_order: agents.length + 1,
      },
    ]);
  };

  const updateRole = (id: string, value: string) => {
    onChange(agents.map((a) => (a.id === id ? { ...a, role_label: value } : a)));
  };

  const removeAgent = (id: string) => {
    const updated = agents
      .filter((a) => a.id !== id)
      .map((a, i) => ({ ...a, display_order: i + 1 }));
    onChange(updated);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="section-label">Agents ({agents.length}/{maxAgents})</p>
        <Button
          variant="ghost"
          size="sm"
          onClick={addAgent}
          disabled={agents.length >= maxAgents}
        >
          + Add agent
        </Button>
      </div>

      {agents.length === 0 && (
        <p className="text-xs text-text-muted py-2">
          Add at least one agent. Each agent gets a custom role — e.g. "Visual Architect", "UX Critic".
        </p>
      )}

      <ul className="flex flex-col gap-2">
        {agents.map((agent, idx) => (
          <li key={agent.id} className="flex items-center gap-2">
            <span className="text-xs text-text-muted w-4 shrink-0 text-right">{idx + 1}</span>
            <Input
              value={agent.role_label}
              onChange={(e) => updateRole(agent.id, e.target.value)}
              placeholder='e.g. "Visual Architect"'
              className="flex-1"
              maxLength={80}
            />
            <button
              onClick={() => removeAgent(agent.id)}
              className="text-text-muted hover:text-danger transition-colors p-1.5 rounded-lg hover:bg-danger/10"
              aria-label={`Remove agent ${idx + 1}`}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M2 2l10 10M12 2L2 12" />
              </svg>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
