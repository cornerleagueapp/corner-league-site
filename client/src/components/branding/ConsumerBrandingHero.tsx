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
}: {
  src: string | null;
  fallback: string;
  alt: string;
  className: string;
}) {
  const [failed, setFailed] = useState(false);
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
}: {
  kind: BrandingKind;
  id: string;
  organizationId: string;
  sport: string;
  name: string;
}) {
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
    <section
      aria-label={`${name} branding`}
      className="relative isolate min-h-48 overflow-hidden rounded-3xl bg-[#17394b] sm:min-h-64"
    >
      <BrandingImage
        key={header ?? "stock-header"}
        src={header}
        fallback={stockHeader(sport)}
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-center"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />
      <div className="relative flex min-h-48 items-end gap-4 p-5 sm:min-h-64 sm:p-7">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/30 bg-white shadow-lg sm:h-24 sm:w-24">
          <BrandingImage
            key={logo ?? "stock-logo"}
            src={logo}
            fallback="/branding/stock-logo.svg"
            alt={`${name} logo`}
            className="h-full w-full object-contain p-2"
          />
        </div>
        <div className="min-w-0 pb-1">
          <p className="text-xs font-bold uppercase tracking-widest text-white/80">
            {kind === "organization"
              ? "Organization"
              : kind === "event"
                ? "Event"
                : kind === "league"
                  ? "League"
                  : "Season"}
          </p>
          <h2 className="mt-2 break-words text-2xl font-black text-white sm:text-3xl">
            {name}
          </h2>
        </div>
      </div>
    </section>
  );
}
