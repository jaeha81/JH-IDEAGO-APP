# Research: Step 11 — Canvas Drawing Engine + i18n

## 1. 캔버스 드로잉 엔진

### 현재 상태
- `CanvasArea.tsx`: HTML5 `<canvas>` 요소만 존재, TODO 주석만 있음
- `ToolBar.tsx`: UI 완성, 12개 도구 정의 (select, move, pen, brush, eraser, text, rect, circle, arrow, line, zoom_in, zoom_out)
- `canvas/page.tsx`: 상태관리 완성 (canvasState, toolbar, saveStatus, Ctrl+S 저장)
- **드로잉 라이브러리 미설치** — package.json에 Konva, Fabric 등 없음

### 타입 구조 (types/index.ts)
- `CanvasState`: { version, width(2560), height(1920), background("#FFFFFF"), elements[] }
- `CanvasElement`: { id, type, data, z_index, position_x, position_y }
- `CanvasElementType`: "stroke" | "text" | "shape" | "image_overlay"
- `StrokeData`: { points[][], color, width, opacity, tool:"pen"|"brush" }
- `ShapeData`: { shape_type:"rect"|"circle"|"arrow"|"line", width, height, fill, stroke_color, stroke_width }
- `TextData`: { content, font_size, font_family, color }
- `ImageOverlayData`: { asset_id, width, height, rotation, annotations[] }
- `DrawingTool`: 12종
- `ToolbarState`: { activeTool, activeColor, strokeWidth, zoom }

### API 계약
- `GET /projects/{id}/canvas` → 최신 스냅샷의 state_json
- `PUT /projects/{id}/canvas` → { state_json: CanvasState, trigger: "manual"|"auto" }
- 백엔드: snapshot 저장 + _sync_elements() + 이벤트 로깅

### 라이브러리 선택: HTML5 Canvas 2D API (네이티브)
- Konva.js: 강력하지만 무거움 (100KB+), 별도 레이어 관리 필요
- Fabric.js: SVG 기반, 복잡한 API
- **네이티브 Canvas 2D API**: 가볍고, 타입 정의와 완전 호환, 추가 의존성 없음
- IDEAGO 요구사항(펜/도형/텍스트/이미지)에 네이티브 API로 충분

### 캔버스 엔진 핵심 구현 항목
1. **렌더링**: elements 배열 → canvas에 그리기 (z_index 순)
2. **드로잉**: pen/brush → freehand stroke 수집 → StrokeData 생성
3. **도형**: rect/circle/arrow/line → 드래그로 크기 결정 → ShapeData 생성
4. **텍스트**: 클릭 → 인라인 입력 → TextData 생성
5. **선택/이동**: 요소 히트테스트 → 드래그 이동 → position 업데이트
6. **지우개**: 요소 히트테스트 → elements에서 제거
7. **줌/팬**: transform 적용, 좌표 변환
8. **이미지 오버레이**: 업로드 후 Image 객체 로드 → 캔버스에 렌더

## 2. 영어/한글 언어 변경 (i18n)

### 현재 상태
- 모든 UI 텍스트가 영어 하드코딩
- i18n 라이브러리 미설치
- next-intl, react-i18next 등 미사용

### 접근 방식: 경량 Context 기반 i18n
- 별도 라이브러리 없이 React Context + JSON 딕셔너리
- `LocaleContext` + `useLocale()` 훅
- `frontend/lib/i18n/` 폴더: en.json, ko.json
- localStorage로 언어 설정 유지
- 토글 UI: 헤더 또는 설정에 언어 전환 버튼

### 번역 대상 범위 (주요 UI)
- 로그인/회원가입 페이지
- 프로젝트 목록 페이지
- 캔버스 워크스페이스 (도구 라벨, 패널 제목)
- 에이전트 패널
- 내보내기 패널
- 공통 UI (버튼, 에러 메시지, 플레이스홀더)

## 결론
- 캔버스 엔진: 네이티브 Canvas 2D API로 구현 (외부 의존성 최소화)
- i18n: Context 기반 경량 구현 (라이브러리 불필요)
- 두 기능 모두 기존 아키텍처와 충돌 없음
