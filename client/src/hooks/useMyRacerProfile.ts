import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/apiClient";

export type MyRacerIdentity = {
  profile: {
    athleteId: string;
    racerId: string | null;
    profileUrl: string | null;
    sportKey: "jet-ski";
    name: string;
    nickname: string | null;
    imageUrl: string | null;
    formattedLocation: string | null;
    isVerifiedAthlete: boolean;
  } | null;
  pendingClaim: { athleteId: string; name: string } | null;
};

export function useMyRacerProfile() {
  const { user, isAuthenticated } = useAuth();
  return useQuery<MyRacerIdentity>({
    queryKey: ["/athletes/me/racer-profile", user?.id],
    queryFn: () =>
      apiRequest<MyRacerIdentity>("GET", "/athletes/me/racer-profile"),
    enabled: isAuthenticated && Boolean(user?.id),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    retry: false,
  });
}
