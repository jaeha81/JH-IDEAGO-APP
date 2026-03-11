"use client";

import { useRef, useEffect } from "react";
import type { CanvasState, CanvasElement, DrawingTool } from "@/types";
import { CanvasEngine } from "@/lib/canvas/engine";
import { Spinner } from "@/components/ui/Spinner";

interface CanvasAreaProps {
  canvasState: CanvasState | null;
  activeTool: DrawingTool;
  activeColor: string;
  strokeWidth: number;
  zoom: number;
  isLoading?: boolean;
  onModified?: () => void;
  onElementsChanged?: (elements: CanvasElement[]) => void;
}

export function CanvasArea({
  canvasState,
  activeTool,
  activeColor,
  strokeWidth,
  zoom,
  isLoading,
  onModified,
  onElementsChanged,
}: CanvasAreaProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<CanvasEngine | null>(null);

  const cursorClass = getCursorClass(activeTool);

  // Initialize engine once when canvas and state are ready
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !canvasState) return;

    // Avoid re-init if engine already exists for this canvas
    if (engineRef.current) return;

    const engine = new CanvasEngine(canvas, {
      width: canvasState.width,
      height: canvasState.height,
      background: canvasState.background,
    });
    engine.setElements(canvasState.elements);
    engine.onElementsChanged = (elements) => {
      onElementsChanged?.(elements);
      onModified?.();
    };
    engineRef.current = engine;

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
    // Only init once — stable dependencies
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasState !== null]);

  // Sync tool
  useEffect(() => {
    engineRef.current?.setTool(activeTool);
  }, [activeTool]);

  // Sync color
  useEffect(() => {
    engineRef.current?.setColor(activeColor);
  }, [activeColor]);

  // Sync stroke width
  useEffect(() => {
    engineRef.current?.setStrokeWidth(strokeWidth);
  }, [strokeWidth]);

  // Sync zoom
  useEffect(() => {
    engineRef.current?.setZoom(zoom);
  }, [zoom]);

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

      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 touch-none"
        style={{
          width: canvasState?.width ?? 2560,
          height: canvasState?.height ?? 1920,
        }}
        width={canvasState?.width ?? 2560}
        height={canvasState?.height ?? 1920}
      />

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
