"use client";

// WorkspaceHeader — project-specific sub-navigation.
// Rendered by the [id]/layout.tsx inside every project workspace route.
// Shows: back link, project title (truncated), and tab pills for Canvas/Agents/Detail/Export.
// Height: 44px (h-11).

import Link from "next/link";
import { usePathname } from "next/navigation";

interface WorkspaceHeaderProps {
  projectId: string;
  projectTitle: string | null;
  /** Optional right-side slot — used by canvas page for save status / save button */
  actions?: React.ReactNode;
}

interface WorkspaceTab {
  href: string;
  label: string;
  segment: string; // last path segment to match
}

export function WorkspaceHeader({ projectId, projectTitle, actions }: WorkspaceHeaderProps) {
  const pathname = usePathname();
  const base = `/projects/${projectId}`;

  const TABS: WorkspaceTab[] = [
    { href: `${base}/canvas`, label: "Canvas", segment: "canvas" },
    { href: `${base}/agents`, label: "Agents", segment: "agents" },
    { href: `${base}/detail`, label: "Detail", segment: "detail" },
    { href: `${base}/export`, label: "Export", segment: "export" },
  ];

  return (
    <div
      className="flex items-center h-11 px-3 md:px-4 gap-3 border-b border-border bg-surface shrink-0"
      role="navigation"
      aria-label="Project sections"
    >
      {/* Back to projects */}
      <Link
        href="/projects"
        className="shrink-0 text-text-muted hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
        aria-label="Back to projects"
        title="Back to projects"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 2L4 7l5 5" />
        </svg>
      </Link>

      {/* Project title */}
      <span
        className="text-sm font-medium text-white truncate max-w-[120px] md:max-w-[200px] shrink-0"
        title={projectTitle ?? "Untitled"}
      >
        {projectTitle ?? <span className="italic text-text-muted">Untitled</span>}
      </span>

      {/* Divider */}
      <span className="text-border-strong select-none shrink-0 hidden sm:block">/</span>

      {/* Tab pills */}
      <nav className="flex items-center gap-0.5 overflow-x-auto scrollbar-none" aria-label="Workspace tabs">
        {TABS.map((tab) => {
          const isActive = pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={isActive ? "page" : undefined}
              className={[
                "px-3 py-1 rounded-lg text-[13px] font-medium whitespace-nowrap transition-colors duration-100",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20",
                isActive
                  ? "bg-white/10 text-white"
                  : "text-text-muted hover:text-text-secondary hover:bg-white/5",
              ].join(" ")}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Actions slot (save status, save button — injected by canvas page context) */}
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
