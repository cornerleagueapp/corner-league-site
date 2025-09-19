// client/src/hooks/useAuth.ts
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/apiClient";
import { User } from "@/types/user";
import { getAccessToken } from "@/lib/token";

export function useAuth() {
  const hasToken = !!getAccessToken();

  const { data, isLoading } = useQuery<User | null>({
    queryKey: ["/auth/me"], // or "/api/user" if your API uses that
    enabled: hasToken, // ⬅️ don’t call if no token
    queryFn: async () => {
      const res = await apiFetch("/auth/me");
      if (!res.ok) return null; // treat 401/404 as “not logged in”
      return (await res.json()) as User;
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  return {
    user: data ?? null,
    isLoading,
    isAuthenticated: !!data,
  };
}
