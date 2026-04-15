import { Link } from "wouter";
import { useIhraSkiGpLeaderboard } from "@/hooks/useScoresLandingData";

export default function LeagueTopPerformersSection() {
  const { rows, isLoading } = useIhraSkiGpLeaderboard();
  const leader = rows[0];

  return (
    <section id="rankings-section" className="pt-16">
      <div className="mb-2 text-xs uppercase tracking-[0.28em] text-white/40">
        Rankings
      </div>

      <h2 className="max-w-4xl text-4xl font-black uppercase leading-[0.95] sm:text-5xl">
        IHRA{" "}
        <span className="inline-block bg-[#ff9c9c]/25 px-2 text-[#ffb3b3]">
          Ski GP Rankings
        </span>
      </h2>

      <p className="mt-4 max-w-3xl text-sm leading-7 text-white/60 sm:text-base">
        Current top 5 in IHRA Ski GP based on season points, with each racer’s
        current overall rating and season moto wins.
      </p>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_1fr] lg:gap-8">
        <div className="overflow-hidden bg-[linear-gradient(135deg,#6753a6_0%,#d6253d_55%,#f0a125_100%)] px-5 py-10 sm:px-8 sm:py-12 lg:min-h-[420px]">
          {leader ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="text-[11px] font-bold uppercase tracking-[0.28em] text-white/75 sm:text-xs">
                Current Points Leader
              </div>

              <div className="mt-5 max-w-full break-words text-4xl font-black uppercase leading-[0.95] text-white sm:text-5xl lg:text-6xl">
                {leader.name}
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <div className="rounded-full bg-black/25 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white sm:px-5 sm:text-sm">
                  {leader.totalPoints} PTS
                </div>

                <div className="rounded-full bg-black/25 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white sm:px-5 sm:text-sm">
                  OVR {Number(leader.overallRating ?? 0).toFixed(1)}
                </div>

                <div className="rounded-full bg-black/25 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white sm:px-5 sm:text-sm">
                  {leader.seasonMotoWins} MOTO WINS
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-center text-4xl font-black uppercase text-white sm:text-5xl lg:text-6xl">
              Coming Soon
            </div>
          )}
        </div>

        <div className="overflow-hidden border border-white/10 bg-white/[0.03]">
          <div className="overflow-x-auto">
            <div className="min-w-[720px]">
              <div className="grid grid-cols-[70px_1fr_110px_90px_110px] items-center border-b border-white/10 px-4 py-4 text-xs font-bold uppercase tracking-[0.18em] text-white/45">
                <div>Rank</div>
                <div>Racer</div>
                <div className="text-right">Points</div>
                <div className="text-right">OVR</div>
                <div className="text-right">Moto Wins</div>
              </div>

              {isLoading ? (
                <div className="px-4 py-8 text-white/60">Loading rankings…</div>
              ) : rows.length === 0 ? (
                <div className="px-4 py-8 text-white/60">
                  Rankings will appear once IHRA Ski GP season data is
                  available.
                </div>
              ) : (
                <div>
                  {rows.map((person, idx) => (
                    <div
                      key={`${person.participantId}-${idx}`}
                      className="grid grid-cols-[70px_1fr_110px_90px_110px] items-center gap-4 border-b border-white/10 px-4 py-5"
                    >
                      <div className="text-4xl font-black text-white/45">
                        {String(idx + 1).padStart(2, "0")}
                      </div>

                      <div className="min-w-0">
                        {person.racerHref ? (
                          <Link href={person.racerHref}>
                            <div className="cursor-pointer break-words font-bold uppercase tracking-[0.06em] text-white hover:text-cyan-300">
                              {person.name}
                            </div>
                          </Link>
                        ) : (
                          <div className="break-words font-bold uppercase tracking-[0.06em] text-white">
                            {person.name}
                          </div>
                        )}

                        <div className="mt-1 text-sm text-white/50">
                          IHRA · Ski GP
                        </div>
                      </div>

                      <div className="text-right text-3xl font-bold text-white">
                        {person.totalPoints}
                      </div>

                      <div className="text-right text-xl font-bold text-cyan-300">
                        {Number(person.overallRating ?? 0).toFixed(1)}
                      </div>

                      <div className="text-right text-xl font-bold text-white">
                        {person.seasonMotoWins}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
