"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { ProjectSummary } from "@/types";

interface ProjectCardProps {
  project: ProjectSummary;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const displayTitle = project.title ?? "Untitled";
  const updatedLabel = formatRelativeDate(project.updated_at);

  return (
    <Link href={`/projects/${project.project_id}`} className="group block">
      <Card
        raised
        className="hover:border-border-strong hover:bg-surface-overlay transition-all duration-150 cursor-pointer"
      >
        <div className="flex flex-col gap-3">
          {/* Title row */}
          <div className="flex items-start justify-between gap-2">
            <h3
              className={[
                "text-sm font-medium leading-snug group-hover:text-white transition-colors",
                project.title ? "text-white" : "text-text-muted italic",
              ].join(" ")}
            >
              {displayTitle}
            </h3>
            {project.status === "archived" && (
              <Badge variant="default">Archived</Badge>
            )}
          </div>

          {/* Meta row */}
          <div className="flex items-center gap-3 text-[11px] text-text-muted">
            <span>{project.agent_count} agent{project.agent_count !== 1 ? "s" : ""}</span>
            <span>·</span>
            <span>Updated {updatedLabel}</span>
          </div>
        </div>
      </Card>
    </Link>
  );
}

function formatRelativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}
