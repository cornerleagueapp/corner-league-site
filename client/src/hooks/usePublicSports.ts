import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/apiClient";
import { publicSports } from "@/lib/publicSports";
export function usePublicSports() {
  return useQuery({
    queryKey: ["public-sports-availability"],
    queryFn: async ({ signal }) => {
      const response = await apiFetch("/sports/catalog/availability", {
        skipAuth: true,
        noRefresh: true,
        cache: "no-store",
        signal,
      });
      if (!response.ok) throw new Error("Unable to load available sports");
      return publicSports(await response.json());
    },
    staleTime: 30000,
    refetchOnWindowFocus: "always",
    retry: 1,
  });
}
