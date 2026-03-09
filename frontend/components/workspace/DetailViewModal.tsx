"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge, statusVariant } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import type { DetailViewResult } from "@/types";
import { triggerDetailView, getDetailView } from "@/lib/services/detail-view";

interface DetailViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}

const POLL_INTERVAL_MS = 3000;

export function DetailViewModal({ isOpen, onClose, projectId }: DetailViewModalProps) {
  const [result, setResult] = useState<DetailViewResult | null>(null);
  const [prompt, setPrompt] = useState("");
  const [isTriggering, setIsTriggering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Poll for status while pending
  useEffect(() => {
    if (!result || result.status !== "pending") return;
    const interval = setInterval(async () => {
      try {
        const updated = await getDetailView(projectId, result.result_id);
        setResult(updated);
        if (updated.status !== "pending") clearInterval(interval);
      } catch {
        clearInterval(interval);
      }
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [result, projectId]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setResult(null);
      setPrompt("");
      setError(null);
    }
  }, [isOpen]);

  const handleTrigger = async () => {
    setIsTriggering(true);
    setError(null);
    try {
      const r = await triggerDetailView(projectId, { user_prompt: prompt || undefined });
      setResult(r);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to trigger Detail View");
    } finally {
      setIsTriggering(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Detail View" size="lg">
      {/* Detail View is on-demand only — never auto-generated */}
      {!result ? (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-text-secondary">
            Generate a high-fidelity visualization from the current canvas state. Optional: add a prompt to guide the output.
          </p>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Optional: describe what you want to visualize…"
            rows={3}
            className="w-full rounded-xl px-3 py-2.5 text-sm resize-none bg-surface-raised border border-border text-white placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-white/20"
          />
          {error && <p className="text-sm text-danger">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
            <Button loading={isTriggering} onClick={handleTrigger}>
              Generate
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Status */}
          <div className="flex items-center gap-2">
            <Badge variant={statusVariant(result.status as "pending" | "completed" | "failed")}>
              {result.status}
            </Badge>
            <span className="text-xs text-text-muted">
              {result.status === "pending"
                ? "Generating… (this may take a moment)"
                : result.status === "completed"
                ? "Ready"
                : "Generation failed"}
            </span>
          </div>

          {/* Pending spinner */}
          {result.status === "pending" && (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" label="Generating Detail View…" />
            </div>
          )}

          {/* Result image */}
          {result.status === "completed" && result.storage_url && (
            <div className="rounded-2xl overflow-hidden border border-border bg-surface-raised">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={result.storage_url}
                alt="Detail View result"
                className="w-full h-auto max-h-[60vh] object-contain"
              />
            </div>
          )}

          {/* Error */}
          {result.status === "failed" && (
            <div className="rounded-2xl border border-danger/30 bg-danger/5 p-4">
              <p className="text-sm text-danger">{result.error_message ?? "Unknown error"}</p>
            </div>
          )}

          <div className="flex justify-between gap-2">
            <Button variant="ghost" size="sm" onClick={() => setResult(null)}>
              New request
            </Button>
            <Button variant="secondary" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
