// client/src/hooks/useAuth.ts
import { useQuery } from "@tanstack/react-query";
import { racerResponseData } from "@/lib/selfRacerLookup";
import { apiRequest, scheduleProactiveRefresh } from "@/lib/apiClient";
import type { User } from "@/types/user";
import {
  getAccessToken,
  getRefreshToken,
  loadUser,
  saveUser,
} from "@/lib/token";

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
      try {
        const u = racerResponseData(
          await apiRequest<unknown>("GET", "/auth/me", undefined, {
            refreshOn401: true,
            logoutOn401: true,
          }),
        );
        if (
          (typeof u.id !== "string" && typeof u.id !== "number") ||
          typeof u.username !== "string"
        ) {
          throw new Error("Invalid account response.");
        }
        saveUser(u);
        const at = getAccessToken();
        if (at) scheduleProactiveRefresh(at);
        return u as User;
      } catch (error: any) {
        if (error?.status === 401 || error?.status === 403) return null;
        throw error;
      }
    },
  });

  return {
    user: hasCreds ? (data ?? null) : null,
    isLoading: hasCreds && isLoading,
    isAuthenticated: hasCreds && !!data,
  };
}
