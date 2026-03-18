import type { CanvasElement, StrokeData, ShapeData } from "@/types";
import type { InteractionState, ViewportState } from "./types";
import { generateId, screenToCanvas } from "./utils";
import { findElementAt, findElementsAt } from "./hit-test";

// ─── Pointer event phase type ────────────────────────────────────────────────

type Phase = "down" | "move" | "up";

// ─── Tool handler result ─────────────────────────────────────────────────────

export interface ToolResult {
  interaction: Partial<InteractionState>;
  addElement?: CanvasElement;
  removeIds?: string[];
  /** Viewport pan delta (move tool) — not undoable */
  viewportDelta?: { dx: number; dy: number };
  /** Move an existing element by delta (select tool drag) */
  moveElement?: { id: string; dx: number; dy: number };
}

// ─── Main dispatcher ─────────────────────────────────────────────────────────

export function handleToolEvent(
  phase: Phase,
  e: PointerEvent,
  interaction: InteractionState,
  viewport: ViewportState,
  elements: CanvasElement[],
  canvasRect: DOMRect,
): ToolResult {
  const pos = screenToCanvas(e.clientX, e.clientY, canvasRect, viewport);

  switch (interaction.tool) {
    case "pen":
      return handlePen(phase, pos, interaction, elements);
    case "brush":
      return handleBrush(phase, pos, interaction, elements);
    case "eraser":
      return handleEraser(phase, pos, interaction, elements);
    case "line":
      return handleShapeDrag(phase, pos, interaction, elements, "line");
    case "rect":
      return handleShapeDrag(phase, pos, interaction, elements, "rect");
    case "circle":
      return handleShapeDrag(phase, pos, interaction, elements, "circle");
    case "arrow":
      return handleShapeDrag(phase, pos, interaction, elements, "arrow");
    case "text":
      return handleText(phase, pos);
    case "select":
      return handleSelect(phase, pos, interaction, elements);
    case "move":
      return handlePan(phase, interaction, e.clientX, e.clientY, viewport.zoom);
    default:
      return { interaction: {} };
  }
}

// ─── Pen tool ────────────────────────────────────────────────────────────────

function handlePen(
  phase: Phase,
  pos: { x: number; y: number },
  interaction: InteractionState,
  elements: CanvasElement[],
): ToolResult {
  switch (phase) {
    case "down":
      return {
        interaction: {
          isDrawing: true,
          currentPoints: [[pos.x, pos.y]],
          selectedElementId: null,
        },
      };

    case "move":
      if (!interaction.isDrawing) return { interaction: {} };
      return {
        interaction: {
          currentPoints: [...interaction.currentPoints, [pos.x, pos.y]],
        },
      };

    case "up": {
      if (!interaction.isDrawing || interaction.currentPoints.length < 2) {
        return { interaction: { isDrawing: false, currentPoints: [] } };
      }
      const points = interaction.currentPoints;
      // Normalize points relative to bounding box origin
      let minX = Infinity, minY = Infinity;
      for (const [px, py] of points) {
        if (px < minX) minX = px;
        if (py < minY) minY = py;
      }
      const normalized: [number, number][] = points.map(([px, py]) => [px - minX, py - minY]);

      const newElement: CanvasElement = {
        id: generateId(),
        type: "stroke",
        z_index: nextZIndex(elements),
        position_x: minX,
        position_y: minY,
        data: {
          points: normalized,
          color: interaction.color,
          width: interaction.strokeWidth,
          opacity: 1,
          tool: "pen",
        } as StrokeData,
      };

      return {
        interaction: { isDrawing: false, currentPoints: [] },
        addElement: newElement,
      };
    }
  }
}

// ─── Brush tool ──────────────────────────────────────────────────────────────

function handleBrush(
  phase: Phase,
  pos: { x: number; y: number },
  interaction: InteractionState,
  elements: CanvasElement[],
): ToolResult {
  switch (phase) {
    case "down":
      return {
        interaction: {
          isDrawing: true,
          currentPoints: [[pos.x, pos.y]],
          selectedElementId: null,
        },
      };

    case "move":
      if (!interaction.isDrawing) return { interaction: {} };
      return {
        interaction: {
          currentPoints: [...interaction.currentPoints, [pos.x, pos.y]],
        },
      };

    case "up": {
      if (!interaction.isDrawing || interaction.currentPoints.length < 2) {
        return { interaction: { isDrawing: false, currentPoints: [] } };
      }
      const points = interaction.currentPoints;
      let minX = Infinity, minY = Infinity;
      for (const [px, py] of points) {
        if (px < minX) minX = px;
        if (py < minY) minY = py;
      }
      const normalized: [number, number][] = points.map(([px, py]) => [px - minX, py - minY]);

      const newElement: CanvasElement = {
        id: generateId(),
        type: "stroke",
        z_index: nextZIndex(elements),
        position_x: minX,
        position_y: minY,
        data: {
          points: normalized,
          color: interaction.color,
          width: Math.max(interaction.strokeWidth * 3, 8),
          opacity: 0.45,
          tool: "brush",
        } as StrokeData,
      };

      return {
        interaction: { isDrawing: false, currentPoints: [] },
        addElement: newElement,
      };
    }
  }
}

// ─── Eraser tool ─────────────────────────────────────────────────────────────

