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
    <div className="min-h-screen bg-cl-canvas text-cl-ink">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 cl-panel-wash" />
        <div className="absolute inset-0 opacity-[0.04] [background-image:linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:72px_72px]" />
      </div>

      <main className="relative mx-auto w-full max-w-[1100px] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link href="/polls">
            <button className="inline-flex items-center gap-2 rounded-full border border-cl-border bg-cl-subtle px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-cl-muted hover:bg-cl-subtle hover:text-cl-ink">
              <ArrowLeft className="h-4 w-4" />
              Back to Polls
            </button>
          </Link>
        </div>

        {isLoading ? (
          <div className="rounded-[28px] border border-cl-border bg-cl-subtle p-8 text-cl-muted">
            Loading poll...
          </div>
        ) : isError ? (
          <div className="rounded-[28px] border border-red-400/20 bg-red-500/10 p-8 text-red-100">
            {(error as any)?.message || "Failed to load poll."}
          </div>
        ) : !poll ? (
          <div className="rounded-[28px] border border-cl-border bg-cl-subtle p-8 text-cl-muted">
            Poll not found.
          </div>
        ) : (
          <>
            {poll.coverImageUrl ? (
              <div className="mb-6 overflow-hidden rounded-[30px] border border-cl-accent/10 bg-cl-surface">
                <img
                  src={poll.coverImageUrl}
                  alt={poll.title}
                  className="h-[280px] w-full object-cover sm:h-[360px]"
                />
              </div>
            ) : (
              <div className="mb-6 flex h-[220px] items-center justify-center rounded-[30px] border border-cl-accent/10 bg-cl-surface text-cl-accent">
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
