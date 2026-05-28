import { useState, type CSSProperties, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import stockAvatar from "@/assets/stockprofilepicture.jpeg";
import {
  ExternalLink,
  Link as LinkIcon,
  PencilLine,
  Play,
  Search as SearchIcon,
  Share2,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import type { Racer, RacerRatingCard } from "./types";
import { humanizeClassGroupLabel } from "./racerProfileUtils";

function getSkillLevelLabel(skillLevel?: string | null) {
  if (skillLevel === "junior") return "Junior";
  if (skillLevel === "pro") return "Pro";
  return "Amateur";
}

function getResponsiveNameStyle(name?: string | null): CSSProperties {
  const length = (name ?? "").trim().length;

  if (length >= 28) {
    return {
      fontSize: "clamp(2rem, 4.6vw, 4.25rem)",
      lineHeight: 0.92,
      wordBreak: "break-word",
    };
  }

  if (length >= 20) {
    return {
      fontSize: "clamp(2.25rem, 5.4vw, 4.75rem)",
      lineHeight: 0.94,
      wordBreak: "break-word",
    };
  }

  return {
    fontSize: "clamp(2.6rem, 6.4vw, 5.25rem)",
    lineHeight: 0.94,
    wordBreak: "break-word",
  };
}

function getLocationLabel(racer: Racer) {
  const r = racer as Racer & {
    city?: string | null;
    stateCode?: string | null;
    countryCode?: string | null;
  };

  const location =
    r.location ||
    [r.city, r.stateCode, r.countryCode].filter(Boolean).join(", ");

  return location || "";
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
  const [isLinksOpen, setIsLinksOpen] = useState(false);

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
  const locationLabel = getLocationLabel(racer);
  const rideAndLocation = [
    racer.boatManufacturers || "Aqua Racer",
    locationLabel,
  ].filter(Boolean);

  return (
    <section className="relative -mx-3 overflow-hidden border-b border-cyan-300/10 bg-[linear-gradient(180deg,#030913_0%,#07111F_48%,#02050A_100%)] shadow-[0_30px_90px_rgba(0,0,0,0.48)] sm:mx-0 sm:rounded-[38px] sm:border sm:border-cyan-300/10">
      <div className="relative min-h-[520px] sm:min-h-[620px] lg:min-h-[520px]">
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt={racer.racerName}
            className="h-full w-full object-cover opacity-90"
            onError={(e) => {
              const img = e.currentTarget as HTMLImageElement;
              if (img.src !== stockAvatar) img.src = stockAvatar;
            }}
          />

          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,8,18,0.95)_0%,rgba(2,8,18,0.66)_42%,rgba(2,8,18,0.25)_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,8,18,0.04)_0%,rgba(2,8,18,0.55)_68%,#030913_100%)]" />
          <div className="absolute inset-0 opacity-[0.045] [background-image:linear-gradient(rgba(255,255,255,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.18)_1px,transparent_1px)] [background-size:72px_72px]" />
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

        <div className="relative z-10 px-4 pt-10 sm:px-7 sm:pt-14 lg:pt-20">
          <div className="grid grid-cols-[116px_minmax(0,1fr)] gap-4 sm:grid-cols-[150px_minmax(0,1fr)_250px] sm:items-end lg:grid-cols-[170px_minmax(0,1fr)_300px]">
            <div className="row-span-2 flex flex-col items-center gap-3 sm:row-span-1">
              <button
                type="button"
                onClick={onProfileImageClick}
                className="relative shrink-0 rounded-full border border-cyan-300/25 bg-black/40 p-1 shadow-[0_0_34px_rgba(34,211,238,0.18)]"
              >
                <img
                  src={profileImage}
                  alt={racer.racerName}
                  className="h-[108px] w-[108px] rounded-full bg-black object-cover sm:h-36 sm:w-36 lg:h-40 lg:w-40"
                  onError={(e) => {
                    const img = e.currentTarget as HTMLImageElement;
                    if (img.src !== stockAvatar) img.src = stockAvatar;
                  }}
                />
              </button>

              {racer.isClaimed ? (
                <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-500/15 px-2.5 py-1 text-[10px] font-semibold text-emerald-200 sm:text-[11px]">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Verified
                </div>
              ) : null}
            </div>

            <div className="min-w-0 self-center sm:self-end">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-cyan-200 shadow-[0_0_22px_rgba(34,211,238,0.14)] sm:px-4 sm:py-1.5 sm:text-[10px]">
                  <span className="mr-2 h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_14px_rgba(103,232,249,0.95)]" />
                  {getSkillLevelLabel(racer.skillLevel)}
                </div>

                {racer.nickname ? (
                  <div className="inline-flex items-center rounded-full border border-[#FF6B35]/20 bg-[#FF6B35]/10 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-[#FFB199] sm:px-4 sm:py-1.5 sm:text-[10px]">
                    “{racer.nickname}”
                  </div>
                ) : null}
              </div>

              <h1
                className="max-w-[720px] bg-[linear-gradient(90deg,#FFFFFF_0%,#7CF4FF_48%,#FF7849_100%)] bg-clip-text uppercase italic tracking-[0.08em] text-transparent drop-shadow-[0_0_26px_rgba(34,211,238,0.12)]"
                style={getResponsiveNameStyle(racer.racerName || "Racer")}
              >
                {racer.racerName || "Racer"}
              </h1>

              <div className="mt-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/60 sm:text-xs">
                {rideAndLocation.map((item, index) => (
                  <span key={`${item}-${index}`}>
                    {index > 0 ? (
                      <span className="mx-2 text-white/30">|</span>
                    ) : null}
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="col-start-2 mt-2 w-full justify-self-start sm:col-start-auto sm:mt-0 lg:ml-auto lg:w-[260px]">
              <div className="grid grid-cols-2 gap-2 sm:hidden">
                <div className="rounded-[16px] border border-cyan-300/15 bg-[#06111f]/85 p-3 shadow-[0_0_28px_rgba(34,211,238,0.14)] backdrop-blur-md">
                  <div className="text-[8px] font-black uppercase tracking-[0.16em] text-white/70">
                    {seasonYear} Ranking
                  </div>

                  <div className="mt-2 text-3xl font-black text-cyan-300">
                    #{nationalRank ?? "—"}
                  </div>

                  <div className="mt-1 text-[9px] font-bold uppercase tracking-[0.12em] text-white/70">
                    {ratingCard?.nationalRankingScore
                      ? `${Number(ratingCard.nationalRankingScore).toFixed(0)} pts`
                      : "Season pts"}
                  </div>
                </div>

                <div className="rounded-[16px] border border-cyan-300/25 bg-[radial-gradient(circle_at_30%_30%,rgba(125,211,252,0.30),rgba(34,211,238,0.12)_42%,rgba(6,17,31,0.95)_100%)] p-3 text-center shadow-[0_0_24px_rgba(34,211,238,0.20),inset_0_0_28px_rgba(125,211,252,0.10)] backdrop-blur-md">
                  <div className="text-[8px] font-black uppercase tracking-[0.18em] text-cyan-200/90">
                    OVR
                  </div>

                  <div className="mt-2 text-3xl font-black text-white drop-shadow-[0_0_14px_rgba(125,211,252,0.35)]">
                    {overall > 0 ? overall.toFixed(0) : "—"}
                  </div>

                  <div className="mt-1 text-[9px] font-bold uppercase tracking-[0.12em] text-white/55">
                    Rating
                  </div>
                </div>
              </div>

              <div className="hidden rounded-[22px] border border-cyan-300/15 bg-[linear-gradient(135deg,rgba(34,211,238,0.10)_0%,rgba(7,17,31,0.92)_44%,rgba(255,107,53,0.08)_100%)] p-3 shadow-[0_24px_70px_rgba(0,0,0,0.34),0_0_34px_rgba(34,211,238,0.12)] backdrop-blur-md sm:block sm:max-w-none sm:p-4">
                <div className="text-[9px] font-black uppercase tracking-[0.18em] text-white/70 sm:text-[10px]">
                  {seasonYear} Season Ranking
                </div>

                <div className="mt-2 bg-[linear-gradient(90deg,#19E3FF_0%,#7CF4FF_45%,#FF7849_100%)] bg-clip-text text-4xl font-black text-transparent sm:text-5xl lg:text-6xl">
                  #{nationalRank ?? "—"}
                </div>

                <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/70 sm:text-xs">
                  {ratingCard?.nationalRankingScore
                    ? `${Number(ratingCard.nationalRankingScore).toFixed(0)} Points`
                    : "Season Points"}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 lg:grid-cols-[220px_auto_minmax(320px,1fr)]">
            {canEdit ? (
              <Button
                onClick={onEdit}
                className="h-16 min-w-0 rounded-[16px] bg-cyan-300 px-4 text-sm font-black uppercase tracking-[0.08em] text-[#06111d] shadow-[0_0_28px_rgba(34,211,238,0.25)] hover:bg-cyan-200 lg:w-[220px]"
              >
                <PencilLine className="mr-2 h-5 w-5" />
                Edit Profile
              </Button>
            ) : canClaim ? (
              <Button
                onClick={onClaim}
                className="h-16 min-w-0 rounded-[16px] bg-cyan-300 px-4 text-sm font-black uppercase tracking-[0.08em] text-[#06111d] shadow-[0_0_28px_rgba(34,211,238,0.25)] hover:bg-cyan-200 lg:w-[220px]"
              >
                <Sparkles className="mr-2 h-5 w-5" />
                {hasRejectedClaim ? "Submit New Claim" : "Claim Profile"}
              </Button>
            ) : hasPendingClaim ? (
              <Button
                disabled
                className="h-16 min-w-0 rounded-[16px] border border-yellow-400/20 bg-yellow-500/20 px-4 text-sm font-black uppercase tracking-[0.08em] text-yellow-100 lg:w-[220px]"
              >
                Claim Pending
              </Button>
            ) : (
              <div className="hidden lg:block" />
            )}

            {hasSocialLinks ? (
              <button
                type="button"
                onClick={() => setIsLinksOpen(true)}
                className="inline-flex h-16 shrink-0 items-center justify-center gap-2 rounded-[16px] border border-white/10 bg-black/35 px-4 text-xs font-black uppercase tracking-[0.12em] text-white/80 shadow-[0_16px_45px_rgba(0,0,0,0.28)] backdrop-blur-md transition hover:border-[#FF6B35]/35 hover:bg-[#FF6B35]/10 hover:text-[#FFB199]"
                aria-label="View racer links"
              >
                <LinkIcon className="h-5 w-5" />
                <span className="hidden sm:inline">Links</span>
              </button>
            ) : (
              <div className="hidden lg:block" />
            )}

            <button
              type="button"
              onClick={onGallery}
              className="col-span-2 flex h-16 w-full min-w-0 items-center justify-between rounded-[18px] border border-cyan-300/25 bg-[linear-gradient(135deg,rgba(34,211,238,0.09)_0%,rgba(7,17,31,0.78)_55%,rgba(255,107,53,0.08)_100%)] px-4 text-left shadow-[0_0_30px_rgba(34,211,238,0.14)] transition hover:border-[#FF6B35]/35 hover:bg-[#FF6B35]/10 lg:col-span-1 lg:px-5"
            >
              <span className="flex min-w-0 items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-black/25">
                  <Play className="h-5 w-5 text-white" />
                </span>

                <span className="min-w-0">
                  <span className="block truncate text-base font-bold text-white">
                    View Racer Gallery
                  </span>
                  <span className="block truncate text-xs text-white/50">
                    Videos & photos
                  </span>
                </span>
              </span>

              <span className="pl-3 text-2xl text-white/60">›</span>
            </button>
          </div>
        </div>
      </div>

      <div className="relative z-10 mt-0 border border-cyan-300/10 bg-[linear-gradient(180deg,rgba(7,17,31,0.92)_0%,rgba(3,9,19,0.96)_100%)] p-5 backdrop-blur-md">
        <div className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-cyan-300/70">
          About
        </div>

        <p className="whitespace-pre-wrap text-sm leading-7 text-white/75">
          {racer.bio || "Bio coming soon."}
        </p>
      </div>

      <div className="relative z-10 grid grid-cols-[1fr_1fr_112px] border-t border-cyan-300/10 bg-[linear-gradient(90deg,rgba(7,17,31,0.95)_0%,rgba(3,9,19,0.98)_55%,rgba(255,107,53,0.06)_100%)] px-4 py-5 sm:grid-cols-[1fr_1fr_150px] sm:px-7">
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

        <div className="grid place-items-center pl-0 sm:pl-3">
          <div className="flex flex-col items-center">
            <div className="text-center">
              <div className="text-3xl font-black text-white">
                {typeof profileViewCount === "number"
                  ? profileViewCount.toLocaleString()
                  : "—"}
              </div>
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/45">
                Page Views
              </div>
            </div>
          </div>
        </div>
      </div>

      {isLinksOpen && hasSocialLinks ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            aria-label="Close racer links"
            onClick={() => setIsLinksOpen(false)}
          />

          <div className="relative w-full max-w-sm overflow-hidden rounded-[28px] border border-cyan-300/20 bg-[#07111F] shadow-[0_30px_90px_rgba(0,0,0,0.65)]">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.18em] text-cyan-200">
                  Racer Links
                </div>
                <div className="mt-1 text-sm text-white/45">
                  Socials, videos, and official pages
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsLinksOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/10 text-white/80 transition hover:bg-white/15"
                aria-label="Close links modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2 p-4">
              {socialLinks!.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 rounded-[18px] border border-white/10 bg-white/[0.04] p-3 text-white transition hover:border-cyan-300/25 hover:bg-cyan-300/10"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-cyan-300/15 bg-black/30 text-cyan-100">
                    {link.icon}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold">
                      {link.label}
                    </span>
                    <span className="block truncate text-xs text-white/45">
                      {link.href}
                    </span>
                  </span>

                  <ExternalLink className="h-4 w-4 shrink-0 text-white/35" />
                </a>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
