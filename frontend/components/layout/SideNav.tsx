"use client";

// SideNav — icon-only left rail (64px wide) for global navigation.
// Visible on md+ screens on global pages (projects list, activity, settings).
// Automatically hides inside project workspace routes so the canvas is unobstructed.
// Items: Projects, Activity, Settings.

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  /** Match pattern — defaults to exact href match */
  matchPrefix?: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    href: "/projects",
    label: "Projects",
    matchPrefix: "/projects",
    icon: (
      // Grid 2×2 icon
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <rect x="2" y="2" width="7" height="7" rx="1.5" />
        <rect x="11" y="2" width="7" height="7" rx="1.5" />
        <rect x="2" y="11" width="7" height="7" rx="1.5" />
        <rect x="11" y="11" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    href: "/activity",
    label: "Activity",
    matchPrefix: "/activity",
    icon: (
      // Clock icon
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <circle cx="10" cy="10" r="8" />
        <path d="M10 6v4l3 2" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: "/settings",
    label: "Settings",
    matchPrefix: "/settings",
    icon: (
      // Gear icon
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <circle cx="10" cy="10" r="3" />
        <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.2 4.2l1.4 1.4M14.4 14.4l1.4 1.4M4.2 15.8l1.4-1.4M14.4 5.6l1.4-1.4" />
      </svg>
    ),
  },
];

export function SideNav() {
  const pathname = usePathname();

  // Hide inside project workspace (any route like /projects/[id]/*)
  // so the canvas has maximum horizontal space.
  const isInsideProject = /^\/projects\/[^/]+\//.test(pathname);
  if (isInsideProject) return null;

  return (
    <nav
      className="hidden md:flex flex-col items-center py-3 gap-1 w-16 shrink-0 bg-surface border-r border-border"
      aria-label="Main navigation"
    >
      {NAV_ITEMS.map((item) => {
        const isActive = item.matchPrefix
          ? pathname.startsWith(item.matchPrefix)
          : pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            title={item.label}
            aria-label={item.label}
            aria-current={isActive ? "page" : undefined}
            className={[
              "flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-colors duration-150",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20",
              isActive
                ? "bg-white/10 text-white"
                : "text-text-muted hover:text-text-secondary hover:bg-white/5",
            ].join(" ")}
          >
            {item.icon}
            <span className="text-[9px] mt-0.5 font-medium tracking-wide">{item.label}</span>
          </Link>
        );
      })}

      {/* Push settings to bottom */}
      <div className="flex-1" />

      {/* Version marker — minimal */}
      <span className="text-[9px] text-text-muted opacity-40 select-none pb-1">MVP</span>
    </nav>
  );
}
