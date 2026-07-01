import type { PollStatus } from "../types/poll.types";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function PollStatusBadge({ status }: { status: PollStatus }) {
  const label =
    status === "active" ? "Active" : status === "closed" ? "Closed" : "Draft";

  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.16em]",
        status === "active" &&
          "border-emerald-400/25 bg-emerald-400/10 text-emerald-200",
        status === "closed" && "border-white/15 bg-white/[0.05] text-white/60",
        status === "draft" &&
          "border-amber-400/25 bg-amber-400/10 text-amber-200",
      )}
    >
      {label}
    </span>
  );
}
