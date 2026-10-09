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
    d.organizationId !== org ||
    d.sportKey !== sport ||
    !Array.isArray(d.items) ||
    !Number.isFinite(d.total)
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
    d.id !== id ||
    d.organizationId !== org ||
    d.sportKey !== sport ||
    ![d.divisions, d.teams, d.games, d.results, d.standings].every(
      Array.isArray,
    ) ||
    d.teams.some((t) => !Array.isArray(t.players)) ||
    d.results.some((r) => !Array.isArray(r.periods)) ||
    d.standings.some((s) => !Array.isArray(s.rows))
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
