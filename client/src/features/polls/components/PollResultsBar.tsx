import type { PollResultOption } from "../types/poll.types";

interface PollResultsBarProps {
  option: PollResultOption;
  isSelected?: boolean;
}

export function PollResultsBar({ option, isSelected }: PollResultsBarProps) {
  return (
    <div className="rounded-2xl border border-cl-border bg-cl-subtle p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {isSelected ? (
            <span className="rounded-full bg-cl-accent/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.18em] text-cl-accent">
              Your Vote
            </span>
          ) : null}

          <p className="truncate text-sm font-black uppercase tracking-wide text-cl-ink">
            {option.label}
          </p>
        </div>

        <div className="shrink-0 text-sm font-black text-cl-ink">
          {option.percentage}%
        </div>
      </div>

      <div className="cl-dark h-3 overflow-hidden rounded-full bg-black/60 ring-1 ring-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cl-accent via-cl-accent to-cl-accent"
          style={{
            width: `${option.percentage}%`,
          }}
        />
      </div>

      <div className="mt-2 text-xs text-cl-muted">
        {option.votes.toLocaleString()} vote{option.votes === 1 ? "" : "s"}
      </div>
    </div>
  );
}
