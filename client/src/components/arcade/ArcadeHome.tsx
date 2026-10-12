import type { ArcadeCourse } from "@/services/arcadeService";

type Props = {
  course: ArcadeCourse;
  onPlay: () => void;
};

export default function ArcadeHome({ course, onPlay }: Props) {
  return (
    <div className="min-h-screen bg-cl-canvas px-4 py-6 text-cl-ink sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-48px)] max-w-7xl flex-col justify-center">
        <div className="mb-5 flex flex-col gap-2 text-center">
          <div className="text-[10px] font-black uppercase tracking-[0.28em] text-cl-accent">
            Corner League Arcade
          </div>

          <h1 className="text-3xl font-black uppercase tracking-[-0.04em] text-cl-ink sm:text-5xl">
            Jet Ski Challenge
          </h1>

          <p className="text-sm font-bold uppercase tracking-[0.18em] text-cl-muted">
            Weekly Course: {course.name}
          </p>
        </div>

        <div className="relative mx-auto aspect-video w-full max-w-6xl overflow-hidden rounded-[32px] border-4 border-cl-border bg-cl-canvas shadow-cl-panel">
          <img
            src="/arcade/jetSki/screens/title-screen.png"
            alt="Corner League Arcade Jet Ski Challenge"
            className="absolute inset-0 h-full w-full object-cover"
            draggable={false}
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />

          <div className="absolute inset-0 bg-black/20" />

          {/* Clickable button overlays */}
          <div className="absolute left-[4.8%] top-[50%] z-10 flex w-[30%] flex-col gap-[2.1%]">
            <button
              type="button"
              onClick={onPlay}
              className="group flex h-[78px] items-center gap-4 rounded-[14px] border-[5px] border-cl-border bg-yellow-300 px-8 text-left text-4xl font-black uppercase tracking-[-0.04em] text-cl-ink shadow-cl-panel transition hover:-translate-y-1 hover:bg-yellow-200 hover:shadow-cl-panel active:translate-y-1 active:shadow-cl-panel"
            >
              <span className="text-3xl transition group-hover:translate-x-1">
                ▶
              </span>
              Play
            </button>

            <button
              type="button"
              disabled
              className="flex h-[54px] cursor-not-allowed items-center gap-3 rounded-[10px] border-[3px] border-cl-accent/70 bg-cl-accent/80 px-7 text-left text-xl font-black uppercase tracking-[0.08em] text-cl-contrast"
            >
              <span>▣</span>
              Weekly Challenge
            </button>

            <button
              type="button"
              disabled
              className="flex h-[54px] cursor-not-allowed items-center gap-3 rounded-[10px] border-[3px] border-cl-accent/70 bg-cl-accent/80 px-7 text-left text-xl font-black uppercase tracking-[0.08em] text-cl-contrast"
            >
              <span>🏆</span>
              Leaderboard
            </button>

            <button
              type="button"
              disabled
              className="flex h-[54px] cursor-not-allowed items-center gap-3 rounded-[10px] border-[3px] border-cl-accent/70 bg-cl-accent/80 px-7 text-left text-xl font-black uppercase tracking-[0.08em] text-cl-contrast"
            >
              <span>?</span>
              How To Play
            </button>
          </div>

          {/* Small real dynamic course badge */}
          <div className="cl-dark absolute bottom-[5.5%] left-1/2 z-10 -translate-x-1/2 rounded-xl border-2 border-cl-accent/30 bg-black/75 px-6 py-3 text-center shadow-cl-panel">
            <div className="text-[10px] font-black uppercase tracking-[0.24em] text-cl-accent">
              Current Course
            </div>
            <div className="mt-1 text-lg font-black uppercase tracking-[0.04em] text-cl-ink">
              {course.name}
            </div>
          </div>

          {/* Fallback content if image is missing */}
          <div className="absolute inset-0 -z-10 flex items-center justify-center cl-panel-wash">
            <div className="text-center">
              <div className="text-[10px] font-black uppercase tracking-[0.32em] text-cl-warning">
                Corner League
              </div>
              <div className="mt-3 text-6xl font-black uppercase text-cl-ink">
                Arcade
              </div>
              <div className="mt-3 text-xl font-black uppercase tracking-[0.25em] text-cl-accent">
                Jet Ski Challenge
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-5 max-w-4xl rounded-[24px] border border-cl-accent/10 bg-cl-surface p-4 text-center text-sm leading-6 text-cl-muted">
          Race around the buoy course, avoid crashes, and post your best time.
          Use arrow keys or WASD to control your jet ski.
        </div>
      </div>
    </div>
  );
}
