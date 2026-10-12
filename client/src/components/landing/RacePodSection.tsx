import { Link } from "wouter";
import {
  Activity,
  ArrowRight,
  Gauge,
  MapPinned,
  Radio,
  Route,
  Share2,
  Zap,
} from "lucide-react";

export default function RacePodSection() {
  return (
    <section className="mt-8 overflow-hidden rounded-[30px] border border-cl-accent/10 cl-panel-wash p-5 shadow-cl-panel sm:p-8">
      <div className="grid gap-8 lg:grid-cols-[1fr_420px] lg:items-center">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cl-accent/20 bg-cl-accent/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-cl-accent">
            <Radio className="h-3.5 w-3.5" />
            Introducing RacePod
          </div>

          <h2 className="max-w-4xl text-3xl font-black uppercase leading-[0.95] tracking-[-0.04em] text-cl-ink sm:text-5xl">
            Turn Every Practice Session Into A{" "}
            <span className="cl-title-accent">Pro-Level Replay</span>
          </h2>

          <p className="mt-4 max-w-3xl text-sm leading-7 text-cl-muted sm:text-base">
            RacePod is Corner League’s GPS replay system for racers. Record your
            route, speed, distance, and session history, then publish shareable
            replay highlights to your racer profile.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:max-w-3xl">
            <div className="flex gap-3 rounded-[22px] border border-cl-border bg-cl-subtle p-4">
              <Route className="mt-0.5 h-5 w-5 shrink-0 text-cl-accent" />
              <div>
                <div className="text-sm font-black uppercase tracking-[0.12em] text-cl-ink">
                  Route Replay
                </div>
                <p className="mt-1 text-sm leading-6 text-cl-muted">
                  See your line after each session with GPS route playback.
                </p>
              </div>
            </div>

            <div className="flex gap-3 rounded-[22px] border border-cl-border bg-cl-subtle p-4">
              <Gauge className="mt-0.5 h-5 w-5 shrink-0 text-cl-accent" />
              <div>
                <div className="text-sm font-black uppercase tracking-[0.12em] text-cl-ink">
                  Speed Data
                </div>
                <p className="mt-1 text-sm leading-6 text-cl-muted">
                  Track max speed, average speed, and session performance.
                </p>
              </div>
            </div>

            <div className="flex gap-3 rounded-[22px] border border-cl-border bg-cl-subtle p-4">
              <Share2 className="mt-0.5 h-5 w-5 shrink-0 text-cl-accent" />
              <div>
                <div className="text-sm font-black uppercase tracking-[0.12em] text-cl-ink">
                  Shareable Replays
                </div>
                <p className="mt-1 text-sm leading-6 text-cl-muted">
                  Publish sessions and share replay links with fans or sponsors.
                </p>
              </div>
            </div>

            <div className="flex gap-3 rounded-[22px] border border-cl-border bg-cl-subtle p-4">
              <Activity className="mt-0.5 h-5 w-5 shrink-0 text-cl-accent" />
              <div>
                <div className="text-sm font-black uppercase tracking-[0.12em] text-cl-ink">
                  Racer History
                </div>
                <p className="mt-1 text-sm leading-6 text-cl-muted">
                  Build a performance timeline across practice and race days.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link href="/racepod-info">
              <button
                type="button"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-cl-accent px-6 py-4 text-xs font-black uppercase tracking-[0.18em] text-cl-contrast shadow-cl-panel transition duration-200 hover:-translate-y-0.5 hover:bg-cl-accent sm:w-auto"
              >
                Explore RacePod
                <ArrowRight className="h-4 w-4" />
              </button>
            </Link>

            <Link href="/racepod">
              <button
                type="button"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-cl-accent/20 bg-cl-accent/10 px-6 py-4 text-xs font-black uppercase tracking-[0.18em] text-cl-accent transition duration-200 hover:-translate-y-0.5 hover:border-cl-accent/40 hover:bg-cl-accent/20 hover:text-cl-ink sm:w-auto"
              >
                Open Dashboard
              </button>
            </Link>
          </div>
        </div>

        <div className="relative">
          <div className="pointer-events-none absolute -inset-5 rounded-[36px] bg-cl-accent/10 blur-3xl" />

          <div className="relative overflow-hidden rounded-[30px] border border-cl-accent/15 bg-cl-canvas p-4 shadow-cl-panel">
            <div className="rounded-[26px] border border-cl-border cl-panel-wash p-4">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.22em] text-cl-accent">
                    RacePod Preview
                  </div>
                  <div className="mt-1 text-lg font-black text-cl-ink">
                    Practice Replay
                  </div>
                </div>

                <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-300">
                  GPS
                </div>
              </div>

              <div className="relative min-h-[220px] overflow-hidden rounded-[22px] border border-cl-border bg-cl-subtle">
                <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.26)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.26)_1px,transparent_1px)] [background-size:30px_30px]" />

                <svg
                  viewBox="0 0 600 300"
                  className="absolute inset-0 h-full w-full"
                  role="img"
                  aria-label="RacePod route preview"
                >
                  <path
                    d="M 64 230 C 130 160, 184 196, 230 126 S 344 68, 406 116 S 484 220, 542 80"
                    fill="none"
                    stroke="rgba(124,244,255,0.96)"
                    strokeWidth="8"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 64 230 C 130 160, 184 196, 230 126 S 344 68, 406 116 S 484 220, 542 80"
                    fill="none"
                    stroke="rgba(255,107,53,0.72)"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <circle cx="64" cy="230" r="9" fill="rgba(52,211,153,1)" />
                  <circle cx="542" cy="80" r="9" fill="rgba(255,107,53,1)" />
                </svg>

                <div className="absolute left-4 top-4 rounded-2xl border border-cl-accent/15 bg-cl-surface px-3 py-2">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-cl-accent">
                    <Zap className="h-3.5 w-3.5" />
                    54.8 mph
                  </div>
                </div>

                <div className="absolute bottom-4 right-4 rounded-2xl border border-cl-accent/20 bg-cl-surface px-3 py-2">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-cl-accent">
                    <MapPinned className="h-3.5 w-3.5" />
                    4.2 mi
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="rounded-2xl border border-cl-border bg-cl-subtle p-3">
                  <div className="text-[9px] font-black uppercase tracking-[0.16em] text-cl-muted">
                    Speed
                  </div>
                  <div className="mt-1 text-xl font-black text-cl-ink">
                    54.8
                  </div>
                  <div className="text-[10px] text-cl-muted">mph</div>
                </div>

                <div className="rounded-2xl border border-cl-border bg-cl-subtle p-3">
                  <div className="text-[9px] font-black uppercase tracking-[0.16em] text-cl-muted">
                    Distance
                  </div>
                  <div className="mt-1 text-xl font-black text-cl-ink">4.2</div>
                  <div className="text-[10px] text-cl-muted">mi</div>
                </div>

                <div className="rounded-2xl border border-cl-border bg-cl-subtle p-3">
                  <div className="text-[9px] font-black uppercase tracking-[0.16em] text-cl-muted">
                    Points
                  </div>
                  <div className="mt-1 text-xl font-black text-cl-ink">288</div>
                  <div className="text-[10px] text-cl-muted">GPS</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
