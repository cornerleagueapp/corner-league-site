import { useState, type CSSProperties, type ReactNode } from "react";
import AthleteFollowButton from "@/components/community/AthleteFollowButton";
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
  const cleanName = (name ?? "").trim();
  const length = cleanName.length;
  const wordCount = cleanName.split(/\s+/).filter(Boolean).length;

  const base: CSSProperties = {
    overflowWrap: "normal",
    wordBreak: "normal",
    hyphens: "none",
    textWrap: "balance" as CSSProperties["textWrap"],
  };

  if (length >= 34) {
    return {
      ...base,
      fontSize: "clamp(1.35rem, 5.4vw, 3.25rem)",
      lineHeight: 0.92,
      letterSpacing: "0.035em",
    };
  }

  if (length >= 28) {
    return {
      ...base,
      fontSize: "clamp(1.55rem, 6.2vw, 3.6rem)",
      lineHeight: 0.92,
      letterSpacing: "0.045em",
    };
  }

  if (length >= 22 || wordCount >= 3) {
    return {
      ...base,
      fontSize: "clamp(1.75rem, 7vw, 4rem)",
      lineHeight: 0.93,
      letterSpacing: "0.055em",
    };
  }

  if (length >= 16) {
    return {
      ...base,
      fontSize: "clamp(2rem, 8.2vw, 4.5rem)",
      lineHeight: 0.93,
      letterSpacing: "0.065em",
    };
  }

  return {
    ...base,
    fontSize: "clamp(2.35rem, 9vw, 5.25rem)",
    lineHeight: 0.92,
    letterSpacing: "0.08em",
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
    <section className="cl-dark relative -mx-3 overflow-hidden border-b border-cl-accent/10 cl-panel-wash shadow-cl-panel sm:mx-0 sm:rounded-[38px] sm:border sm:border-cl-accent/10">
      <div className="relative min-h-[520px] min-[1025px]:min-h-[520px]">
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
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute inset-0 opacity-[0.045] [background-image:linear-gradient(rgba(255,255,255,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.18)_1px,transparent_1px)] [background-size:72px_72px]" />
          <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-cl-accent/10 blur-3xl" />
          <div className="absolute -right-24 bottom-8 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
        </div>

        <div className="relative z-10 flex items-center justify-end gap-2 px-4 pt-4 min-[1025px]:px-7">
          <button
            type="button"
            onClick={onSearch}
            className="cl-dark grid h-12 w-12 place-items-center rounded-full border border-cl-border bg-cl-subtle text-cl-ink shadow-cl-panel backdrop-blur-md transition hover:bg-black/55"
            aria-label="Search racers"
          >
            <SearchIcon className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={onShare}
            className="cl-dark grid h-12 w-12 place-items-center rounded-full border border-cl-border bg-cl-subtle text-cl-ink shadow-cl-panel backdrop-blur-md transition hover:bg-black/55"
            aria-label="Share racer profile"
          >
            <Share2 className="h-5 w-5" />
          </button>
        </div>

        <div className="relative z-10 px-4 pt-10 min-[1025px]:px-7 min-[1025px]:pt-20">
          <div className="grid grid-cols-[112px_minmax(0,1fr)] gap-3 min-[1025px]:grid-cols-[170px_minmax(0,1fr)_250px] min-[1025px]:items-end min-[1025px]:gap-4 xl:grid-cols-[170px_minmax(0,1fr)_300px]">
            <div className="row-span-2 flex flex-col items-center gap-3 min-[1025px]:row-span-1">
              <button
                type="button"
                onClick={onProfileImageClick}
                className="relative shrink-0 rounded-full border border-cl-accent/25 bg-cl-subtle p-1 shadow-cl-panel"
              >
                <img
                  src={profileImage}
                  alt={racer.racerName}
                  className="h-[104px] w-[104px] rounded-full bg-cl-canvas object-cover min-[1025px]:h-40 min-[1025px]:w-40"
                  onError={(e) => {
                    const img = e.currentTarget as HTMLImageElement;
                    if (img.src !== stockAvatar) img.src = stockAvatar;
                  }}
                />
              </button>

              {racer.isVerifiedAthlete ? (
                <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-500/15 px-2.5 py-1 text-[10px] font-semibold text-emerald-200 min-[1025px]:text-[11px]">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Verified
                </div>
              ) : null}
            </div>

            <div className="min-w-0 self-center min-[1025px]:self-end">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center rounded-full border border-cl-accent/25 bg-cl-accent/10 px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-cl-accent shadow-cl-panel min-[1025px]:px-4 min-[1025px]:py-1.5 min-[1025px]:text-[10px]">
                  <span className="mr-2 h-1.5 w-1.5 rounded-full bg-cl-accent shadow-cl-panel" />
                  {getSkillLevelLabel(racer.skillLevel)}
                </div>

                {racer.nickname ? (
                  <div className="inline-flex items-center rounded-full border border-cl-accent/20 bg-cl-accent/10 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-cl-accent min-[1025px]:px-4 min-[1025px]:py-1.5 min-[1025px]:text-[10px]">
                    “{racer.nickname}”
                  </div>
                ) : null}
              </div>

              <h1
                className="max-w-full whitespace-normal cl-title-accent  uppercase italic   min-[1025px]:max-w-[620px] xl:max-w-[760px]"
                style={getResponsiveNameStyle(racer.racerName || "Racer")}
              >
                {racer.racerName || "Racer"}
              </h1>

              <div className="mt-3 max-w-full truncate text-[10px] font-semibold uppercase tracking-[0.2em] text-cl-muted min-[1025px]:text-xs">
                {rideAndLocation.map((item, index) => (
                  <span key={`${item}-${index}`}>
                    {index > 0 ? (
                      <span className="mx-2 text-cl-muted">|</span>
                    ) : null}
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="col-start-2 mt-2 w-full justify-self-start min-[1025px]:col-start-auto min-[1025px]:ml-auto min-[1025px]:mt-0 min-[1025px]:w-[240px] xl:w-[260px]">
              <div className="grid grid-cols-2 gap-2 min-[1025px]:hidden">
                <div className="rounded-[16px] border border-cl-accent/[0.15] bg-cl-surface/[0.85] p-3 shadow-cl-panel backdrop-blur-md">
                  <div className="text-[8px] font-black uppercase tracking-[0.16em] text-cl-muted">
                    {seasonYear} Ranking
                  </div>

                  <div className="mt-2 text-3xl font-black text-cl-accent">
                    #{nationalRank ?? "—"}
                  </div>

                  <div className="mt-1 text-[9px] font-bold uppercase tracking-[0.12em] text-cl-muted">
                    {ratingCard?.nationalRankingScore
                      ? `${Number(ratingCard.nationalRankingScore).toFixed(0)} pts`
                      : "Season pts"}
                  </div>
                </div>

                <div className="rounded-[16px] border border-cl-accent/25 bg-[radial-gradient(circle_at_30%_30%,rgba(125,211,252,0.30),rgba(34,211,238,0.12)_42%,rgba(6,17,31,0.95)_100%)] p-3 text-center shadow-cl-panel backdrop-blur-md">
                  <div className="text-[8px] font-black uppercase tracking-[0.18em] text-cl-accent">
                    OVR
                  </div>

                  <div className="mt-2 text-3xl font-black text-cl-ink ">
                    {overall > 0 ? overall.toFixed(0) : "—"}
                  </div>

                  <div className="mt-1 text-[9px] font-bold uppercase tracking-[0.12em] text-cl-muted">
                    Rating
                  </div>
                </div>
              </div>

              <div className="hidden rounded-[22px] border border-cl-accent/[0.15] cl-panel-wash p-3 shadow-cl-panel backdrop-blur-md min-[1025px]:block min-[1025px]:max-w-none min-[1025px]:p-4">
                <div className="text-[9px] font-black uppercase tracking-[0.18em] text-cl-muted min-[1025px]:text-[10px]">
                  {seasonYear} Season Ranking
                </div>

                <div className="mt-2 cl-title-accent  text-4xl font-black  min-[1025px]:text-6xl">
                  #{nationalRank ?? "—"}
                </div>

                <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-cl-muted min-[1025px]:text-xs">
                  {ratingCard?.nationalRankingScore
                    ? `${Number(ratingCard.nationalRankingScore).toFixed(0)} Points`
                    : "Season Points"}
                </div>
              </div>
            </div>
          </div>

          {canEdit && !racer.isVerifiedAthlete && (
            <div className="mt-6 rounded-xl border border-cl-border bg-cl-subtle p-4 text-sm text-cl-muted">
              {hasPendingClaim ? (
                "Your identity verification is pending review."
              ) : (
                <>
                  <p>
                    Your racer profile is linked to your account. Request
                    verification to add the reviewed athlete badge.
                  </p>
                  <Button
                    onClick={onClaim}
                    disabled={!canClaim}
                    className="mt-3"
                  >
                    Request athlete verification
                  </Button>
                </>
              )}
            </div>
          )}

          {racer.athleteId && (
            <div className="mt-5">
              <AthleteFollowButton athleteId={String(racer.athleteId)} />
            </div>
          )}

          <div className="mt-8 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 min-[1025px]:grid-cols-[220px_auto_minmax(320px,1fr)]">
            {canEdit ? (
              <Button
                onClick={onEdit}
                className="h-16 min-w-0 rounded-[16px] bg-cl-accent px-4 text-sm font-black uppercase tracking-[0.08em] text-cl-contrast shadow-cl-panel hover:bg-cl-accent min-[1025px]:w-[220px]"
              >
                <PencilLine className="mr-2 h-5 w-5" />
                Edit Profile
              </Button>
            ) : canClaim ? (
              <Button
                onClick={onClaim}
                className="h-16 min-w-0 rounded-[16px] bg-cl-accent px-4 text-sm font-black uppercase tracking-[0.08em] text-cl-contrast shadow-cl-panel hover:bg-cl-accent min-[1025px]:w-[220px]"
              >
                <Sparkles className="mr-2 h-5 w-5" />
                {hasRejectedClaim ? "Submit New Claim" : "Claim Profile"}
              </Button>
            ) : hasPendingClaim ? (
              <Button
                disabled
                className="h-16 min-w-0 rounded-[16px] border border-yellow-400/20 bg-yellow-500/20 px-4 text-sm font-black uppercase tracking-[0.08em] text-yellow-100 min-[1025px]:w-[220px]"
              >
                Claim Pending
              </Button>
            ) : (
              <div className="hidden min-[1025px]:block" />
            )}

            {hasSocialLinks ? (
              <button
                type="button"
                onClick={() => setIsLinksOpen(true)}
                className="inline-flex h-16 shrink-0 items-center justify-center gap-2 rounded-[16px] border border-cl-border bg-cl-subtle px-4 text-xs font-black uppercase tracking-[0.12em] text-cl-ink shadow-cl-panel backdrop-blur-md transition hover:border-cl-accent/[0.35] hover:bg-cl-accent/10 hover:text-cl-accent"
                aria-label="View racer links"
              >
                <LinkIcon className="h-5 w-5" />
                <span className="hidden min-[1025px]:inline">Links</span>
              </button>
            ) : (
              <div className="hidden min-[1025px]:block" />
            )}

            <button
              type="button"
              onClick={onGallery}
              className="col-span-2 flex h-16 w-full min-w-0 items-center justify-between rounded-[18px] border border-cl-accent/25 cl-panel-wash px-4 text-left shadow-cl-panel transition hover:border-cl-accent/[0.35] hover:bg-cl-accent/10 min-[1025px]:col-span-1 min-[1025px]:px-5"
            >
              <span className="flex min-w-0 items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-cl-border bg-cl-subtle">
                  <Play className="h-5 w-5 text-cl-ink" />
                </span>

                <span className="min-w-0">
                  <span className="block truncate text-base font-bold text-cl-ink">
                    View Racer Gallery
                  </span>
                  <span className="block truncate text-xs text-cl-muted">
                    Videos & photos
                  </span>
                </span>
              </span>

              <span className="pl-3 text-2xl text-cl-muted">›</span>
            </button>
          </div>
        </div>
      </div>

      <div className="relative z-10 mt-0 border border-cl-accent/10 cl-panel-wash p-5 backdrop-blur-md">
        <div className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-cl-accent">
          About
        </div>

        <p className="whitespace-pre-wrap text-sm leading-7 text-cl-muted">
          {racer.bio || "Bio coming soon."}
        </p>
      </div>

      <div className="relative z-10 grid grid-cols-[1fr_1fr_112px] border-t border-cl-accent/10 cl-panel-wash px-4 py-5 min-[1025px]:grid-cols-[1fr_1fr_150px] min-[1025px]:px-7">
        <div className="border-r border-cl-accent/10 pr-4">
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-cl-muted">
            National Rank
          </div>

          <div className="mt-2 text-3xl font-black text-cl-ink">
            #{nationalRank ?? "—"}
          </div>

          <div className="text-sm text-cl-muted">{className}</div>
        </div>

        <div className="border-r border-cl-accent/10 px-4">
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-cl-muted">
            Org Rank
          </div>

          <div className="mt-2 text-3xl font-black text-cl-ink">
            #{orgRank ?? "—"}
          </div>

          <div className="text-sm text-cl-muted">{orgLabel}</div>
        </div>

        <div className="grid place-items-center pl-0 min-[1025px]:pl-3">
          <div className="flex flex-col items-center">
            <div className="text-center">
              <div className="text-3xl font-black text-cl-ink">
                {typeof profileViewCount === "number"
                  ? profileViewCount.toLocaleString()
                  : "—"}
              </div>
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-cl-muted">
                Page Views
              </div>
            </div>
          </div>
        </div>
      </div>

      {isLinksOpen && hasSocialLinks ? (
        <div className="cl-dark fixed inset-0 z-[90] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            aria-label="Close racer links"
            onClick={() => setIsLinksOpen(false)}
          />

          <div className="relative w-full max-w-sm overflow-hidden rounded-[28px] border border-cl-accent/20 bg-cl-surface shadow-cl-panel">
            <div className="flex items-center justify-between border-b border-cl-border px-5 py-4">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.18em] text-cl-accent">
                  Racer Links
                </div>
                <div className="mt-1 text-sm text-cl-muted">
                  Socials, videos, and official pages
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsLinksOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-full border border-cl-border bg-cl-subtle text-cl-ink transition hover:bg-cl-subtle"
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
                  className="flex items-center gap-3 rounded-[18px] border border-cl-border bg-cl-subtle p-3 text-cl-ink transition hover:border-cl-accent/25 hover:bg-cl-accent/10"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-cl-accent/[0.15] bg-cl-subtle text-cl-accent">
                    {link.icon}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold">
                      {link.label}
                    </span>
                    <span className="block truncate text-xs text-cl-muted">
                      {link.href}
                    </span>
                  </span>

                  <ExternalLink className="h-4 w-4 shrink-0 text-cl-muted" />
                </a>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
