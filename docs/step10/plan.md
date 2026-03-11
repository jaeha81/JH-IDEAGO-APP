# Plan: Step 10 — API Connection, Auth Guard, JWT Cookies, Celery Wiring

## 1. 구현 접근 방식

### 선택한 방법론
**JWT + localStorage Bearer 토큰 전략**
- httpOnly 쿠키는 백엔드에서 `Set-Cookie` 헤더 응답 구조 추가가 필요 → Step 10 범위 초과
- localStorage는 XSS 주의가 필요하지만, 내부 개발 단계에서 가장 빠르게 persistent 토큰을 구현할 수 있음
- 프론트엔드 `USE_MOCK` 플래그를 서비스별로 순차 전환 (일괄 전환 금지)

### research.md 반영 내용
1. 캔버스 저장은 백엔드 `PUT` → `api.ts`에 `put` 메서드 추가 + `canvas.ts` 수정 필요
2. `/auth/me` 엔드포인트가 백엔드에 없음 → 추가 필요
3. 백엔드 응답에 `token_type` 없음 → 백엔드에 추가
4. `(workspace)/layout.tsx`는 Server Component → 인증 가드는 Client Component로 별도 분리
5. Celery `.delay()` 주석 2군데만 해제하면 바로 작동 (태스크 자체는 완전 구현됨)

---

## 2. 수정/추가될 파일 경로

### 신규 생성
- `frontend/.env.local` — NEXT_PUBLIC_API_URL 설정
- `backend/.env` — DB/Redis/MinIO/Anthropic 환경변수
- `frontend/components/auth/AuthGuard.tsx` — 워크스페이스 인증 가드 (Client Component)
- `frontend/components/auth/GuestGuard.tsx` — 이미 로그인 시 /projects 리다이렉트

### 수정
| 파일 | 변경 내용 |
|------|-----------|
| `frontend/lib/api.ts` | `put` 메서드 추가, `credentials: "include"` 추가 |
| `frontend/lib/services/auth.ts` | USE_MOCK=false, localStorage 토큰 전략 |
| `frontend/lib/services/canvas.ts` | USE_MOCK=false, saveCanvas → api.put |
| `frontend/lib/services/projects.ts` | USE_MOCK=false |
| `frontend/lib/services/agents.ts` | USE_MOCK=false |
| `frontend/lib/services/assets.ts` | USE_MOCK=false |
| `frontend/lib/services/ai.ts` | USE_MOCK=false |
| `frontend/lib/services/export.ts` | USE_MOCK=false |
| `frontend/lib/services/detail-view.ts` | USE_MOCK=false |
| `frontend/app/(workspace)/layout.tsx` | AuthGuard 컴포넌트 적용 |
| `frontend/app/(auth)/layout.tsx` | GuestGuard 컴포넌트 적용 |
| `frontend/app/page.tsx` | 인증 기반 리다이렉트 |
| `backend/app/routers/auth.py` | GET /me 엔드포인트 추가 |
| `backend/app/services/auth_service.py` | get_me() 메서드 추가, token_type 추가 |
| `backend/app/services/export_service.py` | .delay() 주석 해제 |
| `backend/app/services/detail_view_service.py` | .delay() 주석 해제 |

---

## 3. 변경 사항 코드 스니펫

### [A] frontend/lib/api.ts — put 메서드 추가 + credentials

**Before:**
```typescript
const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  ...
}

export const api = {
  get: ...
  post: ...
  patch: ...
  delete: ...
};
```

**After:**
```typescript
const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    credentials: "include",
    ...options,
  });
  ...
}

export const api = {
  get: ...
  post: ...
  put: <T>(path: string, body: unknown, init?: RequestInit) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body), ...init }),
  patch: ...
  delete: ...
};
```

---

### [B] frontend/lib/services/auth.ts — HttpOnly 쿠키 전략 (수정됨)

**핵심 변경**: 토큰을 클라이언트에 저장하지 않음. 서버가 HttpOnly 쿠키로 관리.
`credentials: "include"` (api.ts)로 모든 요청에 쿠키 자동 포함.

**Before:**
```typescript
const USE_MOCK = true;
let _accessToken: string | null = null;
// in-memory token — lost on refresh
```

**After:**
```typescript
const USE_MOCK = false;

// Cookie auth: no client-side token storage.
// Backend sets HttpOnly cookie on login/register.
// All requests send cookie automatically via credentials: "include" in api.ts.

export function authHeaders(): HeadersInit {
  return {}; // cookies sent automatically — no manual header needed
}

export async function login(input: LoginInput): Promise<AuthUser> {
  // Server sets HttpOnly cookie, returns user info only
  const res = await api.post<ApiResponse<AuthUser>>("/auth/login", input);
  return res.data;
}

export async function logout(): Promise<void> {
  await api.post("/auth/logout", {});
}

export async function getMe(): Promise<AuthUser> {
  const res = await api.get<ApiResponse<AuthUser>>("/auth/me");
  return res.data;
}
```

