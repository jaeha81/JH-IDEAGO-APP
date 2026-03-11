# Research: Step 11 Phase A-2.1 — Pan, Move Object, Zoom Controls

## 1. 현재 아키텍처 분석

### 데이터 흐름 (A-1 기준)
```
PointerEvent
  → engine.handlePointerDown/Move/Up
    → handleToolEvent(phase, e, interaction, viewport, elements, canvasRect)
      → tools.ts dispatcher → tool-specific handler
        → returns ToolResult { interaction, addElement?, removeIds? }
    → engine.applyToolResult(result)
      → Object.assign(interaction, result.interaction)
      → push undo state if changed
      → notifyChange() → onElementsChanged callback → React page
```

### ViewportState (현재)
```typescript
interface ViewportState {
  zoom: number;     // 0.1–5.0, engine.setZoom()으로 설정
  offsetX: number;  // 0 고정 (A-1)
  offsetY: number;  // 0 고정 (A-1)
}
```

### 좌표 변환 일관성 검증
- **render**: `ctx.scale(zoom)` → `ctx.translate(offsetX, offsetY)`
  - element at (px, py) → screen pixel: `(px + offsetX) * zoom`
- **screenToCanvas**: `(clientX - rect.left) / zoom - offsetX`
  - 역변환: `(px + offsetX) * zoom / zoom - offsetX = px` ✓
- **결론**: offsetX/Y 활성화 시 render ↔ input 좌표 일관성 유지됨

### ToolResult 현재 구조
```typescript
interface ToolResult {
  interaction: Partial<InteractionState>;
  addElement?: CanvasElement;
  removeIds?: string[];
}
```

### 미사용 도구 (A-1에서 default 폴스루)
- `move` — ToolBar "select" 그룹에 있음, 핸들러 없음
- `zoom_in` — ToolBar "view" 그룹에 있음, 핸들러 없음
- `zoom_out` — ToolBar "view" 그룹에 있음, 핸들러 없음
- `brush` — A-2.4 범위
- `text` — A-2.3 범위
- `arrow` — A-2.2 범위

### engine.handlePointerMove 동작
```typescript
private handlePointerMove(e: PointerEvent): void {
  if (!this.interaction.isDrawing) return; // ← 핵심: isDrawing이 false면 move 무시
  ...
}
```
이 가드 때문에 pan/move도 `isDrawing: true`로 진입해야 동작함.

---

## 2. Pan Viewport 분석

### 도구 매핑 결정
- ToolBar에 이미 `move` 도구가 있음 (select 그룹, 4방향 화살표 아이콘)
- `move` 도구 = viewport pan (뷰포트 이동)
- `select` 도구 = 요소 선택 + 드래그 이동 (A-2.1 후반)
- 이 구분은 Figma/Sketch 등 디자인 도구의 표준 패턴과 일치

### 구현 전략
1. `tools.ts`에 `handlePan` 함수 추가
2. Down: `isDrawing: true` + `dragOrigin` 기록
3. Move: 이전 위치와의 delta 계산 → `viewportDelta` 반환
4. Up: `isDrawing: false`
5. `ToolResult`에 `viewportDelta?: { dx: number; dy: number }` 추가
6. `engine.applyToolResult`에서 `viewportDelta` 처리

### 좌표 계산
Pan 드래그 시:
- 이전 screen 위치와 현재 screen 위치의 차이 → `screenDelta`
- viewportDelta = screenDelta / zoom (스크린 픽셀을 캔버스 좌표로 변환)
- `viewport.offsetX += dx`, `viewport.offsetY += dy`

### 주의사항
- Pan은 elements를 변경하지 않으므로 undo 스택에 push하지 않음
- Pan 중 `isDrawing: true`이므로 다른 도구의 drawing과 충돌 없음 (도구가 다르므로)
- `handlePointerMove`의 `_lastPointerCanvasPos` 갱신은 pan 시에도 수행됨 (문제 없음)

### Pan 시 InteractionState 활용
- `dragOrigin`: pan 시작점 (screen coords로 저장해야 delta 계산 편리)
- 기존 `dragOrigin`은 canvas coords 기준이므로, pan 전용 `panLastScreen` 필드가 필요하거나
- 아니면 `handlePan`에서 `screenToCanvas`를 쓰지 않고 raw screen coords로 delta 계산

