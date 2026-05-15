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
    <div className="min-h-screen bg-black text-white">
      <PageSEO
        title="Corner League Scores"
        description="Live scores, rankings, latest stories, and race schedules for Aqua jet ski competition."
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
          {
            key: "supercross",
            label: "Supercross",
            href: "/scores/supercross",
            enabled: false,
          },
          {
            key: "motorcross",
            label: "Motorcross",
            href: "/scores/motorcross",
            enabled: false,
          },
          {
            key: "powerboat",
            label: "Powerboat",
            href: "/scores/powerboat",
            enabled: false,
          },
          { key: "drag", label: "Drag", href: "/scores/drag", enabled: false },
        ]}
      />

      <main className="mx-auto max-w-7xl px-4 pb-20 pt-10 sm:px-6 lg:px-8">
        <section
          id="home-section"
          className="grid gap-8 border-b border-white/10 pb-14 lg:grid-cols-[1.1fr_0.9fr]"
        >
          <div className="flex flex-col justify-center">
            <div className="mb-6 flex items-center gap-4 text-xs uppercase tracking-[0.3em] text-white/40">
              <span className="h-px w-8 bg-white/20" />
              2026 SEASON
            </div>

            <div className="text-sm uppercase tracking-[0.22em] text-[#6B6BFF]">
              Corner League Sports Hub
            </div>

            <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-[0.98] sm:text-5xl lg:text-6xl">
              Welcome to Corner League Aqua
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/65">
              A world wide sports hub dedicated to live scores, rankings, news,
              and more for the jet ski racing community. Dive into the latest
              action from the IJSBA, Pro Watercross, and more, all in one place.
            </p>

            <div className="mt-8">
              <Link href={"/welcome"}>
                <button className="bg-white/10 px-6 py-4 text-sm font-medium text-white hover:bg-white/15">
                  Explore The Hub →
                </button>
              </Link>
            </div>
          </div>

          <div className="relative p-2">
            <div className="pointer-events-none absolute -left-2 -top-2 h-14 w-14 border-l-[3px] border-t-[3px] border-[#3A3AFF]" />
            <div className="pointer-events-none absolute -bottom-2 -right-2 h-14 w-14 border-b-[3px] border-r-[3px] border-[#3A3AFF]" />
            <img
              src={CLLogo}
              alt="Corner League Aqua Sports Hub Logo"
              className="aspect-[4/3] w-full object-cover"
              loading="eager"
            />
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
      </main>

      <footer className="mt-20 border-t border-white/10 py-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 text-sm uppercase tracking-[0.18em] text-white/45 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>Corner League</div>
          <div className="flex flex-wrap gap-6">
            <Link href="/contact">Contact Us</Link>
            <Link href="/terms">Terms of Use</Link>
            <Link href="/terms">Privacy Policy</Link>
          </div>
          <div>© 2026 Corner League, Inc.</div>
        </div>
      </footer>
    </div>
  );
}
