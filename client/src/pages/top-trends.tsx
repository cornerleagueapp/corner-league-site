import LeagueTopPerformersSection from "@/components/landing/LeagueTopPerformersSection";
import { PageSEO } from "@/seo/usePageSEO";

export default function TopTrendsPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#030913] px-3 py-6 text-white sm:px-6 lg:px-8">
      <PageSEO
        title="Top Trends • Corner League Sports"
        description="View trending racers, rankings, engagement leaderboards, and athlete profile momentum."
        canonicalPath="/top-trends"
      />

      <div className="mx-auto max-w-7xl">
        <LeagueTopPerformersSection />
      </div>
    </div>
  );
}
