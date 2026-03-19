"use client";

// Project Summary page — /projects/[id]/summary
// Lives inside [id]/layout.tsx which provides WorkspaceHeader.
// AppShell provides TopBar + SideNav — no AppHeader needed here.

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { getProject } from "@/lib/services/projects";
import { listEvents } from "@/lib/services/events";
import type { Project, ProjectEvent } from "@/types";

export default function ProjectSummaryPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [events, setEvents] = useState<ProjectEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) return;
    Promise.all([getProject(projectId), listEvents(projectId)])
      .then(([proj, { events }]) => {
        setProject(proj);
        setEvents(events);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load project"))
      .finally(() => setIsLoading(false));
  }, [projectId]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6">
        <p className="text-danger text-sm">{error ?? "Project not found"}</p>
        <Button variant="ghost" onClick={() => router.push("/projects")}>Back</Button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-8 py-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <h1 className="text-2xl font-semibold text-white">
          {project.title ?? <span className="text-text-muted italic">Untitled</span>}
        </h1>

        {/* Project metadata */}
        <Card>
          <p className="section-label mb-3">Project Details</p>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-text-muted">Status</dt>
              <dd className="text-white mt-0.5">
                <Badge variant={project.status === "active" ? "success" : "default"}>
                  {project.status}
                </Badge>
              </dd>
            </div>
            <div>
              <dt className="text-text-muted">Exports</dt>
              <dd className="text-white mt-0.5">{project.export_count}</dd>
            </div>
            <div>
              <dt className="text-text-muted">Created</dt>
              <dd className="text-white mt-0.5">
                {new Date(project.created_at).toLocaleDateString()}
              </dd>
            </div>
            <div>
              <dt className="text-text-muted">Last canvas save</dt>
              <dd className="text-white mt-0.5">
                {project.canvas_last_saved
                  ? new Date(project.canvas_last_saved).toLocaleDateString()
                  : "—"}
              </dd>
            </div>
          </dl>
          {project.purpose_note && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-text-muted text-xs mb-1 uppercase tracking-wider">Purpose</p>
              <p className="text-sm text-white leading-relaxed">{project.purpose_note}</p>
            </div>
          )}
        </Card>

        {/* Agent configuration */}
        <Card>
          <p className="section-label mb-3">Agents ({project.agents.length})</p>
          <ul className="flex flex-col gap-2">
            {project.agents.map((agent) => (
              <li
                key={agent.agent_id}
                className="flex items-center justify-between py-2 border-b border-border last:border-0"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs text-text-muted w-5 text-right">
                    {agent.display_order}
                  </span>
                  <span className="text-sm text-white">{agent.role_label}</span>
                </div>
                {!agent.is_active && <Badge variant="default">Inactive</Badge>}
              </li>
            ))}
          </ul>
        </Card>

        {/* Event history */}
        <div>
          <p className="section-label mb-3">Event History ({events.length})</p>
          <div className="flex flex-col gap-1">
            {events
              .slice()
              .sort((a, b) => b.sequence_num - a.sequence_num)
              .map((evt) => (
                <div
                  key={evt.event_id}
                  className="flex items-start gap-3 px-4 py-2.5 rounded-xl hover:bg-surface transition-colors"
                >
                  <span className="text-[10px] text-text-muted w-6 text-right shrink-0 mt-0.5">
                    #{evt.sequence_num}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm text-white font-mono">{evt.event_type}</p>
                    <p className="text-[11px] text-text-muted">
                      {new Date(evt.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Bottom actions */}
        <div className="flex gap-3 pb-8">
          <Link href={`/projects/${projectId}/export`} className="flex-1">
            <Button variant="secondary" className="w-full">Export Project</Button>
          </Link>
          <Link href={`/projects/${projectId}/canvas`}>
            <Button>Back to Canvas</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
