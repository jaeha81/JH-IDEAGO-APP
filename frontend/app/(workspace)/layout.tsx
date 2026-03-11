// (workspace) route group layout — wraps all authenticated pages with AppShell.
// AuthGuard validates session via /auth/me before rendering children.

import { AppShell } from "@/components/layout/AppShell";
import AuthGuard from "@/components/auth/AuthGuard";

export default function WorkspaceGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <AppShell>{children}</AppShell>
    </AuthGuard>
  );
}
