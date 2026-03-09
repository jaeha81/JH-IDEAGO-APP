"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge, statusVariant } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import type { ExportRecord } from "@/types";
import { initiateExport, getExport, listExports } from "@/lib/services/export";
import { EXPORT_FILE_TREE } from "@/lib/mock/export";

interface ExportPanelProps {
  projectId: string;
  projectTitle: string | null;
}

const POLL_INTERVAL_MS = 3000;

export function ExportPanel({ projectId, projectTitle }: ExportPanelProps) {
  const [exports, setExports] = useState<ExportRecord[]>([]);
  const [pendingExport, setPendingExport] = useState<ExportRecord | null>(null);
  const [isInitiating, setIsInitiating] = useState(false);
  const [includeHistory, setIncludeHistory] = useState(true);
  const [includeDetailViews, setIncludeDetailViews] = useState(false);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoadingList, setIsLoadingList] = useState(true);

  // Load export history on mount
  useEffect(() => {
    listExports(projectId)
      .then(setExports)
      .catch(() => setError("Could not load export history"))
      .finally(() => setIsLoadingList(false));
  }, [projectId]);

  // Poll pending export status
  useEffect(() => {
    if (!pendingExport || pendingExport.status !== "pending") return;
    const interval = setInterval(async () => {
      try {
        const updated = await getExport(projectId, pendingExport.export_id);
        setPendingExport(updated);
        if (updated.status !== "pending") {
          setExports((prev) => [updated, ...prev.filter((e) => e.export_id !== updated.export_id)]);
        }
      } catch {
        clearInterval(interval);
      }
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [pendingExport, projectId]);

  const handleInitiate = async () => {
    setIsInitiating(true);
    setError(null);
    try {
      const record = await initiateExport(projectId, {
        include_history: includeHistory,
        include_detail_views: includeDetailViews,
        notes: notes.trim() || undefined,
      });
      setPendingExport(record);
      setExports((prev) => [record, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to initiate export");
    } finally {
      setIsInitiating(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-white">Export Project</h1>
        <p className="text-sm text-text-secondary mt-1">
          {projectTitle ?? "Untitled project"} — structured handoff package
        </p>
      </div>

      {/* Package contents preview */}
      <Card>
        <p className="section-label mb-3">Package Contents</p>
        <ul className="flex flex-col gap-2">
          {EXPORT_FILE_TREE.map((f) => (
            <li key={f.name} className="flex items-start gap-3">
              <span className="text-text-muted font-mono text-xs mt-0.5">
                {f.isFolder ? "📁" : "📄"}
              </span>
              <div>
                <p className="text-sm text-white font-mono">{f.name}</p>
                <p className="text-xs text-text-muted">{f.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </Card>

      {/* Options */}
      <Card>
        <p className="section-label mb-3">Export Options</p>
        <div className="flex flex-col gap-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={includeHistory}
              onChange={(e) => setIncludeHistory(e.target.checked)}
              className="h-4 w-4 rounded border-border bg-surface accent-white"
            />
            <div>
              <p className="text-sm text-white">Include event history</p>
              <p className="text-xs text-text-muted">Full append-only event log (history.json)</p>
            </div>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={includeDetailViews}
              onChange={(e) => setIncludeDetailViews(e.target.checked)}
              className="h-4 w-4 rounded border-border bg-surface accent-white"
            />
            <div>
              <p className="text-sm text-white">Include Detail View results</p>
              <p className="text-xs text-text-muted">Generated visualizations (visualization/ folder)</p>
            </div>
          </label>
          <div>
            <label className="section-label block mb-1.5">Handoff notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes for the recipient of this export…"
              rows={3}
              className="w-full rounded-xl px-3 py-2.5 text-sm resize-none bg-surface-raised border border-border text-white placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-white/20"
            />
          </div>
        </div>
      </Card>

      {/* In-progress export status */}
      {pendingExport && pendingExport.status === "pending" && (
        <Card>
          <div className="flex items-center gap-3">
            <Spinner size="sm" />
            <div>
              <p className="text-sm text-white">Building export package…</p>
              <p className="text-xs text-text-muted">This may take up to a minute</p>
            </div>
          </div>
        </Card>
      )}

      {error && <p className="text-sm text-danger">{error}</p>}

      {/* Initiate button */}
      <Button
        size="lg"
        onClick={handleInitiate}
        loading={isInitiating}
        disabled={!!pendingExport && pendingExport.status === "pending"}
        className="w-full"
      >
        {isInitiating ? "Initiating…" : "Export Package"}
      </Button>

      {/* Export history */}
      {(exports.length > 0 || isLoadingList) && (
        <div>
          <p className="section-label mb-3">Export History</p>
          {isLoadingList ? (
            <div className="flex items-center gap-2 text-text-secondary text-sm">
              <Spinner size="sm" />
              <span>Loading…</span>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {exports.map((record) => (
                <ExportHistoryRow key={record.export_id} record={record} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ExportHistoryRow({ record }: { record: ExportRecord }) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-surface border border-border px-4 py-3 gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <Badge variant={statusVariant(record.status as "pending" | "completed" | "failed")}>
          {record.status}
        </Badge>
        <span className="text-xs text-text-muted truncate">
          {new Date(record.created_at).toLocaleString()}
        </span>
      </div>
      {record.status === "completed" && record.download_url && (
        <a
          href={record.download_url}
          download
          className="text-xs text-white underline underline-offset-2 hover:text-text-secondary transition-colors shrink-0"
        >
          Download
        </a>
      )}
      {record.expires_at && (
        <span className="text-[10px] text-text-muted shrink-0">
          Expires {new Date(record.expires_at).toLocaleDateString()}
        </span>
      )}
    </div>
  );
}
