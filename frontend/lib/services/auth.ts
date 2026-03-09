// API service: Authentication
// MOCK → REAL: set USE_MOCK = false and ensure NEXT_PUBLIC_API_URL is set.
// All token storage is in memory only — no localStorage in this scaffold.
// TODO(Step 10): Integrate refresh token rotation using httpOnly cookie or
//   secure storage strategy agreed with backend.

import { api } from "@/lib/api";
import type { ApiResponse, AuthUser, TokenPair } from "@/types";

const USE_MOCK = true;

// In-memory token store — replace with a secure strategy in Step 10
let _accessToken: string | null = null;

export function getAccessToken(): string | null {
  return _accessToken;
}

export function setAccessToken(token: string | null): void {
  _accessToken = token;
}

// Inject auth header for authenticated requests
export function authHeaders(): HeadersInit {
  return _accessToken ? { Authorization: `Bearer ${_accessToken}` } : {};
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

export async function login(input: LoginInput): Promise<TokenPair> {
  if (USE_MOCK) {
    await delay(400);
    const token = "mock-access-token-" + Date.now();
    setAccessToken(token);
    return { access_token: token, token_type: "bearer" };
  }
  const res = await api.post<ApiResponse<TokenPair>>("/auth/login", input);
  setAccessToken(res.data.access_token);
  return res.data;
}

export async function register(input: RegisterInput): Promise<TokenPair> {
  if (USE_MOCK) {
    await delay(500);
    const token = "mock-access-token-" + Date.now();
    setAccessToken(token);
    return { access_token: token, token_type: "bearer" };
  }
  const res = await api.post<ApiResponse<TokenPair>>("/auth/register", input);
  setAccessToken(res.data.access_token);
  return res.data;
}

export async function getMe(): Promise<AuthUser> {
  if (USE_MOCK) {
    await delay(200);
    return { user_id: "user-001", email: "designer@example.com", display_name: "Designer" };
  }
  const res = await api.get<ApiResponse<AuthUser>>("/auth/me", { headers: authHeaders() });
  return res.data;
}

export function logout(): void {
  setAccessToken(null);
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
