import {
  publicSportData,
  sandboxSportData,
  unwrapSportData,
} from "./sportRegistration";
import { apiRequest } from "./apiClient";
export type TeamPlayer = {
  profileId: string;
  name: string;
  number: string;
  position: string;
};
export type PublicTeamSeason = {
  id: string;
  organizationId: string;
  sportKey: string;
  name: string;
  leagueName: string;
  startsOn: string;
  endsOn: string;
  publishedAt: string;
  scoreLabel: string;
  periodLabel: string;
  divisions: { id: string; name: string }[];
  teams: {
    id: string;
    divisionId: string;
    name: string;
    players: TeamPlayer[];
  }[];
  games: {
    id: string;
    homeTeamId: string;
    awayTeamId: string;
    startsAt: string;
    venue: string;
    status: string;
  }[];
  results: {
    gameId: string;
    status: string;
    homeScore: number;
    awayScore: number;
    tiebreakWinnerId: string | null;
    periods: { label: string; homeScore: number; awayScore: number }[];
  }[];
  standings: {
    divisionId: string;
    name: string;
    rows: {
      teamId: string;
      name: string;
      played: number;
      wins: number;
      draws: number;
      losses: number;
      scoredFor: number;
      scoredAgainst: number;
      difference: number;
      points: number;
    }[];
  }[];
};
export type TeamSeasonList = {
  organizationId: string;
  sportKey: string;
  items: {
    id: string;
    name: string;
    leagueName: string;
    startsOn: string;
    endsOn: string;
  }[];
  total: number;
  page: number;
  limit: number;
};
export type PlayerInvitation = {
  id: string;
  status: "pending" | "accepted";
  profileId: string;
  sportKey: string;
  teamName: string;
  seasonName: string;
  organizationName: string;
  organizationId: string;
  seasonId: string;
  number: string;
  position: string;
};
export async function listTeamSeasons(
  org: string,
  sport: string,
  page: number,
  sandbox?: string,
): Promise<TeamSeasonList> {
  const path = `/team-sports/organizations/${encodeURIComponent(org)}/seasons?page=${page}&limit=20`;
  const d = await (sandbox
    ? sandboxSportData<TeamSeasonList>(sandbox, path)
    : publicSportData<TeamSeasonList>(path));
  if (
    !d ||
    d.organizationId !== org ||
    d.sportKey !== sport ||
    !Array.isArray(d.items) ||
    !Number.isInteger(d.total) ||
    d.total < 0 ||
    d.items.some(
      (item) =>
        !item ||
        typeof item.id !== "string" ||
        typeof item.name !== "string" ||
        typeof item.leagueName !== "string",
    )
  )
    throw new Error("Season list does not match this organization.");
  return d;
}
export function validatePublicTeamSeason(
  d: PublicTeamSeason,
  id: string,
  org: string,
  sport: string,
) {
  if (
    !d ||
    d.id !== id ||
    d.organizationId !== org ||
    d.sportKey !== sport ||
    ![d.divisions, d.teams, d.games, d.results, d.standings].every(
      Array.isArray,
    ) ||
    typeof d.scoreLabel !== "string" ||
    typeof d.periodLabel !== "string" ||
    d.divisions.some(
      (v) => !v || typeof v.id !== "string" || typeof v.name !== "string",
    ) ||
    d.teams.some(
      (t) =>
        !t ||
        typeof t.name !== "string" ||
        !Array.isArray(t.players) ||
        t.players.some(
          (p) =>
            !p || typeof p.profileId !== "string" || typeof p.name !== "string",
        ),
    ) ||
    d.games.some(
      (g) =>
        !g ||
        !Number.isFinite(Date.parse(g.startsAt)) ||
        !d.teams.some((t) => t.id === g.homeTeamId) ||
        !d.teams.some((t) => t.id === g.awayTeamId),
    ) ||
    d.results.some(
      (r) =>
        !r ||
        !Array.isArray(r.periods) ||
        !Number.isInteger(r.homeScore) ||
        r.homeScore < 0 ||
        !Number.isInteger(r.awayScore) ||
        r.awayScore < 0 ||
        r.periods.some((p) => !p || typeof p.label !== "string"),
    ) ||
    d.standings.some(
      (s) =>
        !s ||
        !Array.isArray(s.rows) ||
        s.rows.some((r) => !r || typeof r.name !== "string"),
    )
  )
    throw new Error("Season data does not match this organization.");
  return d;
}
export async function readTeamSeason(
  id: string,
  org: string,
  sport: string,
  sandbox?: string,
) {
  const path = `/team-sports/seasons/${encodeURIComponent(id)}`;
  return validatePublicTeamSeason(
    await (sandbox
      ? sandboxSportData<PublicTeamSeason>(sandbox, path)
      : publicSportData<PublicTeamSeason>(path)),
    id,
    org,
    sport,
  );
}
export async function myTeamInvitations(page: number) {
  const d = unwrapSportData<{ items: PlayerInvitation[]; total: number }>(
    await apiRequest("GET", `/team-sports/me/roster?page=${page}&limit=20`),
  );
  if (!Array.isArray(d.items) || !Number.isFinite(d.total))
    throw new Error("Invalid roster invitation response.");
  return d;
}
export async function respondToTeamInvitation(
  id: string,
  action: "accept" | "decline" | "leave",
) {
  return unwrapSportData(
    await apiRequest(
      "POST",
      `/team-sports/me/roster/${encodeURIComponent(id)}/respond`,
      { action },
      { refreshOn401: true },
    ),
  );
}

export function seasonView(
  d: PublicTeamSeason,
  division: string,
  status: string,
) {
  const teams = d.teams.filter((t) => !division || t.divisionId === division),
    ids = new Set(teams.map((t) => t.id));
  const games = d.games
    .filter((g) => ids.has(g.homeTeamId) && ids.has(g.awayTeamId))
    .filter(
      (g) =>
        status === "all" ||
        (status === "cancelled"
          ? g.status === "cancelled"
          : status === "final"
            ? g.status !== "cancelled" &&
              d.results.some((r) => r.gameId === g.id && r.status === "final")
            : g.status === "scheduled" &&
              !d.results.some(
                (r) => r.gameId === g.id && r.status === "final",
              )),
    );
  return {
    teams,
    games,
    standings: d.standings.filter(
      (s) => !division || s.divisionId === division,
    ),
  };
}
export function pageItems<T>(items: T[], requested: number, size: number) {
  const pages = Math.max(1, Math.ceil(items.length / size)),
    page = Math.max(1, Math.min(requested, pages));
  return { items: items.slice((page - 1) * size, page * size), page, pages };
}