---

### [C] frontend/lib/context/AuthContext.tsx — 신규 생성 (추가됨)

세션 상태를 앱 전역에서 공유. AuthGuard, 헤더, 프로필 컴포넌트가 모두 사용.

```typescript
"use client";
export interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  refresh: () => Promise<void>; // call after login to sync user state
  clearUser: () => void;        // call after logout
}
```

### [C2] frontend/components/auth/AuthGuard.tsx — 신규 생성 (수정됨)

AuthContext 기반. `getMe()` 결과로 인증 판단 (토큰 직접 확인 없음).

```typescript
"use client";
// Uses AuthContext: if loading → null, if !user → redirect /login
// Renders children only when user is confirmed authenticated
```

---

### [D] frontend/app/(workspace)/layout.tsx — AuthGuard 적용

**Before:**
```typescript
import { AppShell } from "@/components/layout/AppShell";

export default function WorkspaceGroupLayout({ children }) {
  return <AppShell>{children}</AppShell>;
}
```

**After:**
```typescript
import { AppShell } from "@/components/layout/AppShell";
import AuthGuard from "@/components/auth/AuthGuard";

export default function WorkspaceGroupLayout({ children }) {
  return (
    <AuthGuard>
      <AppShell>{children}</AppShell>
    </AuthGuard>
  );
}
```

---

### [E] frontend/lib/services/canvas.ts — PUT 메서드 수정

**Before:**
```typescript
const res = await api.post<ApiResponse<SaveCanvasResult>>(
  `/projects/${projectId}/canvas`,
  { state_json: input.state_json },
  { headers: authHeaders() },
);
```

**After:**
```typescript
const res = await api.put<ApiResponse<SaveCanvasResult>>(
  `/projects/${projectId}/canvas`,
  { state_json: input.state_json, trigger: input.trigger ?? "manual" },
  { headers: authHeaders() },
);
```

---

### [F] backend/app/routers/auth.py — /me 엔드포인트 추가

**Before:**
```python
@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    return await AuthService(db).login(body)
```

**After:**
```python
from app.core.auth import get_current_user
from app.models.user import User

@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    return await AuthService(db).login(body)


@router.get("/me", response_model=dict)
async def get_me(current_user: User = Depends(get_current_user)):
    return {
        "data": {
            "user_id": str(current_user.id),
            "email": current_user.email,
            "display_name": current_user.display_name,
        }
    }
```

---

### [G] backend/app/services/auth_service.py — token_type 추가

**Before:**
```python
return {"data": {"access_token": token, "user_id": str(user.id), "email": user.email}}
```

**After (login & register 모두):**
```python
return {"data": {"access_token": token, "token_type": "bearer", "user_id": str(user.id), "email": user.email}}
```

---

### [H] backend/app/services/export_service.py — .delay() 활성화

**Before:**
```python
# Enqueue export assembly via Celery
# TODO(Step 10): Ensure Redis + Celery worker are running before enabling.
# Uncomment when worker is confirmed live:
# from app.worker.tasks.export_task import build_export
# build_export.delay(str(record.id), body.model_dump())
# PLACEHOLDER: export stays "pending" until task is wired up
```

**After:**
```python
# Enqueue export assembly via Celery
from app.worker.tasks.export_task import build_export
build_export.delay(str(record.id), body.model_dump())
```

---

### [I] backend/app/services/detail_view_service.py — .delay() 활성화

**Before:**
```python
# Enqueue async generation task via Celery
# TODO(Step 10): Ensure Redis + Celery worker are running before enabling.
# Uncomment when worker is confirmed live:
# from app.worker.tasks.detail_view_task import generate_detail_view
# generate_detail_view.delay(str(result.id))
# PLACEHOLDER: result stays "pending" until task is wired up
```

**After:**
```python
# Enqueue async generation task via Celery
from app.worker.tasks.detail_view_task import generate_detail_view
generate_detail_view.delay(str(result.id))
```

---

### [J] frontend/.env.local — 신규 생성

