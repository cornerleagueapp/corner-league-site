// src/lib/logout.ts
import { apiRequest } from "@/lib/apiClient";
import { clearTokens } from "@/lib/token";
import { CacheManager } from "@/lib/cacheManager";
import { queryClient } from "@/lib/queryClient";

export async function logout(redirectTo = "/auth") {
  // Best-effort tell backend; ignore if endpoint doesn’t exist or user already logged out
  try {
    await apiRequest("POST", "/auth/logout");
  } catch {}

  // Clear local auth + all app caches
  clearTokens(); // <-- also clears cached user (from our earlier change)
  CacheManager?.handleUserAction?.("logout");

  // Make sure React Query stops thinking we’re logged in
  queryClient.setQueryData(["/auth/me"], null);
  queryClient.removeQueries({ queryKey: ["/auth/me"], exact: true });

  // Optional: clear whole cache if you want a pristine state
  // queryClient.clear();

  // Redirect to auth
  window.location.href = redirectTo;
}
