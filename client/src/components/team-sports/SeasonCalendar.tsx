import { useMemo, useState } from "react";
import type { PublicTeamSeason } from "@/lib/teamSports";
import {
  gamesInMonth,
  initialMonth,
  localDay,
  monthCells,
  shiftMonth,
} from "@/lib/seasonCalendar";
import GameCard from "./GameCard";
export default function SeasonCalendar({
  season,
  games,
  sandbox = false,
}: {
  season: PublicTeamSeason;
  games: PublicTeamSeason["games"];
  sandbox?: boolean;
}) {
  const playing = useMemo(
    () => games.filter((g) => !g.competition?.bye),
    [games],
  );
  const [month, setMonth] = useState(() => initialMonth(playing)),
    [day, setDay] = useState("");
  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const g of playing) {
      const key = localDay(g.startsAt);
      m.set(key, (m.get(key) || 0) + 1);
    }
    return m;
  }, [playing]);
  const change = (date: Date) => {
    setMonth(date);
    setDay("");
  };
  const shown = gamesInMonth(playing, month, day);
  const button =
    "min-h-11 rounded-xl border border-cl-border bg-cl-surface px-3 py-2 text-sm font-semibold text-cl-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-cl-accent";
  return (
    <section aria-label="Season calendar" className="min-w-0 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <button
          aria-label="Previous month"
          className={button + " w-11 shrink-0 text-xl"}
          onClick={() => change(shiftMonth(month, -1))}
        >
          <span aria-hidden="true">‹</span>
        </button>
        <h5
          aria-live="polite"
          className="min-w-0 text-center text-base font-bold sm:text-lg"
        >
          {month.toLocaleDateString(undefined, {
            month: "long",
            year: "numeric",
          })}
        </h5>
        <button
          aria-label="Next month"
          className={button + " w-11 shrink-0 text-xl"}
          onClick={() => change(shiftMonth(month, 1))}
        >
          <span aria-hidden="true">›</span>
        </button>
      </div>
      <p className="text-sm text-cl-muted">
        {Intl.DateTimeFormat().resolvedOptions().timeZone} · Select a day to
        view its games. Division and status filters apply.
      </p>
      <div className="grid grid-cols-7 overflow-hidden rounded-xl border border-cl-border">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <span
            key={d}
            className="py-3 text-center text-xs font-semibold text-cl-muted"
          >
            {d}
          </span>
        ))}
        {monthCells(month).map((date, i) => {
          if (!date) return <span key={`blank-${i}`} />;
          const key = localDay(date),
            count = counts.get(key) || 0,
            selected = day === key;
          return (
            <button
              key={key}
              aria-pressed={selected}
              aria-label={`${date.toLocaleDateString(undefined, { dateStyle: "full" })}, ${count} games`}
              onClick={() => setDay(selected ? "" : key)}
              className={`flex min-h-16 min-w-0 flex-col items-center justify-center gap-1 border-t border-cl-border px-0.5 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cl-accent sm:min-h-20 ${selected ? "bg-blue-600 text-white" : "bg-cl-surface text-cl-ink hover:bg-cl-subtle"}`}
            >
              <span className="font-semibold">{date.getDate()}</span>
              {count > 0 && (
                <span
                  className={`rounded-full px-1.5 text-xs ${selected ? "text-white" : "text-cl-accent"}`}
                >
                  {count}
                  <span className="hidden sm:inline">
                    {" "}
                    {count === 1 ? "game" : "games"}
                  </span>
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          className={button}
          onClick={() =>
            change(new Date(new Date().getFullYear(), new Date().getMonth(), 1))
          }
        >
          Today
        </button>
        {day && (
          <button className={button} onClick={() => setDay("")}>
            Show whole month
          </button>
        )}
      </div>
      <h5 aria-live="polite" className="font-bold">
        {day
          ? new Date(day + "T12:00:00").toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })
          : "Monthly agenda"}{" "}
        · {shown.length} {shown.length === 1 ? "game" : "games"}
      </h5>
      {!shown.length && (
        <p className="rounded-xl border border-cl-border p-4 text-cl-muted">
          No published games match this date and the current filters.
        </p>
      )}
      <div className="space-y-3">
        {shown.map((game) => (
          <GameCard
            key={game.id}
            sandbox={sandbox}
            data={{
              seasonId: season.id,
              organizationId: season.organizationId,
              sportKey: season.sportKey,
              periodLabel: season.periodLabel,
              scoreLabel: season.scoreLabel,
              game,
              result: season.results.find((r) => r.gameId === game.id) || null,
              teams: season.teams,
              playerStats: season.playerStats || [],
            }}
          />
        ))}
      </div>
    </section>
  );
}
