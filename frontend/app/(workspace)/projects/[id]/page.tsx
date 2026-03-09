import { redirect } from "next/navigation";

// /projects/[id] → redirect to the canvas sub-route.
// WorkspaceHeader tabs always show Canvas as the default entry point.
export default function ProjectIndexPage({ params }: { params: { id: string } }) {
  redirect(`/projects/${params.id}/canvas`);
}
