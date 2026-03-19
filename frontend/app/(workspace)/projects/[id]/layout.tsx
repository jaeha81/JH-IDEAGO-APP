// Project workspace layout — server component.
//
// generateStaticParams returns [] so Next.js output:export skips pre-rendering
// for unknown [id] values. The Capacitor WebView handles all [id] routes
// client-side via Next.js router — no per-ID HTML file is needed.
//
// Note: project title not fetched here (no server API calls in static export).
// WorkspaceHeader shows "Untitled" by default; page components fetch their own data.

import { WorkspaceHeader } from "@/components/layout/WorkspaceHeader";

// Required for Next.js output:export with dynamic [id] segment.
// Empty array = no static pages pre-rendered; client-side routing handles all IDs.
export function generateStaticParams() {
  return [];
}

interface ProjectLayoutProps {
  children: React.ReactNode;
  params: { id: string };
}

export default function ProjectLayout({ children, params }: ProjectLayoutProps) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <WorkspaceHeader
        projectId={params.id}
        projectTitle={null}
      />
      <div className="flex-1 overflow-hidden flex flex-col">
        {children}
      </div>
    </div>
  );
}
