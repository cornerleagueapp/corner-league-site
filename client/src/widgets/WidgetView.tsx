import { useState, type CSSProperties } from "react";
import { formatCell, type WidgetPayload, type WidgetRow } from "./contract";
export function WidgetView({
  data,
  busy = false,
  onRefresh,
}: {
  data: WidgetPayload;
  busy?: boolean;
  onRefresh?: () => void;
}) {
  const [list, setList] = useState(false);
  const bracket = data.kind === "team-bracket";
  const cards = data.kind === "team-scoreboard" || bracket;
  const time = (s: string) =>
    new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(s));
  const match = (r: WidgetRow) => (
    <article className="clw-match" key={r.id}>
      <div className="clw-match-meta">
        <span
          className={`clw-status ${r.status === "in-progress" ? "clw-progress" : ""}`}
        >
          {r.cells[4]}
        </span>
        {r.startsAt && <time dateTime={r.startsAt}>{time(r.startsAt)}</time>}
      </div>
      <div className={`clw-team ${r.winner === "home" ? "clw-winner" : ""}`}>
        <span>{r.cells[0]}</span>
        <strong>{r.cells[1]}</strong>
      </div>
      {r.status !== "bye" && (
        <div className={`clw-team ${r.winner === "away" ? "clw-winner" : ""}`}>
          <span>{r.cells[2]}</span>
          <strong>{r.cells[3]}</strong>
        </div>
      )}
      {r.cells[5] && <p className="clw-venue">{r.cells[5]}</p>}
    </article>
  );
  return (
    <main
      className={`clw-widget clw-${data.theme} clw-${data.density}`}
      style={{ "--clw-accent": data.accent } as CSSProperties}
    >
      <header className="clw-header">
        <div>
          <p className="clw-kicker">{data.organization.name}</p>
          <h1>{data.title}</h1>
          <p className="clw-subtitle">
            {data.preview ? "Preview · " : ""}Published{" "}
            {data.kind === "team-bracket"
              ? "tournament"
              : data.kind === "golf-leaderboard"
                ? "leaderboard"
                : "updates"}
          </p>
        </div>
        <span className="clw-mark" aria-label="Corner League">
          CL
        </span>
      </header>
      <div className="clw-toolbar">
        <span>
          {data.publishedAt && Number.isFinite(Date.parse(data.publishedAt)) ? (
            <>
              Published{" "}
              <time dateTime={data.publishedAt}>{time(data.publishedAt)}</time>
            </>
          ) : (
            "Organization calendar"
          )}
        </span>
        <div className="clw-actions">
          {bracket && (
            <button
              type="button"
              aria-pressed={list}
              onClick={() => setList((v) => !v)}
            >
              {list ? "Bracket view" : "List view"}
            </button>
          )}
          {onRefresh && (
            <button type="button" onClick={onRefresh} disabled={busy}>
              {busy ? "Updating…" : "Refresh"}
            </button>
          )}
        </div>
      </div>
      {!data.sections.some((s) => s.rows.length) && (
        <div className="clw-empty">
          <span aria-hidden="true">◇</span>
          <h2>No published entries yet</h2>
          <p>
            Check back after the organizer publishes this schedule or result.
          </p>
        </div>
      )}
      <div
        className={bracket && !list ? "clw-rounds" : ""}
        role={bracket && !list ? "region" : undefined}
        aria-label={
          bracket && !list
            ? "Tournament bracket; scroll horizontally for later rounds"
            : undefined
        }
        tabIndex={bracket && !list ? 0 : undefined}
      >
        {data.sections.map((s) => (
          <section
            className={bracket && !list ? "clw-round" : "clw-section"}
            key={s.id}
            aria-label={s.title}
          >
            <h2>{s.title}</h2>
            {cards && !list ? (
              <div className={bracket ? "clw-matches" : "clw-score-grid"}>
                {s.rows.map(match)}
              </div>
            ) : (
              <div
                className="clw-table-scroll"
                role="region"
                aria-label={s.title + " table"}
                tabIndex={0}
              >
                <table>
                  <caption className="clw-sr">{s.title}</caption>
                  <thead>
                    <tr>
                      {s.columns.map((c, i) => (
                        <th scope="col" key={i}>
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {s.rows.map((r) => (
                      <tr key={r.id}>
                        {r.cells.map((c, i) =>
                          i === 0 ? (
                            <th scope="row" key={i}>
                              {formatCell(c)}
                            </th>
                          ) : (
                            <td key={i}>{formatCell(c)}</td>
                          ),
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!s.rows.length && (
                  <p className="clw-note">
                    No published entries in this group.
                  </p>
                )}
              </div>
            )}
          </section>
        ))}
      </div>
      <footer className="clw-footer">
        <div>
          <a href={data.sourceUrl} target="_blank" rel="noopener noreferrer">
            View on Corner League <span aria-hidden="true">↗</span>
            <span className="clw-sr"> (opens a new tab)</span>
          </a>
          <p>
            Checked {time(data.refreshedAt)} · Times in{" "}
            {Intl.DateTimeFormat().resolvedOptions().timeZone}
          </p>
        </div>
        <a
          className="clw-powered"
          href={new URL(data.sourceUrl).origin}
          target="_blank"
          rel="noopener noreferrer"
        >
          Powered by <strong>Corner League</strong>
        </a>
      </footer>
    </main>
  );
}
