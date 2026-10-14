import NewsletterForm from "@/components/marketing/NewsletterForm";
import { useSportSelection } from "@/hooks/useSportSelection";
import SportOrganizationsPage from "@/pages/organizations/sport-organizations";
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
import SpotifyPodcastSection from "@/components/SpotifyPodcastSection";
import CLLogo from "@assets/corner-league-aqua.png";
import { FeaturedPollSection } from "@/features/polls/components/FeaturedPollSection";
import RacePodSection from "@/components/landing/RacePodSection";
import FeaturedRacerGallerySection from "@/components/FeaturedRacerGallerySection";

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
  const { sportKey, isJetSki, isLoading } = useSportSelection();
  if (isLoading)
    return (
      <p role="status" className="p-8 text-cl-muted">
        Loading sports…
      </p>
    );
  return (
    <>
      {isJetSki ? (
        <JetSkiLandingPage />
      ) : (
        <SportOrganizationsPage sportKey={sportKey} />
      )}
      <div className="mx-auto max-w-7xl px-5 pb-10">
        <NewsletterForm />
      </div>
    </>
  );
}
function JetSkiLandingPage() {
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
    <div className="min-h-screen overflow-x-hidden bg-cl-canvas text-cl-ink">
      <PageSEO
        title="Corner League Sports | Jet Ski Racing Results, Rankings & Events"
        description="The digital home for jet ski racing: live results, rankings, racer profiles, event coverage, and sponsor-ready data from the Corner League Sports platform."
        canonicalPath="/"
      />

      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 cl-panel-wash" />
        <div className="absolute inset-0 opacity-[0.035] [background-image:linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:72px_72px]" />
      </div>

      <main className="mx-auto max-w-7xl px-3 pb-20 pt-20 sm:px-6 md:pt-10 lg:px-8">
        <section
          id="home-section"
          className="relative min-w-0 overflow-hidden rounded-[30px] border border-cl-accent/10 cl-panel-wash px-4 py-8 shadow-cl-panel sm:rounded-[38px] sm:px-8 sm:py-12 lg:px-10"
        >
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-24 top-0 h-80 w-80 rounded-full bg-cl-accent/10 blur-3xl" />
            <div className="absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-cl-accent/10 blur-3xl" />
            <div className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(rgba(255,255,255,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.18)_1px,transparent_1px)] [background-size:72px_72px]" />
          </div>

          <div className="relative grid min-w-0 gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
            <div className="min-w-0">
              <div className="mb-5 flex flex-wrap items-center gap-2 sm:gap-3">
                <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-cl-accent/20 bg-cl-accent/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-cl-accent sm:px-4 sm:text-[11px] sm:tracking-[0.24em]">
                  <span className="h-2 w-2 rounded-full bg-cl-accent shadow-cl-panel" />
                  Corner League Sports
                </div>

                <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-cl-accent/20 bg-cl-accent/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-cl-accent sm:px-4 sm:text-[11px] sm:tracking-[0.24em]">
                  2026 Season
                </div>
              </div>

              <div className="text-xs font-black uppercase tracking-[0.28em] text-cl-accent">
                Jet Ski Racing Media + Data Hub
              </div>

              <h1 className="mt-4 max-w-4xl text-[2.8rem] font-black uppercase leading-[0.86] tracking-[-0.065em] text-cl-ink min-[380px]:text-5xl sm:text-6xl lg:text-7xl">
                The Digital Home For{" "}
                <span className="cl-title-accent">Jet Ski Racing</span>
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-8 text-cl-muted sm:text-lg">
                Live results, rankings, racer profiles, event coverage, and
                sponsor-ready data for the jet ski racing community — all in one
                modern sports hub.
              </p>

              <div className="mt-7 grid grid-cols-1 gap-3 sm:flex sm:flex-wrap">
                <Link href="/scores/aqua">
                  {/* <Link href="/welcome"> */}
                  <button
                    type="button"
                    className="w-full rounded-full bg-cl-accent px-6 py-4 text-xs font-black uppercase tracking-[0.16em] text-cl-contrast shadow-cl-panel transition duration-200 hover:-translate-y-0.5 hover:bg-cl-accent sm:w-auto sm:tracking-[0.18em]"
                  >
                    View Racing Hub
                  </button>
                </Link>

                <button
                  type="button"
                  onClick={() => scrollToSection("partner-with-us")}
                  className="w-full rounded-full border border-cl-accent/20 bg-cl-accent/10 px-6 py-4 text-xs font-black uppercase tracking-[0.16em] text-cl-accent transition duration-200 hover:-translate-y-0.5 hover:border-cl-accent/40 hover:bg-cl-accent/20 hover:text-cl-ink sm:w-auto sm:tracking-[0.18em]"
                >
                  Sponsors Learn More
                </button>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <div className="rounded-[24px] border border-cl-border bg-cl-subtle p-4">
                  <div className="text-2xl font-black text-cl-ink">
                    {organizations.length}
                  </div>
                  <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-cl-muted">
                    Organizations
                  </div>
                </div>

                <div className="rounded-[24px] border border-cl-border bg-cl-subtle p-4">
                  <div className="text-2xl font-black text-cl-ink">
                    {allEvents.length}
                  </div>
                  <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-cl-muted">
                    Events Tracked
                  </div>
                </div>

                <div className="rounded-[24px] border border-cl-border bg-cl-subtle p-4">
                  <div className="text-2xl font-black text-cl-ink">
                    {upcomingEvents.length}
                  </div>
                  <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-cl-muted">
                    Upcoming
                  </div>
                </div>
              </div>
            </div>

            <div className="relative min-w-0">
              <div className="pointer-events-none absolute -left-2 -top-2 h-16 w-16 border-l-[3px] border-t-[3px] border-cl-accent/70" />
              <div className="pointer-events-none absolute -bottom-2 -right-2 h-16 w-16 border-b-[3px] border-r-[3px] border-cl-accent/70" />

              <div className="relative overflow-hidden rounded-[30px] border border-cl-accent/10 bg-cl-surface p-3 shadow-cl-panel">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.1),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(255,107,53,0.1),transparent_30%)]" />

                <img
                  src={CLLogo}
                  alt="Corner League Aqua Sports Hub Logo"
                  className="relative aspect-[4/3] w-full rounded-[24px] object-cover"
                  loading="eager"
                />

                <div className="relative mt-3 grid grid-cols-2 gap-3">
                  <div className="rounded-[22px] border border-cl-accent/10 bg-cl-accent/[0.06] p-4">
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-cl-accent">
                      Platform
                    </div>
                    <div className="mt-1 text-sm font-black uppercase tracking-[0.12em] text-cl-ink">
                      Results + Rankings
                    </div>
                  </div>

                  <div className="rounded-[22px] border border-cl-accent/15 bg-cl-accent/[0.07] p-4">
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-cl-accent">
                      For Brands
                    </div>
                    <div className="mt-1 text-sm font-black uppercase tracking-[0.12em] text-cl-ink">
                      Sponsor Data
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <FeaturedPollSection sourcePage="landing_page" />

        <LeagueTopPerformersSection />

        <FeaturedRacerGallerySection sourcePage="landing_page" limit={7} />

        <RacePodSection />

        <NationwideMap events={allEvents} />

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
          className="mt-10 scroll-mt-24 overflow-hidden rounded-[30px] border border-cl-accent/15 cl-panel-wash p-5 shadow-cl-panel sm:p-8"
        >
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cl-accent/20 bg-cl-accent/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-cl-accent">
                Sponsor Intelligence
              </div>

              <h2 className="max-w-3xl text-3xl font-black uppercase leading-[0.95] tracking-[-0.04em] text-cl-ink sm:text-5xl">
                Built To Help Brands Understand The Sport
              </h2>

              <p className="mt-4 max-w-3xl text-sm leading-7 text-cl-muted sm:text-base">
                Corner League gives sponsors and event partners a clearer view
                of racer visibility, event engagement, audience interest, and
                marketable stories inside jet ski racing.
              </p>
            </div>

            <Link id="partner-with-us" href="/contact" className="scroll-mt-28">
              <button className="w-full rounded-full bg-cl-accent px-6 py-4 text-xs font-black uppercase tracking-[0.18em] text-cl-contrast transition duration-200 hover:-translate-y-0.5 hover:bg-cl-accent sm:w-auto">
                Partner With Us
              </button>
            </Link>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            <div className="rounded-[24px] border border-cl-border bg-cl-subtle p-5">
              <div className="text-sm font-black uppercase tracking-[0.16em] text-cl-ink">
                Racer Visibility
              </div>
              <p className="mt-3 text-sm leading-7 text-cl-muted">
                Profile views, rankings movement, fan interest, and athlete
                storylines.
              </p>
            </div>

            <div className="rounded-[24px] border border-cl-border bg-cl-subtle p-5">
              <div className="text-sm font-black uppercase tracking-[0.16em] text-cl-ink">
                Event Reach
              </div>
              <p className="mt-3 text-sm leading-7 text-cl-muted">
                Event page views, schedule engagement, organization traction,
                and results interest.
              </p>
            </div>

            <div className="rounded-[24px] border border-cl-border bg-cl-subtle p-5">
              <div className="text-sm font-black uppercase tracking-[0.16em] text-cl-ink">
                Brand Signals
              </div>
              <p className="mt-3 text-sm leading-7 text-cl-muted">
                Sponsor clicks, fan voting, polls, partner activations, and
                audience insights.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
