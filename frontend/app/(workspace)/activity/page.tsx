"use client";

// Activity page — /activity
// Append-only event feed aggregated across ALL user projects.
// Strategy: fetch all projects → load events per project in parallel →
//   merge + sort by created_at desc → show with project context.
// "Load More" loads events for the next batch of projects.

import { useEffect, useState, useCallback } from "react";
import { listProjects } from "@/lib/services/projects";
import { listEvents } from "@/lib/services/events";
import { Spinner } from "@/components/ui/Spinner";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { ProjectEvent, ProjectSummary } from "@/types";

const EVENTS_PER_PROJECT = 50;
const PROJECTS_BATCH_SIZE = 8;

interface EnrichedEvent extends ProjectEvent {
  projectTitle: string | null;
}

function eventTypeBadgeVariant(
  eventType: string,
): "default" | "success" | "warning" | "danger" | "info" {
  if (eventType.startsWith("canvas")) return "success";
  if (eventType.startsWith("export")) return "warning";
  if (eventType.startsWith("asset")) return "info";
  return "default";
}

export default function ActivityPage() {
  const [allProjects, setAllProjects] = useState<ProjectSummary[]>([]);
  const [events, setEvents] = useState<EnrichedEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadedBatches, setLoadedBatches] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const fetchBatch = useCallback(
    async (
      projects: ProjectSummary[],
      batchIndex: number,
      append: boolean,
    ) => {
      const start = batchIndex * PROJECTS_BATCH_SIZE;
      const batch = projects.slice(start, start + PROJECTS_BATCH_SIZE);
      if (batch.length === 0) {
        setHasMore(false);
        return;
      }

      const settled = await Promise.allSettled(
        batch.map(async (p) => {
          const { events: evts } = await listEvents(
            p.project_id,
            1,
            EVENTS_PER_PROJECT,
          );
          return evts.map(
            (e): EnrichedEvent => ({ ...e, projectTitle: p.title }),
          );
        }),
      );

      const enriched: EnrichedEvent[] = settled
        .filter((r) => r.status === "fulfilled")
        .flatMap((r) => (r as PromiseFulfilledResult<EnrichedEvent[]>).value);

      enriched.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );

      if (append) {
        setEvents((prev) =>
          [...prev, ...enriched].sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime(),
          ),
        );
      } else {
        setEvents(enriched);
      }

      const nextStart = (batchIndex + 1) * PROJECTS_BATCH_SIZE;
      setHasMore(nextStart < projects.length);
      setLoadedBatches(batchIndex + 1);
    },
    [],
  );

  useEffect(() => {
    setIsLoading(true);
    listProjects()
      .then(async (projects) => {
        setAllProjects(projects);
        await fetchBatch(projects, 0, false);
      })
      .catch((err) =>
        setError(
          err instanceof Error ? err.message : "Failed to load activity",
        ),
      )
      .finally(() => setIsLoading(false));
  }, [fetchBatch]);

  const handleLoadMore = async () => {
    setIsLoadingMore(true);
    try {
      await fetchBatch(allProjects, loadedBatches, true);
    } finally {
      setIsLoadingMore(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-8 py-10">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-white">Activity</h1>
          <p className="text-sm text-text-secondary mt-1">
            Append-only event log across all your projects.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <p className="text-danger text-sm">{error}</p>
        ) : events.length === 0 ? (
          <div className="text-center py-16 text-text-muted text-sm">
            No events yet. Start working on a project to see activity here.
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-0.5">
              {events.map((evt) => (
                <div
                  key={evt.event_id}
                  className="flex items-start gap-4 px-4 py-3 rounded-xl hover:bg-surface transition-colors"
                >
                  {/* Sequence number */}
                  <span className="text-[10px] text-text-muted w-6 text-right shrink-0 mt-0.5 tabular-nums">
                    #{evt.sequence_num}
                  </span>

                  {/* Main content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="text-sm text-white font-mono truncate">
                        {evt.event_type}
                      </span>
                      <Badge
                        variant={eventTypeBadgeVariant(evt.event_type)}
                        className="shrink-0"
                      >
                        {evt.projectTitle
                          ? evt.projectTitle.slice(0, 20)
                          : evt.project_id.slice(0, 8)}
                      </Badge>
                    </div>
                    <span className="text-[11px] text-text-muted">
                      {new Date(evt.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {hasMore && (
              <div className="flex justify-center mt-8">
                <Button
                  variant="ghost"
                  onClick={handleLoadMore}
                  loading={isLoadingMore}
                >
                  Load More Projects
                </Button>
              </div>
            )}

            <p className="text-center text-[11px] text-text-muted mt-6 pb-4">
              Showing events from{" "}
              {Math.min(
                loadedBatches * PROJECTS_BATCH_SIZE,
                allProjects.length,
              )}{" "}
              of {allProjects.length} project
              {allProjects.length !== 1 ? "s" : ""}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