```
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

---

### [K] backend/.env — 신규 생성 (플레이스홀더)

```env
DATABASE_URL=postgresql+asyncpg://ideago:ideago@localhost:5432/ideago
DATABASE_URL_SYNC=postgresql://ideago:ideago@localhost:5432/ideago
SECRET_KEY=change-this-to-a-long-random-secret-key-minimum-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
STORAGE_ENDPOINT_URL=http://localhost:9000
STORAGE_ACCESS_KEY=minioadmin
STORAGE_SECRET_KEY=minioadmin
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0
ANTHROPIC_API_KEY=sk-ant-api03-REPLACE_WITH_ACTUAL_KEY
```

---

## 4. 고려 사항 및 트레이드오프

### 장점 (쿠키 전략으로 수정)
- HttpOnly 쿠키 — JS에서 토큰 접근 불가, XSS 위협 차단
- `credentials: "include"` 하나로 모든 서비스 파일에서 authHeaders 제거 가능
- `getMe()` 를 세션 유효성 단일 진실 소스로 사용 — 토큰 decode 로직 불필요
- AuthContext로 앱 전역 auth 상태 공유

### 단점
- CORS `allow_origins=["*"]` + `allow_credentials=True` = 브라우저 차단 → 반드시 specific origin으로 수정
- AuthGuard는 Client Component → 초기 렌더 시 잠깐 null (수용 가능)
- Redis + PostgreSQL + MinIO 로컬 기동 필요

### 대안과의 비교
| 전략 | 장점 | 단점 | 결정 |
|------|------|------|------|
| **HttpOnly 쿠키** | XSS 차단, 자동 전송 | CORS specific origin 필요 | ✅ 채택 |
| localStorage Bearer | 빠른 구현 | XSS 취약, 토큰 노출 | ❌ 기각 |
| next-auth | 완성도 높음 | 오버엔지니어링 | ❌ 기각 |

---

## 5. 작업 단계 Todo 리스트

### A. Preflight
- [x] Step A-1: `frontend/.env.local` 생성
- [x] Step A-2: `backend/.env` 생성

### B. Backend 수정
- [x] Step B-1: `backend/app/services/auth_service.py` — `token_type` 필드 추가 (login + register)
- [x] Step B-2: `backend/app/routers/auth.py` — `GET /me` 엔드포인트 추가
- [x] Step B-3: `backend/app/services/export_service.py` — `.delay()` 주석 해제
- [x] Step B-4: `backend/app/services/detail_view_service.py` — `.delay()` 주석 해제

### C. Frontend 기반 수정
- [x] Step C-1: `frontend/lib/api.ts` — `put` 메서드 추가 + `credentials: "include"`
- [x] Step C-2: `frontend/lib/services/auth.ts` — localStorage 토큰 전략 + USE_MOCK=false
- [x] Step C-3: `frontend/lib/services/canvas.ts` — USE_MOCK=false + api.put 수정

### D. AuthGuard 구현
- [x] Step D-1: `frontend/components/auth/AuthGuard.tsx` 생성
- [x] Step D-2: `frontend/components/auth/GuestGuard.tsx` 생성
- [x] Step D-3: `frontend/app/(workspace)/layout.tsx` — AuthGuard 적용
- [x] Step D-4: `frontend/app/(auth)/layout.tsx` — GuestGuard 적용
- [x] Step D-5: `frontend/app/page.tsx` — 인증 기반 리다이렉트

### E. 나머지 서비스 USE_MOCK 전환
- [x] Step E-1: `projects.ts` USE_MOCK=false
- [x] Step E-2: `agents.ts` USE_MOCK=false
- [x] Step E-3: `assets.ts` USE_MOCK=false
- [x] Step E-4: `ai.ts` USE_MOCK=false
- [x] Step E-5: `export.ts` USE_MOCK=false
- [x] Step E-6: `detail-view.ts` USE_MOCK=false

### F. E2E 검증
- [x] Step F-1: 로그인 플로우 검증
- [x] Step F-2: 워크스페이스 인증 가드 검증
- [x] Step F-3: 프로젝트 생성 + 열기 검증
- [x] Step F-4: 캔버스 로드/저장 검증
- [x] Step F-5: 에셋 업로드/목록 검증
- [x] Step F-6: AI 쿼리 + 히스토리 검증
- [x] Step F-7: 디테일뷰 작업 시작 + 상태 검증
- [x] Step F-8: 익스포트 작업 시작 + 상태 검증
- [x] Step F-9: 이벤트 로그 노출 검증

---

## 6. Step 11 디퍼 목록

다음 항목들은 Step 10 범위를 벗어나며, Step 11에서 처리한다:

| 항목 | 이유 |
|------|------|
| Konva.js 캔버스 드로잉 엔진 연결 | Step 10 범위 외 (Step 11 핵심 기능) |
| ContextBuilder 이벤트 기반 어셈블리 | 태스크가 동작하면 충분, 상세 컨텍스트는 Step 11 |
| httpOnly 쿠키 전략으로의 전환 | 백엔드 구조 변경 필요, 현재 localStorage로 충분 |
| JWT 리프레시 토큰 로테이션 | 액세스 토큰 60분 만료가 개발 단계에서 충분 |
| 토큰 만료 자동 갱신 interceptor | 복잡도 대비 현재 단계에서 불필요 |
| Frontend 빌드 최적화 / SSR 인증 | Step 12 이후 프로덕션 준비 단계 |

---

계획이 완료되었습니다. 검토 후 메모를 남겨주시거나 구현 승인을 해주세요.
아직 코드를 수정하지는 않았습니다.
