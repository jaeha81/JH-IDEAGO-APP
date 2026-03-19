"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { AgentRoleInput, type AgentDraft } from "@/components/projects/AgentRoleInput";
import { createProject } from "@/lib/services/projects";
import { SUGGESTED_AGENT_ROLES } from "@/lib/mock/projects";

export default function NewProjectPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [purposeNote, setPurposeNote] = useState("");
  const [agents, setAgents] = useState<AgentDraft[]>([
    { id: crypto.randomUUID(), role_label: "", display_order: 1 },
  ]);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasValidAgents = agents.some((a) => a.role_label.trim().length > 0);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!hasValidAgents) {
      setError("Add at least one agent with a role label.");
      return;
    }
    setError(null);
    setIsCreating(true);
    try {
      const project = await createProject({
        title: title.trim() || undefined,
        purpose_note: purposeNote.trim() || undefined,
        agents: agents
          .filter((a) => a.role_label.trim())
          .map((a) => ({ role_label: a.role_label.trim(), display_order: a.display_order })),
      });
      router.push(`/projects/${project.project_id}/canvas`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create project");
      setIsCreating(false);
    }
  };

  const applyRoleExample = (role: string) => {
    // Fill next empty agent slot, or add new one
    const emptyIdx = agents.findIndex((a) => !a.role_label.trim());
    if (emptyIdx >= 0) {
      setAgents(agents.map((a, i) => (i === emptyIdx ? { ...a, role_label: role } : a)));
    } else if (agents.length < 6) {
      setAgents([...agents, { id: crypto.randomUUID(), role_label: role, display_order: agents.length + 1 }]);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-10">
      <div className="max-w-xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-white">New project</h1>
          <p className="text-sm text-text-secondary mt-1">
            You can start rough — agents will help organize your thinking.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Project title — optional */}
          <Input
            label="Project title (optional)"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Mobile App Redesign"
            maxLength={120}
            hint="Leave blank to auto-title from your first agent interaction"
          />

          {/* Purpose note — optional */}
          <Textarea
            label="Purpose / context (optional)"
            value={purposeNote}
            onChange={(e) => setPurposeNote(e.target.value)}
            placeholder="What are you trying to figure out? What's the context?"
            maxLength={500}
          />

          {/* Agent configuration */}
          <div className="flex flex-col gap-3">
            <AgentRoleInput agents={agents} onChange={setAgents} />

            {/* Role suggestions */}
            <div>
              <p className="section-label mb-2">Suggestions</p>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_AGENT_ROLES.map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => applyRoleExample(role)}
                    className="text-xs px-3 py-1 rounded-lg bg-surface border border-border text-text-secondary hover:text-white hover:border-border-strong transition-colors"
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.push("/projects")}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={isCreating}
              disabled={!hasValidAgents}
              className="flex-1"
            >
              Create project
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
