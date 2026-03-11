# Research: Step 10 — API Connection, Auth Guard, JWT Cookies, Celery Wiring

## 1. 분석 대상 및 작동 원리

### 관련 파일/폴더
| 파일 경로 | 목적 |
|-----------|------|
| `frontend/lib/api.ts` | Base fetch wrapper — 모든 서비스가 사용 |
| `frontend/lib/services/auth.ts` | 로그인/로그아웃/getMe — USE_MOCK=true, 토큰 메모리 저장 |
| `frontend/lib/services/projects.ts` | 프로젝트 CRUD — USE_MOCK=true |
| `frontend/lib/services/agents.ts` | 에이전트 CRUD — USE_MOCK=true |
| `frontend/lib/services/canvas.ts` | 캔버스 로드/저장 — USE_MOCK=true |
| `frontend/lib/services/assets.ts` | 에셋 업로드/조회 — USE_MOCK=true |
| `frontend/lib/services/ai.ts` | AI 쿼리/응답/히스토리 — USE_MOCK=true |
| `frontend/lib/services/export.ts` | 익스포트 시작/조회 — USE_MOCK=true |
| `frontend/lib/services/detail-view.ts` | 디테일뷰 시작/조회 — USE_MOCK=true |
| `frontend/app/(workspace)/layout.tsx` | 워크스페이스 레이아웃 — 인증 가드 미구현 |
| `frontend/app/(auth)/layout.tsx` | 인증 레이아웃 — 로그인 상태 리다이렉트 미구현 |
| `frontend/app/page.tsx` | 루트 — 항상 /projects로 리다이렉트 (인증 무시) |
| `backend/app/routers/auth.py` | 인증 라우터 — /me 엔드포인트 없음 |
| `backend/app/services/auth_service.py` | 인증 서비스 — token_type 누락 |
| `backend/app/services/export_service.py` | 익스포트 서비스 — .delay() 주석 처리됨 |
| `backend/app/services/detail_view_service.py` | 디테일뷰 서비스 — .delay() 주석 처리됨 |
| `backend/app/worker/celery_app.py` | Celery 앱 — 구성 완료, 워커 미기동 |
| `backend/app/worker/tasks/export_task.py` | 익스포트 태스크 — 완전 구현됨 |
| `backend/app/worker/tasks/detail_view_task.py` | 디테일뷰 태스크 — 완전 구현됨 |
| `backend/app/core/auth.py` | JWT 생성/검증 — Bearer만 지원 |
| `backend/app/main.py` | FastAPI 앱 — CORS credentials=True 설정됨 |

### 작동 방식 / 데이터 흐름

**인증 흐름 (현재 상태)**:
```
POST /auth/login
  ↓ credentials 검증 (bcrypt)
  ↓ JWT 생성 (sub=user_id, exp=+60min)
  ↓ { data: { access_token, user_id, email } } 반환

Frontend: _accessToken 변수에 저장 (페이지 새로고침 시 소멸)
→ 새로고침 = 로그아웃 상태 = 인증 안된 것으로 처리
```

**인증 흐름 (Step 10 목표)**:
```
POST /auth/login
  ↓ JWT 생성
  ↓ localStorage에 access_token 저장
  ↓ /projects로 이동

새로고침 시: localStorage에서 토큰 복원 → getMe() 호출 → 유효성 확인
인증 가드: (workspace)/layout에서 토큰 확인 → 없으면 /login 리다이렉트
```

**Celery 흐름 (현재 비활성)**:
```
POST /exports → ExportRecord(status="pending") 생성
                .delay() 주석 처리됨 → 태스크 미전송
                → 상태 영원히 "pending"

Step 10 목표:
POST /exports → ExportRecord 생성 → build_export.delay(id) 호출
                Celery 워커 picks up → ZIP 생성 → MinIO 업로드
                → ExportRecord.status = "completed", download_url 설정
```

---

## 2. 기존 레이어 및 아키텍처 구조

### 현재 계층 구조
```
Frontend
  app/(auth)/ → 비인증 페이지 (login, register)
  app/(workspace)/ → 인증 필요 페이지 (projects, [id], etc.)
  lib/services/ → API 서비스 레이어 (8개 파일, 전부 USE_MOCK=true)
  lib/api.ts → base fetch wrapper

Backend
  routers/ → FastAPI 라우터 (auth, projects, agents, canvas, assets, ai, detail_view, export, events)
  services/ → 비즈니스 로직 (auth_service, project_service 등)
  models/ → SQLAlchemy ORM 모델
  core/ → auth.py (JWT), config.py (환경변수), storage.py (MinIO)
  worker/ → Celery 앱 + tasks (export_task, detail_view_task)
```

### 각 계층의 책임
- **라우터**: HTTP 요청/응답 처리, 입력 검증, Depends(get_current_user) 인증 적용
- **서비스**: 비즈니스 로직, DB 조작, Celery 태스크 디스패치
- **태스크**: 백그라운드 비동기 작업 (AI 호출, 파일 어셈블리, 스토리지 업로드)
- **core/auth.py**: JWT 생성/검증, 현재 사용자 추출

---

## 3. 데이터베이스 및 ORM 관리 방식

