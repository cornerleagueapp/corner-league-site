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
        <div className="rounded-[28px] border border-cl-border bg-cl-subtle p-6">
          <div className="h-5 w-40 animate-pulse rounded-full bg-cl-subtle" />
          <div className="mt-5 h-10 w-3/4 animate-pulse rounded-xl bg-cl-subtle" />
          <div className="mt-4 h-24 animate-pulse rounded-2xl bg-cl-subtle" />
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
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-cl-accent/15 bg-cl-accent/10 px-3 py-1 text-xs font-black uppercase tracking-[0.22em] text-cl-accent">
            <Trophy size={14} />
            Featured Fan Vote
          </div>

          <h2 className="text-4xl font-black uppercase tracking-tight text-cl-ink sm:text-5xl">
            Fan{" "}
            <span className="bg-gradient-to-r from-cyan-300 via-sky-300 to-[#FF6B35] bg-clip-text text-transparent">
              Voting
            </span>
          </h2>

          <p className="mt-3 max-w-2xl text-sm leading-7 text-cl-muted">
            Vote on racers, brands, events, and community awards. Corner League
            uses fan engagement to power better racing stories, sponsor
            insights, and community recognition.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link href={`/polls/${featuredPoll.id}`}>
            <button className="rounded-full border border-cl-accent/20 bg-cl-accent/10 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-cl-accent transition hover:bg-cl-accent/20">
              Open Poll
            </button>
          </Link>

          <Link href="/polls">
            <button className="rounded-full border border-cl-accent/20 bg-cl-accent/10 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-cl-accent transition hover:bg-cl-accent/20">
              View All Polls
            </button>
          </Link>
        </div>
      </div>

      <PollCard poll={featuredPoll} sourcePage={sourcePage} userId={userId} />
    </section>
  );
}
