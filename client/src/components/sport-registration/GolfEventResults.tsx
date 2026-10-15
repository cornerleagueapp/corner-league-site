import { PublicOperations } from "./SportEventOperations";
const relative = (value: number | null | undefined) =>
  value == null
    ? "—"
    : value === 0
      ? "E"
      : value > 0
        ? `+${value}`
        : String(value);
export default function GolfEventResults({ data }: { data: PublicOperations }) {
  return (
    <section
      aria-label="Golf rounds and scores"
      className="min-w-0 space-y-5 rounded-3xl border border-cl-border bg-cl-surface p-5 sm:p-7"
    >
      <h2 className="text-2xl font-black">Golf rounds & scores</h2>
      <p className="text-cl-muted">
        Gross, net stroke play, or net Stableford, as configured by the
        organizer. Hole scores include penalty strokes. Equal totals share a
        place. Only published information appears here.
      </p>
      <p className="text-sm text-cl-muted">
        Net scores use organizer-entered round playing handicaps. Stableford
        awards max(0, 2 + par − net hole strokes); higher points win. Gross and
        net stroke play use lower totals. A shared place is not a declared
        playoff winner.
      </p>
      {!data.schedule.length && (
        <p>The organizer has not published flights yet.</p>
      )}
      {data.golfStandings?.map((group) => (
        <div key={group.classId} className="overflow-x-auto">
          <h3 className="font-bold">
            {group.className} ·{" "}
            {group.scoring === "net"
              ? "Net stroke play"
              : group.scoring === "stableford"
                ? "Net Stableford"
                : "Gross stroke play"}{" "}
            leaderboard
          </h3>
          <p className="text-sm text-cl-muted">
            Overall places require a finished scorecard in every published round
            for this class.
          </p>
          <table className="mt-3 w-full text-left text-sm">
            <thead>
              <tr>
                {[
                  "Place",
                  "Golfer",
                  "Rounds complete",
                  "Gross strokes",
                  "To par",
                  "Net strokes",
                  "Net to par",
                  "Stableford points",
                ].map((t) => (
                  <th className="p-2" key={t}>
                    {t}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {group.rows.map((r) => (
                <tr key={r.profileId} className="border-t border-cl-border">
                  <td className="p-2">{r.position ?? "Incomplete"}</td>
                  <td className="p-2">{r.name}</td>
                  <td className="p-2">
                    {r.completedRounds}/{r.totalRounds}
                  </td>
                  <td className="p-2">
                    {r.completedRounds ? r.grossStrokes : "—"}
                  </td>
                  <td className="p-2">
                    {r.completedRounds ? relative(r.toPar) : "—"}
                  </td>
                  <td className="p-2">
                    {r.completedRounds ? (r.netStrokes ?? r.grossStrokes) : "—"}
                  </td>
                  <td className="p-2">
                    {r.completedRounds ? relative(r.netToPar ?? r.toPar) : "—"}
                  </td>
                  <td className="p-2">
                    {group.scoring === "stableford" && r.completedRounds
                      ? (r.stablefordPoints ?? "—")
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
      {data.schedule.map((h) => {
        const sheet = data.results.find((r) => r.heatId === h.id);
        return (
          <article
            key={h.id}
            className="space-y-3 rounded-2xl border border-cl-border p-4"
          >
            <h3 className="text-xl font-bold">
              {h.label} · Round {h.round}
            </h3>
            <p className="text-cl-muted">
              {h.className} · {h.golfScoring ?? "gross"} ·{" "}
              <time dateTime={h.startsAt}>
                {new Date(h.startsAt).toLocaleString()}
              </time>{" "}
              · {h.holePars?.length} holes · Par{" "}
              {h.holePars?.reduce((sum, p) => sum + p, 0)}
            </p>
            <details>
              <summary className="min-h-11 cursor-pointer py-2">
                {h.participants.length} golfers · View flight
              </summary>
              <ul>
                {h.participants.map((p) => (
                  <li key={p.id}>{p.name}</li>
                ))}
              </ul>
            </details>
            {!sheet ? (
              <p className="text-cl-muted">
                Round results have not been published.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <caption className="text-left">
                    Published round results
                  </caption>
                  <thead>
                    <tr>
                      {[
                        "Flight place",
                        "Golfer",
                        "Gross",
                        "To par",
                        "Playing handicap",
                        "Net",
                        "Net to par",
                        "Stableford",
                        ...(h.holePars ?? []).map(
                          (p, i) => `Hole ${i + 1} · Par ${p}`,
                        ),
                      ].map((t) => (
                        <th key={t} className="whitespace-nowrap p-2">
                          {t}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sheet.rows.map((r) => (
                      <tr key={r.id} className="border-t border-cl-border">
                        <td className="p-2">
                          {r.status === "finished"
                            ? r.position
                            : r.status.toUpperCase()}
                        </td>
                        <td className="whitespace-nowrap p-2">{r.name}</td>
                        <td className="p-2">{r.grossStrokes ?? "—"}</td>
                        <td className="p-2">{relative(r.toPar)}</td>
                        <td className="p-2">{r.playingHandicap ?? "—"}</td>
                        <td className="p-2">{r.netStrokes ?? "—"}</td>
                        <td className="p-2">{relative(r.netToPar)}</td>
                        <td className="p-2">
                          {h.golfScoring === "stableford"
                            ? (r.stablefordPoints ?? "—")
                            : "—"}
                        </td>
                        {(h.holePars ?? []).map((_, i) => (
                          <td key={i} className="p-2">
                            {r.holeScores?.find((s) => s.hole === i + 1)
                              ?.strokes ?? "—"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </article>
        );
      })}
    </section>
  );
}
