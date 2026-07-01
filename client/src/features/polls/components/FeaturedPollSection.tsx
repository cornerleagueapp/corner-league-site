import { Link } from "wouter";
import { Trophy } from "lucide-react";
import { useFeaturedPoll } from "../hooks/usePolls";
import { PollCard } from "./PollCard";

interface FeaturedPollSectionProps {
  sourcePage: string;
  userId?: string;
}

export function FeaturedPollSection({
  sourcePage,
  userId,
}: FeaturedPollSectionProps) {
  const { data: featuredPoll, isLoading, error } = useFeaturedPoll();

  if (isLoading) {
    return (
      <section className="py-12">
        <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
          <div className="h-5 w-40 animate-pulse rounded-full bg-white/10" />
          <div className="mt-5 h-10 w-3/4 animate-pulse rounded-xl bg-white/10" />
          <div className="mt-4 h-24 animate-pulse rounded-2xl bg-white/10" />
        </div>
      </section>
    );
  }

  if (error || !featuredPoll?.id || !featuredPoll?.title) {
    return null;
  }

  return (
    <section id="fan-voting" className="py-14">
      <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-300/10 px-3 py-1 text-xs font-black uppercase tracking-[0.22em] text-cyan-200">
            <Trophy size={14} />
            Featured Fan Vote
          </div>

          <h2 className="text-4xl font-black uppercase tracking-tight text-white sm:text-5xl">
            Fan{" "}
            <span className="bg-gradient-to-r from-cyan-300 via-sky-300 to-[#FF6B35] bg-clip-text text-transparent">
              Voting
            </span>
          </h2>

          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/55">
            Vote on racers, brands, events, and community awards. Corner League
            uses fan engagement to power better racing stories, sponsor
            insights, and community recognition.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link href={`/polls/${featuredPoll.id}`}>
            <button className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-cyan-100 transition hover:bg-cyan-300/20">
              Open Poll
            </button>
          </Link>

          <Link href="/polls">
            <button className="rounded-full border border-[#FF6B35]/20 bg-[#FF6B35]/10 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-[#FFB199] transition hover:bg-[#FF6B35]/20">
              View All Polls
            </button>
          </Link>
        </div>
      </div>

      <PollCard poll={featuredPoll} sourcePage={sourcePage} userId={userId} />
    </section>
  );
}
