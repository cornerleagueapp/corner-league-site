import { useState } from "react";
import SocialPostFeed, {
  socialButton,
} from "@/components/community/SocialPosts";
export default function FeedPage() {
  const [feed, setFeed] = useState<"following" | "all">("following");
  return (
    <main className="mx-auto max-w-3xl space-y-6 p-4 py-8 text-white">
      <header>
        <p className="text-xs font-bold uppercase tracking-widest text-cyan-200">
          Corner League community
        </p>
        <h1 className="mt-2 text-3xl font-black">Your feed</h1>
        <p className="mt-2 text-white/55">
          People, athletes, and the stories behind the competition.
        </p>
      </header>
      <div role="tablist" aria-label="Feed selection" className="flex gap-2">
        <button
          role="tab"
          aria-selected={feed === "following"}
          onClick={() => setFeed("following")}
          className={socialButton}
        >
          Following
        </button>
        <button
          role="tab"
          aria-selected={feed === "all"}
          onClick={() => setFeed("all")}
          className={socialButton}
        >
          Discover
        </button>
      </div>
      <SocialPostFeed feed={feed} compose />
    </main>
  );
}
