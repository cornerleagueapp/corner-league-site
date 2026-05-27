import { motion } from "framer-motion";
import type { RacerRatingCard } from "./types";
import { humanizeClassGroupLabel } from "./racerProfileUtils";

function RatingMeter({
  label,
  value,
  delay = 0,
}: {
  label: string;
  value?: number | null;
  delay?: number;
}) {
  const safe = Math.max(0, Math.min(99, Number(value ?? 0)));

  return (
    <div className="rounded-[18px] border border-white/10 bg-white/[0.03] p-3">
      <div className="text-[10px] uppercase tracking-[0.18em] text-white/45">
        {label}
      </div>

      <div className="mt-1 text-sm font-semibold text-white">
        {safe.toFixed(1)}
      </div>

      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/[0.06]">
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: safe / 100 }}
          transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
          style={{ originX: 0 }}
          className="h-full w-full rounded-full bg-[linear-gradient(90deg,#67e8f9_0%,#38bdf8_55%,#2563eb_100%)]"
        />
      </div>
    </div>
  );
}

function RankingBadge({
  label,
  rank,
  subtitle,
}: {
  label: string;
  rank?: number | null;
  subtitle?: string | null;
}) {
  if (!rank) return null;

  return (
    <div className="rounded-[18px] border border-cyan-400/15 bg-cyan-400/[0.06] px-3 py-2">
      <div className="text-[10px] uppercase tracking-[0.18em] text-cyan-300/75">
        {label}
      </div>

      <div className="mt-1 text-base font-semibold text-white">#{rank}</div>

      {subtitle ? (
        <div className="mt-0.5 text-[11px] text-white/50">{subtitle}</div>
      ) : null}
    </div>
  );
}

export function RacerRatingHero({
  rating,
}: {
  rating: RacerRatingCard | null;
}) {
  if (!rating) return null;

  const overall = Math.max(0, Math.min(99, Number(rating.overallRating ?? 0)));

  return (
    <div className="mt-6 rounded-[26px] border border-cyan-400/15 bg-[linear-gradient(180deg,rgba(10,26,43,0.88)_0%,rgba(6,19,31,0.96)_100%)] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.22)]">
      <div className="mb-4 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-[0.22em] text-cyan-300/80">
            Corner League Rating
          </div>

          <div className="mt-2 text-2xl font-semibold text-white">
            {humanizeClassGroupLabel(
              rating.classGroupName || rating.classGroupCode,
            ) || "Season Rating"}
          </div>

          <div className="mt-1 text-xs text-white/50">
            {rating.rankingPeriodName || "Current season"}
            {rating.seasonYear ? ` · ${rating.seasonYear}` : ""}
          </div>

          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <RankingBadge
              label="National Rank"
              rank={rating.nationalRankingPosition}
              subtitle={
                humanizeClassGroupLabel(rating.classGroupCode) || "National"
              }
            />

            <RankingBadge
              label="Org Rank"
              rank={rating.organizationRankingPosition}
              subtitle={
                rating.organizationAbbreviation ||
                rating.organizationName ||
                "Organization"
              }
            />
          </div>
        </div>

        <div className="flex w-full items-center justify-center gap-4 lg:w-auto lg:justify-end">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex h-28 w-28 items-center justify-center rounded-full border border-cyan-300/45 bg-[radial-gradient(circle_at_30%_30%,rgba(125,211,252,0.42),rgba(34,211,238,0.20)_38%,rgba(59,130,246,0.25)_68%,rgba(6,17,31,0.96)_100%)] shadow-[0_0_0_1px_rgba(34,211,238,0.20),0_0_32px_rgba(34,211,238,0.40),0_0_84px_rgba(59,130,246,0.28),inset_0_0_42px_rgba(125,211,252,0.18)]"
          >
            <motion.div
              className="absolute inset-[-6px] rounded-full border border-cyan-300/30 shadow-[0_0_34px_rgba(34,211,238,0.28)]"
              animate={{
                opacity: [0.25, 0.65, 0.25],
                scale: [0.98, 1.04, 0.98],
              }}
              transition={{
                duration: 2.4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />

            <div className="relative z-10 text-center">
              <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-300/80">
                OVR
              </div>

              <div className="text-4xl font-black text-white drop-shadow-[0_0_16px_rgba(125,211,252,0.45)]">
                {overall.toFixed(0)}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <RatingMeter label="Speed" value={rating.speedRating} delay={0.02} />
        <RatingMeter
          label="Consistency"
          value={rating.consistencyRating}
          delay={0.06}
        />
        <RatingMeter
          label="Strength"
          value={rating.strengthRating}
          delay={0.1}
        />
        <RatingMeter
          label="Momentum"
          value={rating.momentumRating}
          delay={0.14}
        />
        <RatingMeter
          label="Versatility"
          value={rating.versatilityRating}
          delay={0.18}
        />
        <RatingMeter
          label="Activity"
          value={rating.activityRating}
          delay={0.22}
        />
      </div>
    </div>
  );
}
