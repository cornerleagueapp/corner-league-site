import { Trophy, RotateCcw, Home, Timer, Flag } from "lucide-react";

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
  title?: string;
  timeMs?: number;
  penalties?: number;
  lapsCompleted?: number;
  position?: number;
  totalRacers?: number;
  onRaceAgain?: () => void;
  onMainMenu?: () => void;
};

export default function ArcadeResultsPanel({
  title = "Race Complete",
  timeMs = 0,
  penalties = 0,
  lapsCompleted = 0,
  position,
  totalRacers,
  onRaceAgain,
  onMainMenu,
}: Props) {
  return (
    <div className="overflow-hidden rounded-[32px] border border-cyan-300/10 bg-[#07111F]/90 text-white shadow-[0_30px_90px_rgba(0,0,0,0.42)]">
      <div className="relative p-6 sm:p-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_34%),radial-gradient(circle_at_82%_18%,rgba(255,213,30,0.12),transparent_30%)]" />

        <div className="relative">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl border border-yellow-300/25 bg-yellow-300/15 text-yellow-200">
            <Trophy className="h-8 w-8" />
          </div>

          <div className="mt-5 text-center">
            <div className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-300/70">
              Corner League Arcade
            </div>

            <h2 className="mt-2 text-4xl font-black uppercase tracking-[-0.04em] text-white">
              {title}
            </h2>

            {position && totalRacers ? (
              <div className="mt-2 text-sm font-bold uppercase tracking-[0.16em] text-yellow-200">
                Finished {position} / {totalRacers}
              </div>
            ) : null}
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-white/[0.045] p-5">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-300/70">
                <Timer className="h-4 w-4" />
                Time
              </div>

              <div className="mt-3 font-mono text-3xl font-black text-white">
                {formatTime(timeMs)}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.045] p-5">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-red-200/70">
                <Flag className="h-4 w-4" />
                Penalties
              </div>

              <div className="mt-3 text-3xl font-black text-white">
                {penalties}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.045] p-5">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-yellow-200/70">
                <Flag className="h-4 w-4" />
                Laps
              </div>

              <div className="mt-3 text-3xl font-black text-white">
                {lapsCompleted}
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={onRaceAgain}
              className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl border-4 border-black bg-yellow-300 px-6 text-sm font-black uppercase tracking-[0.16em] text-black shadow-[0_7px_0_#000] transition hover:-translate-y-0.5 hover:shadow-[0_9px_0_#000]"
            >
              <RotateCcw className="h-4 w-4" />
              Race Again
            </button>

            <button
              type="button"
              onClick={onMainMenu}
              className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-6 text-sm font-black uppercase tracking-[0.16em] text-cyan-100 transition hover:bg-cyan-300 hover:text-[#06111d]"
            >
              <Home className="h-4 w-4" />
              Main Menu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
