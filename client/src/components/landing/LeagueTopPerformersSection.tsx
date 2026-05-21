import { useState } from "react";
import { Link } from "wouter";
import {
  useEngagementLeaderboards,
  useIhraSkiGpLeaderboard,
  useTrendingRacers,
} from "@/hooks/useScoresLandingData";

export default function LeagueTopPerformersSection() {
  const { rows, isLoading } = useIhraSkiGpLeaderboard();
  const leader = rows[0];

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
    <section id="rankings-section" className="scroll-mt-24 pt-16">
      <div className="relative overflow-hidden rounded-[30px] border border-cyan-300/10 bg-[linear-gradient(180deg,rgba(7,17,31,0.96)_0%,rgba(4,10,19,0.98)_100%)] px-4 py-8 shadow-[0_30px_90px_rgba(0,0,0,0.38)] sm:rounded-[38px] sm:px-8 sm:py-10">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 top-0 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="absolute -right-24 top-20 h-96 w-96 rounded-full bg-[#FF6B35]/10 blur-3xl" />
          <div className="absolute inset-0 opacity-[0.045] [background-image:linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:72px_72px]" />
        </div>

        <div className="relative">
          <div className="mb-3 flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-cyan-200 sm:px-4 sm:text-[11px] sm:tracking-[0.24em]">
              <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(103,232,249,0.95)]" />
              Stats
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-[#FF6B35]/20 bg-[#FF6B35]/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#FFB199] sm:px-4 sm:text-[11px] sm:tracking-[0.24em]">
              Power Rankings
            </div>
          </div>

          <h2 className="max-w-4xl text-[2.35rem] font-black uppercase leading-[0.9] tracking-[-0.04em] text-white min-[380px]:text-4xl sm:text-5xl lg:text-6xl">
            IHRA
            <span className="bg-[linear-gradient(90deg,#19E3FF_0%,#FF7849_100%)] bg-clip-text text-transparent">
              Ski GP Rankings
            </span>
          </h2>

          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
            Current top performers, athlete profile momentum, and fan engagement
            signals from across the Corner League racing ecosystem.
          </p>

          <div className="mt-10 grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-8">
            <div className="relative overflow-hidden rounded-[30px] border border-cyan-300/10 bg-[linear-gradient(135deg,rgba(25,227,255,0.18)_0%,rgba(7,17,31,0.98)_42%,rgba(255,107,53,0.18)_100%)] px-5 py-10 shadow-[0_24px_70px_rgba(0,0,0,0.36)] sm:px-8 sm:py-12 lg:min-h-[430px]">
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 rounded-full bg-cyan-300/10 blur-3xl" />
                <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,0.22)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.22)_1px,transparent_1px)] [background-size:54px_54px]" />
              </div>

              {leader ? (
                <div className="relative flex h-full flex-col justify-between">
                  <div>
                    <div className="inline-flex rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200">
                      Current Points Leader
                    </div>

                    <div className="mt-6 max-w-full break-words text-4xl font-black uppercase leading-[0.92] tracking-[-0.04em] text-white sm:text-5xl lg:text-6xl">
                      {leader.name}
                    </div>

                    {/* <p className="mt-4 text-sm leading-7 text-slate-300">
                      Leading the IHRA Ski GP standings with the strongest
                      current points profile in the class.
                    </p> */}
                  </div>

                  <div className="mt-8 grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                    <div className="rounded-[24px] border border-white/10 bg-black/25 p-4">
                      <div className="text-2xl font-black text-white">
                        {leader.totalPoints}
                      </div>
                      <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">
                        Points
                      </div>
                    </div>

                    <div className="rounded-[24px] border border-cyan-300/15 bg-cyan-300/[0.08] p-4">
                      <div className="text-2xl font-black text-cyan-200">
                        {Number(leader.overallRating ?? 0).toFixed(1)}
                      </div>
                      <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">
                        Overall
                      </div>
                    </div>

                    <div className="rounded-[24px] border border-[#FF6B35]/15 bg-[#FF6B35]/[0.08] p-4">
                      <div className="text-2xl font-black text-[#FFB199]">
                        {leader.seasonMotoWins}
                      </div>
                      <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">
                        Moto Wins
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative flex h-full min-h-[320px] items-center justify-center text-center text-4xl font-black uppercase text-white sm:text-5xl lg:text-6xl">
                  Coming Soon
                </div>
              )}
            </div>

            <div className="overflow-hidden rounded-[30px] border border-cyan-300/10 bg-[#07111F]/80 shadow-[0_24px_70px_rgba(0,0,0,0.34)]">
              <div className="flex flex-col gap-2 border-b border-white/10 bg-white/[0.03] px-4 py-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-sm font-black uppercase tracking-[0.2em] text-white">
                    Top 5 Standings
                  </div>
                  <div className="mt-1 text-xs text-white/45">
                    IHRA · Ski GP · Season points
                  </div>
                </div>

                <div className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-200">
                  Official Stats
                </div>
              </div>

              <div className="overflow-x-auto [scrollbar-width:thin] [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-cyan-300/20">
                <div className="min-w-[680px]">
                  <div className="grid grid-cols-[70px_minmax(0,1fr)_110px_90px_110px] items-center border-b border-white/10 px-4 py-4 text-xs font-bold uppercase tracking-[0.18em] text-white/45">
                    <div>Rank</div>
                    <div>Racer</div>
                    <div className="text-right">Points</div>
                    <div className="text-right">OVR</div>
                    <div className="text-right">Wins</div>
                  </div>

                  {isLoading ? (
                    <div className="px-4 py-8 text-slate-300">
                      Loading rankings…
                    </div>
                  ) : rows.length === 0 ? (
                    <div className="px-4 py-8 text-slate-300">
                      Rankings will appear once IHRA Ski GP season data is
                      available.
                    </div>
                  ) : (
                    <div>
                      {rows.map((person, idx) => (
                        <div
                          key={`${person.participantId}-${idx}`}
                          className="group grid grid-cols-[70px_minmax(0,1fr)_110px_90px_110px] items-center gap-4 border-b border-white/10 px-4 py-5 transition duration-200 last:border-b-0 hover:bg-cyan-300/[0.035]"
                        >
                          <div className="text-4xl font-black text-white/35 group-hover:text-cyan-200">
                            {String(idx + 1).padStart(2, "0")}
                          </div>

                          <div className="min-w-0 max-w-full">
                            {person.racerHref ? (
                              <Link href={person.racerHref}>
                                <div className="cursor-pointer break-words font-black uppercase tracking-[0.06em] text-white transition hover:text-cyan-300">
                                  {person.name}
                                </div>
                              </Link>
                            ) : (
                              <div className="break-words font-black uppercase tracking-[0.06em] text-white">
                                {person.name}
                              </div>
                            )}

                            <div className="mt-1 text-sm text-white/45">
                              IHRA · Ski GP
                            </div>
                          </div>

                          <div className="text-right text-3xl font-black text-white">
                            {person.totalPoints}
                          </div>

                          <div className="text-right text-xl font-black text-cyan-300">
                            {Number(person.overallRating ?? 0).toFixed(1)}
                          </div>

                          <div className="text-right text-xl font-black text-[#FFB199]">
                            {person.seasonMotoWins}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-14 border-t border-white/10 pt-10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="mb-2 text-xs font-black uppercase tracking-[0.28em] text-cyan-200/55">
                  Nationwide Attention
                </div>

                <h3 className="text-3xl font-black uppercase leading-[0.95] tracking-[-0.03em] text-white sm:text-4xl">
                  Trending
                  <span className="bg-[linear-gradient(90deg,#19E3FF_0%,#FF7849_100%)] bg-clip-text text-transparent">
                    Athlete Profiles
                  </span>
                </h3>

                <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
                  Top athlete profiles by profile views across Corner League
                  Aqua nationwide.
                </p>
              </div>

              <div className="inline-flex w-fit overflow-hidden rounded-full border border-cyan-300/10 bg-white/[0.04] p-1 shadow-[0_18px_45px_rgba(0,0,0,0.22)]">
                <button
                  type="button"
                  onClick={() => setTrendingRange("7d")}
                  className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] transition ${
                    trendingRange === "7d"
                      ? "bg-cyan-300 text-[#06111d] shadow-[0_0_22px_rgba(34,211,238,0.2)]"
                      : "text-white/55 hover:text-white"
                  }`}
                >
                  7D
                </button>

                <button
                  type="button"
                  onClick={() => setTrendingRange("30d")}
                  className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] transition ${
                    trendingRange === "30d"
                      ? "bg-cyan-300 text-[#06111d] shadow-[0_0_22px_rgba(34,211,238,0.2)]"
                      : "text-white/55 hover:text-white"
                  }`}
                >
                  30D
                </button>
              </div>
            </div>

            {trendingLoading ? (
              <div className="mt-8 rounded-[24px] border border-white/10 bg-white/[0.03] px-5 py-8 text-slate-300">
                Loading trending athlete profiles…
              </div>
            ) : trendingRacers.length === 0 ? null : (
              <div className="mt-8 overflow-hidden rounded-[30px] border border-cyan-300/10 bg-[#07111F]/80 shadow-[0_24px_70px_rgba(0,0,0,0.3)]">
                <div className="overflow-x-auto [scrollbar-width:thin] [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-cyan-300/20">
                  <div className="min-w-[620px]">
                    <div className="grid grid-cols-[70px_1fr_140px] items-center border-b border-white/10 px-4 py-4 text-xs font-bold uppercase tracking-[0.18em] text-white/45">
                      <div>Rank</div>
                      <div>Athlete</div>
                      <div className="text-right">Profile Views</div>
                    </div>

                    {trendingRacers.map((racer, idx) => (
                      <div
                        key={`${racer.racerDetailId}-${idx}`}
                        className="group grid grid-cols-[70px_1fr_140px] items-center gap-4 border-b border-white/10 px-4 py-5 transition duration-200 last:border-b-0 hover:bg-cyan-300/[0.035]"
                      >
                        <div className="text-4xl font-black text-white/35 group-hover:text-cyan-200">
                          {String(idx + 1).padStart(2, "0")}
                        </div>

                        <div className="min-w-0 max-w-full">
                          <Link href={racer.racerHref}>
                            <div className="cursor-pointer break-words font-black uppercase tracking-[0.06em] text-white transition hover:text-cyan-300">
                              {racer.racerName}
                            </div>
                          </Link>

                          <div className="mt-1 text-sm text-white/45">
                            Nationwide · Last
                            {trendingRange === "7d" ? "7" : "30"} days
                          </div>
                        </div>

                        <div className="text-right text-3xl font-black text-cyan-300">
                          {racer.views.toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {engagementLoading ? (
              <div className="mt-8 rounded-[24px] border border-white/10 bg-white/[0.03] px-5 py-8 text-slate-300">
                Loading engagement leaderboards…
              </div>
            ) : hasEngagementData ? (
              <div className="mt-10 grid gap-5 lg:grid-cols-3">
                {engagedOrganizations.length > 0 && (
                  <div className="min-w-0 overflow-hidden rounded-[30px] border border-cyan-300/10 bg-[#07111F]/80 p-4 shadow-[0_24px_70px_rgba(0,0,0,0.28)] sm:p-5">
                    <div className="text-xs uppercase tracking-[0.22em] text-cyan-300/70">
                      Organizations
                    </div>
                    <h4 className="mt-2 text-xl font-black uppercase text-white">
                      Most Engaged Orgs
                    </h4>
                    <p className="mt-2 text-xs leading-6 text-white/45">
                      Total organization views, clicks, and schedule opens.
                    </p>
                    <div className="mt-5 space-y-3">
                      {engagedOrganizations.map((org, idx) => (
                        <Link
                          key={org.organizationId}
                          href={org.organizationHref}
                        >
                          <div className="group flex min-w-0 cursor-pointer flex-col items-start gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-4 transition hover:border-cyan-300/30 hover:bg-cyan-300/10 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:py-3">
                            <div className="min-w-0 max-w-full">
                              <div className="text-xs font-black text-white/40">
                                #{idx + 1}
                              </div>
                              <div className="max-w-full break-words font-bold uppercase leading-snug text-white group-hover:text-cyan-300 sm:truncate">
                                {org.organizationName}
                              </div>
                              <div className="mt-1 text-xs text-white/45">
                                Last {trendingRange === "7d" ? "7" : "30"} days
                              </div>
                            </div>
                            <div className="w-full shrink-0 rounded-full border border-cyan-300/10 bg-cyan-300/[0.06] px-3 py-2 text-left text-lg font-black text-cyan-300 sm:w-auto sm:bg-transparent sm:px-0 sm:py-0 sm:text-right sm:text-xl">
                              {org.engagements.toLocaleString()}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {viewedEvents.length > 0 && (
                  <div className="min-w-0 overflow-hidden rounded-[30px] border border-cyan-300/10 bg-[#07111F]/80 p-4 shadow-[0_24px_70px_rgba(0,0,0,0.28)] sm:p-5">
                    <div className="text-xs uppercase tracking-[0.22em] text-cyan-300/70">
                      Events
                    </div>
                    <h4 className="mt-2 text-xl font-black uppercase text-white">
                      Most Viewed Events
                    </h4>
                    <p className="mt-2 text-xs leading-6 text-white/45">
                      Total event detail page views.
                    </p>
                    <div className="mt-5 space-y-3">
                      {viewedEvents.map((event, idx) => (
                        <Link key={event.eventId} href={event.eventHref}>
                          <div className="group flex min-w-0 cursor-pointer flex-col items-start gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-4 transition hover:border-cyan-300/30 hover:bg-cyan-300/10 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:py-3">
                            <div className="min-w-0 max-w-full">
                              <div className="text-xs font-black text-white/40">
                                #{idx + 1}
                              </div>
                              <div className="max-w-full break-words font-bold uppercase leading-snug text-white group-hover:text-cyan-300 sm:truncate">
                                {event.eventName}
                              </div>
                              {event.organizationName ? (
                                <div className="max-w-full break-words text-xs leading-5 text-white/45 sm:truncate">
                                  {event.organizationName}
                                </div>
                              ) : (
                                <div className="mt-1 text-xs text-white/45">
                                  Last {trendingRange === "7d" ? "7" : "30"}
                                  days
                                </div>
                              )}
                            </div>
                            <div className="w-full shrink-0 rounded-full border border-cyan-300/10 bg-cyan-300/[0.06] px-3 py-2 text-left text-lg font-black text-cyan-300 sm:w-auto sm:bg-transparent sm:px-0 sm:py-0 sm:text-right sm:text-xl">
                              {event.views.toLocaleString()}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {viewedDivisions.length > 0 && (
                  <div className="min-w-0 overflow-hidden rounded-[30px] border border-cyan-300/10 bg-[#07111F]/80 p-4 shadow-[0_24px_70px_rgba(0,0,0,0.28)] sm:p-5">
                    <div className="text-xs uppercase tracking-[0.22em] text-cyan-300/70">
                      Classes
                    </div>
                    <h4 className="mt-2 text-xl font-black uppercase text-white">
                      Most Viewed Classes
                    </h4>
                    <p className="mt-2 text-xs leading-6 text-white/45">
                      Total class/result views.
                    </p>
                    <div className="mt-5 space-y-3">
                      {viewedDivisions.map((division, idx) => {
                        const content = (
                          <div className="group flex min-w-0 cursor-pointer flex-col items-start gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-4 transition hover:border-cyan-300/30 hover:bg-cyan-300/10 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:py-3">
                            <div className="min-w-0 max-w-full">
                              <div className="text-xs font-black text-white/40">
                                #{idx + 1}
                              </div>
                              <div className="max-w-full break-words font-bold uppercase leading-snug text-white group-hover:text-cyan-300 sm:truncate">
                                {division.divisionName}
                              </div>
                              {division.eventName ? (
                                <div className="max-w-full break-words text-xs leading-5 text-white/45 sm:truncate">
                                  {division.eventName}
                                </div>
                              ) : (
                                <div className="mt-1 text-xs text-white/45">
                                  Last {trendingRange === "7d" ? "7" : "30"}
                                  days
                                </div>
                              )}
                            </div>
                            <div className="w-full shrink-0 rounded-full border border-cyan-300/10 bg-cyan-300/[0.06] px-3 py-2 text-left text-lg font-black text-cyan-300 sm:w-auto sm:bg-transparent sm:px-0 sm:py-0 sm:text-right sm:text-xl">
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
