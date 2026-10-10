import { AdmissionOffer } from "@/components/admissions/AdmissionOffer";
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
    <section className="mt-6 space-y-5 rounded-2xl border border-white/15 bg-[#07111f] p-5 text-white">
      <h2 className="text-2xl font-bold">Leagues & seasons</h2>
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
                className={`min-h-11 rounded-xl border px-4 py-2 ${id === s.id ? "border-cyan-300 text-cyan-200" : "border-white/20"}`}
              >
                {s.leagueName} · {s.name}
              </button>
            ))}
          </div>
          {!list.data.items.length && (
            <p className="text-slate-300">No published seasons yet.</p>
          )}
          <div className="flex flex-wrap items-center gap-4">
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
          </div>
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
      <div>
        <h3 className="text-xl font-bold">
          {d.leagueName} · {d.name}
        </h3>
        <p className="text-slate-300">
          {d.startsOn} – {d.endsOn} · Published season
        </p>
      </div>
      <label className="block space-y-2">
        Division
        <select
          className="block w-full min-h-11 rounded-xl border border-white/20 bg-[#07111f] p-3"
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
      <div>
        <h4 className="mb-3 text-lg font-bold">Teams & players</h4>
        <div className="grid gap-4 md:grid-cols-2">
          {teams.items.map((t) => (
            <article
              key={t.id}
              className="rounded-xl border border-white/10 p-4"
            >
              <h5 className="font-bold">{t.name}</h5>
              <p className="text-sm text-slate-400">
                {d.divisions.find((v) => v.id === t.divisionId)?.name}
              </p>
              {!t.players.length && (
                <p className="mt-3 text-slate-400">
                  No published player roster yet.
                </p>
              )}
              <ul className="mt-3 space-y-2">
                {t.players.map((p) => (
                  <li key={p.profileId}>
                    {sandbox ? (
                      <span>{p.name}</span>
                    ) : (
                      <Link
                        className="text-cyan-200 underline"
                        href={`/racer/${encodeURIComponent(p.profileId)}?sport=${encodeURIComponent(d.sportKey)}`}
                      >
                        {p.name}
                      </Link>
                    )}{" "}
                    <span className="text-sm text-slate-300">
                      {p.number ? `#${p.number} ` : ""}
                      {p.position}
                    </span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
        {!view.teams.length && <p>No teams in this division yet.</p>}
        <Pages
          label="teams"
          page={teams.page}
          pages={teams.pages}
          onChange={setTeamPage}
        />
      </div>
      <div>
        <h4 className="mb-3 text-lg font-bold">
          Games & {d.scoreLabel.toLowerCase()}
        </h4>
        <label className="mb-3 block">
          Game status
          <select
            className="ml-2 min-h-11 rounded-xl border border-white/20 bg-[#07111f] p-2"
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
        <p className="mb-3 text-sm text-slate-400">
          Game start times use your device’s local time zone.
        </p>
        {!view.games.length && (
          <p className="text-slate-400">
            No published games match these filters.
          </p>
        )}
        <div className="space-y-3">
          {games.items.map((g) => {
            const r = d.results.find((r) => r.gameId === g.id);
            return (
              <article
                key={g.id}
                className="rounded-xl border border-white/10 p-4"
              >
                <h5 className="font-bold">
                  {name(g.homeTeamId)} vs {name(g.awayTeamId)}
                </h5>
                <p className="text-sm text-slate-300">
                  <time dateTime={g.startsAt}>
                    {new Date(g.startsAt).toLocaleString()}
                  </time>{" "}
                  · {g.venue || "Venue to be announced"}
                </p>
                <p className="mt-2 font-bold">
                  {g.status === "cancelled"
                    ? "Cancelled"
                    : r
                      ? `${r.homeScore} – ${r.awayScore} · ${r.status === "final" ? "Final" : "In progress"}`
                      : "Scheduled"}
                </p>
                {g.status !== "cancelled" && (
                  <AdmissionOffer
                    eventKey={`game:${d.id}:${g.id}`}
                    sandbox={sandbox}
                  />
                )}
                {r?.tiebreakWinnerId && (
                  <p>Tiebreak winner: {name(r.tiebreakWinnerId)}</p>
                )}
                {!!r?.periods.length && (
                  <details className="mt-2">
                    <summary className="min-h-11 cursor-pointer text-cyan-200">
                      {d.periodLabel} scores
                    </summary>
                    <ul>
                      {r.periods.map((p, i) => (
                        <li key={i}>
                          {p.label}: {p.homeScore} – {p.awayScore}
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </article>
            );
          })}
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
        <p className="mb-3 text-sm text-slate-400">
          Final games only. Ordered by standings points, score difference and
          scores for; teams with equal values remain tied.
        </p>
        {view.standings.map((s) => (
          <div key={s.divisionId} className="mb-5">
            <h5 className="mb-2 font-bold">{s.name}</h5>
            <ul
              className="space-y-3 sm:hidden"
              aria-label={`${s.name} standings`}
            >
              {s.rows.map((r) => (
                <li
                  key={r.teamId}
                  className="rounded-xl border border-white/10 p-3"
                >
                  <p className="font-bold">
                    {r.name} · {r.points} points
                  </p>
                  <p className="text-sm text-slate-300">
                    Played {r.played} · W {r.wins} · D {r.draws} · L {r.losses}
                  </p>
                  <p className="text-sm text-slate-300">
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
                      "Played",
                      "Wins",
                      "Draws",
                      "Losses",
                      `${d.scoreLabel} for`,
                      `${d.scoreLabel} against`,
                      "Difference",
                      "Standings points",
                    ].map((h) => (
                      <th
                        key={h}
                        scope="col"
                        className="whitespace-nowrap border-b border-white/20 p-3"
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
                        {r.name}
                      </th>
                      {[
                        r.played,
                        r.wins,
                        r.draws,
                        r.losses,
                        r.scoredFor,
                        r.scoredAgainst,
                        r.difference,
                        r.points,
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
