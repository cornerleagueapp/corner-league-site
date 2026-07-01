import { useEffect } from "react";
import { BarChart3, Trophy } from "lucide-react";
import { usePollResults } from "../hooks/usePolls";
import type { AdminPollListItem } from "../types/poll.types";

interface PollResultsPanelProps {
  poll: AdminPollListItem | null;
}

export function PollResultsPanel({ poll }: PollResultsPanelProps) {
  const { data, isLoading, refetch } = usePollResults({
    pollId: poll?.id,
    enabled: Boolean(poll?.id),
  });

  useEffect(() => {
    if (poll?.id) {
      void refetch();
    }
  }, [poll?.id, refetch]);

  if (!poll) {
    return (
      <div className="rounded-[28px] border border-white/10 bg-[#07111F]/90 p-6 text-white/55">
        Select a poll to view live results.
      </div>
    );
  }

  const sortedOptions = [...(data?.options ?? [])].sort(
    (a, b) => b.votes - a.votes,
  );

  const leader = sortedOptions[0];

  return (
    <div className="rounded-[28px] border border-cyan-300/10 bg-[#07111F]/90 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.3)]">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200">
            <BarChart3 className="h-3.5 w-3.5" />
            Live Results
          </div>

          <h3 className="text-xl font-black uppercase leading-tight text-white">
            {poll.title}
          </h3>

          <p className="mt-2 text-sm text-white/45">
            {(data?.totalVotes ?? poll.totalVotes).toLocaleString()} total votes
          </p>
        </div>

        {leader ? (
          <div className="rounded-2xl border border-yellow-300/20 bg-yellow-300/10 px-3 py-2 text-right">
            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-yellow-200">
              <Trophy className="h-3.5 w-3.5" />
              Leader
            </div>
            <div className="mt-1 text-sm font-black text-white">
              {leader.label}
            </div>
          </div>
        ) : null}
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-white/50">
          Loading results...
        </div>
      ) : sortedOptions.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-white/50">
          No results yet.
        </div>
      ) : (
        <div className="space-y-3">
          {sortedOptions.map((option) => (
            <div
              key={option.optionId}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
            >
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-black uppercase tracking-wide text-white">
                    {option.label}
                  </div>
                  <div className="mt-1 text-xs text-white/40">
                    {option.votes.toLocaleString()} votes
                  </div>
                </div>

                <div className="text-lg font-black text-white">
                  {option.percentage}%
                </div>
              </div>

              <div className="h-3 overflow-hidden rounded-full bg-black/60">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-sky-400 to-[#FF6B35]"
                  style={{ width: `${option.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
