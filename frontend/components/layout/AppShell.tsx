// AppShell — outermost layout wrapper for all workspace routes.
// Composes: TopBar (top) + SideNav (left, md+) + main content + BottomNav (bottom, mobile).
//
// Layout grid behaviour:
//   md+ landscape : [SideNav 64px] [content flex-1]
//   mobile/portrait: [content flex-1] with BottomNav pinned at bottom
//
// SideNav self-hides when inside project workspace routes (see SideNav.tsx).
// This is a Server Component — client interactivity is inside TopBar/SideNav/BottomNav.

import { TopBar } from "@/components/layout/TopBar";
import { SideNav } from "@/components/layout/SideNav";
import { BottomNav } from "@/components/layout/BottomNav";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="h-dvh flex flex-col overflow-hidden bg-[#0F0F0F]">
      {/* Global top bar — always visible */}
      <TopBar />

      {/* Body: SideNav + main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left rail nav — self-hides in workspace routes */}
        <SideNav />

        {/* Main content area — pages control their own scroll/overflow */}
        <main className="flex-1 overflow-hidden flex flex-col" id="main-content">
          {children}
        </main>
      </div>

      {/* Bottom tab bar — mobile / tablet portrait only */}
      <BottomNav />
    </div>
  );
}
