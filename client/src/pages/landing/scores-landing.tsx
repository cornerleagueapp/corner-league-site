import { useEffect, useState } from "react";
import { trackEvent } from "@/lib/analytics";
import { AnalyticsEvents } from "@/lib/analytics-events";
import { useScoresLandingData } from "@/hooks/useScoresLandingData";
import LeagueTopPerformersSection from "@/components/landing/LeagueTopPerformersSection";
import LatestStoriesSection from "@/components/landing/LatestStoriesSection";
import UpcomingEventsSection from "@/components/landing/UpcomingEventsSection";
import NationwideMap from "@/components/landing/NationwideMap";
import { Link } from "wouter";
import { PageSEO } from "@/seo/usePageSEO";
import PublicTopNav from "@/components/navigation/PublicTopNav";
import SpotifyPodcastSection from "@/components/SpotifyPodcastSection";
import CLLogo from "@assets/corner-league-aqua.png";

function scrollToSection(targetId: string) {
  const el = document.getElementById(targetId);
  if (!el) return;

  const offset = 92;
  const y = el.getBoundingClientRect().top + window.scrollY - offset;

  window.scrollTo({
    top: y,
    behavior: "smooth",
  });
}

export default function ScoresLandingPage() {
  const [selectedOrgId, setSelectedOrgId] = useState<string>("all");
  const [selectedRankingOrgId, setSelectedRankingOrgId] = useState<string>("");

  const {
    organizations,
    allEvents,
    upcomingEvents,
    topPerformersByOrg,
    isLoading,
  } = useScoresLandingData();

  useEffect(() => {
    trackEvent(AnalyticsEvents.SCORES_HOME_VIEWED, {
      sport: "jet_ski",
      organization_count: organizations.length,
      event_count: allEvents.length,
      upcoming_event_count: upcomingEvents.length,
      page_type: "scores_landing",
    });
  }, [organizations.length, allEvents.length, upcomingEvents.length]);

  // const latestStories = stories.slice(0, 4);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#030913] text-white">
      <PageSEO
        title="Corner League Sports | Jet Ski Racing Results, Rankings & Events"
        description="The digital home for jet ski racing: live results, rankings, racer profiles, event coverage, and sponsor-ready data from the Corner League Sports platform."
        canonicalPath="/"
      />

      <PublicTopNav
        activeTab="home"
        selectedSportKey="jet-ski"
        sports={[
          {
            key: "jet-ski",
            label: "Jet Ski",
            href: "/scores/aqua",
            enabled: true,
          },
        ]}
      />

      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.11),transparent_26%),radial-gradient(circle_at_78%_10%,rgba(255,107,53,0.09),transparent_22%),linear-gradient(180deg,#030913_0%,#07111F_48%,#02050A_100%)]" />
        <div className="absolute inset-0 opacity-[0.035] [background-image:linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:72px_72px]" />
      </div>

      <main className="mx-auto max-w-7xl px-3 pb-20 pt-8 sm:px-6 sm:pt-10 lg:px-8">
        <section
          id="home-section"
          className="relative min-w-0 overflow-hidden rounded-[30px] border border-cyan-300/10 bg-[linear-gradient(180deg,rgba(7,17,31,0.94)_0%,rgba(4,10,19,0.98)_100%)] px-4 py-8 shadow-[0_30px_90px_rgba(0,0,0,0.42)] sm:rounded-[38px] sm:px-8 sm:py-12 lg:px-10"
        >
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-24 top-0 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" />
            <div className="absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-[#FF6B35]/10 blur-3xl" />
            <div className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(rgba(255,255,255,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.18)_1px,transparent_1px)] [background-size:72px_72px]" />
          </div>

          <div className="relative grid min-w-0 gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
            <div className="min-w-0">
              <div className="mb-5 flex flex-wrap items-center gap-2 sm:gap-3">
                <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-cyan-200 sm:px-4 sm:text-[11px] sm:tracking-[0.24em]">
                  <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(103,232,249,0.95)]" />
                  Corner League Sports
                </div>

                <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-[#FF6B35]/20 bg-[#FF6B35]/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#FFB199] sm:px-4 sm:text-[11px] sm:tracking-[0.24em]">
                  2026 Season
                </div>
              </div>

              <div className="text-xs font-black uppercase tracking-[0.28em] text-cyan-200/65">
                Jet Ski Racing Media + Data Hub
              </div>

              <h1 className="mt-4 max-w-4xl text-[2.8rem] font-black uppercase leading-[0.86] tracking-[-0.065em] text-white min-[380px]:text-5xl sm:text-6xl lg:text-7xl">
                The Digital Home For{" "}
                <span className="bg-[linear-gradient(90deg,#19E3FF_0%,#7CF4FF_35%,#FF7849_100%)] bg-clip-text text-transparent">
                  Jet Ski Racing
                </span>
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
                Live results, rankings, racer profiles, event coverage, and
                sponsor-ready data for the jet ski racing community — all in one
                modern sports hub.
              </p>

              <div className="mt-7 grid grid-cols-1 gap-3 sm:flex sm:flex-wrap">
                <Link href="/welcome">
                  <button
                    type="button"
                    className="w-full rounded-full bg-cyan-300 px-6 py-4 text-xs font-black uppercase tracking-[0.16em] text-[#06111d] shadow-[0_0_28px_rgba(34,211,238,0.25)] transition duration-200 hover:-translate-y-0.5 hover:bg-cyan-200 sm:w-auto sm:tracking-[0.18em]"
                  >
                    Go to Hub
                  </button>
                </Link>

                <button
                  type="button"
                  onClick={() => scrollToSection("partner-with-us")}
                  className="w-full rounded-full border border-[#FF6B35]/20 bg-[#FF6B35]/10 px-6 py-4 text-xs font-black uppercase tracking-[0.16em] text-[#FFB199] transition duration-200 hover:-translate-y-0.5 hover:border-[#FF7849]/40 hover:bg-[#FF6B35]/20 hover:text-white sm:w-auto sm:tracking-[0.18em]"
                >
                  Sponsors Learn More
                </button>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
                  <div className="text-2xl font-black text-white">
                    {organizations.length}
                  </div>
                  <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white/45">
                    Organizations
                  </div>
                </div>

                <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
                  <div className="text-2xl font-black text-white">
                    {allEvents.length}
                  </div>
                  <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white/45">
                    Events Tracked
                  </div>
                </div>

                <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
                  <div className="text-2xl font-black text-white">
                    {upcomingEvents.length}
                  </div>
                  <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white/45">
                    Upcoming
                  </div>
                </div>
              </div>
            </div>

            <div className="relative min-w-0">
              <div className="pointer-events-none absolute -left-2 -top-2 h-16 w-16 border-l-[3px] border-t-[3px] border-cyan-300/70" />
              <div className="pointer-events-none absolute -bottom-2 -right-2 h-16 w-16 border-b-[3px] border-r-[3px] border-[#FF6B35]/70" />

              <div className="relative overflow-hidden rounded-[30px] border border-cyan-300/10 bg-[#06111d] p-3 shadow-[0_28px_80px_rgba(0,0,0,0.45)]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.1),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(255,107,53,0.1),transparent_30%)]" />

                <img
                  src={CLLogo}
                  alt="Corner League Aqua Sports Hub Logo"
                  className="relative aspect-[4/3] w-full rounded-[24px] object-cover"
                  loading="eager"
                />

                <div className="relative mt-3 grid grid-cols-2 gap-3">
                  <div className="rounded-[22px] border border-cyan-300/10 bg-cyan-300/[0.06] p-4">
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200/70">
                      Platform
                    </div>
                    <div className="mt-1 text-sm font-black uppercase tracking-[0.12em] text-white">
                      Results + Rankings
                    </div>
                  </div>

                  <div className="rounded-[22px] border border-[#FF6B35]/15 bg-[#FF6B35]/[0.07] p-4">
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FFB199]/80">
                      For Brands
                    </div>
                    <div className="mt-1 text-sm font-black uppercase tracking-[0.12em] text-white">
                      Sponsor Data
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <NationwideMap events={allEvents} />

        <LeagueTopPerformersSection />

        <SpotifyPodcastSection
          title="Wally's World WaterX Podcast"
          subtitle="Weekly updates from the racing world, featured stories, live interviews with racers, and more."
          showEmbedUrl="https://open.spotify.com/embed/show/0AJKS9cjhpd0DeYULPCsKT?utm_source=generator"
        />

        {/* <LatestStoriesSection stories={latestStories} /> */}

        <UpcomingEventsSection
          organizations={organizations}
          selectedOrgId={selectedOrgId}
          onSelectOrg={setSelectedOrgId}
          events={upcomingEvents}
          isLoading={isLoading}
        />

        <section
          id="sponsors-section"
          className="mt-10 scroll-mt-24 overflow-hidden rounded-[30px] border border-[#FF6B35]/15 bg-[linear-gradient(135deg,rgba(255,107,53,0.12)_0%,rgba(7,17,31,0.96)_42%,rgba(34,211,238,0.09)_100%)] p-5 shadow-[0_28px_80px_rgba(0,0,0,0.36)] sm:p-8"
        >
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#FF6B35]/20 bg-[#FF6B35]/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-[#FFB199]">
                Sponsor Intelligence
              </div>

              <h2 className="max-w-3xl text-3xl font-black uppercase leading-[0.95] tracking-[-0.04em] text-white sm:text-5xl">
                Built To Help Brands Understand The Sport
              </h2>

              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
                Corner League gives sponsors and event partners a clearer view
                of racer visibility, event engagement, audience interest, and
                marketable stories inside jet ski racing.
              </p>
            </div>

            <Link id="partner-with-us" href="/contact" className="scroll-mt-28">
              <button className="w-full rounded-full bg-[#FF6B35] px-6 py-4 text-xs font-black uppercase tracking-[0.18em] text-white transition duration-200 hover:-translate-y-0.5 hover:bg-[#FF7849] sm:w-auto">
                Partner With Us
              </button>
            </Link>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
              <div className="text-sm font-black uppercase tracking-[0.16em] text-white">
                Racer Visibility
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Profile views, rankings movement, fan interest, and athlete
                storylines.
              </p>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
              <div className="text-sm font-black uppercase tracking-[0.16em] text-white">
                Event Reach
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Event page views, schedule engagement, organization traction,
                and results interest.
              </p>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
              <div className="text-sm font-black uppercase tracking-[0.16em] text-white">
                Brand Signals
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Sponsor clicks, fan voting, polls, partner activations, and
                audience insights.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="mt-20 border-t border-cyan-300/10 bg-[#02050A]/70 py-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 text-sm uppercase tracking-[0.18em] text-white/45 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="font-black text-white/70">Corner League Sports</div>

          <div className="flex flex-wrap gap-6">
            <Link className="transition hover:text-cyan-200" href="/contact">
              Contact Us
            </Link>
            <Link className="transition hover:text-cyan-200" href="/terms">
              Terms of Use
            </Link>
            <Link className="transition hover:text-cyan-200" href="/terms">
              Privacy Policy
            </Link>
          </div>

          <div>© 2026 Corner League, Inc.</div>
        </div>
      </footer>
    </div>
  );
}
