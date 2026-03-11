import type { CanvasElement, StrokeData, ShapeData } from "@/types";
import type { ViewportState } from "./types";

// ─── Main render pipeline ────────────────────────────────────────────────────

export function renderScene(
  ctx: CanvasRenderingContext2D,
  elements: CanvasElement[],
  viewport: ViewportState,
  background: string,
  selectedId: string | null,
): void {
  const { width, height } = ctx.canvas;

  // Clear
  ctx.clearRect(0, 0, width, height);

  // Background
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, height);

  // Apply viewport transform
  ctx.save();
  ctx.scale(viewport.zoom, viewport.zoom);
  ctx.translate(viewport.offsetX, viewport.offsetY);

  // Sort by z_index and render
  const sorted = [...elements].sort((a, b) => a.z_index - b.z_index);
  for (const el of sorted) {
    renderElement(ctx, el);
  }

  // Selection highlight
  if (selectedId) {
    const sel = elements.find((e) => e.id === selectedId);
    if (sel) renderSelectionHighlight(ctx, sel);
  }

  ctx.restore();
}

// ─── Element dispatch ────────────────────────────────────────────────────────

function renderElement(ctx: CanvasRenderingContext2D, el: CanvasElement): void {
  switch (el.type) {
    case "stroke":
      renderStroke(ctx, el.position_x, el.position_y, el.data as StrokeData);
      break;
    case "shape":
      renderShape(ctx, el.position_x, el.position_y, el.data as ShapeData);
      break;
    // text, image_overlay → Phase A-2
    default:
      break;
  }
}

// ─── Stroke rendering ────────────────────────────────────────────────────────

function renderStroke(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  data: StrokeData,
): void {
  if (data.points.length < 2) return;

  ctx.save();
  ctx.globalAlpha = data.opacity;
  ctx.strokeStyle = data.color;
  ctx.lineWidth = data.width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.beginPath();
  const [firstX, firstY] = data.points[0];
  ctx.moveTo(ox + firstX, oy + firstY);

  for (let i = 1; i < data.points.length; i++) {
    const [x, y] = data.points[i];
    ctx.lineTo(ox + x, oy + y);
  }

  ctx.stroke();
  ctx.restore();
}

// ─── Shape rendering ─────────────────────────────────────────────────────────

function renderShape(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  data: ShapeData,
): void {
  ctx.save();
  ctx.strokeStyle = data.stroke_color;
  ctx.lineWidth = data.stroke_width;

  switch (data.shape_type) {
    case "rect":
      if (data.fill && data.fill !== "transparent") {
        ctx.fillStyle = data.fill;
        ctx.fillRect(ox, oy, data.width, data.height);
      }
      ctx.strokeRect(ox, oy, data.width, data.height);
      break;

    case "circle": {
      const rx = Math.abs(data.width) / 2;
      const ry = Math.abs(data.height) / 2;
      const cx = ox + data.width / 2;
      const cy = oy + data.height / 2;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      if (data.fill && data.fill !== "transparent") {
        ctx.fillStyle = data.fill;
        ctx.fill();
      }
      ctx.stroke();
      break;
    }

    case "line":
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.lineTo(ox + data.width, oy + data.height);
      ctx.stroke();
      break;

    // arrow → Phase A-2
    default:
      break;
  }

  ctx.restore();
}

// ─── Selection highlight ─────────────────────────────────────────────────────

function renderSelectionHighlight(
  ctx: CanvasRenderingContext2D,
  el: CanvasElement,
): void {
  const bounds = getElementBounds(el);
  if (!bounds) return;

  const pad = 4;
  ctx.save();
  ctx.strokeStyle = "#3B82F6";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 4]);
  ctx.strokeRect(
    bounds.x - pad,
    bounds.y - pad,
    bounds.w + pad * 2,
    bounds.h + pad * 2,
  );
  ctx.setLineDash([]);
  ctx.restore();
}

// ─── Bounding box helper ─────────────────────────────────────────────────────

export function getElementBounds(
  el: CanvasElement,
): { x: number; y: number; w: number; h: number } | null {
  switch (el.type) {
    case "stroke": {
      const data = el.data as StrokeData;
      if (data.points.length === 0) return null;
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const [px, py] of data.points) {
        const x = el.position_x + px;
        const y = el.position_y + py;
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
      return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
    }
    case "shape": {
      const data = el.data as ShapeData;
      const x = Math.min(el.position_x, el.position_x + data.width);
      const y = Math.min(el.position_y, el.position_y + data.height);
      return {
        x,
        y,
        w: Math.abs(data.width),
        h: Math.abs(data.height),
      };
    }
    default:
      return null;
  }
}

// ─── Preview rendering (during active drawing) ──────────────────────────────

export function renderPreviewStroke(
  ctx: CanvasRenderingContext2D,
  points: [number, number][],
  color: string,
  width: number,
  viewport: ViewportState,
): void {
  if (points.length < 2) return;

  ctx.save();
  ctx.scale(viewport.zoom, viewport.zoom);
  ctx.translate(viewport.offsetX, viewport.offsetY);

  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i][0], points[i][1]);
  }
  ctx.stroke();
  ctx.restore();
}

export function renderPreviewShape(
  ctx: CanvasRenderingContext2D,
  shapeType: "rect" | "circle" | "line",
  originX: number,
  originY: number,
  currentX: number,
  currentY: number,
  color: string,
  strokeWidth: number,
  viewport: ViewportState,
): void {
  ctx.save();
  ctx.scale(viewport.zoom, viewport.zoom);
  ctx.translate(viewport.offsetX, viewport.offsetY);

  ctx.strokeStyle = color;
  ctx.lineWidth = strokeWidth;
  ctx.setLineDash([4, 4]);

  const w = currentX - originX;
  const h = currentY - originY;

  switch (shapeType) {
    case "rect":
      ctx.strokeRect(originX, originY, w, h);
      break;
    case "circle": {
      const rx = Math.abs(w) / 2;
      const ry = Math.abs(h) / 2;
      const cx = originX + w / 2;
      const cy = originY + h / 2;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }
    case "line":
      ctx.beginPath();
      ctx.moveTo(originX, originY);
      ctx.lineTo(currentX, currentY);
      ctx.stroke();
      break;
  }

  ctx.setLineDash([]);
  ctx.restore();
}
