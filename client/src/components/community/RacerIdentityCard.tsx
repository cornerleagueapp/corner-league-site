import { Link } from "wouter";
import { ShieldCheck, Trophy, ArrowUpRight } from "lucide-react";
import type { PublicAthlete } from "@/lib/communityApi";

export default function RacerIdentityCard({
  profile,
  isOwn,
}: {
  profile: PublicAthlete | null;
  isOwn: boolean;
}) {
  if (!profile && !isOwn) return null;
  return (
    <section className="rounded-3xl border border-cyan-300/20 bg-cyan-300/[0.06] p-5">
      <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-cyan-200">
        <Trophy className="h-4 w-4" /> Athlete identity
      </div>
      {profile ? (
        <>
          <p className="break-words text-lg font-bold text-white">
            {profile.name}
          </p>
          <p className="mt-1 text-sm text-white/60">
            {profile.sportKey === "jet-ski" ? "Jet Ski racer" : "Athlete"}
          </p>
          {profile.isVerifiedAthlete && (
            <p className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-emerald-200">
              <ShieldCheck className="h-4 w-4" />
              Verified athlete
            </p>
          )}
          {profile.profileUrl ? (
            <Link
              href={profile.profileUrl}
              className="mt-4 flex min-h-11 items-center justify-between rounded-xl border border-white/10 px-3 py-2 text-sm font-bold text-cyan-100"
            >
              View racer profile
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          ) : (
            <p className="mt-3 text-sm text-white/60">
              Racer page unavailable.
            </p>
          )}
        </>
      ) : (
        <>
          <p className="text-sm leading-relaxed text-white/65">
            Link your racing identity and keep your results connected to your
            account.
          </p>
          <Link
            href="/create-racer-profile"
            className="mt-4 inline-flex min-h-11 items-center text-sm font-bold text-cyan-100"
          >
            Create or claim your racer profile{" "}
            <ArrowUpRight className="ml-2 h-4 w-4" />
          </Link>
        </>
      )}
    </section>
  );
}
