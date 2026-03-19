"use client";

// Detail View page — /projects/[id]/detail
// On-demand only — never auto-generated or auto-opened.
// Flow: user hits Generate → POST detail-view (returns pending result_id)
//       → poll GET detail-view/{result_id} until status != "pending"
//       → display image or error message.

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge, statusVariant } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { Input } from "@/components/ui/Input";
import {
  triggerDetailView,
  getDetailView,
  listDetailViews,
} from "@/lib/services/detail-view";
import type { DetailViewResult } from "@/types";

const POLL_INTERVAL_MS = 2500;

export default function DetailPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const [results, setResults] = useState<DetailViewResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPoll = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const startPoll = useCallback(
    (resultId: string) => {
      stopPoll();
      pollRef.current = setInterval(async () => {
        if (!projectId) return;
        try {
          const updated = await getDetailView(projectId, resultId);
          setResults((prev) =>
            prev.map((r) => (r.result_id === resultId ? updated : r)),
          );
          if (updated.status !== "pending") stopPoll();
        } catch {
          stopPoll();
        }
      }, POLL_INTERVAL_MS);
    },
    [projectId, stopPoll],
  );

  useEffect(() => {
    return stopPoll;
  }, [stopPoll]);

  useEffect(() => {
    if (!projectId) return;
    listDetailViews(projectId)
      .then((list) => {
        setResults(list);
        const pending = list.find((r) => r.status === "pending");
        if (pending) startPoll(pending.result_id);
      })
      .catch(() => setResults([]))
      .finally(() => setIsLoading(false));
  }, [projectId, startPoll]);

  const handleGenerate = async () => {
    if (!projectId || isGenerating) return;
    setIsGenerating(true);
    setGenerateError(null);
    try {
      const result = await triggerDetailView(projectId, {
        user_prompt: prompt.trim() || undefined,
      });
      setResults((prev) => [result, ...prev]);
      setPrompt("");
      if (result.status === "pending") startPoll(result.result_id);
    } catch (err) {
      setGenerateError(
        err instanceof Error ? err.message : "Failed to trigger generation",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-8 py-8">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-white">Detail View</h1>
          <p className="text-sm text-text-secondary mt-1">
            On-demand high-fidelity visualization from the current canvas
            state. Never auto-generated.
          </p>
        </div>

        {/* Generate */}
        <Card>
          <p className="section-label mb-3">Generate Visualization</p>
          <div className="flex gap-3">
            <Input
              placeholder="Optional: describe the style or focus area…"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && !isGenerating && handleGenerate()
              }
              disabled={isGenerating}
              className="flex-1"
            />
            <Button onClick={handleGenerate} loading={isGenerating}>
              Generate
            </Button>
          </div>
          {generateError && (
            <p className="text-danger text-xs mt-2">{generateError}</p>
          )}
        </Card>

        {/* History */}
        <div>
          <p className="section-label mb-3">History</p>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-12 text-text-muted text-sm">
              No visualizations yet. Use Generate above to create your first
              one.
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {results.map((result) => (
                <ResultCard key={result.result_id} result={result} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ResultCard({ result }: { result: DetailViewResult }) {
  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Badge
            variant={statusVariant(
              result.status as
                | "pending"
                | "completed"
                | "failed"
                | "building",
            )}
          >
            {result.status}
          </Badge>
          {result.status === "pending" && <Spinner size="sm" />}
        </div>
        <span className="text-xs text-text-muted">
          {new Date(result.created_at).toLocaleString()}
        </span>
      </div>

      {result.user_prompt && (
        <p className="text-sm text-text-secondary mb-3 italic">
          &ldquo;{result.user_prompt}&rdquo;
        </p>
      )}

      {result.status === "completed" && result.storage_url && (
        <div className="rounded-xl overflow-hidden bg-surface mt-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={result.storage_url}
            alt="Detail view visualization"
            className="w-full object-contain max-h-[520px]"
          />
        </div>
      )}

      {result.status === "failed" && result.error_message && (
        <p className="text-danger text-sm mt-1">{result.error_message}</p>
      )}

      {result.completed_at && (
        <p className="text-[11px] text-text-muted mt-3">
          Completed {new Date(result.completed_at).toLocaleString()}
        </p>
      )}
    </Card>
  );
}
