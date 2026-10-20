import { useMemo, useState } from "react";
import { Link } from "wouter";
import { ExternalLink, ImageIcon, Play } from "lucide-react";
import SocialPostFeed from "@/components/community/SocialPosts";
import OrganizationPhotoGallery from "@/components/OrganizationPhotoGallery";
import type {
  Racer,
  RacerSponsor,
  RacerGalleryItem,
  RacerRatingCard,
} from "@/pages/racer-profile-parts/types";
import {
  analyzePerformance,
  performanceFilters,
  displayMetric,
  raceStatus,
  finishPosition,
  isMoto,
  type PerformanceResult,
} from "@/lib/athletePerformance";
import PerformanceChart from "./PerformanceChart";
type Tab = "overview" | "results" | "stats" | "posts" | "gallery";
export default function AthletePerformanceCenter({
  racer,
  history,
  loading,
  error,
  onRetry,
  sponsors,
  sponsorsLoading,
  galleryItems,
  galleryLoading,
  rating,
  canEdit,
  isOwner,
  onGallery,
  onWorldFinals,
  ageLabel,
  heightLabel,
}: {
  ageLabel?: string;
  heightLabel?: string;
  racer: Racer;
  history: PerformanceResult[];
  loading: boolean;
  error?: string | null;
  onRetry: () => void;
  sponsors: RacerSponsor[];
  sponsorsLoading: boolean;
  galleryItems: RacerGalleryItem[];
  galleryLoading: boolean;
  rating: RacerRatingCard | null;
  canEdit: boolean;
  isOwner: boolean;
  onGallery: () => void;
  onWorldFinals: () => void;
}) {
  const choices = useMemo(() => performanceFilters(history), [history]);
  const [year, setYear] = useState<string | null>(null),
    [division, setDivision] = useState("all"),
    [tab, setTab] = useState<Tab>("overview"),
    [limit, setLimit] = useState(20);
  const season = year ?? choices.years[0] ?? "all";
  const analysis = useMemo(
      () => analyzePerformance(history, season, division),
      [history, season, division],
    ),
    stats = analysis.stats;
  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "results", label: "Results" },
    { id: "stats", label: "Stats" },
    { id: "posts", label: "Posts" },
    { id: "gallery", label: "Gallery" },
  ];
  const hasData = !loading && !error;
  const snapshot = [
    ["Overall wins", stats.wins],
    ["Podiums", stats.podiums],
    ["Recorded points", stats.totalPoints],
    ["Average finish", stats.averageFinish],
  ] as const;
  const tabClick = (next: Tab) => {
    setTab(next);
    setLimit(20);
  };
  function galleryPreview(full = false) {
    return (
      <section className="athlete-panel">
        <header className="athlete-panel-heading">
          <h2>Gallery</h2>
          <button type="button" onClick={onGallery}>
            View full gallery →
          </button>
        </header>
        {galleryLoading ? (
          <p role="status">Loading photos…</p>
        ) : !galleryItems.length ? (
          <p className="athlete-empty">No athlete media yet.</p>
        ) : (
          <div className="athlete-gallery-grid">
            {galleryItems.slice(0, full ? 18 : 4).map((item) => (
              <button
                type="button"
                className="athlete-gallery-tile"
                key={item.id}
                onClick={onGallery}
              >
                <span className="athlete-gallery-photo">
                  {item.thumbnailUrl ||
                  item.thumbnail_url ||
                  (item.type === "image" ? item.url : null) ? (
                    <img
                      src={item.thumbnailUrl || item.thumbnail_url || item.url}
                      alt={item.title || "Athlete media"}
                      loading="lazy"
                    />
                  ) : (
                    <ImageIcon aria-hidden="true" />
                  )}
                  {item.type === "video" && (
                    <span className="athlete-gallery-play">
                      <Play size={16} aria-hidden="true" />
                    </span>
                  )}
                </span>
                <span className="athlete-gallery-caption">
                  {item.title ||
                    (item.type === "video" ? "Race video" : "Race photo")}
                </span>
              </button>
            ))}
          </div>
        )}
      </section>
    );
  }
  function results(full = false) {
    const rows = [...analysis.rows].reverse().slice(0, full ? limit : 6);
    return (
      <section className="athlete-panel">
        <header className="athlete-panel-heading">
          <div>
            <h2>{full ? "Race results" : "Recent results"}</h2>
            <p>
              {season === "all" ? "All recorded seasons" : `${season} season`} ·{" "}
              {analysis.rows.length} records
            </p>
          </div>
          {!full && (
            <button type="button" onClick={() => tabClick("results")}>
              View all results →
            </button>
          )}
        </header>
        {loading ? (
          <p role="status">Loading results…</p>
        ) : error ? (
          <p role="alert">{error}</p>
        ) : !rows.length ? (
          <p className="athlete-empty">
            No recorded results for these filters.
          </p>
        ) : (
          <>
            <div className="athlete-results-wrap">
              <table className="athlete-results-table">
                <caption className="sr-only">
                  Race results for the selected season and class
                </caption>
                <thead>
                  <tr>
                    {[
                      "Date",
                      "Event / class",
                      "Type",
                      "Finish",
                      "Points",
                      "Status",
                    ].map((label) => (
                      <th scope="col" key={label}>
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.resultId}>
                      <td data-label="Date">
                        {row.eventStartDate &&
                        Number.isFinite(Date.parse(row.eventStartDate))
                          ? new Date(row.eventStartDate).toLocaleDateString(
                              undefined,
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                                timeZone: "UTC",
                              },
                            )
                          : "Date unavailable"}
                      </td>
                      <td data-label="Event / class">
                        {row.eventId ? (
                          <Link
                            href={`/aqua-organizations/event-details/${encodeURIComponent(row.eventId)}${row.organizationId ? `?orgId=${encodeURIComponent(row.organizationId)}` : ""}`}
                          >
                            {row.eventName || "Event"}
                          </Link>
                        ) : (
                          <strong>{row.eventName || "Event"}</strong>
                        )}
                        <small>{row.divisionName || "Unspecified class"}</small>
                      </td>
                      <td data-label="Type">
                        {isMoto(row)
                          ? `Moto ${row.motoSequence ?? "—"}`
                          : "Overall"}
                      </td>
                      <td data-label="Finish">
                        <strong>
                          {raceStatus(row) === "finished" &&
                          finishPosition(row) !== null
                            ? `P${finishPosition(row)}`
                            : "—"}
                        </strong>
                      </td>
                      <td data-label="Points">
                        {displayMetric(
                          typeof row.score === "number" ? row.score : null,
                          0,
                        )}
                      </td>
                      <td data-label="Status">
                        <span
                          className={`athlete-result-status athlete-result-status--${raceStatus(row)}`}
                        >
                          {raceStatus(row) === "finished"
                            ? "Finished"
                            : raceStatus(row) === "unknown"
                              ? "Unspecified"
                              : raceStatus(row).toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {full && analysis.rows.length > limit && (
              <button
                type="button"
                className="athlete-load-more"
                onClick={() => setLimit((n) => n + 20)}
              >
                Show more results
              </button>
            )}
          </>
        )}
      </section>
    );
  }
  return (
    <div className="athlete-performance-center">
      <nav
        className="athlete-profile-tabs"
        aria-label="Athlete profile sections"
      >
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={tab === item.id}
            onClick={() => tabClick(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>
      <div className="athlete-performance-filters">
        <div>
          <h2>Performance center</h2>
          <p>Recorded race results and season analysis</p>
          <button
            className="athlete-refresh"
            type="button"
            onClick={onRetry}
            disabled={loading}
          >
            {loading ? "Refreshing…" : "Refresh results"}
          </button>
        </div>
        <div className="athlete-filter-controls">
          <label>
            Season
            <select
              value={season}
              onChange={(e) => {
                setYear(e.target.value);
                setLimit(20);
              }}
            >
              <option value="all">All time</option>
              {choices.years.map((y) => (
                <option value={y} key={y}>
                  {y} season
                </option>
              ))}
            </select>
          </label>
          <label>
            Class
            <select
              value={division}
              onChange={(e) => {
                setDivision(e.target.value);
                setLimit(20);
              }}
            >
              <option value="all">All classes</option>
              {choices.classes.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
      {error && (
        <div className="athlete-data-error" role="alert">
          {error}{" "}
          <button type="button" onClick={onRetry}>
            Try again
          </button>
        </div>
      )}
      <div className="athlete-performance-columns">
        <main className="athlete-performance-main">
          {(tab === "overview" || tab === "stats") && (
            <>
              <section className="athlete-panel">
                <header className="athlete-panel-heading">
                  <div>
                    <h2>Season snapshot</h2>
                    <p>
                      {loading
                        ? "Loading race history…"
                        : `${stats.starts} overall starts · ${stats.classified} classified finishes`}
                    </p>
                  </div>
                </header>
                <div className="athlete-snapshot-grid">
                  {snapshot.map(([label, value]) => (
                    <div key={label}>
                      <span>{label}</span>
                      <strong>
                        {hasData
                          ? displayMetric(
                              value,
                              label === "Average finish" ? 1 : 0,
                            )
                          : "—"}
                      </strong>
                    </div>
                  ))}
                </div>
                <div className="athlete-rate-grid">
                  {[
                    ["Win rate", stats.winRate],
                    ["Podium rate", stats.podiumRate],
                    ["Completion rate", stats.completionRate],
                  ].map(([label, value]) => (
                    <div key={String(label)}>
                      <strong>
                        {hasData
                          ? displayMetric(value as number | null, 1, "%")
                          : "—"}
                      </strong>
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
              </section>
              {hasData && <PerformanceChart rows={analysis.overall} />}
              <section className="athlete-panel">
                <h2>Race analysis</h2>
                <dl className="athlete-analysis-grid">
                  {[
                    ["Best finish", displayMetric(stats.bestFinish, 0)],
                    ["Finish variation", displayMetric(stats.finishDeviation)],
                    [
                      "Recent average (up to 5)",
                      displayMetric(stats.recentAverage),
                    ],
                    ["Moto wins", String(analysis.motoStats.wins)],
                    [
                      "Moto win rate",
                      displayMetric(analysis.motoStats.winRate, 1, "%"),
                    ],
                    [
                      "DNF / DNS / DSQ",
                      `${stats.dnf} / ${stats.dns} / ${stats.dsq}`,
                    ],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <dt>{label}</dt>
                      <dd>{hasData ? value : "—"}</dd>
                    </div>
                  ))}
                </dl>
                <p className="athlete-trend-summary">
                  {hasData && stats.finishImprovement !== null
                    ? `${Math.abs(stats.finishImprovement).toFixed(1)} places ${stats.finishImprovement > 0 ? "better" : stats.finishImprovement < 0 ? "worse" : "changed"} in the last 5 finishes versus the previous 5.`
                    : "Ten classified finishes are needed to compare the last 5 with the previous 5."}
                </p>
                <details className="athlete-chart-data">
                  <summary>How these numbers are calculated</summary>
                  <p>
                    Season uses the event start year in UTC. Overall and moto
                    records stay separate. Win and podium rates use known
                    starts; DNS and unknown statuses are excluded. Completion
                    rate is finished results divided by starts. Average, best
                    and variation use positive classified finishes only;
                    variation is their population standard deviation, with lower
                    values indicating more consistent positions. It does not
                    adjust for field size or class difficulty.
                  </p>
                  <p>
                    Recorded points sum stored overall class points, including
                    recorded penalties. {stats.pointsRecorded} of{" "}
                    {stats.records} overall records have points. Missing values
                    remain unavailable. {analysis.undated} undated records are
                    included only in All time and excluded from charts.
                  </p>
                </details>
              </section>
            </>
          )}
          {(tab === "overview" || tab === "results") &&
            results(tab === "results")}
          {tab === "stats" && (
            <section className="athlete-panel">
              <h2>Class breakdown</h2>
              {!analysis.classes.length ? (
                <p className="athlete-empty">No overall class results.</p>
              ) : (
                <div className="athlete-class-cards">
                  {analysis.classes.map((c) => (
                    <div key={c.key}>
                      <h3>{c.label}</h3>
                      <p>
                        {c.starts} starts · {c.wins} wins · {c.podiums} podiums
                      </p>
                      <p>
                        Average finish {displayMetric(c.averageFinish)} ·{" "}
                        {displayMetric(c.totalPoints, 0)} recorded points
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
          {(tab === "overview" || tab === "posts") && racer.athleteId && (
            <section className="athlete-updates">
              <SocialPostFeed athleteId={racer.athleteId} compose />
            </section>
          )}
          {tab === "gallery" && (
            <>
              {galleryPreview(true)}
              <OrganizationPhotoGallery
                athleteId={racer.athleteId}
                canRemoveTag={isOwner}
              />
            </>
          )}
        </main>
        <aside className="athlete-performance-sidebar">
          <section className="athlete-panel">
            <h2>About {racer.racerName.split(" ")[0] || "the athlete"}</h2>
            <p className="athlete-bio">
              {racer.bio || "No biography shared yet."}
            </p>
            <dl className="athlete-bio-facts">
              <div>
                <dt>Location</dt>
                <dd>
                  {racer.location ||
                    [racer.city, racer.stateCode, racer.countryCode]
                      .filter(Boolean)
                      .join(", ") ||
                    "—"}
                </dd>
              </div>
              <div>
                <dt>Age</dt>
                <dd>{ageLabel || "—"}</dd>
              </div>
              <div>
                <dt>Level</dt>
                <dd>{racer.skillLevel || "Amateur"}</dd>
              </div>
              <div>
                <dt>Ride</dt>
                <dd>{racer.boatManufacturers || "—"}</dd>
              </div>
              <div>
                <dt>Height</dt>
                <dd>{heightLabel || "—"}</dd>
              </div>
              <div>
                <dt>National rank</dt>
                <dd>
                  {rating?.nationalRankingPosition
                    ? `#${rating.nationalRankingPosition}`
                    : "—"}
                </dd>
              </div>
              <div>
                <dt>Organization rank</dt>
                <dd>
                  {rating?.organizationRankingPosition
                    ? `#${rating.organizationRankingPosition}`
                    : "—"}
                </dd>
              </div>
            </dl>
            {rating?.computedAt && (
              <p className="athlete-method-note">
                Rankings updated{" "}
                {new Date(rating.computedAt).toLocaleDateString()}. Rankings may
                use a different season or class.
              </p>
            )}
          </section>
          <section className="athlete-panel">
            <header className="athlete-panel-heading">
              <h2>World Finals</h2>
              {canEdit && (
                <button type="button" onClick={onWorldFinals}>
                  Edit
                </button>
              )}
            </header>
            <strong>{racer.careerWorldFinalsWins ?? 0}</strong>
            <p>Career wins · profile reported</p>
          </section>
          <section className="athlete-panel">
            <h2>Sponsors</h2>
            {sponsorsLoading ? (
              <p role="status">Loading sponsors…</p>
            ) : !sponsors.length ? (
              <p className="athlete-empty">No sponsors shared yet.</p>
            ) : (
              <div className="athlete-sponsor-list">
                {sponsors.map((s) => {
                  const logo = s.logoUrl || s.logo_url,
                    link = s.websiteUrl || s.website_url;
                  const safe = link && /^https?:\/\//i.test(link) ? link : null;
                  const content = (
                    <>
                      {logo && <img src={logo} alt="" loading="lazy" />}
                      <span>{s.name}</span>
                      {safe && <ExternalLink size={15} aria-hidden="true" />}
                    </>
                  );
                  return safe ? (
                    <a
                      key={s.id}
                      href={safe}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {content}
                    </a>
                  ) : (
                    <div key={s.id}>{content}</div>
                  );
                })}
              </div>
            )}
          </section>
          {tab !== "gallery" && galleryPreview()}
        </aside>
      </div>
    </div>
  );
}
