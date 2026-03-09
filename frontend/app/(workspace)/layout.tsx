// (workspace) route group layout — wraps all authenticated pages with AppShell.
// AppShell provides: TopBar, SideNav (md+), BottomNav (mobile).
// Step 10: add JWT auth guard here before rendering children.

import { AppShell } from "@/components/layout/AppShell";

export default function WorkspaceGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
