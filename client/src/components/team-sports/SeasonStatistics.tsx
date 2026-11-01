import {
  leaderCategories,
  percentageCategory,
  playerLeaders,
} from "@/lib/seasonLeaders";
import {
  orderedStatKeys,
  recordedDerivedStats,
  derivedStatDisplay,
} from "@/lib/statPresentation";
import { useState } from "react";
import { Link } from "wouter";
import type { PublicTeamSeason } from "@/lib/teamSports";
import { seasonStats } from "@/lib/seasonStatistics";
import { SPORT_STATS, statTotals, statLabel } from "@/lib/sportStatistics";
import { athleteHref, teamHref } from "./GameCard";
import TeamLogo from "./TeamLogo";
export default function SeasonStatistics({
  season: d,
}: {
  season: PublicTeamSeason;
}) {
  const [division, setDivision] = useState(""),
    [metric, setMetric] = useState("");
  const { teams, rows, players } = seasonStats(d, division);
  const metrics = orderedStatKeys(
    d.sportKey,
    (SPORT_STATS[d.sportKey] || []).filter((m) =>
      rows.some((r) => m in r.values),
    ),
  );
  const efficiency = teams
    .map((team) => ({
      team,
      rates: recordedDerivedStats(
        rows.filter((r) => r.teamId === team.id),
        d.sportKey,
      ),
    }))
    .filter((item) => item.rates.length > 0);
  const categories = leaderCategories(d.sportKey, metrics);
  const chosen = categories.some((c) => c.key === metric)
    ? metric
    : categories[0]?.key || "";
  const rate = percentageCategory(d.sportKey, chosen);
  const leaders = playerLeaders(players, d.sportKey, chosen);
  return (
    <section className="min-w-0 space-y-5" aria-label="Season statistics">
      <h2 className="text-2xl font-bold">Stats & Leaders</h2>
      <p className="text-sm text-cl-muted">
        Totals from published player box scores in final games, including
        tournaments. Unpublished, canceled and unfinished games are excluded.
        Team totals reflect the player stats recorded by the organizer.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-2 text-sm font-semibold">
          Division
          <select
            className="block min-h-11 w-full rounded-xl border border-cl-border bg-cl-surface p-3"
            value={division}
            onChange={(e) => setDivision(e.target.value)}
          >
            <option value="">All divisions</option>
            {d.divisions.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </label>
        {categories.length > 0 && (
          <label className="space-y-2 text-sm font-semibold">
            Leader category
            <select
              className="block min-h-11 w-full rounded-xl border border-cl-border bg-cl-surface p-3"
              value={chosen}
              onChange={(e) => setMetric(e.target.value)}
            >
              {categories.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      {!rows.length ? (
        <p className="rounded-xl border border-cl-border bg-cl-subtle p-5 text-cl-muted">
          Player statistics have not been published for final games in this
          division yet.
        </p>
      ) : (
        <>
          <section className="space-y-3">
            <h3 className="text-xl font-bold">
              Player leaders · {statLabel(chosen)}
            </h3>
            {rate && (
              <p className="text-sm text-cl-muted">
                Season percentage from recorded makes ÷ attempts in final games,
                including tournaments. At least one recorded attempt is
                required; makes and attempts are shown for context.
              </p>
            )}
            {rate && !leaders.length && (
              <p className="rounded-xl border border-cl-border bg-cl-subtle p-5 text-cl-muted">
                No players have recorded attempts for this percentage in the
                selected division yet.
              </p>
            )}
            <ol className="divide-y divide-cl-border rounded-xl border border-cl-border">
              {leaders.map((p, i) => (
                <li key={p.profileId} className="flex items-center gap-3 p-4">
                  <span className="w-6 text-sm text-cl-muted">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <Link
                      className="break-words font-semibold text-cl-accent"
                      href={athleteHref(d.sportKey, p.profileId)}
                    >
                      {p.name}
                    </Link>
                    <p className="text-xs text-cl-muted">
                      {p.teamIds
                        .map((id) => teams.find((t) => t.id === id)?.name)
                        .filter(Boolean)
                        .join(" / ")}{" "}
                      · {p.games} games
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <strong>
                      {rate
                        ? `${p.value.toLocaleString(undefined, { maximumFractionDigits: 1 })}%`
                        : p.value.toLocaleString()}
                    </strong>
                    {rate && (
                      <p className="mt-1 text-xs text-cl-muted">
                        {p.made} / {p.attempts} made
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </section>
          <section className="space-y-3">
            <h3 className="text-xl font-bold">Team statistics</h3>
            <div
              role="region"
              aria-label="Team statistics table, scroll horizontally for all categories"
              tabIndex={0}
              className="max-w-full overflow-x-auto rounded-xl border border-cl-border"
            >
              <table className="w-full text-left text-sm">
                <caption className="sr-only">
                  Recorded team totals from published final game player stats
                </caption>
                <thead>
                  <tr>
                    {["Team", ...metrics.map(statLabel)].map((label) => (
                      <th
                        key={label}
                        scope="col"
                        className="whitespace-nowrap border-b border-cl-border bg-cl-subtle p-3"
                      >
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {teams.map((t) => {
                    const teamRows = rows.filter((r) => r.teamId === t.id),
                      totals = statTotals(teamRows, d.sportKey);
                    return (
                      <tr key={t.id}>
                        <th scope="row" className="p-3">
                          <Link
                            className="inline-flex min-w-40 items-center gap-2"
                            href={teamHref(
                              d.sportKey,
                              d.id,
                              t.id,
                              d.organizationId,
                            )}
                          >
                            <TeamLogo team={t} />
                            {t.name}
                          </Link>
                        </th>
                        {metrics.map((m) => (
                          <td key={m} className="whitespace-nowrap p-3">
                            {teamRows.length
                              ? (totals[m] || 0).toLocaleString()
                              : "—"}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {efficiency.length > 0 && (
              <section
                className="space-y-3"
                aria-label="Recorded team efficiency"
              >
                <h3 className="text-xl font-bold">
                  {d.sportKey === "basketball"
                    ? "Shooting percentages"
                    : "Team efficiency"}
                </h3>
                <p className="text-sm text-cl-muted">
                  Calculated only where the required stats and attempts are
                  recorded.
                </p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {efficiency.map(({ team, rates }) => (
                    <div
                      key={team.id}
                      className="rounded-xl border border-cl-border bg-cl-subtle p-4"
                    >
                      <h4 className="font-bold">{team.name}</h4>
                      <dl className="mt-2 space-y-1 text-sm">
                        {rates.map(([key, value]) => (
                          <div key={key} className="flex justify-between gap-3">
                            <dt className="text-cl-muted">{statLabel(key)}</dt>
                            <dd className="font-semibold">
                              {derivedStatDisplay(key, value)}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </section>
        </>
      )}
    </section>
  );
}
