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

/** Structured error so UI can branch on status without dumping server JSON */
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

async function doRefresh(): Promise<void> {
  const rt = getRefreshToken();
  if (!rt) throw new Error("No refresh token");

  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: rt }),
  });

  if (!res.ok) {
    throw new Error(`Refresh failed: ${res.status}`);
  }

  const json = await res.json();
  const data = json?.data ?? json;
  if (!data?.accessToken) {
    throw new Error("Invalid refresh response");
  }

  setTokens(data.accessToken, data.refreshToken ?? rt);
}

async function ensureRefreshedOnce() {
  if (!refreshing) {
    refreshing = doRefresh().finally(() => (refreshing = null));
  }
  return refreshing;
}

export type ApiInit = RequestInit & { skipAuth?: boolean };

/** Best-effort extract of a human-friendly message from various API shapes */
function pickServerMessage(body: any, fallback: string) {
  return (
    body?.message || body?.error || body?.result?.response?.message || fallback
  );
}

/** Throw ApiError with parsed body so callers can decide UX */
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

  const headers: HeadersInit = {
    ...(init.headers || {}),
    ...(init.skipAuth ? {} : getAuthHeaders()),
  };

  let res = await fetch(url, { ...init, headers });

  if (res.status !== 401) return res;

  // Try refresh once if we had an access token attached
  if (!init.skipAuth && getAccessToken() && getRefreshToken()) {
    try {
      await ensureRefreshedOnce();
      const retryHeaders: HeadersInit = {
        ...(init.headers || {}),
        ...getAuthHeaders(),
      };
      res = await fetch(url, { ...init, headers: retryHeaders });
      if (res.status !== 401) return res;
    } catch {
      // fall through
    }
  }

  clearTokens();
  return res; // let caller decide how to handle 401
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
