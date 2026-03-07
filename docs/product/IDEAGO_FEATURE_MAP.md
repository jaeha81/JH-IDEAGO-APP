# IDEAGO Feature Map
# IDEAGO FEATURE MAP

## 문서 목적
이 문서는 IDEAGO의 화면, 기능, 백엔드 책임, 데이터 책임을 연결하는 기준 문서다.  
피그마 화면 구조와 실제 시스템 구조가 달라도, 기능 책임과 데이터 계약이 일치하도록 만드는 것이 목적이다.

이 문서는 특히 아래 역할에 사용한다.

- 피그마 화면을 구현 가능한 기능 단위로 해석
- 클로드코드/커서가 프론트엔드와 백엔드 책임을 혼동하지 않도록 정리
- UI 변경이 생겨도 백엔드 계약이 유지되어야 하는 범위를 구분
- Export, Agent, Canvas, Upload, Detail View의 책임 분리

---

# 1. 전체 원칙

## 1-1. 화면 구조와 시스템 구조는 같을 필요가 없다
- 피그마는 사용자 흐름/시각 구조 중심이다.
- 백엔드는 데이터, 저장, 계약, export 중심이다.
- 둘은 1:1로 복제하지 않는다.

## 1-2. 기능 책임은 고정, UI 배치는 변경 가능
### 고정
- 프로젝트 생성
- 에이전트 커스터마이징
- 캔버스
- 이미지 업로드 + 마킹
- 요약형 에이전트 응답
- 선택형 Detail View
- 구조화 Export
- 기계 판독 가능한 사용자 행위 저장

### 변경 가능
- 패널 위치
- 버튼 위치
- 모달/드로어 여부
- 탭 순서
- 반응형 배치
- 스타일

## 1-3. 이 문서는 구현 기준선이다
- 프론트는 이 문서를 기준으로 화면과 상태를 연결한다.
- 백엔드는 이 문서를 기준으로 API와 저장 구조를 설계한다.

---

# 2. Screen → Feature → Backend Responsibility Map

## S-01. Landing / Home
### 화면 목적
사용자가 IDEAGO에 처음 진입하고 새 프로젝트 또는 기존 프로젝트로 이동하는 화면

### 핵심 기능
- 브랜드 진입
- 새 프로젝트 시작
- 기존 프로젝트 열기
- 최근 프로젝트 접근

### 백엔드 책임
- 프로젝트 목록 조회
- 최근 프로젝트 조회
- 프로젝트 생성 진입점 제공

### 데이터 책임
- project summary preview
- 최근 수정 시간
- 프로젝트 제목
- 프로젝트 상태 요약

### API 후보
- GET /projects
- GET /projects/recent
- POST /projects

---

## S-02. New Project Setup
### 화면 목적
새 프로젝트 생성 전 프로젝트명과 에이전트 구성을 정하는 화면

### 핵심 기능
- 프로젝트명 수동 입력
- 프로젝트명 자동 생성
- 에이전트 수 선택
- 에이전트 역할 입력
- 프로젝트 시작

### 백엔드 책임
- 프로젝트 초기 생성
- 에이전트 기본 구성 저장
- 초기 project state 생성

### 데이터 책임
- project.title
- project.slug or generated label
- agent.count
- agent.role_label
- project.created_at

### API 후보
- POST /projects
- POST /projects/{id}/agents
- POST /projects/{id}/initialize

---

## S-03. Main Workspace
### 화면 목적
사용자가 자유 드로잉, 텍스트 작성, 도형 입력, 이미지 마킹, 에이전트 협업을 수행하는 핵심 작업 화면

### 핵심 기능
- 자유 캔버스
- 텍스트
- 도형
- 색상
- 선택/이동/복사/자르기
- 확대/축소
- 업로드한 이미지 위 마킹
- 에이전트 질의
- Detail View 진입
- Export 진입

### 백엔드 책임
- 캔버스 상태 저장
- 캔버스 이벤트 저장
- 업로드 자산 연결
- 에이전트 질문/응답 저장
- 프로젝트 스냅샷 생성
- 최근 작업 상태 유지

