"use client";

// Export page — /projects/[id]/export
// Lives inside [id]/layout.tsx which provides WorkspaceHeader.
// AppShell provides TopBar — no AppHeader needed here.

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ExportPanel } from "@/components/export/ExportPanel";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";
import { getProject } from "@/lib/services/projects";
import type { Project } from "@/types";

export default function ExportPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) return;
    getProject(projectId)
      .then(setProject)
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
      <ExportPanel projectId={projectId} projectTitle={project.title} />
    </div>
  );
}
