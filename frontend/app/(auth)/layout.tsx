// Auth route group — redirects to /projects if already authenticated.

import GuestGuard from "@/components/auth/GuestGuard";

export default function AuthGroupLayout({ children }: { children: React.ReactNode }) {
  return <GuestGuard>{children}</GuestGuard>;
}
