"use client";

import { useRef, useEffect, useState, useCallback } from "react";
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
  onZoomChanged?: (zoom: number) => void;
  imageOverlayToAdd?: { assetId: string; url: string; width: number; height: number } | null;
  onImageOverlayAdded?: () => void;
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
  onZoomChanged,
  imageOverlayToAdd,
  onImageOverlayAdded,
}: CanvasAreaProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<CanvasEngine | null>(null);
  const [textOverlayPos, setTextOverlayPos] = useState<{ x: number; y: number } | null>(null);

  const cursorClass = getCursorClass(activeTool);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !canvasState) return;
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
    engine.onZoomChanged = (z) => onZoomChanged?.(z);
    engine.onInteractionChanged = ({ textOverlayPos: pos }) => setTextOverlayPos(pos);
    engineRef.current = engine;

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasState !== null]);

  useEffect(() => { engineRef.current?.setTool(activeTool); }, [activeTool]);
  useEffect(() => { engineRef.current?.setColor(activeColor); }, [activeColor]);
  useEffect(() => { engineRef.current?.setStrokeWidth(strokeWidth); }, [strokeWidth]);
  useEffect(() => { engineRef.current?.setZoom(zoom); }, [zoom]);

  useEffect(() => {
    if (imageOverlayToAdd && engineRef.current) {
      engineRef.current.addImageOverlay(
        imageOverlayToAdd.assetId,
        imageOverlayToAdd.url,
        imageOverlayToAdd.width,
        imageOverlayToAdd.height,
      );
      onImageOverlayAdded?.();
    }
  }, [imageOverlayToAdd, onImageOverlayAdded]);

  const handleTextCommit = useCallback((text: string) => {
    if (!textOverlayPos || !engineRef.current) return;
    engineRef.current.commitText(text, textOverlayPos, 18, activeColor);
    setTextOverlayPos(null);
  }, [textOverlayPos, activeColor]);

  const handleTextCancel = useCallback(() => {
    setTextOverlayPos(null);
    if (engineRef.current) {
      engineRef.current.commitText("", { x: 0, y: 0 }, 18, "#000000");
    }
  }, []);

  const textScreenX = textOverlayPos
    ? textOverlayPos.x * zoom
    : 0;
  const textScreenY = textOverlayPos
    ? textOverlayPos.y * zoom
    : 0;

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

      {textOverlayPos && (
        <TextOverlayInput
          x={textScreenX}
          y={textScreenY}
          color={activeColor}
          onCommit={handleTextCommit}
          onCancel={handleTextCancel}
        />
      )}

      <div className="absolute bottom-3 right-3 text-[11px] text-neutral-400 bg-white/80 backdrop-blur-sm rounded-lg px-2 py-1">
        {Math.round(zoom * 100)}%
      </div>
    </div>
  );
}

interface TextOverlayInputProps {
  x: number;
  y: number;
  color: string;
  onCommit: (text: string) => void;
  onCancel: () => void;
}

function TextOverlayInput({ x, y, color, onCommit, onCancel }: TextOverlayInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onCommit(inputRef.current?.value ?? "");
    } else if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    }
  };

  const handleBlur = () => {
    onCommit(inputRef.current?.value ?? "");
  };

  return (
    <input
      ref={inputRef}
      type="text"
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      className="absolute z-20 bg-transparent border-none outline-none text-[18px] font-sans min-w-[4ch]"
      style={{
        left: x,
        top: y,
        color,
        caretColor: color,
      }}
      aria-label="Text input"
    />
  );
}

function getCursorClass(tool: DrawingTool): string {
  switch (tool) {
    case "select": return "cursor-default";
    case "move": return "cursor-grab active:cursor-grabbing";
    case "eraser": return "cursor-cell";
    case "text": return "cursor-text";
    case "zoom_in":
    case "zoom_out": return "cursor-zoom-in";
    default: return "cursor-crosshair";
  }
}
