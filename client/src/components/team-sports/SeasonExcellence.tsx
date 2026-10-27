import { Link } from "wouter";
import { Trophy, Star } from "lucide-react";
import type { PublicTeamSeason } from "@/lib/teamSports";
import GameCard, { athleteHref } from "./GameCard";
export default function SeasonExcellence({
  season: d,
  sandbox = false,
}: {
  season: PublicTeamSeason;
  sandbox?: boolean;
}) {
  const honors = d.excellence;
  if (!honors?.awards.length) return null;
  const groups = [
    ...new Set(honors.awards.filter((a) => a.group).map((a) => a.group!)),
  ];
  const game = d.games.find(
    (g) => g.id === honors.allStarGameId && g.status !== "cancelled",
  );
  const person = (a: (typeof honors.awards)[number]) =>
    a.profileId && !sandbox ? (
      <Link
        className="font-semibold text-cl-ink hover:text-cl-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-cl-accent"
        href={athleteHref(d.sportKey, a.profileId)}
      >
        {a.name}
      </Link>
    ) : (
      <span className="font-semibold text-cl-ink">{a.name}</span>
    );
  return (
    <section
      className="my-6 min-w-0 space-y-5 rounded-2xl border border-cl-border bg-cl-panel p-4 sm:p-6"
      aria-label="Season All-Stars and awards"
    >
      <header className="flex items-center gap-3">
        <Trophy aria-hidden className="shrink-0 text-cl-accent" />
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-cl-muted">
            {d.leagueName} · {d.name}
          </p>
          <h3 className="text-2xl font-bold text-cl-ink">All-Stars & Awards</h3>
        </div>
      </header>
      <div className="grid gap-4 sm:grid-cols-2">
        {honors.awards
          .filter((a) => !a.group)
          .map((a, i) => (
            <article
              key={i}
              className="min-w-0 rounded-xl border border-cl-border bg-cl-surface p-5"
            >
              <p className="mb-2 text-sm font-bold uppercase tracking-wide text-cl-accent">
                {a.title}
              </p>
              {person(a)}
            </article>
          ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {groups.map((group) => (
          <article
            key={group}
            className="min-w-0 rounded-xl border border-cl-border bg-cl-surface p-5"
          >
            <h4 className="mb-4 flex items-center gap-2 text-lg font-bold text-cl-ink">
              <Star size={18} aria-hidden className="text-cl-accent" />
              {group}
            </h4>
            <ul className="divide-y divide-cl-border">
              {honors.awards
                .filter((a) => a.group === group)
                .map((a, i) => (
                  <li
                    key={i}
                    className="flex min-w-0 flex-wrap items-center justify-between gap-2 py-3"
                  >
                    <span className="break-words">{person(a)}</span>
                    <span className="text-xs text-cl-muted">{a.title}</span>
                  </li>
                ))}
            </ul>
          </article>
        ))}
      </div>
      {game && (
        <div className="min-w-0">
          <h4 className="mb-3 text-lg font-bold text-cl-ink">All-Star game</h4>
          <GameCard
            sandbox={sandbox}
            data={{
              seasonId: d.id,
              organizationId: d.organizationId,
              sportKey: d.sportKey,
              periodLabel: d.periodLabel,
              scoreLabel: d.scoreLabel,
              game,
              result: d.results.find((r) => r.gameId === game.id) || null,
              teams: d.teams,
              playerStats: d.playerStats || [],
            }}
          />
        </div>
      )}
    </section>
  );
}