**결정**: tools.ts의 handlePan은 raw PointerEvent를 받아 screen-level delta를 계산.
단, 현재 `handleToolEvent`는 `pos = screenToCanvas(...)` 변환 후 핸들러에 전달.
Pan은 screen delta가 필요하므로, `handleToolEvent`에서 raw screen coords도 전달해야 함.

**해결**: `handleToolEvent`에 `screenPos: { x: number; y: number }` 파라미터 추가하거나,
PointerEvent 자체를 전달 (이미 `e: PointerEvent`로 전달 중이지만 핸들러 함수에는 `pos`만 전달).

**최소 변경 방안**: `handlePan`에서만 `e` 대신 screen coords 필요. tools.ts dispatcher에서
`screenPos = { x: e.clientX, y: e.clientY }`를 추가 인자로 pan 핸들러에만 전달.

---

## 3. Move Selected Object 분석

### 현재 select 도구 동작
```typescript
function handleSelect(phase, pos, interaction, elements): ToolResult {
  if (phase === "down") {
    const hit = findElementAt(elements, pos.x, pos.y);
    return { interaction: { selectedElementId: hit?.id ?? null } };
  }
  return { interaction: {} };
}
```
- Down에서만 처리, move/up 무시
- `isDrawing`을 설정하지 않으므로 engine의 move 가드에 걸림

### 확장 전략
1. Down: hit-test → 요소 있으면 `selectedElementId` 설정 + `isDrawing: true` + `dragOrigin` 기록
2. Move: 이전 위치와의 delta → `moveElement: { id, dx, dy }` 반환
3. Up: `isDrawing: false`, 최종 위치 확정
4. Down에서 빈 영역 클릭 시: `selectedElementId: null`, `isDrawing: false`

### ToolResult 확장
```typescript
moveElement?: { id: string; dx: number; dy: number };
```
- Engine이 해당 요소의 `position_x += dx`, `position_y += dy` 적용

### Undo 처리
- **drag 시작 시 (down)** undo state push — drag 중에는 push하지 않음
- drag 없이 클릭만 한 경우 (select만) undo push 불필요
- **drag 여부 판별**: move 이벤트 수신 + delta가 threshold 초과 시 "moved" 플래그 설정
- Engine의 `applyToolResult`에서 `moveElement`이 처음 나올 때만 undo push

### InteractionState 활용
- `dragOrigin`: 드래그 시작점 (canvas coords) — 이미 있음
- `selectedElementId`: 이동 대상 — 이미 있음
- `isDrawing`: drag 중 플래그 — 재사용 가능

### 이동 제약
- 이동 대상: stroke, shape (A-1 element types만)
- text, image_overlay는 A-2 후반에서 처리
- position_x/y 변경만 — data 내부는 불변
- 이동 후 저장하면 새로운 position_x/y가 영속화됨 (CanvasElement[] 포맷 유지)

---

## 4. Zoom Controls UI 분석

### 현재 zoom 제어 경로
```
ToolBar zoom% 버튼 → onChange({ zoom: 1 }) → page state → CanvasArea → engine.setZoom()
```
단방향: React → Engine. Engine에서 zoom을 변경하면 React가 모름.

### zoom_in / zoom_out 도구 동작 설계
- 캔버스 클릭 시 zoom 단계 변경
- zoom_in: `zoom *= 1.25`
- zoom_out: `zoom *= 0.8`
- 이들은 "클릭 도구" — drag 불필요, down에서만 반응

### 역방향 알림 문제
Engine이 zoom을 바꾸면 page의 `toolbar.zoom`이 stale:
- **해결**: `ToolResult`에 `zoomDelta` 추가하지 말고,
  engine에서 직접 처리 + `onZoomChanged` 콜백으로 page에 알림
- `CanvasArea`에 `onZoomChanged?: (zoom: number) => void` prop 추가
- Page에서 `setToolbar(t => ({ ...t, zoom }))` 업데이트

### 대안: Engine 밖에서 처리
zoom_in/zoom_out를 engine 도구로 처리하지 않고, ToolBar에서 직접 `onChange({ zoom: state.zoom * 1.25 })` 호출.
하지만 이러면 "캔버스 클릭 위치 기준 줌" 불가능 → 기능 손실.

**결정**: Engine 내부에서 처리 (handlePointerDown에서 zoom 도구 special-case) + onZoomChanged 콜백.
zoom_in/zoom_out는 tools.ts에서 처리하지 않고 engine.ts에서 직접 처리 (특수 도구).

