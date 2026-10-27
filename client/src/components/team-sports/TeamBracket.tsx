import TeamLogo from "./TeamLogo";
import type { PublicTeamSeason } from "@/lib/teamSports";
import { tournamentRounds, tournamentWinner } from "@/lib/teamTournament";
export default function TeamBracket({
  season,
  division,
}: {
  season: PublicTeamSeason;
  division: string;
}) {
  const games = season.games.filter(
    (g) =>
      g.competition?.kind === "single-elimination" &&
      (!division ||
        season.teams.find((t) => t.id === g.homeTeamId)?.divisionId ===
          division),
  );
  const ids = [...new Set(games.map((g) => g.competition!.id))];
  const name = (id: string) =>
    season.teams.find((t) => t.id === id)?.name ?? "Team";
  if (!ids.length) return null;
  return (
    <section aria-label="Published tournaments" className="min-w-0 space-y-4">
      <h4 className="text-xl font-bold">Tournament brackets</h4>
      <p className="text-sm text-cl-muted">
        Published results determine winners. Byes advance automatically. Future
        matchups remain provisional until the organizer advances and publishes
        the next round.
      </p>
      {ids.map((id, index) => {
        const rounds = tournamentRounds(season, id);
        const final = rounds[rounds.length - 1].matches[0].game;
        const champion = tournamentWinner(season, final);
        return (
          <details
            open
            key={id}
            className="min-w-0 rounded-2xl border border-cl-border p-4"
          >
            <summary className="min-h-11 cursor-pointer font-bold">
              {games.find((g) => g.competition?.id === id)?.competition
                ?.tournamentName || `Single elimination ${index + 1}`}{" "}
              ·{" "}
              {games.find((g) => g.competition?.id === id)?.competition
                ?.category ||
                season.divisions.find(
                  (d) =>
                    d.id ===
                    season.teams.find(
                      (t) =>
                        t.id ===
                        games.find((g) => g.competition?.id === id)?.homeTeamId,
                    )?.divisionId,
                )?.name ||
                "Division"}
            </summary>
            {champion && (
              <p
                role="status"
                className="my-3 rounded-xl bg-cl-accent/10 p-3 font-bold"
              >
                Champion: {name(champion)}
              </p>
            )}
            <div
              role="region"
              aria-label={`Tournament ${index + 1} bracket`}
              tabIndex={0}
              className="flex max-w-full gap-5 overflow-x-auto py-4"
            >
              {rounds.map(({ round, label, matches }) => (
                <section key={round} className="w-64 shrink-0 space-y-4">
                  <h5 className="sticky top-0 font-bold">{label}</h5>
                  {matches.map(({ match, game }) => {
                    const winner = tournamentWinner(season, game);
                    const result =
                      game && season.results.find((r) => r.gameId === game.id);
                    return (
                      <article
                        id={`bracket-${id}-${round}-${match}`}
                        key={match}
                        className="rounded-xl border border-cl-border bg-cl-surface p-3 text-sm"
                      >
                        <p className="mb-2 text-cl-muted">Match {match}</p>
                        {game ? (
                          <>
                            <p
                              className={
                                winner === game.homeTeamId
                                  ? "font-black text-cl-accent"
                                  : "font-semibold"
                              }
                            >
                              {game.competition?.homeSeed
                                ? `#${game.competition.homeSeed} `
                                : ""}
                              <span className="inline-flex items-center gap-2">
                                <TeamLogo
                                  team={season.teams.find(
                                    (t) => t.id === game.homeTeamId,
                                  )}
                                />
                                {name(game.homeTeamId)}
                              </span>
                            </p>
                            <p
                              className={
                                winner === game.awayTeamId
                                  ? "font-black text-cl-accent"
                                  : "font-semibold"
                              }
                            >
                              {game.competition?.bye ? (
                                "BYE"
                              ) : (
                                <span className="inline-flex items-center gap-2">
                                  <TeamLogo
                                    team={season.teams.find(
                                      (t) => t.id === game.awayTeamId,
                                    )}
                                  />
                                  {game.competition?.awaySeed
                                    ? `#${game.competition.awaySeed} `
                                    : ""}
                                  {name(game.awayTeamId)}
                                </span>
                              )}
                            </p>
                            <p className="mt-2 font-bold">
                              {game.competition?.bye
                                ? "Automatic advancement"
                                : game.status === "cancelled"
                                  ? "Cancelled"
                                  : result
                                    ? `${result.homeScore} – ${result.awayScore} · ${result.status === "final" ? "Final" : "In progress"}${result.decision && result.decision !== "regulation" ? ` · ${result.decision}` : ""}`
                                    : "Scheduled"}
                            </p>
                            {winner && <p>Winner: {name(winner)}</p>}
                            {!game.competition?.bye && (
                              <>
                                <time dateTime={game.startsAt}>
                                  {new Date(game.startsAt).toLocaleString()}
                                </time>
                                <p>{game.venue || "Venue to be announced"}</p>
                              </>
                            )}
                            {result?.status === "final" &&
                              !winner &&
                              game.status !== "cancelled" && (
                                <p>Tiebreak decision pending</p>
                              )}
                          </>
                        ) : (
                          <>
                            <p>Winner of match {match * 2 - 1}</p>
                            <p>Winner of match {match * 2}</p>
                            <p className="mt-2 text-cl-muted">
                              Round {round - 1} sources · Matchup not published
                            </p>
                          </>
                        )}
                        {round < rounds.length && (
                          <a
                            className="mt-3 inline-block min-h-11 py-2 text-cl-accent underline"
                            href={`#bracket-${id}-${round + 1}-${Math.ceil(match / 2)}`}
                          >
                            Winner → {rounds[round].label}, match{" "}
                            {Math.ceil(match / 2)}
                          </a>
                        )}
                      </article>
                    );
                  })}
                </section>
              ))}
            </div>
          </details>
        );
      })}
    </section>
  );
}
