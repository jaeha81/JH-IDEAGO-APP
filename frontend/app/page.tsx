import { redirect } from "next/navigation";

// Root "/" redirects to /projects.
// AuthGuard in (workspace)/layout.tsx handles unauthenticated redirect to /login.
export default function RootPage() {
  redirect("/projects");
}