### Zoom 중심점 (향후 A-2 고도화)
A-2.1에서는 top-left 기준 줌 유지 (현재 동작). 클릭 위치 기준 줌은 pan과 결합 시 구현 가능하나 복잡도가 높아 A-2.1에서는 보류.

---

## 5. 상호작용 규칙 정리

| 도구 | 트리거 | 동작 | Elements 변경 | Viewport 변경 | Undo |
|------|--------|------|:---:|:---:|:---:|
| `select` + 요소 클릭 | pointerdown on element | 선택 | ✗ | ✗ | ✗ |
| `select` + 요소 드래그 | pointermove after select | 이동 | ✓ (position) | ✗ | ✓ (드래그 시작 시) |
| `select` + 빈 영역 클릭 | pointerdown on empty | 선택 해제 | ✗ | ✗ | ✗ |
| `move` + 드래그 | pointerdown+move anywhere | 뷰포트 pan | ✗ | ✓ (offsetX/Y) | ✗ |
| `zoom_in` + 클릭 | pointerdown | zoom *= 1.25 | ✗ | ✓ (zoom) | ✗ |
| `zoom_out` + 클릭 | pointerdown | zoom *= 0.8 | ✗ | ✓ (zoom) | ✗ |
| Delete/Backspace | keydown (selected) | 삭제 | ✓ (remove) | ✗ | ✓ |

---

## 6. 수정 대상 파일 요약

| 파일 | 변경 유형 | 내용 |
|------|----------|------|
| `types.ts` | 수정 | ToolResult 아님 (unused). InteractionState에 `panLastScreenX/Y` 추가 |
| `tools.ts` | 수정 | `handlePan`, `handleSelect` 확장, dispatcher에 move/pan 추가 |
| `engine.ts` | 수정 | applyToolResult에 viewportDelta/moveElement 처리, zoom 도구 처리, onZoomChanged 콜백 |
| `CanvasArea.tsx` | 수정 | onZoomChanged prop 추가 + engine 연결 |
| `canvas/page.tsx` | 수정 | onZoomChanged 핸들러 |

---

## 7. 리스크 및 엣지 케이스

### 리스크 1: Pan 좌표 drift
Pan은 screen delta를 zoom으로 나눠 canvas delta로 변환. 부동소수점 누적 오류 가능.
→ 대책: delta 방식이므로 절대 위치 오류 없음. pan은 viewport 상태만 변경.

### 리스크 2: Move + Undo 이중 push
드래그 중 매 move마다 undo push하면 스택 폭발.
→ 대책: "move started" 플래그로 첫 move에서만 push. 이후 move는 position만 변경.

### 리스크 3: Zoom 콜백 순환
Engine zoom 변경 → onZoomChanged → page setState → CanvasArea zoom prop → engine.setZoom() → 무한 루프?
→ 대책: engine.setZoom()에서 값이 같으면 무시 (이미 clamping 로직 있음). 또는 CanvasArea useEffect에서 현재 engine zoom과 비교 후 변경 시에만 호출.

### 리스크 4: 선택 도구에서 "클릭 vs 드래그" 구분
짧은 드래그도 이동으로 처리하면 UX 불편.
→ 대책: 3px threshold (A-1 shape drag와 동일 기준).

### 리스크 5: Pan 중 요소 생성/편집 방지
move 도구 선택 시 다른 도구 동작 비활성 (이미 tool dispatcher 분리로 보장됨).

---

## 8. 구현 순서 추천

1. **ToolResult 확장** — `viewportDelta`, `moveElement` 추가
2. **Pan (move 도구)** — tools.ts handlePan + engine applyToolResult 확장
3. **Move selected (select 도구 확장)** — tools.ts handleSelect 확장 + engine moveElement 처리
4. **Zoom controls** — engine.ts zoom 도구 special-case + onZoomChanged 콜백 + CanvasArea/page 연결
5. **TypeScript 검증** — tsc --noEmit

이 순서는 의존성을 따름: pan이 먼저 (viewport 변경 기반), move가 다음 (ToolResult 확장 재사용), zoom이 마지막 (콜백 추가).

---

## 결론

A-2.1의 세 기능은 모두 기존 아키텍처 내에서 구현 가능.
- `ToolResult` 확장 (2개 필드 추가)과 `engine.applyToolResult` 확장이 핵심 변경점
- zoom은 tool handler가 아닌 engine 직접 처리가 가장 깔끔
- 저장 포맷(CanvasElement[])에 변경 없음
- ViewportState(zoom, offsetX, offsetY)는 저장 대상이 아님 (세션 상태)
