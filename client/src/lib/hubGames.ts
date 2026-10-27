import { publicSportData } from "./sportRegistration";
import type { GameData } from "@/components/team-sports/GameCard";
export type HubGame = GameData & {
  organizationName: string;
  leagueName: string;
  seasonName: string;
};
export type HubGamePage = {
  sportKey: string;
  items: HubGame[];
  total: number;
  page: number;
  limit: number;
};
export async function hubGamePage(
  sport: string,
  status: string,
  page = 1,
  range?: { from: string; to: string },
): Promise<HubGamePage> {
  const data = await publicSportData<HubGamePage>(
    `/team-sports/games?${new URLSearchParams({ sportKey: sport, status, page: String(page), limit: "6", ...range })}`,
  );
  if (
    data.sportKey !== sport ||
    !Array.isArray(data.items) ||
    !Number.isInteger(data.total) ||
    data.total < 0 ||
    data.items.some(
      (g) =>
        g.sportKey !== sport ||
        !g.game?.id ||
        !Number.isFinite(Date.parse(g.game.startsAt)),
    )
  )
    throw new Error("Games do not match this sport.");
  return data;
}
export async function loadHubGames(sport: string) {
  const [live, upcoming] = await Promise.all([
    hubGamePage(sport, "live"),
    hubGamePage(sport, "upcoming"),
  ]);
  const current = [...live.items, ...upcoming.items];
  if (current.length) return current;
  const first = await hubGamePage(sport, "past");
  const last =
    first.total > 6
      ? await hubGamePage(sport, "past", Math.ceil(first.total / 6))
      : first;
  return last.items.slice().reverse();
}
export function shortName(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 4)
    .toUpperCase();
}
