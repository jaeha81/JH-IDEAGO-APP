"use client";

// BottomNav — full-width tab bar at the bottom for mobile and tablet portrait.
// Visible on small screens (hidden on md+).
// Inside project workspace routes, it switches to project-specific tabs.
// Outside workspace routes, it mirrors the SideNav items.

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavTab {
  href: string;
  label: string;
  matchPrefix: string;
  icon: React.ReactNode;
}

// Global tabs (when not inside a project)
const GLOBAL_TABS: NavTab[] = [
  {
    href: "/projects",
    label: "Projects",
    matchPrefix: "/projects",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <rect x="2" y="2" width="8" height="8" rx="1.5" />
        <rect x="12" y="2" width="8" height="8" rx="1.5" />
        <rect x="2" y="12" width="8" height="8" rx="1.5" />
        <rect x="12" y="12" width="8" height="8" rx="1.5" />
      </svg>
    ),
  },
  {
    href: "/activity",
    label: "Activity",
    matchPrefix: "/activity",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <circle cx="11" cy="11" r="9" />
        <path d="M11 7v4l3 2" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: "/settings",
    label: "Settings",
    matchPrefix: "/settings",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <circle cx="11" cy="11" r="3" />
        <path d="M11 2v2M11 18v2M2 11h2M18 11h2M4.9 4.9l1.4 1.4M15.7 15.7l1.4 1.4M4.9 17.1l1.4-1.4M15.7 6.3l1.4-1.4" />
      </svg>
    ),
  },
];

// Workspace tabs (when inside a project) — projectId is extracted from pathname
function workspaceTabs(projectId: string): NavTab[] {
  const base = `/projects/${projectId}`;
  return [
    {
      href: `${base}/canvas`,
      label: "Canvas",
      matchPrefix: `${base}/canvas`,
      icon: (
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M3 19l2-5L16 3l3 3L8 17l-5 2z" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      href: `${base}/agents`,
      label: "Agents",
      matchPrefix: `${base}/agents`,
      icon: (
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <circle cx="11" cy="8" r="4" />
          <path d="M3 20c0-4 3.6-7 8-7s8 3 8 7" />
        </svg>
      ),
    },
    {
      href: `${base}/detail`,
      label: "Detail",
      matchPrefix: `${base}/detail`,
      icon: (
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <rect x="2" y="2" width="18" height="18" rx="2" />
          <circle cx="11" cy="11" r="3" />
          <path d="M11 5v2M11 15v2M5 11h2M15 11h2" />
        </svg>
      ),
    },
    {
      href: `${base}/export`,
      label: "Export",
      matchPrefix: `${base}/export`,
      icon: (
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M4 14v4a1 1 0 001 1h12a1 1 0 001-1v-4" />
          <path d="M11 3v11M7 9l4-4 4 4" strokeLinejoin="round" />
        </svg>
      ),
    },
  ];
}

export function BottomNav() {
  const pathname = usePathname();

  // Detect workspace route: /projects/[id]/*
  const workspaceMatch = pathname.match(/^\/projects\/([^/]+)\//);
  const projectId = workspaceMatch?.[1] ?? null;
  const tabs = projectId ? workspaceTabs(projectId) : GLOBAL_TABS;

  return (
    <nav
      className="flex items-stretch border-t border-border bg-surface h-14 shrink-0"
      aria-label={projectId ? "Workspace navigation" : "Main navigation"}
    >
      {tabs.map((tab) => {
        const isActive = pathname.startsWith(tab.matchPrefix);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-label={tab.label}
            aria-current={isActive ? "page" : undefined}
            className={[
              "flex flex-1 flex-col items-center justify-center gap-0.5 transition-colors duration-150",
              "focus:outline-none focus-visible:ring-inset focus-visible:ring-2 focus-visible:ring-white/20",
              isActive ? "text-white" : "text-text-muted",
            ].join(" ")}
          >
            {tab.icon}
            <span className="text-[10px] font-medium">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
