import { useLocation } from "wouter";
import {
  Activity,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Gauge,
  MapPinned,
  Radio,
  Route,
  Share2,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
  Zap,
} from "lucide-react";

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-[28px] border border-cl-accent/10 bg-cl-surface p-6 shadow-cl-panel">
      <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-cl-accent/10 blur-3xl" />

      <div className="relative">
        <div className="grid h-12 w-12 place-items-center rounded-2xl border border-cl-accent/[0.15] bg-cl-accent/10 text-cl-accent">
          {icon}
        </div>

        <h3 className="mt-5 text-xl font-black text-cl-ink">{title}</h3>

        <p className="mt-3 text-sm leading-7 text-cl-muted">{description}</p>
      </div>
    </div>
  );
}

function StepCard({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[26px] border border-cl-border bg-cl-subtle p-5">
      <div className="grid h-10 w-10 place-items-center rounded-full border border-cl-accent/20 bg-cl-accent/10 text-sm font-black text-cl-accent">
        {number}
      </div>

      <h3 className="mt-5 text-lg font-black text-cl-ink">{title}</h3>

      <p className="mt-2 text-sm leading-7 text-cl-muted">{description}</p>
    </div>
  );
}

function UseCaseCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-[28px] border border-cl-border bg-cl-surface p-6">
      <h3 className="text-xl font-black text-cl-ink">{title}</h3>

      <div className="mt-5 space-y-3">
        {items.map((item) => (
          <div key={item} className="flex gap-3 text-sm text-cl-muted">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-cl-accent" />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function RacePodLandingPage() {
  const [, navigate] = useLocation();

  const betaEmailSubject = encodeURIComponent("RacePod Beta Interest");
  const betaEmailBody = encodeURIComponent(
    [
      "Hey Corner League,",
      "",
      "I am interested in RacePod.",
      "",
      "Name:",
      "Sport:",
      "Racer profile / Instagram:",
      "Individual, team, club, or promoter:",
      "How many devices:",
      "",
      "Thanks!",
    ].join("\n"),
  );

  const betaMailTo = `mailto:jaketylersimon@gmail.com?subject=${betaEmailSubject}&body=${betaEmailBody}`;

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-cl-canvas text-cl-ink">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-cl-canvas" />
        <div className="absolute inset-0 cl-panel-wash" />
        <div className="absolute inset-0 cl-panel-wash" />
        <div className="absolute inset-0 opacity-[0.035] [background-image:linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:72px_72px]" />
      </div>

      <main className="relative z-10 mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[38px] border border-cl-accent/10 cl-panel-wash p-6 shadow-cl-panel sm:p-8 lg:p-10">
          <div className="grid gap-10 lg:grid-cols-[1.04fr_0.96fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-cl-accent/25 bg-cl-accent/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-cl-accent">
                <Sparkles className="h-3.5 w-3.5" />
                Corner League RacePod
              </div>

              <h1 className="mt-6 max-w-4xl text-cl-accent text-4xl font-black uppercase italic tracking-[0.04em] sm:text-6xl lg:text-7xl">
                The Race Replay System for Grassroots Motorsports
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-8 text-cl-muted sm:text-lg">
                RacePod turns every practice session into a pro-level replay.
                Track your route, speed, distance, session history, and
                shareable highlights directly on Corner League.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <a
                  href={betaMailTo}
                  className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-cl-accent px-6 text-sm font-black uppercase tracking-[0.14em] text-cl-contrast transition hover:bg-cl-accent"
                >
                  Join RacePod Beta
                  <ArrowRight className="h-4 w-4" />
                </a>

                <button
                  type="button"
                  onClick={() => navigate("/racepod")}
                  className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl border border-cl-border bg-cl-subtle px-6 text-sm font-black uppercase tracking-[0.14em] text-cl-ink transition hover:bg-cl-subtle hover:text-cl-ink"
                >
                  Owner Dashboard
                </button>
              </div>

              <div className="mt-7 flex flex-wrap gap-2 text-xs text-cl-muted">
                <span className="rounded-full border border-cl-border bg-cl-subtle px-3 py-1.5">
                  GPS route replay
                </span>
                <span className="rounded-full border border-cl-border bg-cl-subtle px-3 py-1.5">
                  Speed analytics
                </span>
                <span className="rounded-full border border-cl-border bg-cl-subtle px-3 py-1.5">
                  Public share links
                </span>
                <span className="rounded-full border border-cl-border bg-cl-subtle px-3 py-1.5">
                  Sponsor-ready proof
                </span>
              </div>
            </div>

            <div className="relative">
              <div className="pointer-events-none absolute -inset-6 rounded-[42px] bg-cl-accent/10 blur-3xl" />

              <div className="relative overflow-hidden rounded-[34px] border border-cl-accent/[0.15] bg-cl-surface p-5 shadow-cl-panel">
                <div className="rounded-[28px] border border-cl-border cl-panel-wash p-5">
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-[0.22em] text-cl-accent">
                        Live Replay Preview
                      </div>
                      <div className="mt-1 text-xl font-black text-cl-ink">
                        Practice Session
                      </div>
                    </div>

                    <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-cl-success">
                      Recorded
                    </div>
                  </div>

                  <div className="relative min-h-[260px] overflow-hidden rounded-[24px] border border-cl-border bg-cl-surface">
                    <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.26)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.26)_1px,transparent_1px)] [background-size:32px_32px]" />

                    <svg
                      viewBox="0 0 600 300"
                      className="absolute inset-0 h-full w-full"
                      role="img"
                      aria-label="RacePod route preview"
                    >
                      <path
                        d="M 68 232 C 132 168, 184 192, 226 128 S 340 62, 404 116 S 484 218, 544 82"
                        fill="none"
                        stroke="rgba(124,244,255,0.96)"
                        strokeWidth="8"
                        strokeLinecap="round"
                      />
                      <path
                        d="M 68 232 C 132 168, 184 192, 226 128 S 340 62, 404 116 S 484 218, 544 82"
                        fill="none"
                        stroke="rgba(255,107,53,0.72)"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                      <circle
                        cx="68"
                        cy="232"
                        r="9"
                        fill="rgba(52,211,153,1)"
                      />
                      <circle
                        cx="544"
                        cy="82"
                        r="9"
                        fill="rgba(255,107,53,1)"
                      />
                    </svg>
                  </div>

                  <div className="mt-5 grid grid-cols-3 gap-3">
                    <div className="rounded-2xl border border-cl-border bg-cl-subtle p-4">
                      <div className="text-[10px] font-black uppercase tracking-[0.16em] text-cl-muted">
                        Max Speed
                      </div>
                      <div className="mt-2 text-2xl font-black text-cl-ink">
                        54.8
                      </div>
                      <div className="text-xs text-cl-muted">mph</div>
                    </div>

                    <div className="rounded-2xl border border-cl-border bg-cl-subtle p-4">
                      <div className="text-[10px] font-black uppercase tracking-[0.16em] text-cl-muted">
                        Distance
                      </div>
                      <div className="mt-2 text-2xl font-black text-cl-ink">
                        4.2
                      </div>
                      <div className="text-xs text-cl-muted">mi</div>
                    </div>

                    <div className="rounded-2xl border border-cl-border bg-cl-subtle p-4">
                      <div className="text-[10px] font-black uppercase tracking-[0.16em] text-cl-muted">
                        Points
                      </div>
                      <div className="mt-2 text-2xl font-black text-cl-ink">
                        288
                      </div>
                      <div className="text-xs text-cl-muted">GPS</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <FeatureCard
            icon={<Route className="h-5 w-5" />}
            title="Route Replay"
            description="Record your line and replay the route after practice, training, or race sessions."
          />

          <FeatureCard
            icon={<Gauge className="h-5 w-5" />}
            title="Speed Tracking"
            description="See max speed, average speed, speed timeline, and key performance moments."
          />

          <FeatureCard
            icon={<Share2 className="h-5 w-5" />}
            title="Shareable Links"
            description="Publish selected sessions and share replay links with fans, teams, and sponsors."
          />

          <FeatureCard
            icon={<BarChart3 className="h-5 w-5" />}
            title="Sponsor Proof"
            description="Turn every session into measurable performance content for sponsor visibility."
          />
        </section>

        <section className="mt-8 rounded-[34px] border border-cl-accent/10 bg-cl-surface p-6 shadow-cl-panel sm:p-8">
          <div className="max-w-3xl">
            <div className="text-[10px] font-black uppercase tracking-[0.22em] text-cl-accent">
              How It Works
            </div>

            <h2 className="mt-3 text-3xl font-black text-cl-ink sm:text-4xl">
              From practice to replay in four steps
            </h2>

            <p className="mt-4 text-sm leading-7 text-cl-muted">
              RacePod is designed to be simple for racers. Activate the device,
              start a session, ride, then view and share the replay.
            </p>
          </div>

          <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StepCard
              number="01"
              title="Activate RacePod"
              description="Link the device to your Corner League account with a simple activation code."
            />

            <StepCard
              number="02"
              title="Start a Session"
              description="Start recording from your RacePod dashboard before practice, testing, or racing."
            />

            <StepCard
              number="03"
              title="Ride or Race"
              description="RacePod records GPS points, speed, route data, and session history."
            />

            <StepCard
              number="04"
              title="View and Share"
              description="Open the replay, review the data, and publish selected sessions publicly."
            />
          </div>
        </section>

        <section className="mt-8 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[34px] border border-cl-accent/10 cl-panel-wash p-6 shadow-cl-panel sm:p-8">
            <div className="text-[10px] font-black uppercase tracking-[0.22em] text-cl-accent">
              Built For Racers
            </div>

            <h2 className="mt-3 text-3xl font-black text-cl-ink sm:text-4xl">
              Make every session count
            </h2>

            <p className="mt-4 text-sm leading-7 text-cl-muted">
              Most grassroots racers finish a session with no real data. RacePod
              gives racers a simple way to understand performance, create better
              content, and show progress over time.
            </p>

            <div className="mt-7 space-y-4">
              <div className="flex gap-3">
                <Trophy className="mt-1 h-5 w-5 shrink-0 text-cl-accent" />
                <div>
                  <div className="font-black text-cl-ink">
                    Better training feedback
                  </div>
                  <div className="mt-1 text-sm leading-6 text-cl-muted">
                    Compare routes, speeds, and session history after each day
                    on the water or track.
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Users className="mt-1 h-5 w-5 shrink-0 text-cl-accent" />
                <div>
                  <div className="font-black text-cl-ink">
                    Better sponsor value
                  </div>
                  <div className="mt-1 text-sm leading-6 text-cl-muted">
                    Give sponsors measurable proof of activity, reach, and
                    performance content.
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-cl-accent" />
                <div>
                  <div className="font-black text-cl-ink">
                    Built for real race days
                  </div>
                  <div className="mt-1 text-sm leading-6 text-cl-muted">
                    Designed around quick sessions, public replays, racer
                    profiles, and event-driven motorsports.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <UseCaseCard
              title="For Racers"
              items={[
                "Track practice and testing sessions",
                "Review speed and route data",
                "Share replays with fans",
                "Build a stronger racer profile",
              ]}
            />

            <UseCaseCard
              title="For Teams"
              items={[
                "Compare multiple racers",
                "Track development over time",
                "Create sponsor-ready recaps",
                "Use data to improve training",
              ]}
            />

            <UseCaseCard
              title="For Clubs"
              items={[
                "Add premium race tech to events",
                "Create more post-event content",
                "Increase racer engagement",
                "Build future live timing features",
              ]}
            />

            <UseCaseCard
              title="For Sponsors"
              items={[
                "See racer activity",
                "Get better performance proof",
                "Create content from real sessions",
                "Measure exposure opportunities",
              ]}
            />
          </div>
        </section>

        <section className="mt-8 overflow-hidden rounded-[34px] border border-cl-accent/20 cl-panel-wash p-6 shadow-cl-panel sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.22em] text-cl-accent">
                Beta Access
              </div>

              <h2 className="mt-3 text-3xl font-black text-cl-ink sm:text-4xl">
                Reserve RacePod for your next season
              </h2>

              <p className="mt-4 max-w-3xl text-sm leading-7 text-cl-muted">
                We are opening early RacePod access for racers, teams, clubs,
                and promoters who want to test replay-based performance tracking
                before public ordering opens.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <a
                href={betaMailTo}
                className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-cl-accent px-6 text-sm font-black uppercase tracking-[0.14em] text-cl-contrast transition hover:bg-cl-accent"
              >
                Reserve RacePod
                <ArrowRight className="h-4 w-4" />
              </a>

              <button
                type="button"
                onClick={() => navigate("/racepod")}
                className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl border border-cl-accent/20 bg-cl-accent/10 px-6 text-sm font-black uppercase tracking-[0.14em] text-cl-accent transition hover:bg-cl-accent hover:text-cl-contrast"
              >
                <Radio className="h-4 w-4" />
                Open Dashboard
              </button>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-[34px] border border-cl-accent/10 bg-cl-surface p-6 shadow-cl-panel sm:p-8">
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.22em] text-cl-accent">
                Coming Next
              </div>

              <h2 className="mt-3 text-2xl font-black text-cl-ink">
                RacePod roadmap
              </h2>
            </div>

            <div className="rounded-[24px] border border-cl-border bg-cl-subtle p-5">
              <Zap className="h-5 w-5 text-cl-accent" />
              <h3 className="mt-4 font-black text-cl-ink">Live sessions</h3>
              <p className="mt-2 text-sm leading-6 text-cl-muted">
                Real-time tracking for events, teams, and race-day operations.
              </p>
            </div>

            <div className="rounded-[24px] border border-cl-border bg-cl-subtle p-5">
              <Activity className="h-5 w-5 text-cl-accent" />
              <h3 className="mt-4 font-black text-cl-ink">
                Advanced analytics
              </h3>
              <p className="mt-2 text-sm leading-6 text-cl-muted">
                Sector comparison, corner analysis, heat maps, and rider
                improvement trends.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
