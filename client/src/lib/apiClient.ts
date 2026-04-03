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
  noRefresh?: boolean;
  hardLogoutOn401?: boolean;
};

function stripLeadingApi(path: string) {
  return path.replace(/^\/api(\/|$)/i, "/");
}

function shouldHardLogout(path: string, opts?: FetchOpts) {
  if (opts?.hardLogoutOn401) return true;
  return AUTH_SENSITIVE_RE.test((path || "").toLowerCase());
}

export async function apiFetch(path: string, opts: FetchOpts = {}) {
  const makeUrl = () => {
    return path.startsWith("http")
      ? path
      : `${API_BASE}${stripLeadingApi(path.startsWith("/") ? path : `/${path}`)}`;
  };

  const doFetch = async () => {
    const url = makeUrl();

    const hdrs = new Headers(opts.headers || {});
    const body = opts.body;

    const isPlainObj =
      body &&
      typeof body === "object" &&
      !(body instanceof FormData) &&
      !(body instanceof Blob);

    if (isPlainObj && !hdrs.has("Content-Type")) {
      hdrs.set("Content-Type", "application/json");
    }
    if (!hdrs.has("Accept")) {
      hdrs.set("Accept", "application/json");
    }

    if (!opts.skipAuth) {
      const at = getAccessToken();
      if (at && !hdrs.has("Authorization")) {
        hdrs.set("Authorization", `Bearer ${at}`);
      }
    }

    const init: RequestInit = {
      method: opts.method ?? "GET",
      credentials: opts.withCredentials ? "include" : "same-origin",
      ...opts,
      headers: hdrs,
      body: isPlainObj ? JSON.stringify(body) : body,
    };

    return fetch(url, init);
  };

  let res = await doFetch();

  const isRefreshCall =
    typeof REFRESH_PATH === "string" &&
    REFRESH_PATH &&
    (path === REFRESH_PATH || path.endsWith(REFRESH_PATH));

  if (
    res.status === 401 &&
    !opts.skipAuth &&
    !opts.noRefresh &&
    !isRefreshCall
  ) {
    const ok = await tryRefresh();

    if (ok) {
      res = await doFetch();
    } else {
      // Do NOT force logout for random content/data requests.
      // Only clear session for identity-sensitive endpoints.
      if (shouldHardLogout(path, opts)) {
        clearTokens();
        window.dispatchEvent(new Event("auth:logout"));
        try {
          localStorage.setItem("auth:logout", String(Date.now()));
        } catch {}
      }
    }
  }

  return res;
}

export class ApiError extends Error {
  status: number;
  body?: any;
  constructor(status: number, message: string, body?: any) {
    super(message);
    this.status = status;
    this.body = body;
    this.name = "ApiError";
  }
}

async function parseMaybeJson(res: Response) {
  const txt = await res.text();
  try {
    return txt ? JSON.parse(txt) : null;
  } catch {
    return txt;
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
          noRefresh: true,
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
        scheduleProactiveRefresh(at);
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

type RequestBehavior = { refreshOn401?: boolean; logoutOn401?: boolean };

export async function apiRequest<T = any>(
  method: string,
  path: string,
  body?: any,
  behavior: RequestBehavior = {},
): Promise<T> {
  const pathLower = (path || "").toLowerCase();
  const refreshOn401 =
    behavior.refreshOn401 ?? AUTH_SENSITIVE_RE.test(pathLower);
  const logoutOn401 = behavior.logoutOn401 ?? AUTH_SENSITIVE_RE.test(pathLower);

  const doRequest = () =>
    apiFetch(path, {
      method,
      body,
      hardLogoutOn401: logoutOn401,
      noRefresh: !refreshOn401,
    });

  let res = await doRequest();

  if (res.status === 401 && refreshOn401) {
    const ok = await tryRefresh();
    if (ok) {
      res = await doRequest();
    }
  }

  if (!res.ok) {
    const bodyJson = await parseMaybeJson(res);
    const msg = pickMsg(bodyJson, res.statusText || "Request failed");

    if (res.status === 401 && logoutOn401) {
      clearTokens();
      window.dispatchEvent(new Event("auth:logout"));
      try {
        localStorage.setItem("auth:logout", String(Date.now()));
      } catch {}
    }

    throw new ApiError(res.status, msg, bodyJson);
  }

  if (res.status === 204) return undefined as T;

  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return (await res.json()) as T;

  return (await res.text()) as unknown as T;
}

let refreshTimer: number | null = null;

export function scheduleProactiveRefresh(accessToken: string) {
  if (refreshTimer) window.clearTimeout(refreshTimer);
  if (refreshUnsupported) return;

  try {
    const [, payload] = accessToken.split(".");
    const { exp } = JSON.parse(atob(payload));
    if (!exp) return;

    const msToExp = exp * 1000 - Date.now();
    const lead = Math.max(30_000, Math.min(90_000, msToExp * 0.1));
    const due = Math.max(5_000, msToExp - lead);

    refreshTimer = window.setTimeout(() => {
      void tryRefresh();
    }, due) as any;
  } catch {
    //
  }
}

export function cancelProactiveRefresh() {
  if (refreshTimer) window.clearTimeout(refreshTimer);
  refreshTimer = null;
}

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    const at = getAccessToken();
    if (at) scheduleProactiveRefresh(at);
  }
});