- **ORM**: SQLAlchemy AsyncSession (asyncpg driver)
- **마이그레이션**: Alembic — `0001_initial_schema.py` (10개 테이블 전체 포함)
- **마이그레이션 규칙**: 새 컬럼 추가 시 새 버전 파일 생성 필요

### 관련 모델
- `users` — id (UUID), email, hashed_password, display_name
- `projects` — id, owner_id, title, status, agent_roles
- `agents` — id, project_id, role, instructions
- `canvas_elements` — id, project_id, element_data (JSONB)
- `project_assets` — id, project_id, file_name, storage_url
- `agent_responses` — id, project_id, query_id, agent_id, summary_text, full_reasoning
- `detail_view_results` — id, project_id, element_id, status, storage_url
- `export_records` — id, project_id, status, download_url, manifest
- `project_events` — id, project_id, event_type, payload (append-only)

---

## 4. 중복 체크 결과

### 기존 유사 기능
| 기능 | 백엔드 구현 | 프론트엔드 서비스 | 상태 |
|------|-----------|----------------|------|
| 로그인/등록 | ✅ 완전 구현 | ✅ mock 존재 | USE_MOCK 전환 필요 |
| 프로젝트 CRUD | ✅ 완전 구현 | ✅ mock 존재 | USE_MOCK 전환 필요 |
| 에이전트 CRUD | ✅ 완전 구현 | ✅ mock 존재 | USE_MOCK 전환 필요 |
| 캔버스 로드/저장 | ✅ 완전 구현 | ✅ mock 존재 | USE_MOCK 전환 필요 |
| 에셋 업로드 | ✅ 완전 구현 | ✅ mock 존재 | USE_MOCK 전환 필요 |
| AI 쿼리 | ✅ 완전 구현 | ✅ mock 존재 | USE_MOCK 전환 필요 |
| 익스포트 | ✅ 구현, 태스크 비활성 | ✅ mock 존재 | .delay() 활성화 필요 |
| 디테일뷰 | ✅ 구현, 태스크 비활성 | ✅ mock 존재 | .delay() 활성화 필요 |
| 이벤트 로그 | ✅ 완전 구현 | ✅ mock 존재 | USE_MOCK 전환 필요 |
| /auth/me | ❌ 없음 | ✅ getMe() 호출 | 백엔드 추가 필요 |

### 재사용 가능한 코드
- `api.ts`의 `request()` 함수 — credentials 추가만 하면 됨
- `authHeaders()` — localStorage 기반으로 교체
- 모든 서비스 파일 구조 — USE_MOCK 플래그만 전환

---

## 5. 핵심 발견사항 및 블로커

### A. 인증 토큰 저장 전략
**현재**: `_accessToken` 인메모리 변수 (새로고침 시 소멸)
**문제**: 새로고침하면 로그아웃됨 — 실사용 불가
**해결**: `localStorage`에 access_token 저장 (httpOnly 쿠키는 백엔드 Set-Cookie 필요 — 구조 변경 큼)
**결정**: localStorage 기반 Bearer 토큰 전략 채택 (Step 10 범위 내)

### B. /auth/me 엔드포인트 누락
**현재**: 백엔드에 GET /auth/me 없음
**문제**: 프론트엔드 `getMe()` 호출 → 404
**해결**: 백엔드 auth.py에 엔드포인트 추가 (2줄)

### C. token_type 필드 불일치
**현재**: 백엔드 응답에 `token_type` 없음
**프론트엔드 TokenPair 타입**: `{ access_token: string; token_type: "bearer" }`
**해결 선택지**:
1. 백엔드에 `token_type: "bearer"` 추가 — 권장
2. 프론트엔드 타입에서 optional로 변경

### D. 캔버스 HTTP 메서드 불일치
**백엔드 캔버스 저장**: `PUT /projects/{id}/canvas`
**프론트엔드 canvas.ts**: 실제 코드 확인 필요 (POST vs PUT)

### E. Celery 태스크 비활성
**export_service.py:36-37**: `.delay()` 주석 처리
**detail_view_service.py:40-41**: `.delay()` 주석 처리
**해결**: 주석 해제 — 단 Redis + Celery 워커 기동 전제

### F. 환경변수 파일 부재
**frontend/.env.local**: 없음 → `NEXT_PUBLIC_API_URL` 미설정
**backend/.env**: 없음 → DB/Redis/MinIO 연결 불가

---

## 결론

Step 10은 **아키텍처 변경 없이 연결 작업**이다.
- 프론트엔드: `USE_MOCK` 플래그 전환 + 토큰 persistent 저장 + 인증 가드 추가
- 백엔드: `/auth/me` 엔드포인트 1개 추가 + `token_type` 필드 추가 + Celery `.delay()` 주석 해제
- 인프라: `.env` 파일 2개 생성

**구현 복잡도**: 낮음 — 모든 수정은 기존 구조 내에서 처리 가능
**리스크**: Redis/PostgreSQL/MinIO 로컬 기동 여부 (인프라 전제 조건)
**Step 11 디퍼**: Konva.js 캔버스 엔진, ContextBuilder 이벤트 어셈블리는 Step 10 범위 외
