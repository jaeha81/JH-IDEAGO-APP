# Plan: Step 11 Phase A-2.1 — Pan, Move Object, Zoom Controls

## 1. 구현 접근 방식

### ToolResult 확장
기존 `{ interaction, addElement?, removeIds? }`에 두 필드 추가:
```typescript
viewportDelta?: { dx: number; dy: number };  // pan 도구용
moveElement?: { id: string; dx: number; dy: number };  // select 드래그용
```

### 도구-동작 매핑 (확정)
| ToolBar 도구 | 캔버스 동작 |
|-------------|-----------|
| `move` | 뷰포트 pan (offsetX/Y 변경) |
| `select` + 요소 위 드래그 | 요소 이동 (position_x/y 변경) |
| `select` + 빈 영역 클릭 | 선택 해제 |
| `zoom_in` + 클릭 | zoom *= 1.25 |
| `zoom_out` + 클릭 | zoom *= 0.8 |

### Zoom 제어 방식
zoom_in/zoom_out는 tools.ts에서 처리하지 않음.
engine.ts의 `handlePointerDown`에서 직접 처리 (특수 도구).
`onZoomChanged` 콜백으로 page에 역방향 알림.

## 2. 수정/추가될 파일 경로

| 파일 | 변경 내용 |
|------|----------|
| `frontend/lib/canvas/types.ts` | InteractionState에 `panLastScreenX/Y` 추가 |
| `frontend/lib/canvas/tools.ts` | ToolResult 확장, `handlePan` 추가, `handleSelect` 드래그 이동 확장 |
| `frontend/lib/canvas/engine.ts` | applyToolResult 확장 (viewportDelta, moveElement), zoom 도구 처리, onZoomChanged 콜백 |
| `frontend/components/workspace/CanvasArea.tsx` | onZoomChanged prop + engine 연결 |
| `frontend/app/(workspace)/projects/[id]/canvas/page.tsx` | handleZoomChanged 핸들러 |

## 3. 변경 사항 코드 스니펫

### types.ts — InteractionState 확장
**Before:**
```typescript
interface InteractionState {
  tool: DrawingTool;
  isDrawing: boolean;
  currentPoints: [number, number][];
  dragOrigin: { x: number; y: number } | null;
  selectedElementId: string | null;
  color: string;
  strokeWidth: number;
}
```

**After:**
```typescript
interface InteractionState {
  tool: DrawingTool;
  isDrawing: boolean;
  currentPoints: [number, number][];
  dragOrigin: { x: number; y: number } | null;
  selectedElementId: string | null;
  color: string;
  strokeWidth: number;
  /** Pan: last screen position for delta calculation */
  panLastScreenX: number;
  panLastScreenY: number;
  /** Select+drag: whether element was actually moved (for undo gating) */
  hasMoved: boolean;
}
```

### tools.ts — ToolResult 확장
**Before:**
```typescript
interface ToolResult {
  interaction: Partial<InteractionState>;
  addElement?: CanvasElement;
  removeIds?: string[];
}
```

**After:**
```typescript
interface ToolResult {
  interaction: Partial<InteractionState>;
  addElement?: CanvasElement;
  removeIds?: string[];
  viewportDelta?: { dx: number; dy: number };
  moveElement?: { id: string; dx: number; dy: number };
}
```

### tools.ts — handlePan
```typescript
function handlePan(
  phase: Phase,
  pos: { x: number; y: number },
  interaction: InteractionState,
  elements: CanvasElement[],
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
```

### tools.ts — handleSelect 확장 (드래그 이동)
```typescript
function handleSelect(phase, pos, interaction, elements): ToolResult {
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
      return { interaction: { selectedElementId: null } };
    }
    case "move": {
      if (!interaction.isDrawing || !interaction.selectedElementId || !interaction.dragOrigin) {
        return { interaction: {} };
      }
      const dx = pos.x - interaction.dragOrigin.x;
      const dy = pos.y - interaction.dragOrigin.y;
      if (!interaction.hasMoved && Math.abs(dx) < 3 && Math.abs(dy) < 3) {
        return { interaction: {} }; // below threshold
      }
      return {
        interaction: {
          dragOrigin: { x: pos.x, y: pos.y },
          hasMoved: true,
        },
        moveElement: { id: interaction.selectedElementId, dx, dy },
      };
    }
    case "up":
      return { interaction: { isDrawing: false, dragOrigin: null } };
  }
}
```

