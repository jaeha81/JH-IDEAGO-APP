# Plan: Step 11 — Canvas Drawing Engine (Phased) + i18n (Deferred)

> **Conditional approval applied.** Original plan split per review decisions.

## Phase Summary

| Phase | Scope | Status |
|-------|-------|--------|
| **A-1: Canvas Core MVP** | Engine, viewport, scene schema, serialization, undo/redo, 6 tools | **Approved — implement now** |
| **A-2: Advanced Interaction** | brush, text (DOM overlay), arrow, move selected, pan viewport, zoom controls | Deferred |
| **B: i18n** | EN/KO Context + JSON dictionary | Deferred until canvas core is stable |

---

## Phase A-1: Canvas Core MVP

### 1. 구현 접근 방식

- **네이티브 HTML5 Canvas 2D API** (외부 라이브러리 없음)
- `CanvasEngine` 클래스로 캡슐화
- Scene object 배열 기반 렌더링 (z_index 정렬)
- Viewport state로 줌/오프셋 관리 (Phase A-1은 줌만, 팬은 A-2)
- Interaction state machine으로 도구별 포인터 이벤트 처리
- Minimal undo/redo stack (element snapshot 방식)
- Save/load serialization: `CanvasElement[]` ↔ `CanvasState`

### 2. 핵심 스키마 정의

#### Scene Object Schema
```typescript
// 기존 types/index.ts의 CanvasElement를 그대로 사용
// { id, type, data, z_index, position_x, position_y }
// type: "stroke" | "text" | "shape" | "image_overlay"
// data: StrokeData | TextData | ShapeData | ImageOverlayData
```

#### Viewport State
```typescript
interface ViewportState {
  zoom: number;       // 0.1 ~ 5.0
  offsetX: number;    // 캔버스 pan 오프셋 (A-1에서는 0 고정)
  offsetY: number;    // 캔버스 pan 오프셋 (A-1에서는 0 고정)
}
```

#### Interaction State
```typescript
interface InteractionState {
  tool: DrawingTool;
  isDrawing: boolean;
  // pen/eraser: freehand stroke 수집 중
  currentPoints: [number, number][];
  // line/rect/circle: 드래그 시작점
  dragOrigin: { x: number; y: number } | null;
  // select: 선택된 요소 ID
  selectedElementId: string | null;
  // 현재 스트로크 색상/두께
  color: string;
  strokeWidth: number;
}
```

#### Serialization Rules
- `CanvasEngine.getElements()` → `CanvasElement[]` — 현재 scene 전체 반환
- `CanvasEngine.setElements(elements)` → scene 로드 (서버에서 받은 데이터 복원)
- 저장: `canvasState.elements = engine.getElements()` → `PUT /projects/{id}/canvas`
- 불필요한 중간 변환 없음 — `CanvasElement` 타입이 그대로 직렬화됨

#### Object Move vs Viewport Pan (구분 명확화)
- **Object Move** (Phase A-2 `move` tool): 선택된 개별 요소의 `position_x`, `position_y` 변경
- **Viewport Pan** (Phase A-2): `ViewportState.offsetX/Y` 변경, 모든 요소의 실제 좌표는 불변
- Phase A-1의 `select` tool: 요소 선택만 (이동 없음), 선택된 요소 하이라이트 + Delete 키로 삭제

#### Text Tool (Phase A-2 설계 메모)
- DOM overlay `<input>` 사용 — 캔버스 위에 절대 위치된 텍스트 입력 필드
- 캔버스에 직접 typing하지 않음 (IME, 커서 제어 문제 회피)
- 입력 완료 시 TextData element로 변환 → 캔버스에 렌더링

### 3. Phase A-1 도구 목록 (6개)

