"use client";

import { useRef, useEffect, useCallback } from "react";
import type { CanvasState, DrawingTool } from "@/types";
import { Spinner } from "@/components/ui/Spinner";

interface CanvasAreaProps {
  canvasState: CanvasState | null;
  activeTool: DrawingTool;
  zoom: number;
  isLoading?: boolean;
  /** Called when canvas has been modified — used to track "unsaved" status */
  onModified?: () => void;
}

// ─── Canvas Area scaffold ─────────────────────────────────────────────────────
// Step 9: Renders the canvas container and placeholder.
// Step 11: Replace placeholder with Konva.js / HTML5 Canvas drawing engine.
//
// The canvas element is referenced via `canvasRef` — attach the drawing engine here.
// `canvasState.elements` is the authoritative list of what should be rendered.
// `onModified` fires whenever the user draws/edits, enabling the save status indicator.

export function CanvasArea({ canvasState, activeTool, zoom, isLoading, onModified }: CanvasAreaProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const cursorClass = getCursorClass(activeTool);

  // Step 11: Initialize drawing engine here using canvasRef.current
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !canvasState) return;
    // TODO(Step 11): Initialize Konva.js Stage or equivalent, load canvasState.elements
  }, [canvasState]);

  // Step 11: Update zoom transform here
  useEffect(() => {
    // TODO(Step 11): Apply zoom/pan transform to canvas stage
  }, [zoom]);

  // Step 11: Update active tool cursor/mode here
  useEffect(() => {
    // TODO(Step 11): Switch drawing engine mode based on activeTool
  }, [activeTool]);

  const handlePointerDown = useCallback(() => {
    // TODO(Step 11): Begin drawing operation
    onModified?.();
  }, [onModified]);

  return (
    <div
      ref={containerRef}
      className={[
        "relative flex-1 overflow-hidden bg-white",
        cursorClass,
      ].join(" ")}
      role="region"
      aria-label="Canvas workspace"
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
          <Spinner size="lg" label="Loading canvas…" />
        </div>
      )}

      {/* HTML5 Canvas element — drawing engine attaches here in Step 11 */}
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 touch-none"
        style={{
          width: canvasState?.width ?? 2560,
          height: canvasState?.height ?? 1920,
          transform: `scale(${zoom})`,
          transformOrigin: "top left",
        }}
        width={canvasState?.width ?? 2560}
        height={canvasState?.height ?? 1920}
        onPointerDown={handlePointerDown}
      />

      {/* Placeholder — visible until drawing engine renders content */}
      {!isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none select-none">
          <div className="text-center opacity-20">
            <p className="text-4xl mb-2">✏️</p>
            <p className="text-xs text-neutral-400">
              Canvas ready — drawing engine connects in Step 11
            </p>
            {canvasState && (
              <p className="text-[10px] text-neutral-400 mt-1">
                {canvasState.elements.length} element{canvasState.elements.length !== 1 ? "s" : ""} in state
              </p>
            )}
          </div>
        </div>
      )}

      {/* Zoom level overlay */}
      <div className="absolute bottom-3 right-3 text-[11px] text-neutral-400 bg-white/80 backdrop-blur-sm rounded-lg px-2 py-1">
        {Math.round(zoom * 100)}%
      </div>
    </div>
  );
}

function getCursorClass(tool: DrawingTool): string {
  switch (tool) {
    case "select": return "cursor-default";
    case "move": return "cursor-grab active:cursor-grabbing";
    case "eraser": return "cursor-cell";
    case "zoom_in":
    case "zoom_out": return "cursor-zoom-in";
    default: return "cursor-crosshair";
  }
}