### engine.ts — applyToolResult 확장
```typescript
// Inside applyToolResult, after existing addElement/removeIds handling:

if (result.viewportDelta) {
  this.viewport.offsetX += result.viewportDelta.dx;
  this.viewport.offsetY += result.viewportDelta.dy;
  // No undo for viewport changes
}

if (result.moveElement) {
  const { id, dx, dy } = result.moveElement;
  // Push undo only on first move
  if (!changed && this.interaction.hasMoved && this.undo.past.length === 0 ||
      /* better: check a flag */) {
    // Actually: push undo on first moveElement per drag session
  }
  const el = this.elements.find(e => e.id === id);
  if (el) {
    el.position_x += dx;
    el.position_y += dy;
    changed = true;
  }
}
```

### engine.ts — zoom 도구 처리 (handlePointerDown 내)
```typescript
private handlePointerDown(e: PointerEvent): void {
  // Zoom tools — handle directly, bypass tool handler
  if (this.interaction.tool === "zoom_in" || this.interaction.tool === "zoom_out") {
    const factor = this.interaction.tool === "zoom_in" ? 1.25 : 0.8;
    this.setZoom(this.viewport.zoom * factor);
    this.onZoomChanged?.(this.viewport.zoom);
    return;
  }

  this.canvas.setPointerCapture(e.pointerId);
  // ... existing code
}
```

### CanvasArea.tsx — onZoomChanged 추가
```tsx
interface CanvasAreaProps {
  // ... existing
  onZoomChanged?: (zoom: number) => void;
}

// In init useEffect:
engine.onZoomChanged = (zoom) => {
  onZoomChanged?.(zoom);
};
```

### canvas/page.tsx — handleZoomChanged
```tsx
const handleZoomChanged = useCallback((zoom: number) => {
  setToolbar((t) => ({ ...t, zoom }));
}, []);

// In CanvasArea:
<CanvasArea
  ...
  onZoomChanged={handleZoomChanged}
/>
```

## 4. 고려 사항 및 트레이드오프

| 항목 | 선택 | 이유 |
|------|------|------|
| Pan 입력 방식 | `move` 도구 전용 | Space+drag는 추후 추가 가능, 지금은 최소 |
| Move undo 타이밍 | 첫 move 시 push | 매 move push는 스택 폭발 |
| Zoom center point | Top-left 기준 | 클릭 위치 기준은 pan 결합 필요 → 복잡도 높음, 향후 |
| Zoom 콜백 순환 방지 | engine.setZoom() 값 비교 | 같은 값이면 skip |
| 드래그 threshold | 3px | A-1 shape drag와 동일 기준 |

## 5. 작업 단계 Todo 리스트

- [x] A2.1-1: `types.ts` — InteractionState에 panLastScreenX/Y, hasMoved 추가
- [x] A2.1-2: `tools.ts` — ToolResult 확장 (viewportDelta, moveElement)
- [x] A2.1-3: `tools.ts` — handlePan 구현 (move 도구 → viewport pan)
- [x] A2.1-4: `tools.ts` — handleSelect 확장 (드래그 이동)
- [x] A2.1-5: `engine.ts` — applyToolResult에 viewportDelta/moveElement 처리 추가
- [x] A2.1-6: `engine.ts` — zoom_in/zoom_out 도구 direct 처리 + onZoomChanged 콜백
- [x] A2.1-7: `CanvasArea.tsx` — onZoomChanged prop + engine 연결
- [x] A2.1-8: `canvas/page.tsx` — handleZoomChanged 핸들러
- [x] A2.1-9: TypeScript 타입 체크 — 0 errors

---
구현이 완료되었습니다. (2026-03-11)
