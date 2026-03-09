// Project workspace layout — sits inside AppShell, adds WorkspaceHeader tabs.
// Server component: fetches project title for the header at layout level so
// all child pages (canvas, agents, detail, export) inherit it without refetching.
//
// Layout chain:
//   RootLayout → AppShell (TopBar + SideNav + BottomNav) → [this] (WorkspaceHeader) → page

import { WorkspaceHeader } from "@/components/layout/WorkspaceHeader";
import { getProject } from "@/lib/services/projects";

interface ProjectLayoutProps {
  children: React.ReactNode;
  params: { id: string };
}

export default async function ProjectLayout({ children, params }: ProjectLayoutProps) {
  // Lightweight fetch for header title — pages fetch full project detail themselves.
  // Falls back gracefully if fetch fails (mock or real API).
  const project = await getProject(params.id).catch(() => null);

  return (
    // Fill the full height provided by AppShell's main area.
    // flex-col so WorkspaceHeader (fixed height) + page (flex-1) stack cleanly.
    <div className="flex flex-col h-full overflow-hidden">
      <WorkspaceHeader
        projectId={params.id}
        projectTitle={project?.title ?? null}
      />

      {/* Page content — each page controls its own scroll/overflow */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {children}
      </div>
    </div>
  );
}
