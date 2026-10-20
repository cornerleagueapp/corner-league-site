import { trackEvent } from "@/lib/analytics";
import { AnalyticsEvents } from "@/lib/analytics-events";
import { useEffect } from "react";
import { useSportSelection } from "@/hooks/useSportSelection";
import { PageSEO } from "@/seo/usePageSEO";
import { sportVisual } from "@/lib/sportVisuals";
import SportHubHero from "@/components/sport-hub/SportHubHero";
import UpcomingSportEvents from "@/components/sport-hub/UpcomingSportEvents";
import OrganizationSpotlight from "@/components/sport-hub/OrganizationSpotlight";
import OrganizationPromoCard from "@/components/OrganizationPromoCard";
import NewsletterForm from "@/components/marketing/NewsletterForm";
import LeagueTopPerformersSection from "@/components/landing/LeagueTopPerformersSection";
import FeaturedRacerGallerySection from "@/components/FeaturedRacerGallerySection";
import { FeaturedPollSection } from "@/features/polls/components/FeaturedPollSection";
import SportCommunitySection from "@/components/sport-hub/SportCommunitySection";
import SpotifyPodcastSection from "@/components/SpotifyPodcastSection";
import NationwideMap from "@/components/landing/NationwideMap";
import { useScoresLandingData } from "@/hooks/useScoresLandingData";
function RacingCoverage() {
  const { allEvents } = useScoresLandingData();
  return (
    <div className="sport-coverage-stack">
      <LeagueTopPerformersSection />
      <FeaturedRacerGallerySection sourcePage="landing_page" limit={4} />
      <FeaturedPollSection sourcePage="landing_page" />
      <NationwideMap events={allEvents} />
      <SpotifyPodcastSection
        title="Wally's World WaterX Podcast"
        subtitle="Stories and interviews from the racing community."
        showEmbedUrl="https://open.spotify.com/embed/show/0AJKS9cjhpd0DeYULPCsKT?utm_source=generator"
      />
    </div>
  );
}
function SportHome({ sport }: { sport: string }) {
  const visual = sportVisual(sport);
  useEffect(() => {
    trackEvent(AnalyticsEvents.SCORES_HOME_VIEWED, {
      sport,
      page_type: "community_hub",
    });
  }, [sport]);
  return (
    <main className="sport-community-home">
      <PageSEO
        title={`${visual.label} community • Corner League`}
        description={`Find ${visual.label.toLowerCase()} events, organizations, and community on Corner League.`}
        canonicalPath="/"
      />
      <SportHubHero sport={sport} />
      <UpcomingSportEvents key={sport} sport={sport} />
      <OrganizationSpotlight sport={sport} />
      {sport === "jet-ski" && <RacingCoverage />}
      <SportCommunitySection sport={sport} />
      <OrganizationPromoCard />
      <NewsletterForm />
    </main>
  );
}
export default function ScoresLandingPage() {
  const { sportKey, isLoading } = useSportSelection();
  if (isLoading)
    return (
      <p role="status" className="sport-hub-empty">
        Loading sports…
      </p>
    );
  return <SportHome key={sportKey} sport={sportKey} />;
}
