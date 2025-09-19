// src/lib/token.ts
const AT_KEY = "cl_access_token";
const RT_KEY = "cl_refresh_token";
const UN_KEY = "cl_username";
const USER_KEY = "cl_user";

export function setTokens(accessToken: string, refreshToken?: string) {
  localStorage.setItem(AT_KEY, accessToken);
  if (refreshToken) localStorage.setItem(RT_KEY, refreshToken);
}

export function clearTokens() {
  localStorage.removeItem(AT_KEY);
  localStorage.removeItem(RT_KEY);
  localStorage.removeItem(UN_KEY);
  clearUser();
}

export function getAccessToken(): string | null {
  return localStorage.getItem(AT_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(RT_KEY);
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

export function getAuthHeaders(): HeadersInit {
  const at = getAccessToken();
  return at ? { Authorization: `Bearer ${at}` } : {};
}
