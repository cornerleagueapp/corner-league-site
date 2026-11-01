import { Link } from "wouter";
import type { PublicTeamSeason } from "@/lib/teamSports";
import { seasonHref } from "@/lib/seasonNavigation";
import GameCard from "./GameCard";
export default function SeasonOverview({
  season: d,
}: {
  season: PublicTeamSeason;
}) {
  const now = Date.now();
  const upcoming = d.games
    .filter(
      (g) =>
        !g.competition?.bye &&
        g.status !== "cancelled" &&
        g.status !== "final" &&
        !d.results.some((r) => r.gameId === g.id && r.status === "final") &&
        Date.parse(g.startsAt) >= now,
    )
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
    .slice(0, 3);
  return (
    <div className="space-y-6">
      <section
        aria-label="Season summary"
        className="grid grid-cols-2 gap-3 lg:grid-cols-4"
      >
        {[
          ["Teams", d.teams.length],
          ["Divisions", d.divisions.length],
          [
            "Scheduled games",
            d.games.filter(
              (g) => !g.competition?.bye && g.status !== "cancelled",
            ).length,
          ],
          [
            "Final results",
            d.results.filter(
              (r) =>
                r.status === "final" &&
                d.games.some(
                  (g) => g.id === r.gameId && g.status !== "cancelled",
                ),
            ).length,
          ],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-xl border border-cl-border bg-cl-subtle p-4"
          >
            <p className="text-sm text-cl-muted">{label}</p>
            <p className="mt-2 text-3xl font-bold">{value}</p>
          </div>
        ))}
      </section>
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold">Up next</h2>
          <Link
            className="inline-flex min-h-11 items-center font-semibold text-cl-accent"
            href={seasonHref(d.sportKey, d.id, d.organizationId, "schedule")}
          >
            Full schedule →
          </Link>
        </div>
        {upcoming.length ? (
          upcoming.map((g) => (
            <GameCard
              key={g.id}
              data={{
                seasonId: d.id,
                organizationId: d.organizationId,
                sportKey: d.sportKey,
                periodLabel: d.periodLabel,
                scoreLabel: d.scoreLabel,
                game: g,
                result: d.results.find((r) => r.gameId === g.id) || null,
                teams: d.teams,
                playerStats: d.playerStats || [],
              }}
            />
          ))
        ) : (
          <p className="rounded-xl border border-cl-border p-5 text-cl-muted">
            No upcoming games are published right now. View Schedule & Results
            for the full season.
          </p>
        )}
      </section>
      <section className="grid gap-3 sm:grid-cols-2">
        <Link
          className="min-h-11 rounded-xl border border-cl-border bg-cl-subtle p-5 font-semibold text-cl-accent"
          href={seasonHref(d.sportKey, d.id, d.organizationId, "standings")}
        >
          Explore division standings →
        </Link>
        <Link
          className="min-h-11 rounded-xl border border-cl-border bg-cl-subtle p-5 font-semibold text-cl-accent"
          href={seasonHref(d.sportKey, d.id, d.organizationId, "photos")}
        >
          See season photos →
        </Link>
      </section>
    </div>
  );
}
