import type { ViewportState } from "./types";

// ─── ID generation ───────────────────────────────────────────────────────────

let counter = 0;

export function generateId(): string {
  counter += 1;
  return `el_${Date.now().toString(36)}_${counter.toString(36)}`;
}

// ─── Coordinate transforms ──────────────────────────────────────────────────

/** Convert screen (pointer event) coordinates to canvas coordinates */
export function screenToCanvas(
  clientX: number,
  clientY: number,
  canvasRect: DOMRect,
  viewport: ViewportState,
): { x: number; y: number } {
  return {
    x: (clientX - canvasRect.left) / viewport.zoom - viewport.offsetX,
    y: (clientY - canvasRect.top) / viewport.zoom - viewport.offsetY,
  };
}

// ─── Geometry helpers ────────────────────────────────────────────────────────

export function distance(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): number {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

/** Point-to-segment distance for hit testing lines/strokes */
export function pointToSegmentDistance(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
): number {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return distance(px, py, ax, ay);
  let t = ((px - ax) * dx + (py - ay) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return distance(px, py, ax + t * dx, ay + t * dy);
}
