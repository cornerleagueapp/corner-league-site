import { useState } from "react";
import { Link, Redirect, useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { isTeamSport } from "@/lib/sportRegistration";
import { listTeamSeasons, readTeamSeason } from "@/lib/teamSports";
import { sportVisual } from "@/lib/sportVisuals";
import { apiFetch } from "@/lib/apiClient";
import { hubEventHref, upcomingHubEvents } from "@/lib/sportHubEvents";
import PublicOrganizationChooser from "@/components/sport-hub/PublicOrganizationChooser";
import TeamRecruitment from "@/components/team-sports/TeamRecruitment";
import { useAuth } from "@/hooks/useAuth";
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
            ? "Choose an organization and season to find teams accepting players. Requests follow the organization’s existing approval process."
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
function TeamRegistration({ sport }: { sport: string }) {
  const [org, setOrg] = useState("");
  return (
    <>
      <PublicOrganizationChooser sport={sport} value={org} onChange={setOrg} />
      {org && <SeasonChooser key={org} org={org} sport={sport} />}
    </>
  );
}
function SeasonChooser({ org, sport }: { org: string; sport: string }) {
  const [page, setPage] = useState(1),
    [season, setSeason] = useState("");
  const q = useQuery({
    queryKey: ["registration-seasons", sport, org, page],
    queryFn: () => listTeamSeasons(org, sport, page),
    staleTime: 60000,
    retry: false,
  });
  return (
    <section className="cl-hub-registration">
      <h2>Choose a season</h2>
      {q.isPending ? (
        <p role="status">Loading seasons…</p>
      ) : q.isError ? (
        <p role="alert">
          Seasons couldn’t load.{" "}
          <button onClick={() => q.refetch()}>Try again</button>
        </p>
      ) : !q.data.items.length ? (
        <p>
          No published seasons yet. Check back when this organization opens a
          season.
        </p>
      ) : (
        <>
          <div className="cl-hub-season-list">
            {q.data.items.map((s) => (
              <button
                key={s.id}
                aria-pressed={season === s.id}
                onClick={() => setSeason(s.id)}
              >
                <strong>{s.leagueName}</strong>
                <span>{s.name}</span>
              </button>
            ))}
          </div>
          {(page > 1 || q.data.total > 20) && (
            <nav aria-label="Seasons">
              <button
                disabled={page === 1 || q.isFetching}
                onClick={() => {
                  setSeason("");
                  setPage((p) => p - 1);
                }}
              >
                Previous
              </button>
              <button
                disabled={page * 20 >= q.data.total || q.isFetching}
                onClick={() => {
                  setSeason("");
                  setPage((p) => p + 1);
                }}
              >
                Next
              </button>
            </nav>
          )}
        </>
      )}
      {season && (
        <SeasonRegistration key={season} id={season} org={org} sport={sport} />
      )}
    </section>
  );
}
function SeasonRegistration({
  id,
  org,
  sport,
}: {
  id: string;
  org: string;
  sport: string;
}) {
  const auth = useAuth();
  const q = useQuery({
    queryKey: ["registration-public-season", sport, org, id],
    queryFn: () => readTeamSeason(id, org, sport),
    staleTime: 60000,
    retry: false,
  });
  if (q.isPending) return <p role="status">Loading available teams…</p>;
  if (q.isError)
    return (
      <p role="alert">
        Teams couldn’t load.{" "}
        <button onClick={() => q.refetch()}>Try again</button>
      </p>
    );
  const teams = q.data.teams.filter((t) => t.recruiting);
  return (
    <div className="cl-hub-registration">
      <h3>{q.data.name} · Available teams</h3>
      {!teams.length ? (
        <p>
          No teams are accepting public join requests for this season. Contact
          the organization for invitation options.
        </p>
      ) : (
        <>
          {!auth.isAuthenticated && (
            <Link
              className="sport-hub-more"
              href={`/auth?next=${encodeURIComponent(`/sports/${sport}/registration`)}`}
            >
              Sign in or create an account to join →
            </Link>
          )}
          <div className="cl-hub-registration-grid">
            {teams.map((t) => (
              <article key={t.id}>
                <p className="cl-eyebrow">
                  {q.data.divisions.find((v) => v.id === t.divisionId)?.name}
                </p>
                <h4>{t.name}</h4>
                <TeamRecruitment seasonId={id} teamId={t.id} sportKey={sport} />
              </article>
            ))}
          </div>
        </>
      )}
    </div>
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
