import { PublicTeamSeason } from "@/lib/teamSports";
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
  if (!ids.length) return null;
  const name = (id: string) =>
    season.teams.find((t) => t.id === id)?.name ?? "Team";
  return (
    <section aria-label="Published tournaments" className="min-w-0 space-y-3">
      <h4 className="text-lg font-bold">Tournament rounds</h4>
      <p className="text-sm text-cl-muted">
        Published rounds only. Organizers advance winners after results are
        final and publish each new round.
      </p>
      {ids.map((id, index) => {
        const group = games.filter((g) => g.competition!.id === id);
        const rounds = [
          ...new Set(group.map((g) => g.competition!.round)),
        ].sort((a, b) => a - b);
        const first = group.find((g) => g.competition!.round === 1);
        const count = first
          ? season.games.filter(
              (g) => g.competition?.id === id && g.competition.round === 1,
            ).length * 2
          : undefined;
        return (
          <details key={id} className="rounded-xl border border-cl-border p-4">
            <summary className="min-h-11 cursor-pointer font-bold">
              Single elimination {index + 1} ·{" "}
              {season.divisions.find(
                (d) =>
                  d.id ===
                  season.teams.find((t) => t.id === group[0].homeTeamId)
                    ?.divisionId,
              )?.name ?? "Division"}
            </summary>
            <div
              role="region"
              aria-label={`Tournament ${index + 1} rounds`}
              tabIndex={0}
              className="flex gap-4 overflow-x-auto pb-3"
            >
              {rounds.map((round) => (
                <section key={round} className="w-64 shrink-0 space-y-3">
                  <h5 className="font-bold">
                    {count && round === Math.log2(count)
                      ? "Final"
                      : `Round ${round}`}
                  </h5>
                  {group
                    .filter((g) => g.competition!.round === round)
                    .sort((a, b) => a.competition!.match - b.competition!.match)
                    .map((g) => {
                      const result = season.results.find(
                        (r) => r.gameId === g.id,
                      );
                      const winner =
                        g.status !== "cancelled" && result?.status === "final"
                          ? result.homeScore > result.awayScore
                            ? g.homeTeamId
                            : result.awayScore > result.homeScore
                              ? g.awayTeamId
                              : result.tiebreakWinnerId
                          : null;
                      return (
                        <article
                          key={g.id}
                          className="rounded-lg border border-cl-border p-3 text-sm"
                        >
                          <p className="text-cl-muted">
                            Match {g.competition!.match}
                          </p>
                          <p>
                            {g.competition!.homeSeed
                              ? `#${g.competition!.homeSeed} `
                              : ""}
                            {name(g.homeTeamId)}
                          </p>
                          <p>
                            {g.competition!.awaySeed
                              ? `#${g.competition!.awaySeed} `
                              : ""}
                            {name(g.awayTeamId)}
                          </p>
                          <p className="mt-2 font-bold">
                            {g.status === "cancelled"
                              ? "Cancelled"
                              : result
                                ? `${result.homeScore} – ${result.awayScore} · ${result.status === "final" ? "Final" : "In progress"}`
                                : "Scheduled"}
                          </p>
                          {winner && (
                            <p className="font-bold">Winner: {name(winner)}</p>
                          )}
                          {result?.status === "final" &&
                            !winner &&
                            g.status !== "cancelled" && (
                              <p>Tiebreak decision pending</p>
                            )}
                          <time dateTime={g.startsAt} className="text-cl-muted">
                            {new Date(g.startsAt).toLocaleString()}
                          </time>
                          <p className="text-cl-muted">
                            {g.venue || "Venue to be announced"}
                          </p>
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
