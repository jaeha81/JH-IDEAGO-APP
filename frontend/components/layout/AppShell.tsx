// AppShell — outermost layout wrapper for all workspace routes.
// Mobile-only layout: TopBar (top) + main content + BottomNav (bottom).
// This is a Server Component — client interactivity is inside TopBar/BottomNav.

import { TopBar } from "@/components/layout/TopBar";
import { BottomNav } from "@/components/layout/BottomNav";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="h-dvh flex flex-col overflow-hidden bg-[#0F0F0F] max-w-screen-sm mx-auto w-full">
      {/* Global top bar */}
      <TopBar />

      {/* Main content area */}
      <main className="flex-1 overflow-hidden flex flex-col" id="main-content">
        {children}
      </main>

      {/* Bottom tab bar */}
      <BottomNav />
    </div>
  );
}
