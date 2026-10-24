import { Link } from "wouter";
import { teamHref } from "./GameCard";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { publicSportData } from "@/lib/sportRegistration";
type Performance = {
  profileId: string;
  sportKey: string;
  metrics: string[];
  seasons: {
    id: string;
    name: string;
    leagueName: string;
    organizationId: string;
    teamName: string;
    teamId?: string;
    summary: null | {
      games: number;
      totals: Record<string, number>;
      averages: Record<string, number>;
    };
    games: {
      gameId: string;
      startsAt: string;
      opponent: string;
      values: Record<string, number>;
    }[];
  }[];
};
const labels: Record<string, string> = {
  points: "Points",
  rebounds: "Rebounds",
  assists: "Assists",
  steals: "Steals",
  blocks: "Blocks",
  turnovers: "Turnovers",
  minutes: "Minutes",
  goals: "Goals",
  shots: "Shots",
  saves: "Saves",
  penalties: "Penalties",
  runs: "Runs",
  hits: "Hits",
  rbi: "RBI",
  touchdowns: "Touchdowns",
  yards: "Yards",
  tackles: "Tackles",
};
export default function AthleteTeamPerformance({
  id,
  sportKey,
}: {
  id: string;
  sportKey: string;
}) {
  const [selected, setSelected] = useState("");
  const q = useQuery({
    queryKey: ["team-athlete-performance", id, sportKey],
    queryFn: async () => {
      const d = await publicSportData<Performance>(
        `/team-sports/athletes/${encodeURIComponent(id)}/performance?sportKey=${encodeURIComponent(sportKey)}`,
      );
      if (d.profileId !== id || d.sportKey !== sportKey)
        throw new Error("Profile mismatch");
      return d;
    },
    staleTime: 30000,
    retry: false,
  });
  const season =
    q.data?.seasons.find((s) => s.id === selected) || q.data?.seasons[0];
  return (
    <section
      className="mt-6 min-w-0 space-y-5 rounded-3xl border border-cl-border bg-cl-surface p-4 sm:p-7"
      aria-label="Athlete performance"
    >
      <h2 className="text-2xl font-black">Performance Center</h2>
      <p className="text-sm text-cl-muted">
        Published final-game statistics. Averages use games with recorded player
        stats.
      </p>
      {q.isPending ? (
        <p role="status">Loading performance…</p>
      ) : q.isError ? (
        <div role="alert">
          <p>Performance is unavailable right now.</p>
          <button
            className="mt-3 rounded-lg border border-cl-border px-4 py-2"
            onClick={() => void q.refetch()}
          >
            Try again
          </button>
        </div>
      ) : !season ? (
        <p className="text-cl-muted">No published season statistics yet.</p>
      ) : (
        <>
          <label className="block space-y-2">
            <span className="font-semibold">Season</span>
            <select
              className="w-full rounded-lg border border-cl-border bg-cl-surface p-3 text-cl-ink"
              value={season.id}
              onChange={(e) => setSelected(e.target.value)}
            >
              {q.data?.seasons.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.leagueName} · {s.name}
                </option>
              ))}
            </select>
          </label>
          <p className="font-semibold">
            {season.teamId ? <Link className="text-cl-accent underline" href={teamHref(sportKey,season.id,season.teamId,season.organizationId)}>{season.teamName}</Link> : season.teamName} · {season.summary?.games || 0} games with stats
          </p>
          {!season.summary ? (
            <p>
              No final-game player stats have been published for this season.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {q.data?.metrics.map((k) => (
                <div
                  key={k}
                  className="rounded-2xl border border-cl-border p-4"
                >
                  <p className="text-sm text-cl-muted">
                    {labels[k] || k} / game
                  </p>
                  <p className="mt-2 text-3xl font-black">
                    {season.summary!.averages[k] ?? 0}
                  </p>
                  <p className="mt-1 text-xs text-cl-muted">
                    {season.summary!.totals[k] ?? 0} total
                  </p>
                </div>
              ))}
            </div>
          )}
          {!!season.games.length && (
            <div
              className="overflow-x-auto rounded-xl border border-cl-border"
              tabIndex={0}
              role="region"
              aria-label="Player game log, scroll horizontally"
            >
              <table className="min-w-[760px] w-full text-left text-sm">
                <caption className="p-3 text-left font-bold">Game log</caption>
                <thead>
                  <tr>
                    {[
                      "Date",
                      "Opponent",
                      ...(q.data?.metrics || []).map((k) => labels[k] || k),
                    ].map((k) => (
                      <th
                        className="whitespace-nowrap border-b border-cl-border p-3"
                        key={k}
                      >
                        {k}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {season.games.map((g) => (
                    <tr key={g.gameId}>
                      <td className="whitespace-nowrap border-b border-cl-border p-3">
                        {new Date(g.startsAt).toLocaleDateString()}
                      </td>
                      <td className="whitespace-nowrap border-b border-cl-border p-3">
                        {g.opponent}
                      </td>
                      {q.data?.metrics.map((k) => (
                        <td className="border-b border-cl-border p-3" key={k}>
                          {g.values[k] ?? "—"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </section>
  );
}
