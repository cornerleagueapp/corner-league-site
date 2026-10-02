import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { getMyRacerIdentity, type MyRacerIdentity } from "@/lib/selfRacerLookup";
export type { MyRacerIdentity } from "@/lib/selfRacerLookup";

export function useMyRacerProfile() {
  const { user, isAuthenticated } = useAuth();
  return useQuery<MyRacerIdentity>({
    queryKey: ["/athletes/me/racer-profile", user?.id],
    queryFn: getMyRacerIdentity,
    enabled: isAuthenticated && Boolean(user?.id),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    retry: false,
  });
}
