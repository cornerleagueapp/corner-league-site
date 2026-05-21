import SpotifyPodcastSection from "@/components/SpotifyPodcastSection";
import { PageSEO } from "@/seo/usePageSEO";

export default function PodcastEpisodesPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#030913] px-3 py-6 text-white sm:px-6 lg:px-8">
      <PageSEO
        title="Podcast Episodes • Corner League Sports"
        description="Listen to Wally's World WaterX Podcast episodes and racing updates."
        canonicalPath="/podcast-episodes"
      />

      <div className="mx-auto max-w-7xl">
        <SpotifyPodcastSection
          title="Wally's World WaterX Podcast"
          subtitle="Weekly updates from the racing world, featured stories, live interviews with racers, and more."
          showEmbedUrl="https://open.spotify.com/embed/show/0AJKS9cjhpd0DeYULPCsKT?utm_source=generator"
        />
      </div>
    </div>
  );
}
