import { apiRequest } from "@/lib/apiClient";

export type RacerMatch = {
  id: string;
  name: string;
  formattedLocation: string;
  profileUrl: string;
};
export async function searchSelfRacers(search: string): Promise<RacerMatch[]> {
  const query = new URLSearchParams({
    search: search.trim(),
    page: "1",
    limit: "30",
    sortBy: "createdAt",
    order: "DESC",
  });
  const data = await apiRequest<{
    racers: { id: string; athlete: { name: string; origin?: string | null } }[];
  }>("GET", `/jet-ski-racer-details?${query}`);
  return data.racers.map((racer) => ({
    id: racer.id,
    name: racer.athlete.name,
    formattedLocation: racer.athlete.origin || "",
    profileUrl: `/racer/${encodeURIComponent(racer.id)}`,
  }));
}
