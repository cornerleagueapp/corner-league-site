// client/src/hooks/useAuth.ts
import { useQuery } from "@tanstack/react-query";
import { apiFetch, scheduleProactiveRefresh } from "@/lib/apiClient";
import type { User } from "@/types/user";
import {
  getAccessToken,
  getRefreshToken,
  loadUser,
  saveUser,
} from "@/lib/token";

// Try several common "me" endpoints; replace with your real one if known.
const ME_ATTEMPTS = [
  "/auth/me",
  "/users/me",
  "/user/me",
  "/users/profile",
  "/auth/profile",
];

let bootRefreshScheduled = false;

export function useAuth() {
  // Run if we have either token (apiFetch can mint a new AT from RT)
  const hasCreds = !!(getAccessToken() || getRefreshToken());
  const cachedUser = loadUser();

  if (hasCreds && !bootRefreshScheduled) {
    const at = getAccessToken();
    if (at) scheduleProactiveRefresh(at); // refresh ~1 min before exp
    bootRefreshScheduled = true;
  }

  const { data, isLoading } = useQuery<User | null>({
    queryKey: ["/auth/me"],
    enabled: hasCreds,
    initialData: cachedUser ?? null,
    placeholderData: (prev) => prev ?? cachedUser,
    retry: false,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      for (const path of ME_ATTEMPTS) {
        const res = await apiFetch(path);
        if (res.status === 401) return null; // not authenticated
        if (res.ok) {
          const u = (await res.json()) as User;
          saveUser(u);
          return u;
        }
        if (res.status !== 404) break;
      }
      // No “me” endpoint or non-401 failure → fall back to cached user
      return loadUser();
    },
  });

  return {
    user: data ?? null,
    isLoading: hasCreds && isLoading,
    isAuthenticated: !!data,
  };
}
