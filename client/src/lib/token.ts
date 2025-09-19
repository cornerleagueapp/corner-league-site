// src/lib/token.ts
const ACCESS_KEY = "accessToken";
const REFRESH_KEY = "refreshToken";
const USERNAME_KEY = "username";

export function setTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem(ACCESS_KEY, accessToken);
  localStorage.setItem(REFRESH_KEY, refreshToken);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export function getAccessToken() {
  return localStorage.getItem(ACCESS_KEY) || "";
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_KEY) || "";
}

export function setUsername(username: string) {
  localStorage.setItem(USERNAME_KEY, username);
}

export function getUsername() {
  return localStorage.getItem(USERNAME_KEY) || "";
}

export function getAuthHeaders(): HeadersInit {
  const at = getAccessToken();
  return at ? { Authorization: `Bearer ${at}` } : {};
}
