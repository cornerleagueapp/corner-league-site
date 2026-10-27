import { useState } from "react";
import { Link, Redirect, useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { isTeamSport } from "@/lib/sportRegistration";
import { sportVisual } from "@/lib/sportVisuals";
import { apiFetch } from "@/lib/apiClient";
import { hubEventHref, upcomingHubEvents } from "@/lib/sportHubEvents";
import { PageSEO } from "@/seo/usePageSEO";
export default function SportRegistrationPage() {
  const [, p] = useRoute("/sports/:sportKey/registration");
  const sport = p?.sportKey || "";
  if (sport === "jet-ski") return <Redirect to="/registration?sport=jet-ski" />;
  return (
    <main className="consumer-document-page cl-sport-hub">
      <PageSEO
        title={`${sportVisual(sport).label} registration · Corner League`}
        canonicalPath={`/sports/${sport}/registration`}
      />
      <header className="cl-hub-intro">
        <p className="cl-eyebrow">Join the competition</p>
        <h1>
          {sportVisual(sport).label} <span>registration</span>
        </h1>
        <p>
          {isTeamSport(sport)
            ? "Choose a league, then a published season. Register as an athlete for the season; team assignments happen separately."
            : "Choose an event to view its registration options, eligibility and availability."}
        </p>
      </header>
      {isTeamSport(sport) ? (
        <TeamRegistration key={sport} sport={sport} />
      ) : (
        <EventRegistration key={sport} sport={sport} />
      )}
    </main>
  );
}
type DirectoryItem = {
  id: string;
  name: string;
  organizationName?: string;
  startsOn?: string;
  endsOn?: string;
  logoUrl?: string | null;
  headerUrl?: string | null;
};
function TeamRegistration({ sport }: { sport: string }) {
  const [league, setLeague] = useState<DirectoryItem | null>(null);
  return (
    <section className="space-y-6 py-6">
      <h2 className="text-2xl font-bold">Choose a league</h2>
      <RegistrationDirectory
        key={sport}
        path={`/season-registration/leagues?sport=${encodeURIComponent(sport)}`}
        label="Leagues"
        selected={league?.id}
        onSelect={setLeague}
      />
      {league && (
        <section key={league.id} className="space-y-4">
          <h2 className="text-2xl font-bold">
            {league.name} · Choose a season
          </h2>
          <RegistrationDirectory
            path={`/season-registration/leagues/${league.id}/seasons?`}
            label="Published seasons"
            onSelect={(s) => navigateSeason(s.id)}
          />
        </section>
      )}
    </section>
  );
}
function navigateSeason(id: string) {
  window.location.assign(
    `/season-registration?season=${encodeURIComponent(id)}`,
  );
}
function RegistrationDirectory({
  path,
  label,
  selected,
  onSelect,
}: {
  path: string;
  label: string;
  selected?: string;
  onSelect: (s: DirectoryItem) => void;
}) {
  const [page, setPage] = useState(1);
  const q = useQuery({
    queryKey: ["registration-directory", path, page],
    staleTime: 30000,
    retry: false,
    queryFn: async () => {
      const response = await apiFetch(`${path}&page=${page}`, {
        skipAuth: true,
        noRefresh: true,
      });
      if (!response.ok) throw new Error(`${label} could not load.`);
      const json = await response.json();
      return (json.data ?? json) as { items: DirectoryItem[]; total: number };
    },
  });
  return (
    <div className="space-y-4">
      {q.isPending ? (
        <p role="status">Loading {label.toLowerCase()}…</p>
      ) : q.isError ? (
        <p role="alert">
          {q.error.message}{" "}
          <button className="underline" onClick={() => void q.refetch()}>
            Try again
          </button>
        </p>
      ) : !q.data.items.length ? (
        <p>No {label.toLowerCase()} are published yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {q.data.items.map((s) => (
            <button
              key={s.id}
              onClick={() => onSelect(s)}
              aria-pressed={selected === s.id}
              className={`min-w-0 overflow-hidden rounded-2xl border bg-card text-left text-card-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${selected === s.id ? "border-primary ring-2 ring-primary" : "border-border"}`}
            >
              {s.headerUrl && (
                <img
                  src={s.headerUrl}
                  alt=""
                  className="h-24 w-full object-cover"
                  loading="lazy"
                  onError={(e) => (e.currentTarget.style.display = "none")}
                />
              )}
              <div className="flex items-center gap-4 p-5">
                <RegistrationLogo url={s.logoUrl} name={s.name} />
                <div className="min-w-0">
                  <h3 className="break-words text-lg font-bold">{s.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {s.organizationName || `${s.startsOn} – ${s.endsOn}`}
                  </p>
                  <span className="mt-2 block text-sm font-semibold text-primary">
                    {s.startsOn
                      ? "Register for this season →"
                      : "View seasons →"}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
      {(page > 1 || (q.data?.total || 0) > 20) && (
        <nav aria-label={label} className="flex gap-4">
          <button
            disabled={page === 1 || q.isFetching}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </button>
          <span>Page {page}</span>
          <button
            disabled={page * 20 >= (q.data?.total || 0) || q.isFetching}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </nav>
      )}
    </div>
  );
}
export function RegistrationLogo({
  url,
  name,
}: {
  url?: string | null;
  name?: string | null;
}) {
  const label =
    typeof name === "string" && name.trim() ? name.trim() : "Corner League";
  const [failed, setFailed] = useState(false);
  return url && !failed ? (
    <img
      src={url}
      alt={`${label} logo`}
      onError={() => setFailed(true)}
      className="h-16 w-16 shrink-0 rounded-xl border border-border bg-background object-contain p-1"
    />
  ) : (
    <span
      aria-label={`${label} logo placeholder`}
      className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-muted text-xl font-bold"
    >
      {label.slice(0, 2).toUpperCase()}
    </span>
  );
}
function EventRegistration({ sport }: { sport: string }) {
  const [page, setPage] = useState(1);
  const q = useQuery({
    queryKey: ["sport-registration-directory", sport, page],
    queryFn: async ({ signal }) => {
      const r = await apiFetch(
        `/sport-event?sportKey=${encodeURIComponent(sport)}&page=${page}&limit=24&order=DESC&sortBy=startDate`,
        { signal, skipAuth: true, noRefresh: true },
      );
      if (!r.ok) throw new Error("Events unavailable");
      const json = await r.json(),
        d = json.data ?? json;
      return {
        items: upcomingHubEvents(json, sport, 0),
        hasNext: d.meta?.hasNextPage ?? d.sportEvents?.length === 24,
      };
    },
    staleTime: 60000,
    retry: false,
  });
  return (
    <section>
      {q.isPending ? (
        <p role="status">Loading events…</p>
      ) : q.isError ? (
        <p role="alert">
          Events couldn’t load.{" "}
          <button onClick={() => q.refetch()}>Try again</button>
        </p>
      ) : !q.data.items.length ? (
        <p>No published events yet.</p>
      ) : (
        <div className="cl-hub-registration-grid">
          {q.data.items.map((e) => (
            <Link key={e.id} href={hubEventHref(sport, e)}>
              <h2>{e.name}</h2>
              <p>{e.organizationName}</p>
              <p>{new Date(e.startDate).toLocaleDateString()}</p>
              <strong>View event & registration →</strong>
            </Link>
          ))}
        </div>
      )}
      <nav aria-label="Registration event pages">
        <button
          disabled={page === 1 || q.isFetching}
          onClick={() => setPage((p) => p - 1)}
        >
          Previous
        </button>
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
