"use client";

import Link from "next/link";

interface AppHeaderProps {
  projectTitle?: string | null;
  saveStatus?: "saved" | "saving" | "unsaved" | null;
  actions?: React.ReactNode;
  /** If true, renders minimal header without project context */
  minimal?: boolean;
}

export function AppHeader({ projectTitle, saveStatus, actions, minimal }: AppHeaderProps) {
  return (
    <header className="glass sticky top-0 z-40 flex h-14 items-center gap-4 px-4 md:px-6">
      {/* Brand */}
      <Link href="/projects" className="flex items-baseline gap-1.5 shrink-0">
        <span className="text-base font-semibold tracking-tight text-white">IDEAGO</span>
        <span className="text-[10px] text-text-secondary font-medium">(MultiGenius)</span>
      </Link>

      {/* Project breadcrumb */}
      {!minimal && projectTitle !== undefined && (
        <>
          <span className="text-border-strong select-none">/</span>
          <span className="text-sm text-text-secondary truncate max-w-[200px]">
            {projectTitle ?? <span className="italic text-text-muted">Untitled</span>}
          </span>
        </>
      )}

      {/* Save status indicator */}
      {saveStatus && (
        <span className="ml-1 flex items-center gap-1.5 text-[11px] text-text-muted shrink-0">
          <SaveStatusDot status={saveStatus} />
          {saveStatus === "saving" ? "Saving…" : saveStatus === "saved" ? "Saved" : "Unsaved"}
        </span>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Actions slot */}
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}

function SaveStatusDot({ status }: { status: "saved" | "saving" | "unsaved" }) {
  const colors = {
    saved: "bg-success",
    saving: "bg-warning animate-pulse",
    unsaved: "bg-text-muted",
  };
  return <span className={`h-1.5 w-1.5 rounded-full ${colors[status]}`} aria-hidden="true" />;
}
