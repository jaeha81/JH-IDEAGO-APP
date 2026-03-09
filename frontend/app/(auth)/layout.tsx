// Auth route group — no auth guard, accessible to guests.
// Step 10: Add auth guard — redirect to /projects if already logged in.

export default function AuthGroupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
