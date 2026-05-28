import stockAvatar from "@/assets/stockprofilepicture.jpeg";
import type { Racer, RacerRatingCard, RacerSponsor } from "./types";
import { humanizeClassGroupLabel } from "./racerProfileUtils";

function getSkillLevelLabel(skillLevel?: string | null) {
  if (skillLevel === "junior") return "Junior";
  if (skillLevel === "pro") return "Pro";
  return "Amateur";
}

function getLocationLabel(racer: Racer) {
  const r = racer as Racer & {
    city?: string | null;
    stateCode?: string | null;
    countryCode?: string | null;
  };

  return (
    racer.formattedAddress ||
    racer.location ||
    [r.city, r.stateCode, r.countryCode].filter(Boolean).join(", ") ||
    "Location coming soon"
  );
}

function getCompactLocationLabel(racer: Racer) {
  const r = racer as Racer & {
    city?: string | null;
    stateCode?: string | null;
    countryCode?: string | null;
  };

  return (
    [r.city, r.stateCode].filter(Boolean).join(", ") ||
    racer.location ||
    racer.formattedAddress ||
    "Location coming soon"
  );
}

function getResponsiveNameClass(name?: string | null) {
  const len = (name ?? "").trim().length;

  if (len > 24) return "text-[62px] leading-[0.92]";
  if (len > 18) return "text-[76px] leading-[0.92]";
  return "text-[92px] leading-[0.92]";
}

function toDisplayNumber(value?: number | string | null) {
  if (value === null || value === undefined || value === "") return "—";
  const num = Number(value);
  if (!Number.isFinite(num)) return "—";
  return num.toLocaleString();
}

