"use client";

// TopBar — global top bar present on every screen.
// Renders brand mark on the left and optional right slot.
// Does NOT contain project-specific context — that lives in WorkspaceHeader.
// Height: 56px (h-14). Sticky, glass morphism background.

import Link from "next/link";
import { usePathname } from "next/navigation";

interface TopBarProps {
  /** Right-side slot — actions passed by the page or layout above */
  actions?: React.ReactNode;
}

export function TopBar({ actions }: TopBarProps) {
  const pathname = usePathname();

  // Determine active top-level section for aria purposes
  const section = pathname.startsWith("/projects")
    ? "projects"
    : pathname.startsWith("/activity")
    ? "activity"
    : pathname.startsWith("/settings")
    ? "settings"
    : null;

  return (
    <header
      className="glass sticky top-0 z-40 flex h-14 items-center gap-4 px-4 shrink-0"
      role="banner"
    >
      {/* Brand */}
      <Link
        href="/projects"
        className="flex items-baseline gap-1.5 shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20 rounded"
        aria-label="IDEAGO home"
      >
        <span className="text-[15px] font-semibold tracking-tight text-white select-none">
          IDEAGO
        </span>
        <span className="text-[10px] text-text-secondary font-medium select-none">
          (MultiGenius)
        </span>
      </Link>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right slot */}
      {actions && (
        <div className="flex items-center gap-2">{actions}</div>
      )}
    </header>
  );
}
