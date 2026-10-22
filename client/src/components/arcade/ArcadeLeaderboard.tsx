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
    <div className="overflow-hidden rounded-[28px] border border-cl-accent/10 bg-cl-surface text-cl-ink shadow-cl-panel">
      <div className="flex items-center justify-between gap-4 border-b border-cl-accent/10 p-5">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.22em] text-cl-accent">
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
          className="grid h-11 w-11 place-items-center rounded-2xl border border-cl-accent/[0.15] bg-cl-accent/10 text-cl-accent transition hover:bg-cl-accent hover:text-cl-contrast disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Refresh leaderboard"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="p-4">
        {error ? (
          <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-cl-danger">
            {error}
          </div>
        ) : null}

        {!error && loading ? (
          <div className="rounded-2xl border border-cl-border bg-cl-subtle p-6 text-center text-sm text-cl-muted">
            Loading leaderboard…
          </div>
        ) : null}

        {!error && !loading && !runs.length ? (
          <div className="rounded-2xl border border-cl-border bg-cl-subtle p-8 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-cl-accent/20 bg-cl-accent/10">
              <Trophy className="h-5 w-5 text-cl-accent" />
            </div>

            <div className="mt-4 text-sm font-black uppercase tracking-[0.16em] text-cl-ink">
              No runs yet
            </div>

            <div className="mt-2 text-sm leading-6 text-cl-muted">
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
                  className="grid grid-cols-[44px_1fr_auto] items-center gap-3 rounded-2xl border border-cl-border bg-cl-subtle px-4 py-3"
                >
                  <div
                    className={`grid h-9 w-9 place-items-center rounded-xl border text-sm font-black ${
                      rank === 1
                        ? "border-yellow-300/30 bg-yellow-300/15 text-cl-warning"
                        : rank === 2
                          ? "border-cl-border bg-cl-subtle text-cl-muted"
                          : rank === 3
                            ? "border-cl-accent/25 bg-cl-accent/10 text-cl-accent"
                            : "border-cl-accent/[0.15] bg-cl-accent/10 text-cl-accent"
                    }`}
                  >
                    {rank}
                  </div>

                  <div className="min-w-0">
                    <div className="truncate text-sm font-black uppercase tracking-[0.04em] text-cl-ink">
                      {run.displayName || "Arcade Racer"}
                    </div>

                    <div className="mt-1 text-xs text-cl-muted">
                      {run.penalties || 0} penalties · {run.lapsCompleted || 0}{" "}
                      laps
                    </div>
                  </div>

                  <div className="flex items-center gap-2 font-mono text-sm font-black text-cl-accent">
                    <Timer className="h-4 w-4 text-cl-accent" />
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
