import { Link, useRoute, useSearch } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { readTeamSeason } from "@/lib/teamSports";
import { sportOrganization } from "@/lib/sportNavigation";
import {
  athleteHref,
  teamHref,
  gameStatus,
} from "@/components/team-sports/GameCard";
import TeamLogo, { teamColor } from "@/components/team-sports/TeamLogo";
import { PageSEO } from "@/seo/usePageSEO";
export default function PublicGamePage() {
  const [, p] = useRoute("/sports/:sportKey/games/:seasonId/:gameId");
  const org = new URLSearchParams(useSearch()).get("org") || "";
  const q = useQuery({
    queryKey: ["team-season", "public", "guest", org, p?.sportKey, p?.seasonId],
    queryFn: () => readTeamSeason(p!.seasonId, org, p!.sportKey),
    enabled: !!p && !!org,
    staleTime: 30000,
    retry: false,
  });
  if (q.isPending && org)
    return (
      <main className="cl-match-page" role="status">
        Loading game…
      </main>
    );
  const d = q.data,
    g = d?.games.find((g) => g.id === p?.gameId);
  if (q.isError || !d || !g || !p)
    return (
      <main className="cl-match-page" role="alert">
        This game is unavailable or is no longer published.{" "}
        {org && <button onClick={() => q.refetch()}>Try again</button>}
      </main>
    );
  const teams = [
      d.teams.find((t) => t.id === g.awayTeamId)!,
      d.teams.find((t) => t.id === g.homeTeamId)!,
    ],
    r = d.results.find((r) => r.gameId === g.id),
    status = gameStatus(g, r || null);
  const rows = (g.status === "cancelled" ? [] : d.playerStats || []).filter(
    (s) => s.gameId === g.id,
  );
  const metrics = [...new Set(rows.flatMap((s) => Object.keys(s.values)))];
  const standing = (id: string) =>
    d.standings.flatMap((s) => s.rows).find((s) => s.teamId === id);
  const teamLink = (id: string) => teamHref(p.sportKey, d.id, id, org);
  const total = (id: string, m: string) => {
    const values = rows.filter(
      (s) => s.teamId === id && Number.isFinite(s.values[m]),
    );
    return values.length ? values.reduce((n, s) => n + s.values[m], 0) : null;
  };
  return (
    <main className="cl-match-page">
      <PageSEO
        title={`${teams[0].name} vs ${teams[1].name} · Corner League`}
        canonicalPath={`/sports/${p.sportKey}/games/${d.id}/${g.id}?org=${org}`}
      />
      <nav aria-label="Breadcrumb" className="cl-match-crumb">
        <Link href={sportOrganization(p.sportKey, org)}>Organization</Link> /{" "}
        <Link
          href={`${sportOrganization(p.sportKey, org)}?section=competition&season=${d.id}`}
        >
          {d.name}
        </Link>{" "}
        / Game
      </nav>
      <header
        className="cl-match-scoreboard"
        style={{
          borderTop: `4px solid ${teamColor(teams[0].primaryColor)}`,
          borderBottom: `4px solid ${teamColor(teams[1].secondaryColor)}`,
        }}
      >
        {teams.map((t, i) => (
          <div className={`cl-match-side cl-match-side-${i}`} key={t.id}>
            <TeamLogo team={t} large />
            <div>
              <Link href={teamLink(t.id)}>{t.name}</Link>
              <small>
                {standing(t.id)
                  ? `${standing(t.id)!.wins}–${standing(t.id)!.losses} · `
                  : ""}
                {i ? "Home" : "Away"}
              </small>
            </div>
            <strong>{r ? (i ? r.homeScore : r.awayScore) : "—"}</strong>
          </div>
        ))}
        <div className="cl-match-periods">
          <strong>
            {status === "cancelled"
              ? "Cancelled"
              : g.competition?.bye
                ? "Bye"
                : r?.status === "final"
                  ? "Final"
                  : status === "live"
                    ? "Live"
                    : status === "past"
                      ? "Result pending"
                      : status}
          </strong>
          <div
            className="cl-score-scroll"
            role="region"
            aria-label="Period scores"
            tabIndex={0}
          >
            <table>
              <thead>
                <tr>
                  <th>Team</th>
                  {r?.periods.map((v, i) => (
                    <th key={i}>{v.label}</th>
                  ))}
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {teams.map((t, i) => (
                  <tr key={t.id}>
                    <th>
                      {t.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 4)}
                    </th>
                    {r?.periods.map((v, j) => (
                      <td key={j}>{i ? v.homeScore : v.awayScore}</td>
                    ))}
                    <td>{r ? (i ? r.homeScore : r.awayScore) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </header>
      <nav className="cl-sport-tabs" aria-label="Game sections">
        <a href="#game-overview">Overview</a>
        <a href="#box-score">Box score</a>
        <a href="#team-stats">Team stats</a>
        <a href="#game-standings">Standings</a>
      </nav>
      <div className="cl-match-layout" id="game-overview">
        <aside>
          <section className="cl-team-panel">
            <h2>Game leaders</h2>
            {!metrics.length && (
              <p>Player statistics have not been published yet.</p>
            )}
            {metrics.map((m) => (
              <div className="cl-leader-category" key={m}>
                <h3>{m.replace(/_/g, " ")}</h3>
                <div>
                  {teams.map((t) => {
                    const candidates = rows.filter(
                      (s) => s.teamId === t.id && Number.isFinite(s.values[m]),
                    );
                    const max = Math.max(...candidates.map((s) => s.values[m]));
                    return (
                      <section key={t.id}>
                        <small>{t.name}</small>
                        {candidates
                          .filter((s) => s.values[m] === max)
                          .map((s) => (
                            <p key={s.profileId}>
                              <Link href={athleteHref(p.sportKey, s.profileId)}>
                                {s.name}
                              </Link>
                              <strong>{s.values[m]}</strong>
                            </p>
                          ))}
                        {!candidates.length && <p>Not recorded</p>}
                      </section>
                    );
                  })}
                </div>
              </div>
            ))}
          </section>
          <section className="cl-team-panel">
            <h2>Game information</h2>
            <p>
              <time dateTime={g.startsAt}>
                {new Date(g.startsAt).toLocaleString(undefined, {
                  dateStyle: "full",
                  timeStyle: "short",
                })}
              </time>
            </p>
            <p>{g.venue || "Venue to be announced"}</p>
            <p>
              {d.leagueName} · {d.name}
            </p>
            {g.competition && (
              <p>
                Round {g.competition.round} · Match {g.competition.match}
              </p>
            )}
            <p className="text-cl-muted">
              Times shown in your local timezone. Scores reflect the latest
              published update.
            </p>
          </section>
        </aside>
        <div>
          <section className="cl-team-panel" id="box-score">
            <h1>Box score</h1>
            {!rows.length && (
              <p>Player statistics will appear here when published.</p>
            )}
            {teams.map((t) => (
              <section key={t.id} className="cl-box-team">
                <h2>
                  <TeamLogo team={t} />
                  <Link href={teamLink(t.id)}>{t.name}</Link>
                </h2>
                <div
                  className="cl-score-scroll"
                  role="region"
                  tabIndex={0}
                  aria-label={`${t.name} player box score, scroll horizontally`}
                >
                  <table>
                    <thead>
                      <tr>
                        <th>Player</th>
                        {metrics.map((m) => (
                          <th key={m}>{m}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows
                        .filter((s) => s.teamId === t.id)
                        .map((s) => (
                          <tr key={s.profileId}>
                            <th>
                              <Link href={athleteHref(p.sportKey, s.profileId)}>
                                {s.name}
                              </Link>
                            </th>
                            {metrics.map((m) => (
                              <td key={m}>{s.values[m] ?? "—"}</td>
                            ))}
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ))}
          </section>
          <section className="cl-team-panel" id="team-stats">
            <h2>Team stats</h2>
            <div className="flex justify-between gap-4 text-sm font-bold">
              {teams.map((t) => (
                <Link key={t.id} href={teamLink(t.id)}>
                  <TeamLogo team={t} />
                  {t.name}
                </Link>
              ))}
            </div>
            <p className="text-cl-muted">
              Totals from recorded player statistics; unrecorded values are not
              treated as zero.
            </p>
            {metrics.map((m) => {
              const a = total(teams[0].id, m),
                b = total(teams[1].id, m);
              return (
                <div className="cl-comparison" key={m}>
                  <div>
                    <strong>{a ?? "—"}</strong>
                    <span>{m}</span>
                    <strong>{b ?? "—"}</strong>
                  </div>
                  <div className="cl-comparison-bar">
                    {[a, b].map((v, i) => (
                      <span
                        key={i}
                        style={{
                          flex: v === null ? 0 : v || 0.01,
                          backgroundColor: teamColor(teams[i].primaryColor),
                        }}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </section>
          <section className="cl-team-panel" id="game-standings">
            <h2>Division standings</h2>
            {d.standings
              .filter((s) => teams.some((t) => t.divisionId === s.divisionId))
              .map((s) => (
                <section key={s.divisionId}>
                  <h3>{s.name}</h3>
                  <div
                    className="cl-score-scroll"
                    tabIndex={0}
                    role="region"
                    aria-label={`${s.name} standings`}
                  >
                    <table>
                      <thead>
                        <tr>
                          <th>Team</th>
                          <th>GP</th>
                          <th>W</th>
                          <th>L</th>
                          <th>Win %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {s.rows.map((v) => (
                          <tr
                            key={v.teamId}
                            className={
                              teams.some((t) => t.id === v.teamId)
                                ? "cl-game-winner"
                                : ""
                            }
                          >
                            <th>
                              <Link href={teamLink(v.teamId)}>{v.name}</Link>
                            </th>
                            <td>{v.played}</td>
                            <td>{v.wins}</td>
                            <td>{v.losses}</td>
                            <td>
                              {((v.winPercentage || 0) * 100).toFixed(1)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              ))}
          </section>
        </div>
      </div>
    </main>
  );
}
