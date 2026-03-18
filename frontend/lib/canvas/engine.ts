import type { CanvasElement, TextData, ImageOverlayData } from "@/types";
import type {
  ViewportState,
  InteractionState,
  UndoStack,
  EngineOptions,
} from "./types";
import { screenToCanvas, generateId } from "./utils";
import {
  renderScene,
  renderPreviewStroke,
  renderPreviewShape,
  preloadImage,
} from "./renderer";
import { handleToolEvent, type ToolResult } from "./tools";

// ─── CanvasEngine ────────────────────────────────────────────────────────────

export class CanvasEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private elements: CanvasElement[] = [];
  private viewport: ViewportState = { zoom: 1, offsetX: 0, offsetY: 0 };
  private interaction: InteractionState;
  private undo: UndoStack = { past: [], future: [] };
  private background: string;
  private rafId: number | null = null;
  private dirty = true;

  onElementsChanged: ((elements: CanvasElement[]) => void) | null = null;
  onZoomChanged: ((zoom: number) => void) | null = null;
  onInteractionChanged: ((state: { textOverlayPos: { x: number; y: number } | null }) => void) | null = null;

  // Max undo history depth
  private static MAX_UNDO = 50;

  constructor(canvas: HTMLCanvasElement, opts: EngineOptions) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context unavailable");
    this.ctx = ctx;

    this.background = opts.background;

    this.interaction = {
      tool: "pen",
      isDrawing: false,
      currentPoints: [],
      dragOrigin: null,
      selectedElementId: null,
      color: "#000000",
      strokeWidth: 2,
      panLastScreenX: 0,
      panLastScreenY: 0,
      hasMoved: false,
      textOverlayPos: null,
    };

    // Bind pointer events
    this.handlePointerDown = this.handlePointerDown.bind(this);
    this.handlePointerMove = this.handlePointerMove.bind(this);
    this.handlePointerUp = this.handlePointerUp.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);

    canvas.addEventListener("pointerdown", this.handlePointerDown);
    canvas.addEventListener("pointermove", this.handlePointerMove);
    canvas.addEventListener("pointerup", this.handlePointerUp);
    canvas.addEventListener("pointerleave", this.handlePointerUp);
    document.addEventListener("keydown", this.handleKeyDown);

    this.startRenderLoop();
  }

  // ─── Public API ──────────────────────────────────────────────────────

  setElements(elements: CanvasElement[]): void {
    this.elements = [...elements];
    this.dirty = true;
  }

  getElements(): CanvasElement[] {
    return [...this.elements];
  }

  setTool(tool: InteractionState["tool"]): void {
    this.interaction.tool = tool;
    // Deselect when switching tools
    if (tool !== "select") {
      this.interaction.selectedElementId = null;
      this.dirty = true;
    }
  }

  setColor(color: string): void {
    this.interaction.color = color;
  }

  setStrokeWidth(width: number): void {
    this.interaction.strokeWidth = width;
  }

  setZoom(zoom: number): void {
    this.viewport.zoom = Math.max(0.1, Math.min(5, zoom));
    this.dirty = true;
  }

  setBackground(bg: string): void {
    this.background = bg;
    this.dirty = true;
  }

  getSelectedElementId(): string | null {
    return this.interaction.selectedElementId;
  }

  getTextOverlayPos(): { x: number; y: number } | null {
    return this.interaction.textOverlayPos ?? null;
  }

  commitText(text: string, pos: { x: number; y: number }, fontSize: number, color: string): void {
    this.interaction.textOverlayPos = null;
    if (!text.trim()) {
      this.dirty = true;
      this.onInteractionChanged?.({ textOverlayPos: null });
      return;
    }
    this.pushUndoState();
    const maxZ = this.elements.length > 0 ? Math.max(...this.elements.map((e) => e.z_index)) + 1 : 1;
    const el: CanvasElement = {
      id: generateId(),
      type: "text",
      z_index: maxZ,
      position_x: pos.x,
      position_y: pos.y,
      data: { content: text, font_size: fontSize, font_family: "sans-serif", color } as TextData,
    };
    this.elements.push(el);
    this.dirty = true;
    this.notifyChange();
    this.onInteractionChanged?.({ textOverlayPos: null });
  }

  addImageOverlay(assetId: string, url: string, width: number, height: number): void {
    preloadImage(assetId, url);
    this.pushUndoState();
    const maxZ = this.elements.length > 0 ? Math.max(...this.elements.map((e) => e.z_index)) + 1 : 1;
    const el: CanvasElement = {
      id: generateId(),
      type: "image_overlay",
      z_index: maxZ,
      position_x: Math.max(0, -this.viewport.offsetX + 80),
      position_y: Math.max(0, -this.viewport.offsetY + 80),
      data: { asset_id: assetId, width, height, rotation: 0, annotations: [] } as ImageOverlayData,
    };
    this.elements.push(el);
    this.dirty = true;
    this.notifyChange();
  }

  // ─── Undo / Redo ────────────────────────────────────────────────────

  private pushUndoState(): void {
    this.undo.past.push(this.elements.map((el) => ({ ...el })));
    if (this.undo.past.length > CanvasEngine.MAX_UNDO) {
      this.undo.past.shift();
    }
    this.undo.future = [];
  }

  performUndo(): void {
    if (this.undo.past.length === 0) return;
    this.undo.future.push(this.elements.map((el) => ({ ...el })));
    this.elements = this.undo.past.pop()!;
    this.interaction.selectedElementId = null;
    this.dirty = true;
    this.notifyChange();
  }

  performRedo(): void {
    if (this.undo.future.length === 0) return;
    this.undo.past.push(this.elements.map((el) => ({ ...el })));
    this.elements = this.undo.future.pop()!;
    this.interaction.selectedElementId = null;
    this.dirty = true;
    this.notifyChange();
  }

  // ─── Pointer events ─────────────────────────────────────────────────

  private handlePointerDown(e: PointerEvent): void {
    // Zoom tools — handle directly, bypass tool handler
    if (this.interaction.tool === "zoom_in" || this.interaction.tool === "zoom_out") {
      const factor = this.interaction.tool === "zoom_in" ? 1.25 : 0.8;
      const oldZoom = this.viewport.zoom;
      this.setZoom(this.viewport.zoom * factor);
      if (this.viewport.zoom !== oldZoom) {
        this.onZoomChanged?.(this.viewport.zoom);
      }
      return;
    }

    this.canvas.setPointerCapture(e.pointerId);
    const rect = this.canvas.getBoundingClientRect();
    const result = handleToolEvent(
      "down", e, this.interaction, this.viewport, this.elements, rect,
    );
    this.applyToolResult(result);
  }

  private handlePointerMove(e: PointerEvent): void {
    if (!this.interaction.isDrawing) return;
    const rect = this.canvas.getBoundingClientRect();
    // Track position for shape preview rendering
    this._lastPointerCanvasPos = screenToCanvas(
      e.clientX, e.clientY, rect, this.viewport,
    );
    const result = handleToolEvent(
      "move", e, this.interaction, this.viewport, this.elements, rect,
    );
    this.applyToolResult(result);
  }

  private handlePointerUp(e: PointerEvent): void {
    this.canvas.releasePointerCapture(e.pointerId);
    if (!this.interaction.isDrawing) return;
    const rect = this.canvas.getBoundingClientRect();
    const result = handleToolEvent(
      "up", e, this.interaction, this.viewport, this.elements, rect,
    );
    this.applyToolResult(result);
  }

  private applyToolResult(result: ToolResult): void {
    // Update interaction state
    Object.assign(this.interaction, result.interaction);

    let changed = false;

    if (result.removeIds && result.removeIds.length > 0) {
      this.pushUndoState();
      const removeSet = new Set(result.removeIds);
      this.elements = this.elements.filter((el) => !removeSet.has(el.id));
      changed = true;
    }

    if (result.addElement) {
      this.pushUndoState();
      this.elements.push(result.addElement);
      changed = true;
    }

    // Viewport pan — no undo (viewport state is not undoable)
    if (result.viewportDelta) {
      this.viewport.offsetX += result.viewportDelta.dx;
      this.viewport.offsetY += result.viewportDelta.dy;
    }

    // Move selected element — push undo only on first move of drag session
    if (result.moveElement) {
      const { id, dx, dy } = result.moveElement;
      const el = this.elements.find((e) => e.id === id);
      if (el) {
        // Push undo on first move (hasMoved just became true in this result)
        if (!this._moveDragUndoPushed) {
          this.pushUndoState();
          this._moveDragUndoPushed = true;
        }
        el.position_x += dx;
        el.position_y += dy;
        changed = true;
      }
    }

    // Reset move-drag undo flag when drawing ends (pointer up)
    if (result.interaction.isDrawing === false) {
      this._moveDragUndoPushed = false;
    }

    if (changed) {
      this.notifyChange();
    }

    if ("textOverlayPos" in result.interaction) {
      this.onInteractionChanged?.({ textOverlayPos: this.interaction.textOverlayPos });
    }

    this.dirty = true;
  }

  private _moveDragUndoPushed = false;

  // ─── Keyboard events ────────────────────────────────────────────────

  private handleKeyDown(e: KeyboardEvent): void {
    // Undo: Ctrl+Z
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === "z") {
      e.preventDefault();
      this.performUndo();
      return;
    }
    // Redo: Ctrl+Shift+Z or Ctrl+Y
    if ((e.ctrlKey || e.metaKey) && (e.shiftKey && e.key === "z" || e.key === "y")) {
      e.preventDefault();
      this.performRedo();
      return;
    }
    // Delete selected element
    if ((e.key === "Delete" || e.key === "Backspace") && this.interaction.selectedElementId) {
      // Don't delete if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      e.preventDefault();
      this.pushUndoState();
      this.elements = this.elements.filter(
        (el) => el.id !== this.interaction.selectedElementId,
      );
      this.interaction.selectedElementId = null;
      this.dirty = true;
      this.notifyChange();
    }
  }

  // ─── Render loop ────────────────────────────────────────────────────

  private startRenderLoop(): void {
    const loop = () => {
      if (this.dirty || this.interaction.isDrawing) {
        this.render();
        this.dirty = false;
      }
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  private render(): void {
    // Full scene render
    renderScene(
      this.ctx,
      this.elements,
      this.viewport,
      this.background,
      this.interaction.selectedElementId,
    );

    // Live preview during active drawing
    if (this.interaction.isDrawing) {
      this.renderActivePreview();
    }
  }

  private renderActivePreview(): void {
    const { tool, currentPoints, dragOrigin, color, strokeWidth } = this.interaction;

    if ((tool === "pen" || tool === "brush") && currentPoints.length >= 2) {
      const previewWidth = tool === "brush" ? Math.max(strokeWidth * 3, 8) : strokeWidth;
      const previewOpacity = tool === "brush" ? 0.45 : 1;
      renderPreviewStroke(this.ctx, currentPoints, color, previewWidth, this.viewport, previewOpacity);
    }

    if (
      (tool === "rect" || tool === "circle" || tool === "line" || tool === "arrow") &&
      dragOrigin
    ) {
      // We need current pointer position — use last known from interaction
      // The preview gets the live cursor from the last pointermove
      // For simplicity, store the last pointer canvas position
      if (this._lastPointerCanvasPos) {
        renderPreviewShape(
          this.ctx,
          tool,
          dragOrigin.x,
          dragOrigin.y,
          this._lastPointerCanvasPos.x,
          this._lastPointerCanvasPos.y,
          color,
          strokeWidth,
          this.viewport,
        );
      }
    }
  }

  /** Last pointer position in canvas coords — for shape preview rendering */
  private _lastPointerCanvasPos: { x: number; y: number } | null = null;

  // ─── Cleanup ────────────────────────────────────────────────────────

  destroy(): void {
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    this.canvas.removeEventListener("pointerdown", this.handlePointerDown);
    this.canvas.removeEventListener("pointermove", this.handlePointerMove);
    this.canvas.removeEventListener("pointerup", this.handlePointerUp);
    this.canvas.removeEventListener("pointerleave", this.handlePointerUp);
    document.removeEventListener("keydown", this.handleKeyDown);
  }

  // ─── Internal ───────────────────────────────────────────────────────

  private notifyChange(): void {
    this.onElementsChanged?.(this.getElements());
  }
}
