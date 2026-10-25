import { useRoute, useSearch, Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { readTeamSeason } from "@/lib/teamSports";
import { sportOrganization } from "@/lib/sportNavigation";
import GameCard, {
  athleteHref,
  teamHref,
} from "@/components/team-sports/GameCard";
import { PageSEO } from "@/seo/usePageSEO";
import TeamLogo, { teamColor } from "@/components/team-sports/TeamLogo";
export default function PublicTeamPage() {
  const [, p] = useRoute("/sports/:sportKey/teams/:seasonId/:teamId");
  const params = new URLSearchParams(useSearch());
  const org = params.get("org") || "";
  const [path] = useLocation();
  const q = useQuery({
    queryKey: ["team-season", "public", "guest", org, p?.sportKey, p?.seasonId],
    queryFn: () => readTeamSeason(p!.seasonId, org, p!.sportKey),
    enabled: !!p && !!org,
    staleTime: 15000,
    retry: false,
  });
  const d = q.data,
    t = d?.teams.find((t) => t.id === p?.teamId);
  const tabs = [
    "roster",
    ...(d?.games.length ? ["schedule"] : []),
    ...(d?.playerStats?.some((r) => r.teamId === t?.id) ? ["stats"] : []),
    ...(d?.standings.some((s) => s.rows.some((r) => r.teamId === t?.id))
      ? ["standings", "record"]
      : []),
  ];
  const tab = tabs.includes(params.get("tab") || "")
    ? params.get("tab")!
    : "roster";
  const href = (v: string) => `${path}?${new URLSearchParams({ org, tab: v })}`;
  if (q.isPending && org)
    return (
      <main className="p-6" role="status">
        Loading team…
      </main>
    );
  if (q.isError || !d || !t || !p)
    return (
      <main className="p-6 text-cl-ink" role="alert">
        This team is unavailable or no longer published.{" "}
        {org && (
          <button className="underline" onClick={() => q.refetch()}>
            Try again
          </button>
        )}
      </main>
    );
  const games = d.games
    .filter((g) => g.homeTeamId === t.id || g.awayTeamId === t.id)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const standing = d.standings.find((s) => s.divisionId === t.divisionId);
  const record = standing?.rows.find((r) => r.teamId === t.id);
  const finals = new Set(
    d.results
      .filter(
        (r) =>
          r.status === "final" &&
          d.games.some((g) => g.id === r.gameId && g.status !== "cancelled"),
      )
      .map((r) => r.gameId),
  );
  const rows = (d.playerStats || []).filter(
    (r) => r.teamId === t.id && finals.has(r.gameId),
  );
  const metrics = [...new Set(rows.flatMap((r) => Object.keys(r.values)))];
  return (
    <main className="consumer-document-page p-3 sm:p-6 text-cl-ink min-w-0">
      <PageSEO
        title={`${t.name} · ${d.name} · Corner League`}
        canonicalPath={teamHref(p.sportKey, d.id, t.id, org)}
      />
      <nav className="mb-5 text-sm text-cl-muted" aria-label="Breadcrumb">
        <Link href={sportOrganization(p.sportKey, org)}>Organization</Link> /{" "}
        <Link
          href={`${sportOrganization(p.sportKey, org)}?section=competition&season=${d.id}`}
        >
          {d.name}
        </Link>{" "}
        / {t.name}
      </nav>
      <header
        className="cl-team-hero"
        style={{
          borderTop: `5px solid ${teamColor(t.primaryColor)}`,
          borderBottom: `3px solid ${teamColor(t.secondaryColor)}`,
        }}
      >
        <TeamLogo team={t} large />
        <div>
          <p className="cl-eyebrow">
            {d.leagueName} · {standing?.name || "Team"}
          </p>
          <h1>{t.name}</h1>
          <p>
            {d.name} · {t.players.length} players
          </p>
        </div>
        <div className="cl-team-record">
          <strong>
            {record
              ? `${record.wins}–${record.losses}${record.draws ? `–${record.draws}` : ""}`
              : "—"}
          </strong>
          <span>Season record</span>
        </div>
      </header>
      <nav className="cl-sport-tabs" aria-label="Team sections">
        {tabs.map((v) => (
          <Link
            key={v}
            href={href(v)}
            aria-current={tab === v ? "page" : undefined}
          >
            {v === "stats" ? "Player stats" : v[0].toUpperCase() + v.slice(1)}
          </Link>
        ))}
      </nav>
      <section className="cl-team-panel">
        {tab === "roster" && (
          <>
            <h2>Roster</h2>
            {t.players.length ? (
              <div className="cl-team-roster">
                {t.players.map((a) => (
                  <Link
                    key={a.profileId}
                    href={athleteHref(p.sportKey, a.profileId)}
                  >
                    <span className="cl-player-number">
                      {a.number ? `#${a.number}` : "—"}
                    </span>
                    <span>
                      <strong>{a.name}</strong>
                      <small>{a.position || "Athlete"}</small>
                    </span>
                    <span aria-hidden="true">→</span>
                  </Link>
                ))}
              </div>
            ) : (
              <p>No published players yet.</p>
            )}
          </>
        )}
        {tab === "schedule" && (
          <>
            <h2>Schedule & results</h2>
            {!games.length && <p>No published games yet.</p>}
            <div className="cl-game-grid">
              {games.map((g) => (
                <GameCard
                  key={g.id}
                  data={{
                    seasonId: d.id,
                    organizationId: org,
                    sportKey: p.sportKey,
                    periodLabel: d.periodLabel,
                    scoreLabel: d.scoreLabel,
                    game: g,
                    result: d.results.find((r) => r.gameId === g.id) || null,
                    teams: d.teams,
                    playerStats: d.playerStats || [],
                  }}
                />
              ))}
            </div>
          </>
        )}
        {tab === "stats" && (
          <>
            <h2>Player stats</h2>
            <p className="mb-4 text-cl-muted">
              Season totals from published final games. GP counts games with
              recorded player stats.
            </p>
            {!rows.length ? (
              <p>No published player stats yet.</p>
            ) : (
              <div
                className="cl-score-scroll"
                tabIndex={0}
                role="region"
                aria-label="Player statistics, scroll horizontally"
              >
                <table>
                  <thead>
                    <tr>
                      <th>Player</th>
                      <th>GP</th>
                      {metrics.map((m) => (
                        <th key={m}>{m.toUpperCase()}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {t.players.map((a) => {
                      const stats = rows.filter(
                        (r) => r.profileId === a.profileId,
                      );
                      return (
                        <tr key={a.profileId}>
                          <th>
                            <Link href={athleteHref(p.sportKey, a.profileId)}>
                              {a.name}
                            </Link>
                          </th>
                          <td>{stats.length}</td>
                          {metrics.map((m) => (
                            <td key={m}>
                              {stats.length
                                ? stats.reduce(
                                    (sum, r) => sum + (r.values[m] || 0),
                                    0,
                                  )
                                : "—"}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
        {tab === "standings" && (
          <>
            <h2>{standing?.name} standings</h2>
            <div
              className="cl-score-scroll"
              tabIndex={0}
              role="region"
              aria-label="Division standings, scroll horizontally"
            >
              <table className="cl-ranked-standings">
                <thead>
                  <tr>
                    {[
                      "Rank",
                      "Team",
                      "GP",
                      "W",
                      "L",
                      "D",
                      "Win %",
                      "For",
                      "Against",
                    ].map((k) => (
                      <th key={k}>{k}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {standing?.rows.map((r) => (
                    <tr
                      key={r.teamId}
                      className={r.teamId === t.id ? "cl-game-winner" : ""}
                    >
                      <td>{r.position || "—"}</td>
                      <th>
                        <Link href={teamHref(p.sportKey, d.id, r.teamId, org)}>
                          {r.name}
                        </Link>
                      </th>
                      {[
                        r.played,
                        r.wins,
                        r.losses,
                        r.draws,
                        ((r.winPercentage || 0) * 100).toFixed(1),
                        r.scoredFor,
                        r.scoredAgainst,
                      ].map((v, i) => (
                        <td key={i}>{v}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        {tab === "record" && (
          <>
            <h2>Season record</h2>
            <p className="text-cl-muted mb-5">
              Final league games; tournament results are shown in the schedule.
            </p>
            <div className="cl-record-grid">
              {[
                ["Wins", record?.wins],
                ["Losses", record?.losses],
                ["Games", record?.played],
                [
                  "Win %",
                  record
                    ? `${((record.winPercentage || 0) * 100).toFixed(1)}%`
                    : undefined,
                ],
                ["Scored", record?.scoredFor],
                ["Allowed", record?.scoredAgainst],
              ].map(([k, v]) => (
                <div key={String(k)}>
                  <span>{k}</span>
                  <strong>{v ?? "—"}</strong>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
