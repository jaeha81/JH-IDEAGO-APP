// API service: Authentication
// Cookie-based strategy: backend sets HttpOnly cookie on login/register.
// Frontend relies on credentials: "include" (set in api.ts) for all requests.
// Session restoration: call getMe() — if 401, user is not authenticated.
// No client-side token storage — cookies are browser-managed.

import { api } from "@/lib/api";
import type { ApiResponse, AuthUser } from "@/types";

const USE_MOCK = false;

// authHeaders() is a no-op — cookies are sent automatically via credentials: "include".
// Kept for backward compatibility with service files that still call it.
export function authHeaders(): HeadersInit {
  return {};
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  display_name?: string;
}

export async function login(input: LoginInput): Promise<AuthUser> {
  if (USE_MOCK) {
    await delay(400);
    return { user_id: "user-001", email: input.email, display_name: "Designer" };
  }
  // Server sets HttpOnly cookie; response body contains user info only
  const res = await api.post<ApiResponse<AuthUser>>("/auth/login", input);
  return res.data;
}

export async function register(input: RegisterInput): Promise<AuthUser> {
  if (USE_MOCK) {
    await delay(500);
    return { user_id: "user-001", email: input.email, display_name: input.display_name ?? null };
  }
  const res = await api.post<ApiResponse<AuthUser>>("/auth/register", input);
  return res.data;
}

export async function getMe(): Promise<AuthUser> {
  if (USE_MOCK) {
    await delay(200);
    return { user_id: "user-001", email: "designer@example.com", display_name: "Designer" };
  }
  // Uses HttpOnly cookie automatically — no Authorization header needed
  const res = await api.get<ApiResponse<AuthUser>>("/auth/me");
  return res.data;
}

export async function logout(): Promise<void> {
  if (USE_MOCK) {
    await delay(100);
    return;
  }
  // Server clears the HttpOnly cookie
  await api.post("/auth/logout", {});
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
