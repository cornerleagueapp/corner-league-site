import LeagueTopPerformersSection from "@/components/landing/LeagueTopPerformersSection";
import { PageSEO } from "@/seo/usePageSEO";

export default function TopTrendsPage() {
  return (
    <div className="sports-directory-page relative min-w-0 bg-cl-canvas py-6 text-cl-ink">
      <PageSEO
        title="Top Trends • Corner League Sports"
        description="View trending racers, rankings, engagement leaderboards, and athlete profile momentum."
        canonicalPath="/top-trends"
      />

      <div className="sports-directory-content w-full">
        <LeagueTopPerformersSection />
      </div>
    </div>
  );
}