export default function RacerProfileShareCard({
  racer,
  ratingCard,
  profileViewCount,
  sponsors = [],
}: {
  racer: Racer;
  ratingCard: RacerRatingCard | null;
  profileViewCount?: number | null;
  sponsors?: RacerSponsor[];
}) {
  const heroImage = racer.headerImageUrl || racer.racerImage || stockAvatar;
  const profileImage = racer.racerImage || stockAvatar;
  const visibleSponsors = sponsors.filter((s) => s?.name).slice(0, 3);

  const overall = Math.max(
    0,
    Math.min(99, Number(ratingCard?.overallRating ?? 0)),
  );

  const nationalRank = ratingCard?.nationalRankingPosition;
  const orgRank = ratingCard?.organizationRankingPosition;
  const orgLabel =
    ratingCard?.organizationAbbreviation ||
    ratingCard?.organizationName ||
    "Organization";

  const className =
    humanizeClassGroupLabel(
      ratingCard?.classGroupName || ratingCard?.classGroupCode,
    ) || "Ski GP";

  const seasonYear = ratingCard?.seasonYear || new Date().getFullYear();

  return (
    <div
      className="relative overflow-hidden rounded-[36px] border border-cyan-300/20 bg-[#030913] text-white shadow-[0_35px_100px_rgba(0,0,0,0.45)]"
      style={{
        width: 1080,
        height: 1350,
      }}
    >
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt=""
          className="h-full w-full object-cover opacity-90"
          onError={(e) => {
            const img = e.currentTarget;
            if (img.src !== stockAvatar) img.src = stockAvatar;
          }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,9,19,0.10)_0%,rgba(3,9,19,0.46)_34%,rgba(3,9,19,0.94)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,9,19,0.92)_0%,rgba(3,9,19,0.48)_56%,rgba(255,107,53,0.16)_100%)]" />
        <div className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:72px_72px]" />
        <div className="absolute -left-24 top-24 h-80 w-80 rounded-full bg-cyan-300/15 blur-3xl" />
        <div className="absolute -right-16 bottom-24 h-96 w-96 rounded-full bg-[#FF6B35]/10 blur-3xl" />
      </div>

      <div className="relative z-10 flex h-full flex-col justify-between p-14">
        <div>
          <div className="mb-10 flex items-start justify-between gap-8">
            <div className="max-w-[720px]">
              <div className="mb-5 flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center rounded-full border border-cyan-300/25 bg-cyan-300/10 px-5 py-2 text-[18px] font-black uppercase tracking-[0.22em] text-cyan-200">
                  {getSkillLevelLabel(racer.skillLevel)}
                </div>

                {racer.nickname ? (
                  <div className="inline-flex items-center rounded-full border border-[#FF6B35]/25 bg-[#FF6B35]/10 px-5 py-2 text-[18px] font-black uppercase tracking-[0.18em] text-[#FFB199]">
                    “{racer.nickname}”
                  </div>
                ) : null}
              </div>

              <h1
                className={[
                  "bg-[linear-gradient(90deg,#FFFFFF_0%,#7CF4FF_45%,#FF7849_100%)] bg-clip-text font-black uppercase italic tracking-[0.06em] text-transparent",
                  getResponsiveNameClass(racer.racerName),
                ].join(" ")}
              >
                {racer.racerName || "Racer"}
              </h1>

              <div className="mt-5 max-w-[760px] text-[23px] font-semibold uppercase leading-9 tracking-[0.16em] text-white/70">
                {racer.boatManufacturers || "Jet Ski Racer"}
                <span className="mx-3 text-white/25">|</span>
                {getCompactLocationLabel(racer)}
              </div>
            </div>

            <div className="shrink-0">
              <img
                src={profileImage}
                alt=""
                className="h-[220px] w-[220px] rounded-full border border-cyan-300/25 bg-[#050B12] object-cover shadow-[0_0_36px_rgba(34,211,238,0.18)]"
                onError={(e) => {
                  const img = e.currentTarget;
                  if (img.src !== stockAvatar) img.src = stockAvatar;
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-5">
            <div className="rounded-[28px] border border-cyan-300/15 bg-[#07111F]/88 p-6">
              <div className="text-[16px] font-black uppercase tracking-[0.18em] text-white/65">
                {seasonYear} National Rank
              </div>
              <div className="mt-4 text-[72px] font-black text-cyan-300">
                #{nationalRank ?? "—"}
              </div>
              <div className="text-[20px] text-white/60">{className}</div>
            </div>

            <div className="rounded-[28px] border border-cyan-300/15 bg-[#07111F]/88 p-6">
              <div className="text-[16px] font-black uppercase tracking-[0.18em] text-white/65">
                Org Rank
              </div>
              <div className="mt-4 text-[72px] font-black text-white">
                #{orgRank ?? "—"}
              </div>
              <div className="text-[20px] text-white/60">{orgLabel}</div>
            </div>

            <div className="rounded-[28px] border border-cyan-300/15 bg-[linear-gradient(135deg,rgba(34,211,238,0.10)_0%,rgba(7,17,31,0.92)_44%,rgba(255,107,53,0.10)_100%)] p-6">
              <div className="text-[16px] font-black uppercase tracking-[0.18em] text-white/65">
                Overall Rating
              </div>
              <div className="mt-4 text-[72px] font-black text-white">
                {overall > 0 ? overall.toFixed(0) : "—"}
              </div>
              <div className="text-[20px] text-white/60">Season Rating</div>
            </div>
          </div>
        </div>

        <div>
          <div className="grid grid-cols-3 gap-5">
            <div className="rounded-[24px] border border-cyan-300/10 bg-white/[0.04] p-5">
              <div className="text-[14px] font-black uppercase tracking-[0.18em] text-cyan-300/70">
                Page Views
              </div>
              <div className="mt-3 text-[46px] font-black text-white">
                {typeof profileViewCount === "number"
                  ? profileViewCount.toLocaleString()
                  : "—"}
              </div>
            </div>

            <div className="rounded-[24px] border border-cyan-300/10 bg-white/[0.04] p-5">
              <div className="text-[14px] font-black uppercase tracking-[0.18em] text-cyan-300/70">
                Ride
              </div>
              <div className="mt-3 text-[34px] font-semibold text-white">
                {racer.boatManufacturers || "Coming soon"}
              </div>
            </div>

            <div className="rounded-[24px] border border-cyan-300/10 bg-white/[0.04] p-5">
              <div className="text-[14px] font-black uppercase tracking-[0.18em] text-cyan-300/70">
                Hometown
              </div>
              <div className="mt-3 text-[30px] font-semibold leading-tight text-white">
                {getLocationLabel(racer)}
              </div>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-5">
            <div className="rounded-[24px] border border-cyan-300/10 bg-white/[0.04] p-5">
              <div className="text-[14px] font-black uppercase tracking-[0.18em] text-cyan-300/70">
                Moto Wins
              </div>
              <div className="mt-3 text-[46px] font-black text-white">
                {toDisplayNumber(racer.seasonWins)}
              </div>
            </div>

            <div className="rounded-[24px] border border-cyan-300/10 bg-white/[0.04] p-5">
              <div className="text-[14px] font-black uppercase tracking-[0.18em] text-cyan-300/70">
                Podiums
              </div>
              <div className="mt-3 text-[46px] font-black text-white">
                {toDisplayNumber(racer.seasonPodiums)}
              </div>
            </div>

            <div className="rounded-[24px] border border-cyan-300/10 bg-white/[0.04] p-5">
              <div className="text-[14px] font-black uppercase tracking-[0.18em] text-cyan-300/70">
                Sponsors
              </div>

              {visibleSponsors.length > 0 ? (
                <div className="mt-3 space-y-1.5">
                  {visibleSponsors.map((sponsor) => (
                    <div
                      key={sponsor.id}
                      className="truncate text-[24px] font-bold leading-tight text-white"
                    >
                      {sponsor.name}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-3 text-[34px] font-semibold text-white">
                  Coming soon
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 flex items-center justify-between border-t border-cyan-300/10 pt-6">
            <div>
              <div className="text-[18px] font-black uppercase tracking-[0.22em] text-cyan-200">
                Corner League
              </div>
              <div className="mt-1 text-[18px] text-white/55">
                cornerleague.com
              </div>
            </div>

            <div className="text-right">
              <div className="text-[14px] font-black uppercase tracking-[0.18em] text-white/45">
                Share this profile
              </div>
              <div className="mt-1 text-[18px] text-white/55">
                Racer stats • rankings • profile
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
