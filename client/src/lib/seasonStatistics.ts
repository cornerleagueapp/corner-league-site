import type { PublicTeamSeason } from "./teamSports";
import { statTotals } from "./sportStatistics";
export function seasonStats(d: PublicTeamSeason, division = "") {
  const teams = d.teams.filter((t) => !division || t.divisionId === division),
    ids = new Set(teams.map((t) => t.id));
  const finals = new Set(
    d.results
      .filter(
        (r) =>
          r.status === "final" &&
          d.games.some(
            (g) =>
              g.id === r.gameId &&
              g.status !== "cancelled" &&
              !g.competition?.bye,
          ),
      )
      .map((r) => r.gameId),
  );
  const rows = (d.playerStats || []).filter(
    (r) => finals.has(r.gameId) && ids.has(r.teamId),
  );
  const people = new Map<
    string,
    { profileId: string; name: string; teamIds: string[]; rows: typeof rows }
  >();
  for (const row of rows) {
    const key = row.profileId,
      p = people.get(key) || {
        profileId: row.profileId,
        name: row.name,
        teamIds: [],
        rows: [],
      };
    if (!p.teamIds.includes(row.teamId)) p.teamIds.push(row.teamId);
    p.rows.push(row);
    people.set(key, p);
  }
  return {
    teams,
    rows,
    players: [...people.values()].map((p) => ({
      ...p,
      games: new Set(p.rows.map((r) => r.gameId)).size,
      totals: statTotals(p.rows, d.sportKey),
    })),
  };
}
