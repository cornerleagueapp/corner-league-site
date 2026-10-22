import { OrganizationFollowButton } from "@/components/community/OrganizationFollowing";
import SportArtwork from "@/components/sport-hub/SportArtwork";
import { sportLogo } from "@/lib/sportVisuals";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSandbox } from "@/pages/organizations/SandboxContext";
import { publicSportData, sandboxSportData } from "@/lib/sportRegistration";
import {
  brandingImage,
  requireConsumerBranding,
  stockHeader,
  type BrandingKind,
  type ConsumerBranding,
} from "@/lib/consumerBranding";
export function BrandingImage({
  src,
  fallback,
  alt,
  className,
  fallbackContent,
}: {
  src: string | null;
  fallback: string;
  alt: string;
  className: string;
  fallbackContent?: React.ReactNode;
}) {
  const [failed, setFailed] = useState(false);
  if ((!src || failed) && fallbackContent) return <>{fallbackContent}</>;
  return (
    <img
      src={!failed && src ? src : fallback}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
      loading="lazy"
    />
  );
}
export default function ConsumerBrandingHero({
  kind,
  id,
  organizationId,
  sport,
  name,
  headingLevel = 2,
}: {
  kind: BrandingKind;
  id: string;
  organizationId: string;
  sport: string;
  name: string;
  headingLevel?: 1 | 2;
}) {
  const Heading = headingLevel === 1 ? "h1" : "h2";
  const sandbox = useSandbox();
  const query = useQuery({
    queryKey: [
      "consumer-branding",
      sandbox?.id ?? "public",
      sandbox?.account ?? "guest",
      kind,
      id,
      organizationId,
    ],
    queryFn: async () => {
      const path = `/branding/${kind}/${encodeURIComponent(id)}`;
      return requireConsumerBranding(
        await (sandbox
          ? sandboxSportData<ConsumerBranding>(sandbox.id, path)
          : publicSportData<ConsumerBranding>(path)),
        kind,
        id,
        organizationId,
      );
    },
    staleTime: sandbox ? 0 : 15000,
    gcTime: sandbox ? 0 : undefined,
    retry: false,
  });
  const data = query.isError ? undefined : query.data;
  const header = brandingImage(data?.effectiveHeaderImageUrl, !!sandbox),
    logo = brandingImage(data?.effectiveLogoUrl, !!sandbox);
  return (
    <section aria-label={`${name} branding`} className="sport-branding-hero">
      <BrandingImage
        key={header ?? "stock-header"}
        src={header}
        fallback={stockHeader(sport)}
        alt=""
        className="sport-branding-photo object-cover"
        fallbackContent={
          <SportArtwork sport={sport} className="sport-branding-photo" />
        }
      />
      <div className="sport-branding-copy">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/30 bg-white shadow-lg sm:h-24 sm:w-24">
          <BrandingImage
            key={logo ?? "stock-logo"}
            src={logo}
            fallback={sportLogo(sport)}
            alt={`${name} logo`}
            className="h-full w-full object-contain p-2"
          />
        </div>
        <div className="min-w-0 pb-1">
          <p className="text-xs font-bold uppercase tracking-widest text-cl-muted">
            {kind === "organization"
              ? "Organization"
              : kind === "event"
                ? "Event"
                : kind === "league"
                  ? "League"
                  : "Season"}
          </p>
          <Heading className="mt-2 break-words text-2xl font-black text-cl-ink sm:text-3xl">
            {name}
          </Heading>
          {kind === "organization" && !sandbox && (
            <OrganizationFollowButton
              key={organizationId}
              organizationId={organizationId}
            />
          )}
        </div>
      </div>
    </section>
  );
}