### 데이터 책임
- canvas_objects
- canvas_state
- canvas_events
- linked_assets
- agent_interactions
- project_snapshot

### API 후보
- GET /projects/{id}
- GET /projects/{id}/canvas
- PUT /projects/{id}/canvas
- POST /projects/{id}/canvas/events
- POST /projects/{id}/uploads
- POST /projects/{id}/agent-prompts
- GET /projects/{id}/agent-results
- POST /projects/{id}/snapshots

---

## O-01. Agent Panel
### 화면 목적
사용자 질문 입력 및 에이전트 요약 결과 확인

### 핵심 기능
- 사용자 질문 입력
- 역할 라벨 표시
- 요약형 응답
- 더보기/상세보기
- 접기/펼치기

### 백엔드 책임
- prompt 기록
- agent result 기록
- summary-first orchestration
- project memory 사용

### 데이터 책임
- user_prompt
- agent_summary
- agent_role_label
- project_context_summary
- response_mode(summary/detail)

### API 후보
- POST /projects/{id}/agent-prompts
- GET /projects/{id}/agent-results
- GET /projects/{id}/agent-results/{result_id}

---

## O-02. Upload + Markup State
### 화면 목적
사용자가 업로드한 이미지/사진/도면 위에 직접 마킹하는 상태

### 핵심 기능
- 업로드
- 캔버스 배치
- 이미지 위 드로잉
- 메모/화살표/도형 표시

### 백엔드 책임
- 업로드 파일 저장
- 업로드 메타데이터 저장
- 캔버스 오버레이 참조 유지
- annotation event 저장

### 데이터 책임
- upload asset
- mime type
- asset dimensions
- storage path
- canvas overlay reference
- annotation events

### API 후보
- POST /projects/{id}/uploads
- GET /projects/{id}/uploads
- DELETE /projects/{id}/uploads/{asset_id}
- POST /projects/{id}/canvas/events

---

## O-03. Detail View
### 화면 목적
사용자가 필요할 때만 결과를 더 정리된 시각화 상태로 보는 기능

### 핵심 기능
- Detail View 열기
- 결과 보기
- 닫기
- 필요 시 비교/확대

### 백엔드 책임
- detail view request 기록
- preview result 기록
- visualization history 저장

### 데이터 책임
- preview_request
- preview_result
- source_snapshot_id
- visualization_metadata
- requested_at

### 원칙
- 항상 열린 패널이 아님
- 저장 구조는 있으나 UI 상시 노출을 전제하지 않음

### API 후보
- POST /projects/{id}/detail-view/requests
- GET /projects/{id}/detail-view/results
- GET /projects/{id}/detail-view/results/{id}

---

## S-04. Project Summary / History
### 화면 목적
프로젝트 핵심 요약, 에이전트 구성, 작업 상태, 다음 단계 확인

### 핵심 기능
- 프로젝트 정보 조회
- 요약 상태 보기
- 히스토리 보기
- 다음 액션 추천

### 백엔드 책임
- summary read model 제공
- project history 제공
- snapshot timeline 제공

### 데이터 책임
- project_summary
- history entries
- snapshot list
- recommended next actions

### API 후보
- GET /projects/{id}/summary
- GET /projects/{id}/history
- GET /projects/{id}/snapshots

---

## S-05. Export Screen
### 화면 목적
프로젝트를 구조화된 전달 패키지로 내보내는 화면

### 핵심 기능
- export 포함 항목 확인
- ZIP/package 생성
- export 수행

### 백엔드 책임
- export manifest 생성
- markdown/json 파일 생성
- 업로드/시각화 결과 묶음
- ZIP 패키징
- export log 저장

### 데이터 책임
- export_manifest
- exported_summary
- exported_agent_roles
- exported_canvas_data
- exported_uploads
- exported_visualizations
- instructions

### 원칙
- 단순 이미지 다운로드 아님
- downstream handoff 패키지여야 함

