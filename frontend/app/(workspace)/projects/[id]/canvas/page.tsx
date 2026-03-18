"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { CanvasArea } from "@/components/workspace/CanvasArea";
import { ToolBar } from "@/components/workspace/ToolBar";
import { AgentPanel } from "@/components/workspace/AgentPanel";
import { UploadButton } from "@/components/workspace/UploadButton";
import { DetailViewModal } from "@/components/workspace/DetailViewModal";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { getProject } from "@/lib/services/projects";
import { getLatestCanvas, saveCanvas } from "@/lib/services/canvas";
import { listResponses } from "@/lib/services/ai";
import type {
  Project,
  CanvasState,
  CanvasElement,
  UploadedAsset,
  AgentResponse,
  ToolbarState,
} from "@/types";

type SaveStatus = "saved" | "saving" | "unsaved" | null;

const INITIAL_TOOLBAR: ToolbarState = {
  activeTool: "pen",
  activeColor: "#000000",
  strokeWidth: 2,
  zoom: 1,
};

const EMPTY_CANVAS: CanvasState = {
  version: 1,
  width: 2560,
  height: 1920,
  background: "#FFFFFF",
  elements: [],
};

export default function CanvasPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const router = useRouter();

  const [project, setProject] = useState<Project | null>(null);
  const [canvasState, setCanvasState] = useState<CanvasState | null>(null);
  const [responses, setResponses] = useState<AgentResponse[]>([]);
  const [toolbar, setToolbar] = useState<ToolbarState>(INITIAL_TOOLBAR);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>(null);
  const [isAgentPanelOpen, setIsAgentPanelOpen] = useState(true);
  const [isDetailViewOpen, setIsDetailViewOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingImageOverlay, setPendingImageOverlay] = useState<{
    assetId: string; url: string; width: number; height: number;
  } | null>(null);

  useEffect(() => {
    if (!projectId) return;
    Promise.all([
      getProject(projectId),
      getLatestCanvas(projectId),
      listResponses(projectId),
    ])
      .then(([proj, snapshot, { responses: hist }]) => {
        setProject(proj);
        setCanvasState(snapshot?.state_json ?? EMPTY_CANVAS);
        setResponses(hist);
        setSaveStatus(snapshot ? "saved" : null);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load canvas"),
      )
      .finally(() => setIsLoading(false));
  }, [projectId]);

  const handleCanvasModified = useCallback(() => setSaveStatus("unsaved"), []);

  const handleSave = useCallback(async () => {
    if (!projectId || !canvasState) return;
    setSaveStatus("saving");
    try {
      await saveCanvas(projectId, { state_json: canvasState, trigger: "manual" });
      setSaveStatus("saved");
    } catch {
      setSaveStatus("unsaved");
    }
  }, [projectId, canvasState]);

  // ⌘S / Ctrl+S shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (saveStatus === "unsaved") handleSave();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [handleSave, saveStatus]);

  useEffect(() => {
    if (!projectId || !canvasState) return;
    const interval = setInterval(() => {
      if (saveStatus === "unsaved") {
        saveCanvas(projectId, { state_json: canvasState, trigger: "auto" }).catch(() => {});
        setSaveStatus("saved");
      }
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [projectId, canvasState, saveStatus]);

  const handleElementsChanged = useCallback((elements: CanvasElement[]) => {
    setCanvasState((prev) => prev ? { ...prev, elements } : prev);
  }, []);

  const handleZoomChanged = useCallback((zoom: number) => {
    setToolbar((t) => ({ ...t, zoom }));
  }, []);

  const handleAssetUploaded = (asset: UploadedAsset) => {
    const img = new window.Image();
    img.onload = () => {
      const maxDim = 800;
      const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
      setPendingImageOverlay({
        assetId: asset.asset_id,
        url: asset.storage_url,
        width: Math.round(img.naturalWidth * scale),
        height: Math.round(img.naturalHeight * scale),
      });
    };
    img.onerror = () => {
      setPendingImageOverlay({ assetId: asset.asset_id, url: asset.storage_url, width: 400, height: 300 });
    };
    img.src = asset.storage_url;
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Spinner size="lg" label="Loading canvas…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6">
        <p className="text-danger text-sm">{error}</p>
        <Button variant="ghost" onClick={() => router.push("/projects")}>
          Back to projects
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Canvas action bar — upload / detail view / save status */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-surface shrink-0">
        <UploadButton projectId={projectId} onUploaded={handleAssetUploaded} />

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsDetailViewOpen(true)}
          title="Generate Detail View (on demand)"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="7" cy="7" r="5.5" />
            <circle cx="7" cy="7" r="2" />
          </svg>
          Detail View
        </Button>

        <div className="flex-1" />

        {/* Save status */}
        {saveStatus && (
          <span className="flex items-center gap-1.5 text-[11px] text-text-muted">
            <SaveDot status={saveStatus} />
            {saveStatus === "saving" ? "Saving…" : saveStatus === "saved" ? "Saved" : "Unsaved changes"}
          </span>
        )}
        {saveStatus === "unsaved" && (
          <Button size="sm" onClick={handleSave}>Save</Button>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden">
        <aside className="hidden md:flex flex-col bg-surface border-r border-border shrink-0">
          <ToolBar state={toolbar} onChange={(p) => setToolbar((t) => ({ ...t, ...p }))} />
        </aside>

        <CanvasArea
          canvasState={canvasState}
          activeTool={toolbar.activeTool}
          activeColor={toolbar.activeColor}
          strokeWidth={toolbar.strokeWidth}
          zoom={toolbar.zoom}
          isLoading={false}
          onModified={handleCanvasModified}
          onElementsChanged={handleElementsChanged}
          onZoomChanged={handleZoomChanged}
          imageOverlayToAdd={pendingImageOverlay}
          onImageOverlayAdded={() => setPendingImageOverlay(null)}
        />

        <AgentPanel
          projectId={projectId}
          initialResponses={responses}
          isOpen={isAgentPanelOpen}
          onClose={() => setIsAgentPanelOpen(false)}
        />
      </div>

      <DetailViewModal
        isOpen={isDetailViewOpen}
        onClose={() => setIsDetailViewOpen(false)}
        projectId={projectId}
      />
    </div>
  );
}

function SaveDot({ status }: { status: "saved" | "saving" | "unsaved" }) {
  const cls = {
    saved: "bg-success",
    saving: "bg-warning animate-pulse",
    unsaved: "bg-text-muted",
  }[status];
  return <span className={`h-1.5 w-1.5 rounded-full ${cls}`} aria-hidden />;
}
