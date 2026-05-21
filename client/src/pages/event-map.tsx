import NationwideMap from "@/components/landing/NationwideMap";
import { useScoresLandingData } from "@/hooks/useScoresLandingData";
import { PageSEO } from "@/seo/usePageSEO";

export default function EventMapPage() {
  const { allEvents } = useScoresLandingData();

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#030913] px-3 py-6 text-white sm:px-6 lg:px-8">
      <PageSEO
        title="Event Map • Corner League Sports"
        description="Explore jet ski racing event coverage across the country."
        canonicalPath="/event-map"
      />

      <div className="mx-auto max-w-7xl">
        <NationwideMap events={allEvents} />
      </div>
    </div>
  );
}
