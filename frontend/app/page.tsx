import { redirect } from "next/navigation";

// Root "/" redirects to the projects list.
// When auth is wired in Step 10, this becomes:
//   - authenticated → /projects
//   - unauthenticated → /login
export default function RootPage() {
  redirect("/projects");
}
