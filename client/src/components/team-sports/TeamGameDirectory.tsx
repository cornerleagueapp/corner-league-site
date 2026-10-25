import NationwideMap from "@/components/landing/NationwideMap";
import EventOrganizationFilter from "@/components/sport-hub/EventOrganizationFilter";
import { sportVisual } from "@/lib/sportVisuals";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { publicSportData } from "@/lib/sportRegistration";
import GameCard, { type GameData } from "./GameCard";
import { sportOrganization } from "@/lib/sportNavigation";
type Page = {
  sportKey: string;
  items: (GameData & {
    organizationName: string;
    leagueName: string;
    seasonName: string;
  })[];
  total: number;
  page: number;
  limit: number;
};
export default function TeamGameDirectory({
  sport,
  organizationId,
}: {
  sport: string;
  organizationId?: string;
}) {
  const [year, setYear] = useState(
      "",
    ),
    [status, setStatus] = useState("all"),
    [page, setPage] = useState(1),
    [selectedOrg, setSelectedOrg] = useState("");
  const scopedOrg = organizationId || selectedOrg;
  const q = useQuery({
    queryKey: [
      "public-team-games",
      sport,
      scopedOrg,
      year,
      status,
      page,
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        sportKey: sport,
        status,
        page: String(page),
        limit: "12",
      });
      if (year) params.set("year", year);
      if (scopedOrg) params.set("organizationId", scopedOrg);
      const d = await publicSportData<Page>(`/team-sports/games?${params}`);
      if (
        d.sportKey !== sport ||
        !Array.isArray(d.items) ||
        d.items.some(
          (i) =>
            i.sportKey !== sport ||
            (scopedOrg && i.organizationId !== scopedOrg),
        )
      )
        throw new Error("Events do not match this sport.");
      return d;
    },
    staleTime: 30000,
    retry: false,
  });
  return (
    <section className="space-y-5 min-w-0" aria-label="Games and events">
      <div className="cl-sport-section-title">
        <div>
          <p className="cl-eyebrow">Around the league</p>
          <h2>Games</h2>
        </div>
        <span className="text-cl-muted">
          {q.data ? `${q.data.total} matchups` : ""}
        </span>
      </div>
      <div className="cl-sport-filters">
        {!organizationId && <EventOrganizationFilter sport={sport} value={selectedOrg} onChange={value => {setSelectedOrg(value);setPage(1);}} />}
        <label>
          Status
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            {["all", "upcoming", "live", "past", "cancelled"].map((s) => (
              <option key={s} value={s}>
                {s === "all" ? "All games" : s[0].toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Year
          <select
            value={year}
            onChange={(e) => {
              setYear(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All years</option>
            {Array.from(
              { length: 21 },
              (_, i) => new Date().getFullYear() + 5 - i,
            ).map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="text-sm text-cl-muted">
        Times are shown in your local time zone. Live labels follow the
        organizer’s scoring updates.
      </p>
      {q.isPending ? (
        <p role="status" className="cl-sport-empty">
          Loading games…
        </p>
      ) : q.isError ? (
        <div role="alert" className="cl-sport-empty">
          Games couldn’t be loaded.{" "}
          <button onClick={() => q.refetch()} className="underline">
            Try again
          </button>
        </div>
      ) : !q.data.items.length ? (
        <p className="cl-sport-empty">
          No published games match these filters.
        </p>
      ) : (
        <div className="cl-game-grid">
          {q.data.items.map((d) => (
            <div className="min-w-0" key={`${d.seasonId}:${d.game.id}`}>
              <div className="cl-game-context">
                <Link
                  href={`${sportOrganization(sport, d.organizationId)}?section=competition&season=${d.seasonId}`}
                >
                  {d.organizationName}
                </Link>
                <span>
                  {d.leagueName} · {d.seasonName}
                </span>
              </div>
              <GameCard data={d} />
            </div>
          ))}
        </div>
      )}
      {!organizationId && q.data && <NationwideMap key={`${sport}:${scopedOrg}:${year}:${status}:${page}`} sportKey={sport} sportLabel={sportVisual(sport).label} pageOnly events={q.data.items.map(d => ({
        id: `${d.seasonId}:${d.game.id}`,
        name: d.teams.map(t => t.name).join(" vs "),
        startDate: d.game.startsAt, endDate: d.game.startsAt,
        location: d.game.venue, organizationId: d.organizationId, organizationName: d.organizationName,
        href: `${sportOrganization(sport, d.organizationId)}?section=competition&season=${encodeURIComponent(d.seasonId)}#game-${encodeURIComponent(d.game.id)}`,
      }))} />}
      {(page > 1 || (q.data?.total || 0) > 12) && (
        <nav className="cl-sport-pagination" aria-label="Games pages">
          <button
            disabled={page === 1 || q.isFetching}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </button>
          <span>Page {page}</span>
          <button
            disabled={q.isFetching || page * 12 >= (q.data?.total || 0)}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </nav>
      )}
    </section>
  );
}
