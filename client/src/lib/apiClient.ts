// src/lib/apiClient.ts
import { API_URL } from "@/lib/env";
import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
  getAuthHeaders,
} from "./token";

let refreshing: Promise<void> | null = null;

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

// proactive refresh scheduler
let refreshTimer: number | null = null;

export function scheduleProactiveRefresh(fromAccessToken: string) {
  try {
    const [, payloadB64] = fromAccessToken.split(".");
    const payload = JSON.parse(atob(payloadB64));
    const expMs = (payload.exp ?? 0) * 1000;
    const msUntil = expMs - Date.now() - 60_000; // refresh 60s early
    if (refreshTimer) window.clearTimeout(refreshTimer);
    if (msUntil > 5_000) {
      refreshTimer = window.setTimeout(() => {
        ensureRefreshedOnce().catch(() => {}); // silent
      }, msUntil);
    }
  } catch {
    /* no exp → skip */
  }
}

export function cancelProactiveRefresh() {
  if (refreshTimer) window.clearTimeout(refreshTimer);
  refreshTimer = null;
}

async function doRefresh(): Promise<void> {
  const rt = getRefreshToken();
  if (!rt) throw new Error("No refresh token");

  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: rt }),
  });
  if (!res.ok) throw new Error(`Refresh failed: ${res.status}`);

  const json = await res.json();
  const data = json?.data ?? json;
  if (!data?.accessToken) throw new Error("Invalid refresh response");

  setTokens(data.accessToken, data.refreshToken ?? rt);
  scheduleProactiveRefresh(data.accessToken);
}

async function ensureRefreshedOnce() {
  if (!refreshing) refreshing = doRefresh().finally(() => (refreshing = null));
  return refreshing;
}

export type ApiInit = RequestInit & { skipAuth?: boolean };

function pickServerMessage(body: any, fallback: string) {
  return (
    body?.message || body?.error || body?.result?.response?.message || fallback
  );
}

async function assertOk(res: Response) {
  if (res.ok) return;
  const text = await res.text();
  let body: any = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  const msg = pickServerMessage(body, res.statusText || "Request failed");
  throw new ApiError(res.status, msg, body);
}

export async function apiFetch(
  path: string,
  init: ApiInit = {}
): Promise<Response> {
  const url = path.startsWith("http") ? path : `${API_URL}${path}`;

  let attempt = 0;
  while (attempt < 2) {
    // If we only have RT, try to mint AT first
    if (!init.skipAuth && !getAccessToken() && getRefreshToken()) {
      try {
        await ensureRefreshedOnce();
      } catch {}
    }

    // Build headers after a possible refresh
    const headers: HeadersInit = {
      ...(init.headers || {}),
      ...(init.skipAuth ? {} : getAuthHeaders()),
    };

    const res = await fetch(url, { ...init, headers });
    if (res.status !== 401 || init.skipAuth) return res;

    // 401 → one refresh+retry if we can
    if (attempt === 0 && getRefreshToken()) {
      try {
        await ensureRefreshedOnce();
        attempt++;
        continue; // loop will rebuild headers and retry
      } catch {
        return res; // no logout here
      }
    }
    return res;
  }
  return fetch(url, init);
}

export async function apiRequest<T = any>(
  method: string,
  path: string,
  data?: unknown
): Promise<T> {
  const res = await apiFetch(path, {
    method,
    headers: data ? { "Content-Type": "application/json" } : undefined,
    body: data ? JSON.stringify(data) : undefined,
  });
  await assertOk(res);
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