| Tool | 동작 | Element Type |
|------|------|-------------|
| `pen` | Freehand stroke → `StrokeData` (tool:"pen") | stroke |
| `eraser` | 히트테스트 → 접촉한 요소 삭제 | (삭제) |
| `line` | 드래그 → `ShapeData` (shape_type:"line") | shape |
| `rect` | 드래그 → `ShapeData` (shape_type:"rect") | shape |
| `circle` | 드래그 → `ShapeData` (shape_type:"circle") | shape |
| `select` | 히트테스트 → 선택 하이라이트, Delete로 삭제 | (선택) |

### 4. Undo/Redo 구조

```typescript
// 최소 구현: element 스냅샷 스택
interface UndoStack {
  past: CanvasElement[][];    // 이전 상태들
  future: CanvasElement[][];  // redo 상태들
}
// pushState(): past에 현재 상태 push, future 초기화
// undo(): past에서 pop → current, current → future에 push
// redo(): future에서 pop → current, current → past에 push
// Ctrl+Z / Ctrl+Shift+Z 단축키 바인딩
```

### 5. 수정/추가될 파일 경로

| 파일 | 변경 유형 | 내용 |
|------|----------|------|
| `frontend/lib/canvas/types.ts` | 신규 | ViewportState, InteractionState, EngineOptions, UndoStack |
| `frontend/lib/canvas/utils.ts` | 신규 | nanoid, screenToCanvas 좌표 변환 |
| `frontend/lib/canvas/renderer.ts` | 신규 | stroke/shape 렌더링 (text/image_overlay는 A-2) |
| `frontend/lib/canvas/hit-test.ts` | 신규 | 요소 충돌 판정 (stroke, shape) |
| `frontend/lib/canvas/tools.ts` | 신규 | pen, eraser, line, rect, circle, select 핸들러 |
| `frontend/lib/canvas/engine.ts` | 신규 | CanvasEngine 클래스 (코어) |
| `frontend/components/workspace/CanvasArea.tsx` | 수정 | 엔진 연결, 플레이스홀더 제거, 이벤트 바인딩 |
| `frontend/app/(workspace)/projects/[id]/canvas/page.tsx` | 수정 | onElementsChanged 콜백, toolbar↔engine 연결 |

### 6. 작업 단계 Todo 리스트

- [x] A1-1: `frontend/lib/canvas/types.ts` — ViewportState, InteractionState, EngineOptions, UndoStack
- [x] A1-2: `frontend/lib/canvas/utils.ts` — generateId(), screenToCanvas()
- [x] A1-3: `frontend/lib/canvas/renderer.ts` — renderStroke(), renderShape(), renderSelection()
- [x] A1-4: `frontend/lib/canvas/hit-test.ts` — hitTestStroke(), hitTestShape(), findElementAt()
- [x] A1-5: `frontend/lib/canvas/tools.ts` — pen, eraser, line, rect, circle, select handlers
- [x] A1-6: `frontend/lib/canvas/engine.ts` — CanvasEngine (init, render loop, pointer events, undo/redo, get/setElements)
- [x] A1-7: `CanvasArea.tsx` — 엔진 연결, 이벤트 바인딩, 플레이스홀더 제거
- [x] A1-8: `canvas/page.tsx` — onElementsChanged, toolbar↔engine 동기화

---

## Phase A-2: Advanced Interaction (Deferred)

- [ ] brush tool (반투명 넓은 stroke)
- [ ] text tool (DOM overlay editing → TextData element)
- [ ] arrow tool (ShapeData + arrowhead 렌더링)
- [ ] move selected object (position_x/y 드래그 변경)
- [ ] viewport pan (middle-click 또는 spacebar+drag)
- [ ] zoom controls (zoom_in/zoom_out tool + pinch gesture)

## Part B: i18n (Deferred)

- 설계는 유지 (Context + JSON dictionary, 라이브러리 없음)
- 캔버스 코어 안정화 후 별도 구현
- `frontend/lib/i18n/` — en.json, ko.json, index.ts
- 헤더 토글 + localStorage 유지

---
계획이 업데이트되었습니다. Phase A-1 구현을 시작합니다.
