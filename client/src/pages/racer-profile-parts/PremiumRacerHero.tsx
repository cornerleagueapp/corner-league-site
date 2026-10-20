import { useState, type ReactNode } from "react";
import AthleteFollowButton from "@/components/community/AthleteFollowButton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Share2, Search, ShieldCheck, Link as LinkIcon } from "lucide-react";
import stockAvatar from "@/assets/stockprofilepicture.jpeg";
import { stockHeader } from "@/lib/consumerBranding";
import type { Racer, RacerRatingCard } from "./types";
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
  const [linksOpen, setLinksOpen] = useState(false);
  const location =
    racer.location ||
    [racer.city, racer.stateCode, racer.countryCode].filter(Boolean).join(", ");
  const hero = racer.headerImageUrl || stockHeader("jet-ski");
  return (
    <section className="athlete-performance-hero" aria-label="Athlete profile">
      <img
        className="athlete-hero-photo"
        src={hero}
        alt=""
        onError={(event) => {
          event.currentTarget.onerror = null;
          event.currentTarget.src = stockHeader("jet-ski");
        }}
      />
      <div className="athlete-hero-identity">
        <button
          type="button"
          className="athlete-hero-portrait"
          onClick={onProfileImageClick}
          aria-label={`View ${racer.racerName}'s profile photo`}
        >
          <img
            src={racer.racerImage || stockAvatar}
            alt={racer.racerName}
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = stockAvatar;
            }}
          />
        </button>
        <div className="athlete-hero-name">
          <p>JET SKI · {(racer.skillLevel || "amateur").toUpperCase()}</p>
          <h1>
            {racer.racerName}
            {racer.isVerifiedAthlete && (
              <ShieldCheck size={24} aria-label="Verified athlete" />
            )}
          </h1>
          {racer.nickname && (
            <p className="athlete-nickname">“{racer.nickname}”</p>
          )}
          {location && <p>{location}</p>}
        </div>
        <div className="athlete-hero-tools">
          <button type="button" aria-label="Search athletes" onClick={onSearch}>
            <Search size={18} />
          </button>
          <button
            type="button"
            aria-label="Share athlete profile"
            onClick={onShare}
          >
            <Share2 size={18} />
          </button>
        </div>
      </div>
      <div className="athlete-hero-actions">
        {racer.athleteId && <AthleteFollowButton athleteId={racer.athleteId} />}
        <div className="athlete-hero-owner-actions">
          {canEdit && (
            <button type="button" onClick={onEdit}>
              Edit profile
            </button>
          )}
          {canClaim && (
            <button type="button" onClick={onClaim}>
              Claim profile
            </button>
          )}
          {hasPendingClaim && <span>Claim pending review</span>}
          {hasRejectedClaim && <span>Previous claim was declined</span>}
          {!!socialLinks?.length && (
            <button type="button" onClick={() => setLinksOpen(true)}>
              <LinkIcon size={16} />
              Links
            </button>
          )}
          <button type="button" onClick={onGallery}>
            View gallery
          </button>
          {racer.claimedByUsername && onClaimedUserClick && (
            <button type="button" onClick={onClaimedUserClick}>
              @{racer.claimedByUsername}
            </button>
          )}
        </div>
        {typeof profileViewCount === "number" && (
          <span className="athlete-view-count">
            {profileViewCount.toLocaleString()} views
          </span>
        )}
      </div>
      <Dialog open={linksOpen} onOpenChange={setLinksOpen}>
        <DialogContent className="athlete-links-dialog">
          <DialogHeader>
            <DialogTitle>Athlete links</DialogTitle>
          </DialogHeader>
          <div className="athlete-link-list">
            {socialLinks
              ?.filter((link) => /^https?:\/\//i.test(link.href))
              .map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {link.icon}
                  {link.label} ↗
                </a>
              ))}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
