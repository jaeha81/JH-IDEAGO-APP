"use client";

// Agents page — dedicated view for managing agents and reading response history.
// Step 11: replace PlaceholderPage with:
//   - Agent list (role labels, is_active toggle, reorder)
//   - Full paginated response history grouped by query_id
//   - Query input (same as in AgentPanel but full-width)

import { useParams } from "next/navigation";
import { PlaceholderPage } from "@/components/ui/PlaceholderPage";

export default function AgentsPage() {
  const { id: projectId } = useParams<{ id: string }>();

  return (
    <div className="flex-1 overflow-y-auto px-4 py-8">
      <PlaceholderPage
        title="Agents"
        description="Manage agent roles and view the full response history. Implementation arrives in Step 11."
      />
    </div>
  );
}
