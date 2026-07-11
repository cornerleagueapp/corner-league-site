import { Link } from "wouter";
import { ArrowLeft, Vote } from "lucide-react";
import { usePollById } from "@/features/polls/hooks/usePolls";
import { PollCard } from "@/features/polls/components/PollCard";
import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";
import { AnalyticsEvents } from "@/lib/analytics-events";

interface PollDetailsPageProps {
  params: {
    id: string;
  };
}

export default function PollDetailsPage({ params }: PollDetailsPageProps) {
  const pollId = params?.id;
  const { data: poll, isLoading, isError, error } = usePollById(pollId);

  useEffect(() => {
    if (!poll?.id) return;

    trackEvent(AnalyticsEvents.POLL_DETAIL_VIEWED, {
      pollId: poll.id,
      pollTitle: poll.title,
      pollCategory: poll.category,
      votingMode: poll.votingMode,
      status: poll.status,
      sourcePage: "poll_detail_page",
    });
  }, [poll?.id]);

  return (
    <div className="min-h-screen bg-[#030913] text-white">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_28%),radial-gradient(circle_at_82%_18%,rgba(255,107,53,0.08),transparent_24%),linear-gradient(180deg,#030913_0%,#07111F_48%,#02050A_100%)]" />
        <div className="absolute inset-0 opacity-[0.04] [background-image:linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:72px_72px]" />
      </div>

      <main className="relative mx-auto w-full max-w-[1100px] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link href="/polls">
            <button className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-white/70 hover:bg-white/10 hover:text-white">
              <ArrowLeft className="h-4 w-4" />
              Back to Polls
            </button>
          </Link>
        </div>

        {isLoading ? (
          <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-8 text-white/50">
            Loading poll...
          </div>
        ) : isError ? (
          <div className="rounded-[28px] border border-red-400/20 bg-red-500/10 p-8 text-red-100">
            {(error as any)?.message || "Failed to load poll."}
          </div>
        ) : !poll ? (
          <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-8 text-white/50">
            Poll not found.
          </div>
        ) : (
          <>
            {poll.coverImageUrl ? (
              <div className="mb-6 overflow-hidden rounded-[30px] border border-cyan-300/10 bg-[#07111F]/90">
                <img
                  src={poll.coverImageUrl}
                  alt={poll.title}
                  className="h-[280px] w-full object-cover sm:h-[360px]"
                />
              </div>
            ) : (
              <div className="mb-6 flex h-[220px] items-center justify-center rounded-[30px] border border-cyan-300/10 bg-[#07111F]/90 text-cyan-200/40">
                <Vote className="h-16 w-16" />
              </div>
            )}

            <PollCard poll={poll} sourcePage="poll_details_page" />
          </>
        )}
      </main>
    </div>
  );
}
