import GameCard, {teamHref} from "./GameCard";
import TeamBracket from "./TeamBracket";
import ConsumerBrandingHero from "@/components/branding/ConsumerBrandingHero";
// Phase 2/3: AdmissionOffer remains in @/components/admissions/AdmissionOffer.
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useSearch, useLocation } from "wouter";
import { useSandbox } from "@/pages/organizations/SandboxContext";
import {
  listTeamSeasons,
  readTeamSeason,
  PublicTeamSeason,
  seasonView,
  pageItems,
} from "@/lib/teamSports";
export default function TeamSeasons({
  organizationId,
  sportKey,
}: {
  organizationId: string;
  sportKey: string;
}) {
  const sandbox = useSandbox();
  return (
    <SeasonBrowser
      key={`${sandbox?.account ?? "public"}:${sandbox?.id ?? "public"}:${organizationId}:${sportKey}`}
      organizationId={organizationId}
      sportKey={sportKey}
      sandboxId={sandbox?.id}
      account={sandbox?.account}
    />
  );
}
function SeasonBrowser({
  organizationId,
  sportKey,
  sandboxId,
  account,
}: {
  organizationId: string;
  sportKey: string;
  sandboxId?: string;
  account?: string;
}) {
  const [page, setPage] = useState(1),
    params = new URLSearchParams(useSearch()),
    id = params.get("season") ?? "",
    [location, navigate] = useLocation();
  const list = useQuery({
    queryKey: [
      "team-seasons",
      sandboxId ?? "public",
      account ?? "guest",
      organizationId,
      sportKey,
      page,
    ],
    queryFn: () => listTeamSeasons(organizationId, sportKey, page, sandboxId),
    gcTime: sandboxId ? 0 : undefined,
    staleTime: sandboxId ? 0 : 30_000,
  });
  const season = useQuery({
    queryKey: [
      "team-season",
      sandboxId ?? "public",
      account ?? "guest",
      organizationId,
      sportKey,
      id,
    ],
    queryFn: () => readTeamSeason(id, organizationId, sportKey, sandboxId),
    enabled: !!id,
    gcTime: sandboxId ? 0 : undefined,
    staleTime: sandboxId ? 0 : 15_000,
  });
  function select(value: string) {
    const query = new URLSearchParams(params);
    if (value) query.set("season", value);
    else query.delete("season");
    navigate(`${location}${query.size ? `?${query}` : ""}`);
  }
  return (
    <section className="mt-6 space-y-5 rounded-2xl border border-cl-border bg-cl-surface p-5 text-cl-ink">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold">Leagues & seasons</h2>
        <button type="button" disabled={list.isFetching || season.isFetching}
          className="min-h-11 rounded-xl border border-cl-border px-4 py-2 disabled:opacity-50"
          onClick={() => { void list.refetch(); if (id) void season.refetch(); }}>
          {list.isFetching || season.isFetching ? "Refreshing…" : "Refresh seasons"}
        </button>
      </div>
      {list.isPending ? (
        <p role="status">Loading seasons…</p>
      ) : list.isError ? (
        <p role="alert">
          Unable to load seasons.{" "}
          <button className="underline" onClick={() => void list.refetch()}>
            Try again
          </button>
        </p>
      ) : (
        <>
          <div className="flex flex-wrap gap-3">
            {list.data.items.map((s) => (
              <button
                key={s.id}
                aria-pressed={id === s.id}
                onClick={() => select(s.id)}
                className={`min-h-11 rounded-xl border px-4 py-2 ${id === s.id ? "border-cl-accent text-cl-accent" : "border-cl-border"}`}
              >
                {s.leagueName} · {s.name}
              </button>
            ))}
          </div>
          {!list.data.items.length && (
            <p className="text-cl-muted">No published seasons yet. Leagues and seasons appear here once the organizer publishes a season.</p>
          )}
          {(page > 1 || list.data.total > 20) && <div className="flex flex-wrap items-center gap-4">
            <button
              disabled={page === 1}
              className="min-h-11 disabled:opacity-40"
              onClick={() => setPage((p) => p - 1)}
            >
              Previous seasons
            </button>
            <span>Page {page}</span>
            <button
              disabled={page * 20 >= list.data.total}
              className="min-h-11 disabled:opacity-40"
              onClick={() => setPage((p) => p + 1)}
            >
              Next seasons
            </button>
          </div>}
        </>
      )}
      {id &&
        (season.isPending ? (
          <p role="status">Loading season…</p>
        ) : season.isError ? (
          <p role="alert">
            This season is unavailable or no longer published.{" "}
            <button className="underline" onClick={() => void season.refetch()}>
              Try again
            </button>{" "}
            <button className="underline" onClick={() => select("")}>
              Close season
            </button>
          </p>
        ) : (
          <SeasonDetails key={id} data={season.data} sandbox={!!sandboxId} />
        ))}
    </section>
  );
}
export function SeasonDetails({
  data: d,
  sandbox = false,
}: {
  data: PublicTeamSeason;
  sandbox?: boolean;
}) {
  const [division, setDivision] = useState(""),
    [status, setStatus] = useState("all"),
    [teamPage, setTeamPage] = useState(1),
    [gamePage, setGamePage] = useState(1);
  const view = seasonView(d, division, status),
    teams = pageItems(view.teams, teamPage, 6),
    games = pageItems(view.games, gamePage, 10);
  const name = (id: string) => d.teams.find((t) => t.id === id)?.name ?? "Team";
  return (
    <div className="min-w-0 space-y-6">
      {!sandbox && <Link href={`/season-registration?season=${encodeURIComponent(d.id)}`} className="inline-flex min-h-11 items-center rounded-xl border border-cl-border bg-cl-surface px-4 py-2 font-semibold text-cl-ink">Season registration</Link>}

      <ConsumerBrandingHero
        kind="season"
        id={d.id}
        organizationId={d.organizationId}
        sport={d.sportKey}
        name={`${d.leagueName} · ${d.name}`}
      />
      <div>
        <h3 className="text-xl font-bold">
          {d.leagueName} · {d.name}
        </h3>
        <p className="text-cl-muted">
          {d.startsOn} – {d.endsOn} · Published season
        </p>
      </div>
      <label className="block space-y-2">
        Division
        <select
          className="block w-full min-h-11 rounded-xl border border-cl-border bg-cl-surface p-3"
          value={division}
          onChange={(e) => {
            setDivision(e.target.value);
            setTeamPage(1);
            setGamePage(1);
          }}
        >
          <option value="">All divisions</option>
          {d.divisions.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </select>
      </label>
      <TeamBracket season={d} division={division} />
      <section className="space-y-5"><h4 className="text-xl font-black">Teams by division</h4>
        {d.divisions.filter(v=>!division||v.id===division).map(v=><div key={v.id} className="cl-division-card"><header><h5>{v.name}</h5><span>{d.teams.filter(t=>t.divisionId===v.id).length} teams</span></header><div className="cl-division-teams">{d.teams.filter(t=>t.divisionId===v.id).map(t=>{const record=d.standings.find(s=>s.divisionId===v.id)?.rows.find(r=>r.teamId===t.id);return <div key={t.id}>{sandbox?<strong>{t.name}</strong>:<Link href={teamHref(d.sportKey,d.id,t.id,d.organizationId)}><strong>{t.name}</strong><span>{record?`${record.wins}–${record.losses}`:'—'} <span aria-hidden="true">→</span></span></Link>}{/* Enrollment is season-wide via the Season registration link above. */}</div>})}</div></div>)}
      </section>
      <div>
        <h4 className="mb-3 text-lg font-bold">
          Games
        </h4>
        <label className="mb-3 block">
          Game status
          <select
            className="ml-2 min-h-11 rounded-xl border border-cl-border bg-cl-surface p-2"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setGamePage(1);
            }}
          >
            <option value="all">All games</option>
            <option value="scheduled">Scheduled / in progress</option>
            <option value="final">Final</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </label>
        <p className="mb-3 text-sm text-cl-muted">
          Game start times use your device’s local time zone.
        </p>
        {!view.games.length && (
          <p className="text-cl-muted">
            No published games match these filters.
          </p>
        )}
        <div className="space-y-3">
          {games.items.map(g=><GameCard key={g.id} sandbox={sandbox} data={{seasonId:d.id,organizationId:d.organizationId,sportKey:d.sportKey,periodLabel:d.periodLabel,scoreLabel:d.scoreLabel,game:g,result:d.results.find(r=>r.gameId===g.id)||null,teams:d.teams,playerStats:d.playerStats||[]}}/>)}
        </div>
      </div>
      <Pages
        label="games"
        page={games.page}
        pages={games.pages}
        onChange={setGamePage}
      />
      <div>
        <h4 className="mb-3 text-lg font-bold">Standings</h4>
        <p className="mb-3 text-sm text-cl-muted">
          Final league games only; tournament games are excluded. Each division
          ranks by points or win percentage, then score difference and scores
          for. Equal values share a place.
        </p>
        {view.standings.map((s) => (
          <div key={s.divisionId} className="mb-5">
            <h5 className="mb-2 font-bold">
              {s.name} ·{" "}
              {s.standingsMode === "win-percentage"
                ? "Win percentage"
                : "Standings points"}
            </h5>
            <ul
              className="space-y-3 sm:hidden"
              aria-label={`${s.name} standings`}
            >
              {s.rows.map((r) => (
                <li
                  key={r.teamId}
                  className="rounded-xl border border-cl-border p-3"
                >
                  <p className="font-bold">
                    #{r.position ?? "—"} {r.name} · {r.points} points ·{" "}
                    {((r.winPercentage ?? 0) * 100).toFixed(1)}%
                  </p>
                  <p className="text-sm text-cl-muted">
                    Played {r.played} · W {r.wins} · D {r.draws} · L {r.losses}{" "}
                    · OT losses {r.overtimeLosses ?? 0}
                  </p>
                  <p className="text-sm text-cl-muted">
                    {d.scoreLabel}: {r.scoredFor} for · {r.scoredAgainst}{" "}
                    against · Difference {r.difference}
                  </p>
                </li>
              ))}
            </ul>
            <div className="min-w-0 max-w-full overflow-x-auto hidden sm:block">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">{s.name} standings</caption>
                <thead>
                  <tr>
                    {[
                      "Team",
                      "Place",
                      "Played",
                      "Wins",
                      "Draws",
                      "Losses",
                      `${d.scoreLabel} for`,
                      `${d.scoreLabel} against`,
                      "Difference",
                      "Standings points",
                      "Win %",
                      "OT losses",
                    ].map((h) => (
                      <th
                        key={h}
                        scope="col"
                        className="whitespace-nowrap border-b border-cl-border p-3"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {s.rows.map((r) => (
                    <tr key={r.teamId}>
                      <th scope="row" className="whitespace-nowrap p-3">
                        {sandbox?r.name:<Link href={teamHref(d.sportKey,d.id,r.teamId,d.organizationId)}>{r.name}</Link>}
                      </th>
                      {[
                        r.position ?? "—",
                        r.played,
                        r.wins,
                        r.draws,
                        r.losses,
                        r.scoredFor,
                        r.scoredAgainst,
                        r.difference,
                        r.points,
                        ((r.winPercentage ?? 0) * 100).toFixed(1),
                        r.overtimeLosses ?? 0,
                      ].map((v, i) => (
                        <td key={i} className="p-3">
                          {v}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Pages({
  label,
  page,
  pages,
  onChange,
}: {
  label: string;
  page: number;
  pages: number;
  onChange: (n: number) => void;
}) {
  if (pages <= 1) return null;
  return (
    <nav
      aria-label={`${label} pages`}
      className="mt-3 flex flex-wrap items-center gap-4"
    >
      <button
        className="min-h-11 disabled:opacity-40"
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
      >
        Previous {label}
      </button>
      <span>
        Page {page} of {pages}
      </span>
      <button
        className="min-h-11 disabled:opacity-40"
        disabled={page === pages}
        onClick={() => onChange(page + 1)}
      >
        Next {label}
      </button>
    </nav>
  );
}
