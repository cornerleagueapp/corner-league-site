import { apiRequest } from "@/lib/apiClient";

export type RacerMatch = {
  id: string;
  name: string;
  formattedLocation: string;
  profileUrl: string;
};
// The backend ResponseInterceptor wraps successful JSON in { status, data }.
// Keep normalization here: other apiRequest consumers handle their own envelopes.
export function racerResponseData(payload: unknown): any {
  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid racer response. Please refresh and try again.");
  }
  const response = payload as Record<string, unknown>;
  if (typeof response.status === "boolean") {
    if (!response.status || !response.data || typeof response.data !== "object") {
      throw new Error("Unable to load racer data. Please try again.");
    }
    return response.data;
  }
  return response;
}

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

export function parseRacerIdentity(payload: unknown): MyRacerIdentity {
  const data = racerResponseData(payload);
  const validProfile = data.profile === null || (
    data.profile && typeof data.profile.athleteId === "string" &&
    typeof data.profile.name === "string" &&
    typeof data.profile.isVerifiedAthlete === "boolean" &&
    (data.profile.profileUrl === null ||
      (typeof data.profile.profileUrl === "string" &&
        /^\/racer\/[^/?#]+$/.test(data.profile.profileUrl)))
  );
  const validClaim = data.pendingClaim === null || (
    data.pendingClaim && typeof data.pendingClaim.athleteId === "string" &&
    typeof data.pendingClaim.name === "string"
  );
  if (!validProfile || !validClaim) {
    throw new Error("We couldn’t check your racer profile. Please try again.");
  }
  return data as MyRacerIdentity;
}

export async function getMyRacerIdentity(): Promise<MyRacerIdentity> {
  return parseRacerIdentity(await apiRequest<unknown>("GET", "/athletes/me/racer-profile"));
}

export async function createMyRacerIdentity(body: {
  name: string; nickname: string; origin: string; bio: string; skillLevel: string;
}): Promise<MyRacerIdentity> {
  return parseRacerIdentity(await apiRequest<unknown>("POST", "/athletes/me/racer-profile", body));
}

export async function searchSelfRacers(search: string): Promise<RacerMatch[]> {
  const query = new URLSearchParams({
    search: search.trim(),
    page: "1",
    limit: "30",
    sortBy: "createdAt",
    order: "DESC",
  });
  const data = racerResponseData(await apiRequest<unknown>("GET", `/jet-ski-racer-details?${query}`));
  if (!Array.isArray(data.racers) || data.racers.some((racer: any) =>
    !racer || typeof racer.id !== "string" || typeof racer.athlete?.name !== "string"
  )) {
    throw new Error("Unable to read racer search results. Please try again.");
  }
  return data.racers.map((racer: { id: string; athlete: { name: string; origin?: string | null } }) => ({
    id: racer.id,
    name: racer.athlete.name,
    formattedLocation: racer.athlete.origin || "",
    profileUrl: `/racer/${encodeURIComponent(racer.id)}`,
  }));
}
