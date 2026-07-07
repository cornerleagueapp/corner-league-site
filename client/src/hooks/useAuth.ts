// client/src/hooks/useAuth.ts
import { useQuery } from "@tanstack/react-query";
import { apiRequest, scheduleProactiveRefresh } from "@/lib/apiClient";
import type { User } from "@/types/user";
import {
  getAccessToken,
  getRefreshToken,
  loadUser,
  saveUser,
} from "@/lib/token";

const ME_ATTEMPTS = [
  "/auth/me",
  "/users/me",
  "/user/me",
  "/users/profile",
  "/auth/profile",
];

let bootRefreshScheduled = false;

export function useAuth() {
  const hasCreds = !!(getAccessToken() || getRefreshToken());
  const cachedUser = loadUser();

  if (hasCreds && !bootRefreshScheduled) {
    const at = getAccessToken();
    const rt = getRefreshToken();

    if (at && rt) {
      scheduleProactiveRefresh(at);
    }

    bootRefreshScheduled = true;
  }

  const { data, isLoading } = useQuery<User | null>({
    queryKey: ["/auth/me"],
    enabled: hasCreds,
    initialData: hasCreds ? (cachedUser ?? null) : null,
    placeholderData: (prev) => (hasCreds ? (prev ?? cachedUser) : null),
    retry: false,
    staleTime: 60 * 1000,
    queryFn: async () => {
      for (const path of ME_ATTEMPTS) {
        try {
          const u = await apiRequest<User>("GET", path, undefined, {
            refreshOn401: true,
            logoutOn401: true,
          });

          saveUser(u);

          const at = getAccessToken();
          if (at) {
            scheduleProactiveRefresh(at);
          }

          return u;
        } catch (e: any) {
          if (e?.status === 404) continue;
          if (e?.status === 401) return null;
        }
      }

      return loadUser();
    },
  });

  return {
    user: hasCreds ? (data ?? null) : null,
    isLoading: hasCreds && isLoading,
    isAuthenticated: hasCreds && !!data,
  };
}
