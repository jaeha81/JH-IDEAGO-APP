"use client";

// Projects list page — /projects
// AppShell (in (workspace)/layout.tsx) already provides TopBar + SideNav.
// This page only renders its own content inside the shell's <main> area.

import { useEffect, useState } from "react";
import Link from "next/link";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { listProjects } from "@/lib/services/projects";
import type { ProjectSummary } from "@/types";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listProjects()
      .then(setProjects)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load projects"))
      .finally(() => setIsLoading(false));
  }, []);

  const activeProjects = projects.filter((p) => p.status === "active");
  const archivedProjects = projects.filter((p) => p.status === "archived");

  return (
    <div className="flex-1 overflow-y-auto px-4 py-10">
      <div className="max-w-4xl mx-auto">
        {/* Page header */}
        <div className="flex items-start justify-between mb-10 gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              Projects
            </h1>
            <p className="text-text-secondary mt-1 text-sm max-w-sm">
              다중 지능 협업으로 아이디어를 구체화하고 발전시키는 시각적 창조 플랫폼
            </p>
          </div>
          <Link href="/projects/new" className="shrink-0">
            <Button size="sm">New project</Button>
          </Link>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center gap-3 text-text-secondary">
            <Spinner size="sm" />
            <span className="text-sm">Loading…</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-2xl border border-danger/30 bg-danger/5 p-4 text-sm text-danger">
            {error}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && projects.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <p className="text-4xl select-none">🎨</p>
            <p className="text-lg font-medium text-white">No projects yet</p>
            <p className="text-sm text-text-secondary max-w-xs">
              Start a new project to begin ideating with your AI agents.
            </p>
            <Link href="/projects/new">
              <Button size="lg" className="mt-2">Create first project</Button>
            </Link>
          </div>
        )}

        {/* Active projects */}
        {activeProjects.length > 0 && (
          <section className="mb-10">
            <p className="section-label mb-4">Active</p>
            <div className="grid grid-cols-1 gap-3">
              {activeProjects.map((p) => (
                <ProjectCard key={p.project_id} project={p} />
              ))}
            </div>
          </section>
        )}

        {/* Archived projects */}
        {archivedProjects.length > 0 && (
          <section>
            <p className="section-label mb-4">Archived</p>
            <div className="grid grid-cols-1 gap-3">
              {archivedProjects.map((p) => (
                <ProjectCard key={p.project_id} project={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
