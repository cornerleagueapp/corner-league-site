import type { PollResultOption } from "../types/poll.types";

interface PollResultsBarProps {
  option: PollResultOption;
  isSelected?: boolean;
}

export function PollResultsBar({ option, isSelected }: PollResultsBarProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {isSelected ? (
            <span className="rounded-full bg-[#ff3b6b]/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.18em] text-[#ff7b9a]">
              Your Vote
            </span>
          ) : null}

          <p className="truncate text-sm font-black uppercase tracking-wide text-white">
            {option.label}
          </p>
        </div>

        <div className="shrink-0 text-sm font-black text-white">
          {option.percentage}%
        </div>
      </div>

      <div className="h-3 overflow-hidden rounded-full bg-black/60 ring-1 ring-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#ff2d55] via-[#a855f7] to-[#38bdf8]"
          style={{
            width: `${option.percentage}%`,
          }}
        />
      </div>

      <div className="mt-2 text-xs text-white/45">
        {option.votes.toLocaleString()} vote{option.votes === 1 ? "" : "s"}
      </div>
    </div>
  );
}
