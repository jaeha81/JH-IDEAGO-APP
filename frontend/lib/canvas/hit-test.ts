import type { CanvasElement, StrokeData, ShapeData, TextData, ImageOverlayData } from "@/types";
import { pointToSegmentDistance, distance } from "./utils";

const HIT_TOLERANCE = 8; // pixels

// ─── Public API ──────────────────────────────────────────────────────────────

/** Find the topmost element at (x, y) in canvas coordinates. */
export function findElementAt(
  elements: CanvasElement[],
  x: number,
  y: number,
): CanvasElement | null {
  // Iterate in reverse z_index order (top element first)
  const sorted = [...elements].sort((a, b) => b.z_index - a.z_index);
  for (const el of sorted) {
    if (hitTest(el, x, y)) return el;
  }
  return null;
}

/** Find all elements intersecting a point (for eraser sweeping). */
export function findElementsAt(
  elements: CanvasElement[],
  x: number,
  y: number,
): CanvasElement[] {
  return elements.filter((el) => hitTest(el, x, y));
}

// ─── Hit test dispatch ───────────────────────────────────────────────────────

function hitTest(el: CanvasElement, x: number, y: number): boolean {
  switch (el.type) {
    case "stroke":
      return hitTestStroke(el, x, y);
    case "shape":
      return hitTestShape(el, x, y);
    case "text":
      return hitTestText(el, x, y);
    case "image_overlay":
      return hitTestImageOverlay(el, x, y);
    default:
      return false;
  }
}

// ─── Stroke hit test ─────────────────────────────────────────────────────────

function hitTestStroke(el: CanvasElement, x: number, y: number): boolean {
  const data = el.data as StrokeData;
  if (data.points.length === 0) return false;

  const tolerance = HIT_TOLERANCE + data.width / 2;

  for (let i = 0; i < data.points.length - 1; i++) {
    const [ax, ay] = data.points[i];
    const [bx, by] = data.points[i + 1];
    const dist = pointToSegmentDistance(
      x, y,
      el.position_x + ax, el.position_y + ay,
      el.position_x + bx, el.position_y + by,
    );
    if (dist <= tolerance) return true;
  }

  // Single point stroke
  if (data.points.length === 1) {
    const [px, py] = data.points[0];
    return distance(x, y, el.position_x + px, el.position_y + py) <= tolerance;
  }

  return false;
}

// ─── Shape hit test ──────────────────────────────────────────────────────────

function hitTestShape(el: CanvasElement, x: number, y: number): boolean {
  const data = el.data as ShapeData;
  const tolerance = HIT_TOLERANCE + data.stroke_width / 2;

  switch (data.shape_type) {
    case "rect": {
      const left = Math.min(el.position_x, el.position_x + data.width);
      const right = Math.max(el.position_x, el.position_x + data.width);
      const top = Math.min(el.position_y, el.position_y + data.height);
      const bottom = Math.max(el.position_y, el.position_y + data.height);
      // Check if near border or inside filled shape
      if (data.fill && data.fill !== "transparent") {
        return x >= left - tolerance && x <= right + tolerance &&
               y >= top - tolerance && y <= bottom + tolerance;
      }
      // Stroke-only: check proximity to edges
      const nearLeft = Math.abs(x - left) <= tolerance && y >= top - tolerance && y <= bottom + tolerance;
      const nearRight = Math.abs(x - right) <= tolerance && y >= top - tolerance && y <= bottom + tolerance;
      const nearTop = Math.abs(y - top) <= tolerance && x >= left - tolerance && x <= right + tolerance;
      const nearBottom = Math.abs(y - bottom) <= tolerance && x >= left - tolerance && x <= right + tolerance;
      return nearLeft || nearRight || nearTop || nearBottom;
    }

    case "circle": {
      const cx = el.position_x + data.width / 2;
      const cy = el.position_y + data.height / 2;
      const rx = Math.abs(data.width) / 2;
      const ry = Math.abs(data.height) / 2;
      if (rx === 0 || ry === 0) return false;
      // Normalized distance from center
      const nx = (x - cx) / rx;
      const ny = (y - cy) / ry;
      const nd = nx * nx + ny * ny;
      if (data.fill && data.fill !== "transparent") {
        return nd <= (1 + tolerance / Math.min(rx, ry)) ** 2;
      }
      // Stroke-only: check proximity to ellipse border
      const normalizedDist = Math.abs(Math.sqrt(nd) - 1) * Math.min(rx, ry);
      return normalizedDist <= tolerance;
    }

    case "line":
    case "arrow": {
      const dist = pointToSegmentDistance(
        x, y,
        el.position_x, el.position_y,
        el.position_x + data.width, el.position_y + data.height,
      );
      return dist <= tolerance;
    }

    default:
      return false;
  }
}

function hitTestText(el: CanvasElement, x: number, y: number): boolean {
  const data = el.data as TextData;
  const estimatedWidth = data.content.length * data.font_size * 0.6;
  const estimatedHeight = data.font_size * 1.4;
  return (
    x >= el.position_x - HIT_TOLERANCE &&
    x <= el.position_x + estimatedWidth + HIT_TOLERANCE &&
    y >= el.position_y - HIT_TOLERANCE &&
    y <= el.position_y + estimatedHeight + HIT_TOLERANCE
  );
}

function hitTestImageOverlay(el: CanvasElement, x: number, y: number): boolean {
  const data = el.data as ImageOverlayData;
  return (
    x >= el.position_x &&
    x <= el.position_x + data.width &&
    y >= el.position_y &&
    y <= el.position_y + data.height
  );
}