### API 후보
- POST /projects/{id}/exports
- GET /projects/{id}/exports
- GET /projects/{id}/exports/{export_id}
- GET /projects/{id}/exports/{export_id}/download

---

# 3. Feature → Persistence Map

## 3-1. 프로젝트
저장 대상:
- project id
- title
- generated title
- created_at
- updated_at
- status
- current purpose hint

## 3-2. 에이전트
저장 대상:
- agent id
- project id
- role label
- order
- active/inactive
- created_at
- updated_at

## 3-3. 캔버스 상태
저장 대상:
- current canvas state
- layer/object references
- style metadata
- linked asset references

## 3-4. 캔버스 이벤트
저장 대상:
- stroke_created
- text_added
- shape_added
- asset_linked
- annotation_added
- move
- copy
- cut
- delete
- zoom state changed
- selection changed

## 3-5. 업로드 자산
저장 대상:
- asset metadata
- storage path
- dimensions
- mime type
- upload timestamp
- linked project

## 3-6. 에이전트 상호작용
저장 대상:
- user prompt
- prompt context
- summary response
- detailed response reference
- agent role mapping
- created_at

## 3-7. Detail View / 시각화
저장 대상:
- request record
- source state/snapshot
- result metadata
- result asset reference
- created_at

## 3-8. Export
저장 대상:
- export record
- export manifest
- package path
- included items
- export timestamp

---

# 4. Feature → API Contract Responsibility Map

## 프로젝트 관련
- project create/read/update/list
- recent projects
- summary view

## 에이전트 관련
- create/update/delete project agents
- fetch configured roles
- fetch agent interaction history

## 캔버스 관련
- full state save/load
- event append
- snapshot generation

## 업로드 관련
- asset upload
- asset list
- asset delete or unlink

## Detail View 관련
- preview request
- preview result list/read

## Export 관련
- export create
- export status
- export download

---

# 5. Fixed Capability vs UI-Changeable Matrix

## 절대 고정
- 프로젝트 기반 구조
- 에이전트 역할 커스터마이징
- 캔버스 + 이미지 마킹
- 요약형 에이전트 응답
- 선택형 Detail View
- 구조화 Export
- 이벤트/스냅샷/기계 판독 로그 저장

## UI 변경 가능
- Agent Panel 위치
- Detail View가 모달인지 드로어인지
- Export 버튼 위치
- 모바일 하단 탭 순서
- Workspace 패널 분할 비율
- Summary/History 화면의 시각 배치

---

# 6. 구현 시 주의사항

1. 피그마 화면 이름을 그대로 백엔드 모듈명으로 복사하지 않는다.
2. Main Workspace 하나에 기능이 많더라도, 저장 책임은 분리한다.
3. Upload + Markup은 canvas의 부가 기능이 아니라 핵심 플로우다.
4. Detail View는 UI 상 선택형이지만, 백엔드 기록 구조는 독립 기능으로 유지한다.
5. Export는 다운로드 기능이 아니라 handoff pipeline이다.
6. Agent Panel은 실시간 소음형 토론보다 summary-first 구조를 유지한다.
7. UI 변경이 생겨도 API 계약과 persistence 책임이 쉽게 흔들리면 안 된다.

---

# 7. 이 문서를 다시 읽어야 하는 단계

이 문서는 최소 아래 단계에서 다시 읽어야 한다.

- Step 5 설계 문서 생성
- Step 7 구현 리포지토리 초기화
- Step 8 백엔드 스캐폴드 구현
- Step 9 프론트엔드 스캐폴드 구현
- Step 10 API 연결
- Step 11 핵심 기능 구현
- Step 12 이벤트/메모리/스냅샷 구현

Step 13 이후에는 참고용으로 사용한다.

---

# 8. 문서 상태
- 버전: v1
- 용도: 화면-기능-시스템 책임 연결 기준
- 적용 범위: 프론트/백엔드 구현 전 단계 및 MVP 구현 단계