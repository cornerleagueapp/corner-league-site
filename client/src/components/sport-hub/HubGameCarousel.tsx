import TeamLogo from "@/components/team-sports/TeamLogo";
import { gameHref } from "@/components/team-sports/GameCard";
import { useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { loadHubGames, shortName, type HubGame } from "@/lib/hubGames";
import { readTeamSeason } from "@/lib/teamSports";
import { sportOrganization } from "@/lib/sportNavigation";
import { gameStatus } from "@/components/team-sports/GameCard";
export default function HubGameCarousel({ sport }: { sport: string }) {
  const strip = useRef<HTMLDivElement>(null);
  const q = useQuery({
    queryKey: ["sport-hub-score-strip", sport],
    queryFn: () => loadHubGames(sport),
    staleTime: 30000,
    retry: false,
  });
  const slide = (direction: number) =>
    strip.current?.scrollBy({
      left: direction * Math.min(260, strip.current.clientWidth),
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  return (
    <section
      id="upcoming-events"
      className="cl-hub-scores"
      aria-label="Scores and schedule"
    >
      <div className="cl-hub-section-heading">
        <div>
          <p className="cl-eyebrow">Around your sport</p>
          <h2>Scores & schedule</h2>
        </div>
        <Link href={`/sports/${sport}/events`}>All events →</Link>
      </div>
      {q.isPending ? (
        <p role="status" className="cl-hub-empty">
          Loading games…
        </p>
      ) : q.isError ? (
        <div className="cl-hub-empty" role="alert">
          Games couldn’t load.{" "}
          <button onClick={() => q.refetch()}>Try again</button>
        </div>
      ) : !q.data.length ? (
        <p className="cl-hub-empty">
          Published games will appear here once organizations share their
          schedules.
        </p>
      ) : (
        <>
          <div className="cl-score-carousel">
            <button aria-label="Previous games" onClick={() => slide(-1)}>
              <ChevronLeft />
            </button>
            <div
              ref={strip}
              className="cl-score-strip"
              tabIndex={0}
              role="region"
              aria-label="Game cards, scroll horizontally"
            >
              {q.data.map((d) => (
                <CompactGame key={`${d.seasonId}:${d.game.id}`} data={d} />
              ))}
            </div>
            <button aria-label="Next games" onClick={() => slide(1)}>
              <ChevronRight />
            </button>
          </div>
          <p className="cl-hub-caption">
            Live games and upcoming matchups first; recent results when no games
            are scheduled. Times are local. Swipe or use the arrows for more.
          </p>
        </>
      )}
    </section>
  );
}
function CompactGame({ data: d }: { data: HubGame }) {
  const scored =
    d.result?.status === "final" || d.result?.status === "in-progress";
  const season = useQuery({
    queryKey: ["hub-team-records", d.sportKey, d.organizationId, d.seasonId],
    queryFn: () => readTeamSeason(d.seasonId, d.organizationId, d.sportKey),
    enabled: !scored,
    staleTime: 60000,
    retry: false,
  });
  const date = new Date(d.game.startsAt),
    status = gameStatus(d.game, d.result);
  const teams = [d.game.awayTeamId, d.game.homeTeamId];
  return (
    <Link
      className="cl-compact-game"
      href={gameHref(d.sportKey, d.seasonId, d.game.id, d.organizationId)}
      aria-label={`${d.teams.map((t) => t.name).join(" versus ")}, ${date.toLocaleString()}`}
    >
      <div className="cl-compact-game-meta">
        <time dateTime={d.game.startsAt}>
          {date.toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          })}{" "}
          ·{" "}
          {scored
            ? status === "live"
              ? "LIVE"
              : "FINAL"
            : date.toLocaleTimeString(undefined, {
                hour: "numeric",
                minute: "2-digit",
                timeZoneName: "short",
              })}
        </time>
        <abbr title={d.organizationName}>{shortName(d.organizationName)}</abbr>
      </div>
      {teams.map((id, i) => {
        const team = d.teams.find((t) => t.id === id),
          record = season.data?.standings
            .flatMap((v) => v.rows)
            .find((r) => r.teamId === id);
        return (
          <div className="cl-compact-team" key={id}>
            <TeamLogo team={team} />
            <strong title={team?.name}>
              {team?.name || "To be determined"}
            </strong>
            <span className={scored ? "cl-compact-score" : "cl-compact-record"}>
              {scored
                ? i === 0
                  ? d.result!.awayScore
                  : d.result!.homeScore
                : record
                  ? `${record.wins}–${record.losses}${record.draws ? `–${record.draws}` : ""}`
                  : "—"}
            </span>
          </div>
        );
      })}
      <span className="sr-only">
        {scored ? "Updated score" : "Season record; dash means unavailable"}
      </span>
    </Link>
  );
}
