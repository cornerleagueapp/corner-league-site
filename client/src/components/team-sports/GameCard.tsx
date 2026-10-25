import TeamLogo from "./TeamLogo";
import { Link } from "wouter";
import type { PublicTeamSeason } from "@/lib/teamSports";
export const teamHref = (
  sport: string,
  season: string,
  team: string,
  org: string,
) =>
  `/sports/${encodeURIComponent(sport)}/teams/${encodeURIComponent(season)}/${encodeURIComponent(team)}?org=${encodeURIComponent(org)}`;
export const athleteHref = (sport: string, id: string) =>
  `/athlete/${encodeURIComponent(id)}?sport=${encodeURIComponent(sport)}`;
export type GameData = {
  seasonId: string;
  organizationId: string;
  sportKey: string;
  periodLabel: string;
  scoreLabel: string;
  game: PublicTeamSeason["games"][number];
  result: PublicTeamSeason["results"][number] | null;
  teams: {
    id: string;
    name: string;
    logoUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
  }[];
  playerStats: NonNullable<PublicTeamSeason["playerStats"]>;
};
export function gameStatus(
  game: GameData["game"],
  result: GameData["result"],
  now = Date.now(),
) {
  if (game.status === "cancelled") return "cancelled";
  if (result?.status === "final" || game.competition?.bye) return "past";
  if (result?.status === "in-progress") return "live";
  return Date.parse(game.startsAt) < now ? "past" : "upcoming";
}
export default function GameCard({
  data: d,
  sandbox = false,
}: {
  data: GameData;
  sandbox?: boolean;
}) {
  const { game: g, result: r } = d;
  const status = gameStatus(g, r);
  const metric = (
    {
      basketball: "points",
      soccer: "goals",
      hockey: "goals",
      baseball: "runs",
      "american-football": "touchdowns",
    } as Record<string, string>
  )[d.sportKey];
  return (
    <article id={`game-${g.id}`} className="cl-game-card">
      <header>
        <span className={`cl-game-status cl-game-status-${status}`}>
          {g.competition?.bye
            ? "Bye"
            : status === "past"
              ? r?.status === "final"
                ? "Final"
                : "Past · result pending"
              : status}
        </span>
        <time dateTime={g.startsAt}>
          {new Date(g.startsAt).toLocaleString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}
        </time>
      </header>
      <div
        className="cl-score-scroll"
        role="region"
        aria-label="Game scoreboard, scroll horizontally"
        tabIndex={0}
      >
        <table>
          <caption className="sr-only">
            Game score and {d.periodLabel.toLowerCase()} scores
          </caption>
          <thead>
            <tr>
              <th scope="col">Team</th>
              {r?.periods.map((p, i) => (
                <th scope="col" key={i}>
                  {p.label}
                </th>
              ))}
              <th scope="col">Total</th>
            </tr>
          </thead>
          <tbody>
            {[g.homeTeamId, g.awayTeamId].map((id, i) => {
              const name = d.teams.find((t) => t.id === id)?.name || "Team";
              const won =
                r?.status === "final" &&
                (i === 0
                  ? r.homeScore > r.awayScore
                  : r.awayScore > r.homeScore);
              return (
                <tr key={id} className={won ? "cl-game-winner" : ""}>
                  <th scope="row">
                    <TeamLogo team={d.teams.find((t) => t.id === id)} />
                    {sandbox ? (
                      <span>{name}</span>
                    ) : (
                      <Link
                        href={teamHref(
                          d.sportKey,
                          d.seasonId,
                          id,
                          d.organizationId,
                        )}
                      >
                        {name}
                      </Link>
                    )}
                    <small>{i === 0 ? "Home" : "Away"}</small>
                  </th>
                  {r?.periods.map((p, n) => (
                    <td key={n}>{i === 0 ? p.homeScore : p.awayScore}</td>
                  ))}
                  <td className="cl-game-total">
                    {r ? (i === 0 ? r.homeScore : r.awayScore) : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {!!r && g.status !== "cancelled" && (
        <div className="cl-game-leaders">
          {[g.homeTeamId, g.awayTeamId].map((id) => {
            const rows = d.playerStats.filter(
              (s) =>
                s.teamId === id &&
                s.gameId === g.id &&
                Number.isFinite(s.values[metric]),
            );
            const max = Math.max(...rows.map((s) => s.values[metric]));
            const leaders = rows.filter((s) => s.values[metric] === max);
            return leaders.length ? (
              <div key={id}>
                <span>
                  {d.teams.find((t) => t.id === id)?.name} · Top{" "}
                  {metric === "points" ? "scorer" : metric}
                </span>
                {leaders.map((p) => (
                  <p key={p.profileId}>
                    {sandbox ? (
                      p.name
                    ) : (
                      <Link href={athleteHref(d.sportKey, p.profileId)}>
                        {p.name}
                      </Link>
                    )}{" "}
                    <strong>
                      {p.values[metric]} {metric}
                    </strong>
                  </p>
                ))}
              </div>
            ) : null;
          })}
        </div>
      )}
      <footer>
        {!sandbox && (
          <Link
            className="cl-boxscore-link"
            href={gameHref(d.sportKey, d.seasonId, g.id, d.organizationId)}
          >
            Box score →
          </Link>
        )}
        {g.venue || "Venue to be announced"}
        {r?.decision && r.decision !== "regulation" ? ` · ${r.decision}` : ""}
        {g.competition ? ` · Round ${g.competition.round}` : ""}
      </footer>
    </article>
  );
}

export const gameHref = (
  sport: string,
  season: string,
  game: string,
  org: string,
) =>
  `/sports/${encodeURIComponent(sport)}/games/${encodeURIComponent(season)}/${encodeURIComponent(game)}?org=${encodeURIComponent(org)}`;
