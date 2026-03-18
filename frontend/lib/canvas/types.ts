import type { CanvasElement, DrawingTool } from "@/types";

// ─── Viewport ────────────────────────────────────────────────────────────────

export interface ViewportState {
  zoom: number;     // 0.1 – 5.0
  offsetX: number;  // pan offset (Phase A-1: fixed at 0)
  offsetY: number;
}

// ─── Interaction ─────────────────────────────────────────────────────────────

export interface InteractionState {
  tool: DrawingTool;
  isDrawing: boolean;
  /** pen / eraser: accumulated freehand points */
  currentPoints: [number, number][];
  /** line / rect / circle: drag start in canvas coords */
  dragOrigin: { x: number; y: number } | null;
  /** select: currently selected element id */
  selectedElementId: string | null;
  color: string;
  strokeWidth: number;
  /** Pan tool: last screen position for delta calculation */
  panLastScreenX: number;
  panLastScreenY: number;
  /** Select+drag: whether the element was actually moved (undo gating) */
  hasMoved: boolean;
  /** Text tool: canvas position where DOM overlay input should appear */
  textOverlayPos: { x: number; y: number } | null;
}

// ─── Undo / Redo ─────────────────────────────────────────────────────────────

export interface UndoStack {
  past: CanvasElement[][];
  future: CanvasElement[][];
}

// ─── Engine options ──────────────────────────────────────────────────────────

export interface EngineOptions {
  width: number;
  height: number;
  background: string;
}

// ─── Tool handler interface ──────────────────────────────────────────────────

export interface ToolHandlerContext {
  ctx: CanvasRenderingContext2D;
  interaction: InteractionState;
  viewport: ViewportState;
  elements: CanvasElement[];
  canvasRect: DOMRect;
}

export interface ToolHandlerResult {
  interaction: Partial<InteractionState>;
  elements?: CanvasElement[];
  /** New element to add on pointer up */
  newElement?: CanvasElement;
  /** Element IDs to remove */
  removeIds?: string[];
  /** Request a re-render */
  needsRender?: boolean;
}
