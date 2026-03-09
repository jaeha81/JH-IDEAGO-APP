"use client";

// Detail View page — on-demand only. Never auto-generated.
// Step 11: replace PlaceholderPage with:
//   - Trigger button + optional prompt input
//   - Result image display with status polling
//   - History of previous Detail View results for this project

import { useParams } from "next/navigation";
import { PlaceholderPage } from "@/components/ui/PlaceholderPage";

export default function DetailPage() {
  const { id: projectId } = useParams<{ id: string }>();

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-8 py-8">
      <PlaceholderPage
        title="Detail View"
        description="Generate a high-fidelity visualization from the current canvas state. On-demand only — never auto-generated. Implementation arrives in Step 11."
      />
    </div>
  );
}
