// src/lib/apiClient.ts
import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
} from "./token";

const API_BASE =
  (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/$/, "") ||
  "/api";

const REFRESH_PATH =
  (import.meta.env.VITE_REFRESH_PATH as string | undefined) || "";

const AUTH_SENSITIVE_RE =
  /\/(auth\/me|users\/me|auth\/profile|users\/profile)\b/i;

type FetchOpts = Omit<RequestInit, "body"> & {
  body?: any;
  skipAuth?: boolean;
  withCredentials?: boolean;
};

export async function apiFetch(path: string, opts: FetchOpts = {}) {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  const headers: Record<string, string> = {};

  // JSON header only for plain object bodies
  const isJsonBody =
    opts.body &&
    !(opts.body instanceof FormData) &&
    !(opts.body instanceof Blob) &&
    typeof opts.body !== "string";

  if (isJsonBody) headers["Content-Type"] = "application/json";
  headers["Accept"] = "application/json";

  if (!opts.skipAuth) {
    const at = getAccessToken();
    if (at) headers["Authorization"] = `Bearer ${at}`;
  }

  const init: RequestInit = {
    method: opts.method ?? "GET",
    // important: do not force cookies (this breaks CORS when server uses `*`)
    credentials: opts.withCredentials ? "include" : "same-origin",
    ...opts,
    headers: { ...(opts.headers as any), ...headers },
    body: isJsonBody ? JSON.stringify(opts.body) : opts.body,
  };

  return fetch(url, init);
}

export class ApiError extends Error {
  status: number;
  body?: any;
  constructor(status: number, message: string, body?: any) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

async function parseMaybeJson(res: Response) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return text;
  }
}

function pickMsg(body: any, fallback: string) {
  return (
    body?.message || body?.error || body?.result?.response?.message || fallback
  );
}

let refreshUnsupported = !REFRESH_PATH;
let refreshInFlight: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  const rt = getRefreshToken();
  if (!rt || refreshUnsupported) return false;

  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const res = await apiFetch(REFRESH_PATH, {
          method: "POST",
          body: { refreshToken: rt },
          skipAuth: true,
        });

        if (res.status === 404 || res.status === 405) {
          refreshUnsupported = true;
          return false;
        }
        if (!res.ok) return false;

        const json = await res.json();
        const at = json?.accessToken ?? json?.data?.accessToken ?? null;
        const newRt = json?.refreshToken ?? json?.data?.refreshToken ?? rt;
        if (!at) return false;

        setTokens(at, newRt);
        return true;
      } catch {
        return false;
      } finally {
        refreshInFlight = null;
      }
    })();
  }
  return refreshInFlight;
}

type RequestBehavior = {
  refreshOn401?: boolean;
  logoutOn401?: boolean;
};

export async function apiRequest<T = any>(
  method: string,
  path: string,
  body?: any,
  behavior: RequestBehavior = {}
): Promise<T> {
  const pathLower = (path || "").toLowerCase();
  const refreshOn401 =
    behavior.refreshOn401 ?? AUTH_SENSITIVE_RE.test(pathLower);
  const logoutOn401 = behavior.logoutOn401 ?? AUTH_SENSITIVE_RE.test(pathLower);

  const doRequest = () => apiFetch(path, { method, body });

  // first attempt
  let res = await doRequest();

  // If 401 and we opted-in to refresh (typically only for /auth/me)
  if (res.status === 401 && refreshOn401) {
    const ok = await tryRefresh();
    if (ok) {
      res = await doRequest();
    }
  }

  if (!res.ok) {
    const bodyJson = await parseMaybeJson(res);
    const msg = pickMsg(bodyJson, res.statusText || "Request failed");

    // IMPORTANT:
    // Only clear tokens for identity endpoints (or if you explicitly opt-in).
    // This prevents logout when the backend uses 401 for “not a member”.
    if (res.status === 401 && logoutOn401) {
      // Only nuke tokens if message clearly indicates token problems,
      // or if we already attempted a refresh for this request.
      const m = String(msg || "").toLowerCase();
      if (/token|jwt|expired|signature|unauth/.test(m) || refreshOn401) {
        clearTokens();
      }
    }

    throw new ApiError(res.status, msg, bodyJson);
  }

  // 204 → no content
  if (res.status === 204) return undefined as T;

  const json = (await parseMaybeJson(res)) as T;
  return json;
}

/** Optional: decode JWT exp and schedule a refresh call a bit early (only useful if refresh exists). */
let refreshTimer: number | null = null;
export function scheduleProactiveRefresh(accessToken: string) {
  if (refreshTimer) window.clearTimeout(refreshTimer);
  if (refreshUnsupported) return; // nothing to schedule
  try {
    const [, payload] = accessToken.split(".");
    const data = JSON.parse(atob(payload));
    const expMs = (data.exp as number) * 1000;
    const skew = 30_000; // refresh 30s early
    const inMs = Math.max(5_000, expMs - Date.now() - skew);
    refreshTimer = window.setTimeout(() => {
      void tryRefresh();
    }, inMs) as any;
  } catch {
    // ignore if token isn't a JWT
  }
}
export function cancelProactiveRefresh() {
  if (refreshTimer) window.clearTimeout(refreshTimer);
  refreshTimer = null;
}
