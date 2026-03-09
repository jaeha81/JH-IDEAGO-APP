// Activity page — global event log across all projects.
// Step 11: replace with real event feed using GET /projects/{id}/events
//   aggregated across all user projects, with infinite scroll.

import { PlaceholderPage } from "@/components/ui/PlaceholderPage";

export const metadata = { title: "Activity" };

export default function ActivityPage() {
  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-8 py-10">
      {/* Page header */}
      <div className="mb-10 max-w-3xl">
        <h1 className="text-2xl font-semibold text-white">Activity</h1>
        <p className="text-sm text-text-secondary mt-1">
          Append-only event log across all projects.
        </p>
      </div>

      <PlaceholderPage
        title="Activity feed"
        description="Chronological event log for all your projects — canvas saves, agent queries, uploads, exports. Implementation arrives in Step 11."
      />
    </div>
  );
}
