import NationwideMap from "@/components/landing/NationwideMap";
import EventOrganizationFilter from "@/components/sport-hub/EventOrganizationFilter";
import { useRoute, Link } from "wouter";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSportSelection } from "@/hooks/useSportSelection";
import { apiFetch } from "@/lib/apiClient";
import { upcomingHubEvents, hubEventHref } from "@/lib/sportHubEvents";
import { sportVisual } from "@/lib/sportVisuals";
import { isTeamSport } from "@/lib/sportRegistration";
import TeamGameDirectory from "@/components/team-sports/TeamGameDirectory";
import { PageSEO } from "@/seo/usePageSEO";
export default function SportEventsPage() {
  const [, p] = useRoute("/sports/:sportKey/events");
  const selected = useSportSelection();
  const sport = p?.sportKey || selected.sportKey;
  return (
    <main className="consumer-document-page p-3 sm:p-6 text-cl-ink">
      <PageSEO
        title={`${sportVisual(sport).label} events · Corner League`}
        canonicalPath={`/sports/${sport}/events`}
      />
      <header className="cl-sport-page-heading">
        <p className="cl-eyebrow">Corner League · {sportVisual(sport).label}</p>
        <h1>
          Every matchup.
          <br />
          Every moment.
        </h1>
        <p>
          Explore published events and schedules across{" "}
          {sportVisual(sport).label} organizations.
        </p>
      </header>
      {isTeamSport(sport) ? (
        <TeamGameDirectory key={sport} sport={sport} />
      ) : (
        <RaceEvents key={sport} sport={sport} />
      )}
    </main>
  );
}
function RaceEvents({ sport }: { sport: string }) {
  const [page, setPage] = useState(1),
    [status, setStatus] = useState("all"),
    [year, setYear] = useState(""),
    [organizationId, setOrganizationId] = useState("");
  const q = useQuery({
    queryKey: ["sport-event-directory", sport, page, status, year, organizationId],
    queryFn: async ({ signal }) => {
      const r = await apiFetch(
        `/sport-event?sportKey=${encodeURIComponent(sport)}&status=${status}${organizationId ? `&organizationId=${encodeURIComponent(organizationId)}` : ""}${year ? `&year=${year}` : ""}&page=${page}&limit=24&order=DESC&sortBy=startDate`,
        { signal, skipAuth: true, noRefresh: true },
      );
      if (!r.ok) throw new Error("Events unavailable");
      const body = await r.json();
      const raw = body.data ?? body;
      return {
        items: upcomingHubEvents(body, sport, 0),
        hasNext: raw.meta?.hasNextPage ?? raw.sportEvents?.length === 24,
      };
    },
    staleTime: 30000,
    retry: false,
  });
  const eventStatus = (e: { startDate: string; endDate: string }) =>
    Date.parse(e.endDate) < Date.now()
      ? "past"
      : Date.parse(e.startDate) > Date.now()
        ? "upcoming"
        : "live";
  const rows = q.data?.items || [];
  return (
    <section className="space-y-5">
      <div className="cl-sport-filters">
        <EventOrganizationFilter sport={sport} value={organizationId} onChange={value => { setOrganizationId(value); setPage(1); }} />
        <label>
          Status
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            {["all", "upcoming", "live", "past"].map((s) => (
              <option key={s} value={s}>
                {s === "all" ? "All events" : s}
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
      {q.isPending ? (
        <p role="status">Loading events…</p>
      ) : q.isError ? (
        <p role="alert">
          Events couldn’t be loaded.{" "}
          <button onClick={() => q.refetch()}>Try again</button>
        </p>
      ) : rows.length ? (
        <div className="cl-game-grid">
          {rows.map((e) => (
            <Link
              className="cl-event-card"
              key={e.id}
              href={hubEventHref(sport, e)}
            >
              <span
                className={`cl-game-status cl-game-status-${eventStatus(e)}`}
              >
                {eventStatus(e)}
              </span>
              <h2>{e.name}</h2>
              <p>{e.organizationName}</p>
              <p>
                {new Date(e.startDate).toLocaleString()} · {e.location}
              </p>
              <strong>View event →</strong>
            </Link>
          ))}
        </div>
      ) : (
        <p className="cl-sport-empty">
          No published events match these filters.
        </p>
      )}
      {!q.isPending && !q.isError && <NationwideMap key={`${sport}:${organizationId}:${status}:${year}:${page}`} events={rows} sportKey={sport} sportLabel={sportVisual(sport).label} pageOnly />}
      <nav className="cl-sport-pagination" aria-label="Event pages">
        <button
          disabled={page === 1 || q.isFetching}
          onClick={() => setPage((p) => p - 1)}
        >
          Previous
        </button>
        <span>Page {page}</span>
        <button
          disabled={!q.data?.hasNext || q.isFetching}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </button>
      </nav>
    </section>
  );
}
