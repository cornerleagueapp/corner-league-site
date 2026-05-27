import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import stockAvatar from "@/assets/stockprofilepicture.jpeg";
import {
  Camera,
  PencilLine,
  Play,
  Search as SearchIcon,
  Share2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { Racer, RacerRatingCard } from "./types";
import { humanizeClassGroupLabel } from "./racerProfileUtils";

function getSkillLevelLabel(skillLevel?: string | null) {
  if (skillLevel === "junior") return "Junior";
  if (skillLevel === "pro") return "Pro";
  return "Amateur";
}

export function PremiumRacerHero({
  racer,
  ratingCard,
  canEdit,
  canClaim,
  hasPendingClaim,
  hasRejectedClaim,
  socialLinks,
  profileViewCount,
  onEdit,
  onClaim,
  onGallery,
  onSearch,
  onShare,
  onProfileImageClick,
  onClaimedUserClick,
}: {
  racer: Racer;
  ratingCard: RacerRatingCard | null;
  canEdit: boolean;
  canClaim: boolean;
  hasPendingClaim: boolean;
  hasRejectedClaim: boolean;
  socialLinks?: {
    label: string;
    href: string;
    icon: ReactNode;
  }[];
  profileViewCount?: number | null;
  onEdit: () => void;
  onClaim: () => void;
  onGallery: () => void;
  onSearch: () => void;
  onShare: () => void;
  onProfileImageClick: () => void;
  onClaimedUserClick?: () => void;
}) {
  const overall = Math.max(
    0,
    Math.min(99, Number(ratingCard?.overallRating ?? 0)),
  );

  const nationalRank = ratingCard?.nationalRankingPosition;
  const orgRank = ratingCard?.organizationRankingPosition;

  const className =
    humanizeClassGroupLabel(
      ratingCard?.classGroupName || ratingCard?.classGroupCode,
    ) || "Ski GP";

  const orgLabel =
    ratingCard?.organizationAbbreviation ||
    ratingCard?.organizationName ||
    "Org";

  const seasonYear = ratingCard?.seasonYear || new Date().getFullYear();

  const heroImage = racer.headerImageUrl || racer.racerImage || stockAvatar;
  const profileImage = racer.racerImage || stockAvatar;
  const hasSocialLinks = !!socialLinks?.length;

  return (
    <section className="relative -mx-3 overflow-hidden border-b border-cyan-300/10 bg-[#020812] shadow-[0_24px_80px_rgba(0,0,0,0.45)] sm:mx-0 sm:rounded-[38px] sm:border">
      <div className="relative min-h-[600px] sm:min-h-[640px] lg:min-h-[520px]">
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt={racer.racerName}
            className="h-full w-full object-cover opacity-80"
            onError={(e) => {
              const img = e.currentTarget as HTMLImageElement;
              if (img.src !== stockAvatar) img.src = stockAvatar;
            }}
          />

          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,8,18,0.98)_0%,rgba(2,8,18,0.74)_40%,rgba(2,8,18,0.34)_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,8,18,0.05)_0%,rgba(2,8,18,0.72)_68%,#030913_100%)]" />
          <div className="absolute inset-0 opacity-[0.055] [background-image:linear-gradient(rgba(255,255,255,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.18)_1px,transparent_1px)] [background-size:72px_72px]" />
          <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-cyan-300/10 blur-3xl" />
          <div className="absolute -right-24 bottom-8 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
        </div>

        <div className="relative z-10 flex items-center justify-end gap-2 px-4 pt-4 sm:px-7">
          <button
            type="button"
            onClick={onSearch}
            className="grid h-12 w-12 place-items-center rounded-full border border-white/10 bg-black/35 text-white shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-md transition hover:bg-black/55"
            aria-label="Search racers"
          >
            <SearchIcon className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={onShare}
            className="grid h-12 w-12 place-items-center rounded-full border border-white/10 bg-black/35 text-white shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-md transition hover:bg-black/55"
            aria-label="Share racer profile"
          >
            <Share2 className="h-5 w-5" />
          </button>
        </div>

        <div className="relative z-10 px-4 pt-16 sm:px-7 sm:pt-20 lg:pt-24">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
            <div className="grid gap-5 sm:grid-cols-[170px_minmax(0,1fr)] sm:items-start">
              <div className="flex flex-row items-end gap-3 sm:flex-col sm:items-center">
                <button
                  type="button"
                  onClick={onProfileImageClick}
                  className="relative shrink-0 rounded-full border border-cyan-300/25 bg-black/40 p-1 shadow-[0_0_34px_rgba(34,211,238,0.18)]"
                >
                  <img
                    src={profileImage}
                    alt={racer.racerName}
                    className="h-32 w-32 rounded-full bg-black object-cover sm:h-40 sm:w-40"
                    onError={(e) => {
                      const img = e.currentTarget as HTMLImageElement;
                      if (img.src !== stockAvatar) img.src = stockAvatar;
                    }}
                  />
                </button>

                {hasSocialLinks ? (
                  <div className="flex flex-wrap gap-2 sm:justify-center">
                    {socialLinks!.map((link) => (
                      <a
                        key={link.label}
                        href={link.href}
                        target="_blank"
                        rel="noreferrer"
                        className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-black/30 text-white/80 backdrop-blur-md transition hover:border-cyan-300/30 hover:bg-cyan-300/10 hover:text-cyan-100"
                        aria-label={link.label}
                      >
                        {link.icon}
                      </a>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="min-w-0 pt-1">
                <div className="mb-3 inline-flex items-center rounded-full border border-cyan-300/25 bg-cyan-300/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200">
                  {getSkillLevelLabel(racer.skillLevel)}
                </div>

                <h1 className="max-w-[640px] break-words text-4xl font-black uppercase italic leading-[0.95] tracking-[0.08em] text-white sm:text-6xl lg:text-7xl">
                  {racer.racerName || "Racer"}
                </h1>

                {racer.nickname ? (
                  <div className="mt-3 text-sm font-semibold uppercase tracking-[0.18em] text-cyan-200/80">
                    “{racer.nickname}”
                  </div>
                ) : null}

                <div className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
                  {racer.boatManufacturers || "Aqua Racer"}
                </div>

                {racer.isClaimed ? (
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/15 px-3 py-1.5 text-xs text-emerald-200">
                      <ShieldCheck className="h-4 w-4" />
                      Verified Athlete
                    </div>

                    {racer.claimedByUsername ? (
                      <button
                        type="button"
                        onClick={onClaimedUserClick}
                        className="text-left text-[11px] text-white/55 underline underline-offset-2 transition hover:text-white"
                      >
                        Claimed by @{racer.claimedByUsername}
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="rounded-[18px] border border-cyan-300/15 bg-[#06111f]/85 p-5 shadow-[0_0_28px_rgba(34,211,238,0.14)] backdrop-blur-md lg:ml-auto lg:mt-16 lg:w-[300px]">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">
                {seasonYear} Season Ranking
              </div>

              <div className="mt-3 text-6xl font-black text-cyan-300">
                #{nationalRank ?? "—"}
              </div>

              <div className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-white/70">
                {ratingCard?.nationalRankingScore
                  ? `${Number(ratingCard.nationalRankingScore).toFixed(0)} Points`
                  : "Season Points"}
              </div>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-[1fr_auto_auto] gap-3 lg:grid-cols-[220px_66px_66px_minmax(280px,520px)] lg:items-center">
            {canEdit ? (
              <Button
                onClick={onEdit}
                className="h-16 rounded-[16px] bg-indigo-500 text-sm font-black uppercase tracking-[0.08em] text-white hover:bg-indigo-400"
              >
                <PencilLine className="mr-2 h-5 w-5" />
                Edit Profile
              </Button>
            ) : canClaim ? (
              <Button
                onClick={onClaim}
                className="h-16 rounded-[16px] bg-indigo-500 text-sm font-black uppercase tracking-[0.08em] text-white hover:bg-indigo-400"
              >
                <Sparkles className="mr-2 h-5 w-5" />
                {hasRejectedClaim ? "Submit New Claim" : "Claim Profile"}
              </Button>
            ) : hasPendingClaim ? (
              <Button
                disabled
                className="h-16 rounded-[16px] border border-yellow-400/20 bg-yellow-500/20 text-sm font-black uppercase tracking-[0.08em] text-yellow-100"
              >
                Claim Pending
              </Button>
            ) : (
              <div className="hidden lg:block" />
            )}

            <button
              type="button"
              onClick={canEdit ? onEdit : undefined}
              className="grid h-16 w-16 place-items-center rounded-[16px] border border-white/10 bg-black/25 text-white transition hover:border-cyan-300/25 hover:bg-cyan-300/10"
              aria-label="Edit racer photos"
            >
              <Camera className="h-6 w-6" />
            </button>

            <button
              type="button"
              onClick={onGallery}
              className="grid h-16 w-16 place-items-center rounded-[16px] border border-white/10 bg-black/25 text-white transition hover:border-cyan-300/25 hover:bg-cyan-300/10"
              aria-label="Open racer videos"
            >
              <Play className="h-6 w-6" />
            </button>

            <button
              type="button"
              onClick={onGallery}
              className="col-span-3 flex h-16 items-center justify-between rounded-[18px] border border-cyan-300/30 bg-cyan-300/[0.06] px-5 text-left shadow-[0_0_30px_rgba(34,211,238,0.16)] transition hover:bg-cyan-300/[0.10] lg:col-span-1"
            >
              <span className="flex min-w-0 items-center gap-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-black/25">
                  <Play className="h-5 w-5 text-white" />
                </span>

                <span className="min-w-0">
                  <span className="block truncate text-base font-bold text-white">
                    View Racer Gallery
                  </span>
                  <span className="block truncate text-xs text-white/50">
                    Videos & photos of highlights
                  </span>
                </span>
              </span>

              <span className="pl-3 text-2xl text-white/60">›</span>
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6  border border-cyan-300/10 bg-[#03101d]/80 p-5 backdrop-blur-md">
        <div className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-cyan-300/70">
          About
        </div>

        <p className="whitespace-pre-wrap text-sm leading-7 text-white/75">
          {racer.bio || "Bio coming soon."}
        </p>
      </div>
      <div className="relative z-10 grid grid-cols-[1fr_1fr_112px] border-t border-cyan-300/10 bg-[#03101d]/90 px-4 py-5 sm:grid-cols-[1fr_1fr_150px] sm:px-7">
        <div className="border-r border-cyan-300/10 pr-4">
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/45">
            National Rank
          </div>

          <div className="mt-2 text-3xl font-black text-white">
            #{nationalRank ?? "—"}
          </div>

          <div className="text-sm text-white/55">{className}</div>
        </div>

        <div className="border-r border-cyan-300/10 px-4">
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/45">
            Org Rank
          </div>

          <div className="mt-2 text-3xl font-black text-white">
            #{orgRank ?? "—"}
          </div>

          <div className="text-sm text-white/55">{orgLabel}</div>
        </div>

        <div className="grid place-items-center pl-3">
          <div className="flex flex-col items-center">
            <div className="mt-2 text-center">
              <div className="mt-2 text-3xl font-black text-white">
                {typeof profileViewCount === "number"
                  ? profileViewCount.toLocaleString()
                  : "—"}
              </div>
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/45">
                Profile Views
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
