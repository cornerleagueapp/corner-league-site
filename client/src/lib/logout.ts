// src/lib/logout.ts
import { apiRequest, cancelProactiveRefresh } from "@/lib/apiClient";
import { clearTokens } from "@/lib/token";
import { CacheManager } from "@/lib/cacheManager";
import { queryClient } from "@/lib/queryClient";

export async function logout(redirectTo = "/auth") {
  try {
    await apiRequest("POST", "/auth/logout");
  } catch {}
  cancelProactiveRefresh();
  clearTokens();
  CacheManager?.handleUserAction?.("logout");
  queryClient.setQueryData(["/auth/me"], null);
  queryClient.removeQueries({ queryKey: ["/auth/me"], exact: true });
  window.location.href = redirectTo;
}
