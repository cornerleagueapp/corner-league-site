import { useEffect, useState } from "react";
import { Trophy, Timer, RefreshCw } from "lucide-react";
import { ArcadeRun, getArcadeLeaderboard } from "@/services/arcadeService";

function formatTime(ms?: number | null) {
  const value = Math.max(0, Number(ms || 0));
  const totalSeconds = value / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const hundredths = Math.floor((totalSeconds % 1) * 100);

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0",
  )}.${String(hundredths).padStart(2, "0")}`;
}

type Props = {
  courseId?: string | null;
  limit?: number;
};

export default function ArcadeLeaderboard({ courseId, limit = 10 }: Props) {
  const [runs, setRuns] = useState<ArcadeRun[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadLeaderboard = async () => {
    if (!courseId) return;

    try {
      setLoading(true);
      setError(null);

      const data = await getArcadeLeaderboard(courseId, limit);
      setRuns(data);
    } catch (e: any) {
      setError(e?.message || "Failed to load leaderboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaderboard();
  }, [courseId, limit]);

  return (
    <div className="overflow-hidden rounded-[28px] border border-cyan-300/10 bg-[#07111F]/85 text-white shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
      <div className="flex items-center justify-between gap-4 border-b border-cyan-300/10 p-5">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300/70">
            Weekly Challenge
          </div>
          <h2 className="mt-1 text-2xl font-black uppercase tracking-[-0.03em]">
            Leaderboard
          </h2>
        </div>

        <button
          type="button"
          onClick={loadLeaderboard}
          disabled={loading || !courseId}
          className="grid h-11 w-11 place-items-center rounded-2xl border border-cyan-300/15 bg-cyan-300/10 text-cyan-100 transition hover:bg-cyan-300 hover:text-[#06111d] disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Refresh leaderboard"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="p-4">
        {error ? (
          <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        {!error && loading ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-6 text-center text-sm text-white/45">
            Loading leaderboard…
          </div>
        ) : null}

        {!error && !loading && !runs.length ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-8 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-cyan-300/20 bg-cyan-300/10">
              <Trophy className="h-5 w-5 text-cyan-100" />
            </div>

            <div className="mt-4 text-sm font-black uppercase tracking-[0.16em] text-white">
              No runs yet
            </div>

            <div className="mt-2 text-sm leading-6 text-white/45">
              Finish the first race to claim the top spot.
            </div>
          </div>
        ) : null}

        {!error && !loading && runs.length ? (
          <div className="space-y-2">
            {runs.map((run, index) => {
              const rank = index + 1;

              return (
                <div
                  key={run.id}
                  className="grid grid-cols-[44px_1fr_auto] items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3"
                >
                  <div
                    className={`grid h-9 w-9 place-items-center rounded-xl border text-sm font-black ${
                      rank === 1
                        ? "border-yellow-300/30 bg-yellow-300/15 text-yellow-200"
                        : rank === 2
                          ? "border-slate-200/20 bg-slate-200/10 text-slate-100"
                          : rank === 3
                            ? "border-orange-300/25 bg-orange-300/10 text-orange-200"
                            : "border-cyan-300/15 bg-cyan-300/10 text-cyan-100"
                    }`}
                  >
                    {rank}
                  </div>

                  <div className="min-w-0">
                    <div className="truncate text-sm font-black uppercase tracking-[0.04em] text-white">
                      {run.displayName || "Arcade Racer"}
                    </div>

                    <div className="mt-1 text-xs text-white/35">
                      {run.penalties || 0} penalties · {run.lapsCompleted || 0}{" "}
                      laps
                    </div>
                  </div>

                  <div className="flex items-center gap-2 font-mono text-sm font-black text-cyan-100">
                    <Timer className="h-4 w-4 text-cyan-300/70" />
                    {formatTime(run.timeMs)}
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}
