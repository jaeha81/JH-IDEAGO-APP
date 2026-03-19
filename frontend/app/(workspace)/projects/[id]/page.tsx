// Server component — redirects /projects/[id] → /projects/[id]/canvas
// generateStaticParams() required for Next.js output:export compatibility.
import { redirect } from "next/navigation";

export function generateStaticParams() { return [{ id: "_" }]; }

export default function ProjectIndexPage({ params }: { params: { id: string } }) {
  redirect(`/projects/${params.id}/canvas`);
}
