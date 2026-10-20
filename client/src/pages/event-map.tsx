import NationwideMap from "@/components/landing/NationwideMap";
import { useScoresLandingData } from "@/hooks/useScoresLandingData";
import { PageSEO } from "@/seo/usePageSEO";

export default function EventMapPage() {
  const { allEvents } = useScoresLandingData();

  return (
    <div className="sports-directory-page relative min-w-0 bg-cl-canvas py-6 text-cl-ink">
      <PageSEO
        title="Event Map • Corner League Sports"
        description="Explore jet ski racing event coverage across the country."
        canonicalPath="/event-map"
      />

      <div className="sports-directory-content w-full">
        <NationwideMap events={allEvents} />
      </div>
    </div>
  );
}
