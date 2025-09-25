// client/src/lib/env.ts
export const API_URL =
  (import.meta.env.VITE_API_URL as string) || "http://localhost:8000";
