import { useState } from "react";
import { Link } from "wouter";
import {
  useEngagementLeaderboards,
  useTrendingRacers,
} from "@/hooks/useScoresLandingData";

export default function LeagueTopPerformersSection() {

  const [trendingRange, setTrendingRange] = useState<"7d" | "30d">("30d");

  const { rows: trendingRacers, isLoading: trendingLoading } =
    useTrendingRacers(trendingRange);

  const {
    organizations: engagedOrganizations,
    events: viewedEvents,
    divisions: viewedDivisions,
    isLoading: engagementLoading,
  } = useEngagementLeaderboards(trendingRange);

  const hasEngagementData =
    engagedOrganizations.length > 0 ||
    viewedEvents.length > 0 ||
    viewedDivisions.length > 0;

  return (
    <section id="rankings-section" className="trending-section scroll-mt-24 pt-6">
      <div className="relative overflow-hidden rounded-[30px] border border-cl-accent/10 cl-panel-wash px-4 py-8 shadow-cl-panel sm:rounded-[38px] sm:px-8 sm:py-10">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 top-0 h-80 w-80 rounded-full bg-cl-accent/10 blur-3xl" />
          <div className="absolute -right-24 top-20 h-96 w-96 rounded-full bg-cl-accent/10 blur-3xl" />
          <div className="absolute inset-0 opacity-[0.045] [background-image:linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:72px_72px]" />
        </div>

        <div className="relative">
          <div className="pt-2">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="mb-2 text-xs font-black uppercase tracking-[0.28em] text-cl-accent">
                  Nationwide Attention
                </div>

                <h3 className="text-3xl font-black uppercase leading-[0.95] tracking-[-0.03em] text-cl-ink sm:text-4xl">
                  Trending
                  <span className="cl-title-accent">Athlete Profiles</span>
                </h3>

                <p className="mt-4 max-w-3xl text-sm leading-7 text-cl-muted sm:text-base">
                  Top athlete profiles by profile views across Corner League
                  Aqua nationwide.
                </p>
              </div>

              <div className="inline-flex w-fit overflow-hidden rounded-full border border-cl-accent/10 bg-cl-subtle p-1 shadow-cl-panel">
                <button
                  type="button"
                  onClick={() => setTrendingRange("7d")}
                  className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] transition ${
                    trendingRange === "7d"
                      ? "bg-cl-accent text-cl-contrast shadow-cl-panel"
                      : "text-cl-muted hover:text-cl-ink"
                  }`}
                >
                  7D
                </button>

                <button
                  type="button"
                  onClick={() => setTrendingRange("30d")}
                  className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] transition ${
                    trendingRange === "30d"
                      ? "bg-cl-accent text-cl-contrast shadow-cl-panel"
                      : "text-cl-muted hover:text-cl-ink"
                  }`}
                >
                  30D
                </button>
              </div>
            </div>

            {trendingLoading ? (
              <div className="mt-8 rounded-[24px] border border-cl-border bg-cl-subtle px-5 py-8 text-cl-muted">
                Loading trending athlete profiles…
              </div>
            ) : trendingRacers.length === 0 ? null : (
              <div className="mt-8 overflow-hidden rounded-[30px] border border-cl-accent/10 bg-cl-surface shadow-cl-panel">
                <div className="overflow-x-auto [scrollbar-width:thin] [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-cl-accent/20">
                  <div className="trending-athletes-table">
                    <div className="grid grid-cols-[70px_1fr_140px] items-center border-b border-cl-border px-4 py-4 text-xs font-bold uppercase tracking-[0.18em] text-cl-muted">
                      <div>Rank</div>
                      <div>Athlete</div>
                      <div className="text-right">Profile Views</div>
                    </div>

                    {trendingRacers.map((racer, idx) => (
                      <div
                        key={`${racer.racerDetailId}-${idx}`}
                        className="group grid grid-cols-[70px_1fr_140px] items-center gap-4 border-b border-cl-border px-4 py-5 transition duration-200 last:border-b-0 hover:bg-cl-accent/[0.035]"
                      >
                        <div className="text-4xl font-black text-cl-muted group-hover:text-cl-accent">
                          {String(idx + 1).padStart(2, "0")}
                        </div>

                        <div className="min-w-0 max-w-full">
                          <Link href={racer.racerHref}>
                            <div className="cursor-pointer break-words font-black uppercase tracking-[0.06em] text-cl-ink transition hover:text-cl-accent">
                              {racer.racerName}
                            </div>
                          </Link>

                          <div className="mt-1 text-sm text-cl-muted">
                            Nationwide · Last{" "}
                            {trendingRange === "7d" ? "7" : "30"} days
                          </div>
                        </div>

                        <div className="text-right text-3xl font-black text-cl-accent">
                          {racer.views.toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {engagementLoading ? (
              <div className="mt-8 rounded-[24px] border border-cl-border bg-cl-subtle px-5 py-8 text-cl-muted">
                Loading engagement leaderboards…
              </div>
            ) : hasEngagementData ? (
              <div className="mt-10 grid gap-5 lg:grid-cols-3">
                {engagedOrganizations.length > 0 && (
                  <div className="min-w-0 overflow-hidden rounded-[30px] border border-cl-accent/10 bg-cl-surface p-4 shadow-cl-panel sm:p-5">
                    <div className="text-xs uppercase tracking-[0.22em] text-cl-accent">
                      Organizations
                    </div>
                    <h4 className="mt-2 text-xl font-black uppercase text-cl-ink">
                      Most Engaged Orgs
                    </h4>
                    <p className="mt-2 text-xs leading-6 text-cl-muted">
                      Total organization views, clicks, and schedule opens.
                    </p>
                    <div className="trending-link-list mt-5">
                      {engagedOrganizations.map((org, idx) => (
                        <Link
                          key={org.organizationId}
                          href={org.organizationHref}
                        >
                          <div className="group flex min-w-0 cursor-pointer flex-col items-start gap-3 rounded-2xl border border-cl-border bg-cl-subtle px-4 py-4 transition hover:border-cl-accent/30 hover:bg-cl-accent/10 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:py-3">
                            <div className="min-w-0 max-w-full">
                              <div className="text-xs font-black text-cl-muted">
                                #{idx + 1}
                              </div>
                              <div className="max-w-full break-words font-bold uppercase leading-snug text-cl-ink group-hover:text-cl-accent ">
                                {org.organizationName}
                              </div>
                              <div className="mt-1 text-xs text-cl-muted">
                                Last {trendingRange === "7d" ? "7" : "30"} days
                              </div>
                            </div>
                            <div className="trending-value">
                              {org.engagements.toLocaleString()}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {viewedEvents.length > 0 && (
                  <div className="min-w-0 overflow-hidden rounded-[30px] border border-cl-accent/10 bg-cl-surface p-4 shadow-cl-panel sm:p-5">
                    <div className="text-xs uppercase tracking-[0.22em] text-cl-accent">
                      Events
                    </div>
                    <h4 className="mt-2 text-xl font-black uppercase text-cl-ink">
                      Most Viewed Events
                    </h4>
                    <p className="mt-2 text-xs leading-6 text-cl-muted">
                      Total event detail page views.
                    </p>
                    <div className="trending-link-list mt-5">
                      {viewedEvents.map((event, idx) => (
                        <Link key={event.eventId} href={event.eventHref}>
                          <div className="group flex min-w-0 cursor-pointer flex-col items-start gap-3 rounded-2xl border border-cl-border bg-cl-subtle px-4 py-4 transition hover:border-cl-accent/30 hover:bg-cl-accent/10 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:py-3">
                            <div className="min-w-0 max-w-full">
                              <div className="text-xs font-black text-cl-muted">
                                #{idx + 1}
                              </div>
                              <div className="max-w-full break-words font-bold uppercase leading-snug text-cl-ink group-hover:text-cl-accent ">
                                {event.eventName}
                              </div>
                              {event.organizationName ? (
                                <div className="max-w-full break-words text-xs leading-5 text-cl-muted ">
                                  {event.organizationName}
                                </div>
                              ) : (
                                <div className="mt-1 text-xs text-cl-muted">
                                  Last {trendingRange === "7d" ? "7" : "30"}
                                  days
                                </div>
                              )}
                            </div>
                            <div className="trending-value">
                              {event.views.toLocaleString()}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {viewedDivisions.length > 0 && (
                  <div className="min-w-0 overflow-hidden rounded-[30px] border border-cl-accent/10 bg-cl-surface p-4 shadow-cl-panel sm:p-5">
                    <div className="text-xs uppercase tracking-[0.22em] text-cl-accent">
                      Classes
                    </div>
                    <h4 className="mt-2 text-xl font-black uppercase text-cl-ink">
                      Most Viewed Classes
                    </h4>
                    <p className="mt-2 text-xs leading-6 text-cl-muted">
                      Total class/result views.
                    </p>
                    <div className="trending-link-list mt-5">
                      {viewedDivisions.map((division, idx) => {
                        const content = (
                          <div className="group flex min-w-0 cursor-pointer flex-col items-start gap-3 rounded-2xl border border-cl-border bg-cl-subtle px-4 py-4 transition hover:border-cl-accent/30 hover:bg-cl-accent/10 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:py-3">
                            <div className="min-w-0 max-w-full">
                              <div className="text-xs font-black text-cl-muted">
                                #{idx + 1}
                              </div>
                              <div className="max-w-full break-words font-bold uppercase leading-snug text-cl-ink group-hover:text-cl-accent ">
                                {division.divisionName}
                              </div>
                              {division.eventName ? (
                                <div className="max-w-full break-words text-xs leading-5 text-cl-muted ">
                                  {division.eventName}
                                </div>
                              ) : (
                                <div className="mt-1 text-xs text-cl-muted">
                                  Last {trendingRange === "7d" ? "7" : "30"}
                                  days
                                </div>
                              )}
                            </div>
                            <div className="trending-value">
                              {division.views.toLocaleString()}
                            </div>
                          </div>
                        );

                        return division.divisionHref ? (
                          <Link
                            key={division.divisionId}
                            href={division.divisionHref}
                          >
                            {content}
                          </Link>
                        ) : (
                          <div key={division.divisionId}>{content}</div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
