// src/lib/token.ts
const AT_KEY = "cl_access_token";
const RT_KEY = "cl_refresh_token";
const UN_KEY = "cl_username";
const USER_KEY = "cl_user";

function stripBearer(s?: string | null): string | null {
  if (!s) return s ?? null;
  return s.startsWith("Bearer ") ? s.slice(7) : s;
}

/** Save tokens to storage (raw JWTs only). */
export function setTokens(accessToken: string, refreshToken?: string) {
  const at = stripBearer(accessToken) ?? "";
  localStorage.setItem(AT_KEY, at);
  if (refreshToken) {
    const rt = stripBearer(refreshToken) ?? "";
    if (rt) localStorage.setItem(RT_KEY, rt);
  }
}

export function clearTokens() {
  localStorage.removeItem(AT_KEY);
  localStorage.removeItem(RT_KEY);
  localStorage.removeItem(UN_KEY);
  clearUser();
}

export function getAccessToken(): string | null {
  return stripBearer(localStorage.getItem(AT_KEY));
}
export function getRefreshToken(): string | null {
  return stripBearer(localStorage.getItem(RT_KEY));
}

export function setUsername(username: string) {
  localStorage.setItem(UN_KEY, username);
}
export function getUsername(): string | null {
  return localStorage.getItem(UN_KEY);
}

export function saveUser(u: any) {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(u));
  } catch {}
}
export function loadUser(): any | null {
  try {
    const s = localStorage.getItem(USER_KEY);
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
}
export function clearUser() {
  localStorage.removeItem(USER_KEY);
}

/** Build Authorization header from stored token. */
export function getAuthHeaders(): HeadersInit {
  const at = getAccessToken();
  return at ? { Authorization: `Bearer ${at}` } : {};
}