function handleEraser(
  phase: Phase,
  pos: { x: number; y: number },
  interaction: InteractionState,
  elements: CanvasElement[],
): ToolResult {
  switch (phase) {
    case "down": {
      const hits = findElementsAt(elements, pos.x, pos.y);
      return {
        interaction: { isDrawing: true, selectedElementId: null },
        removeIds: hits.map((el) => el.id),
      };
    }

    case "move": {
      if (!interaction.isDrawing) return { interaction: {} };
      const hits = findElementsAt(elements, pos.x, pos.y);
      if (hits.length > 0) {
        return { removeIds: hits.map((el) => el.id), interaction: {} };
      }
      return { interaction: {} };
    }

    case "up":
      return { interaction: { isDrawing: false } };
  }
}

// ─── Shape drag tools (line, rect, circle) ───────────────────────────────────

function handleShapeDrag(
  phase: Phase,
  pos: { x: number; y: number },
  interaction: InteractionState,
  elements: CanvasElement[],
  shapeType: "rect" | "circle" | "line" | "arrow",
): ToolResult {
  switch (phase) {
    case "down":
      return {
        interaction: {
          isDrawing: true,
          dragOrigin: { x: pos.x, y: pos.y },
          selectedElementId: null,
        },
      };

    case "move":
      // Preview is handled by engine using dragOrigin + current pointer pos
      return { interaction: {} };

    case "up": {
      if (!interaction.isDrawing || !interaction.dragOrigin) {
        return { interaction: { isDrawing: false, dragOrigin: null } };
      }
      const w = pos.x - interaction.dragOrigin.x;
      const h = pos.y - interaction.dragOrigin.y;

      // Ignore tiny drags (accidental clicks)
      if (Math.abs(w) < 3 && Math.abs(h) < 3) {
        return { interaction: { isDrawing: false, dragOrigin: null } };
      }

      const newElement: CanvasElement = {
        id: generateId(),
        type: "shape",
        z_index: nextZIndex(elements),
        position_x: interaction.dragOrigin.x,
        position_y: interaction.dragOrigin.y,
        data: {
          shape_type: shapeType,
          width: w,
          height: h,
          fill: "transparent",
          stroke_color: interaction.color,
          stroke_width: interaction.strokeWidth,
        } as ShapeData,
      };

      return {
        interaction: { isDrawing: false, dragOrigin: null },
        addElement: newElement,
      };
    }
  }
}

// ─── Text tool ───────────────────────────────────────────────────────────────

function handleText(
  phase: Phase,
  pos: { x: number; y: number },
): ToolResult {
  if (phase === "down") {
    return {
      interaction: {
        textOverlayPos: { x: pos.x, y: pos.y },
        selectedElementId: null,
        isDrawing: false,
      },
    };
  }
  return { interaction: {} };
}

// ─── Pan tool (viewport move) ────────────────────────────────────────────────

function handlePan(
  phase: Phase,
  interaction: InteractionState,
  screenX: number,
  screenY: number,
  zoom: number,
): ToolResult {
  switch (phase) {
    case "down":
      return {
        interaction: {
          isDrawing: true,
          panLastScreenX: screenX,
          panLastScreenY: screenY,
          selectedElementId: null,
        },
      };

    case "move": {
      if (!interaction.isDrawing) return { interaction: {} };
      const dx = (screenX - interaction.panLastScreenX) / zoom;
      const dy = (screenY - interaction.panLastScreenY) / zoom;
      return {
        interaction: {
          panLastScreenX: screenX,
          panLastScreenY: screenY,
        },
        viewportDelta: { dx, dy },
      };
    }

    case "up":
      return { interaction: { isDrawing: false } };
  }
}

// ─── Select tool (with drag-move) ────────────────────────────────────────────

function handleSelect(
  phase: Phase,
  pos: { x: number; y: number },
  interaction: InteractionState,
  elements: CanvasElement[],
): ToolResult {
  switch (phase) {
    case "down": {
      const hit = findElementAt(elements, pos.x, pos.y);
      if (hit) {
        return {
          interaction: {
            selectedElementId: hit.id,
            isDrawing: true,
            dragOrigin: { x: pos.x, y: pos.y },
            hasMoved: false,
          },
        };
      }
      // Clicked empty area — deselect
      return {
        interaction: {
          selectedElementId: null,
          isDrawing: false,
        },
      };
    }

    case "move": {
      if (
        !interaction.isDrawing ||
        !interaction.selectedElementId ||
        !interaction.dragOrigin
      ) {
        return { interaction: {} };
      }
      const dx = pos.x - interaction.dragOrigin.x;
      const dy = pos.y - interaction.dragOrigin.y;
      // Drag threshold — ignore tiny moves
      if (!interaction.hasMoved && Math.abs(dx) < 3 && Math.abs(dy) < 3) {
        return { interaction: {} };
      }
      return {
        interaction: {
          dragOrigin: { x: pos.x, y: pos.y },
          hasMoved: true,
        },
        moveElement: {
          id: interaction.selectedElementId,
          dx,
          dy,
        },
      };
    }

    case "up":
      return {
        interaction: { isDrawing: false, dragOrigin: null },
      };
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function nextZIndex(elements: CanvasElement[]): number {
  if (elements.length === 0) return 1;
  return Math.max(...elements.map((el) => el.z_index)) + 1;
}
