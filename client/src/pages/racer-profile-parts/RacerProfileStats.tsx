import { Trophy } from "lucide-react";

export function PercentStatBox({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-[16px] border border-cyan-400/10 bg-cyan-400/[0.04] px-2 py-3 sm:rounded-[22px] sm:px-4 sm:py-4">
      <div className="text-lg font-semibold text-white sm:text-2xl">
        {value.toFixed(1)}%
      </div>

      <div className="mt-1 text-[9px] uppercase tracking-[0.12em] text-white/50 sm:text-xs sm:tracking-[0.16em]">
        {label}
      </div>
    </div>
  );
}

export function StatBox({
  label,
  value,
  trophy,
}: {
  label: string;
  value: number;
  trophy?: boolean;
}) {
  return (
    <div className="rounded-[16px] border border-white/10 bg-white/[0.04] px-2 py-3 sm:rounded-[22px] sm:px-4 sm:py-4">
      <div className="flex items-center gap-1 text-lg font-semibold text-white sm:gap-2 sm:text-2xl">
        {value}
        {trophy ? (
          <Trophy className="h-4 w-4 text-amber-400 sm:h-5 sm:w-5" />
        ) : null}
      </div>

      <div className="mt-1 text-[9px] uppercase tracking-[0.12em] text-white/50 sm:text-xs sm:tracking-[0.16em]">
        {label}
      </div>
    </div>
  );
}

export function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[20px] border border-white/10 bg-white/[0.03] px-4 py-3">
      <div className="text-lg font-semibold text-white">{value}</div>

      <div className="mt-1 text-xs uppercase tracking-[0.16em] text-white/50">
        {label}
      </div>
    </div>
  );
}
