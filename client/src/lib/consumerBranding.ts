export type BrandingKind = "organization" | "league" | "season" | "event";
export type ConsumerBranding = {
  kind: BrandingKind;
  resourceId: string;
  organizationId: string;
  revision: number;
  sportKey: string;
  effectiveLogoUrl: string | null;
  effectiveHeaderImageUrl: string | null;
};
export function stockHeader(sport: string) {
  return `/branding/stock-${sport === "golf" ? "golf" : ["jet-ski", "motocross", "boat-racing", "onewheel-racing", "rc-racing"].includes(sport) ? "racing" : "team"}.svg`;
}
export function brandingImage(value: unknown, sandbox = false): string | null {
  if (typeof value !== "string") return null;
  if (/^https:\/\/[^\s]+$/i.test(value)) return value;
  if (
    sandbox &&
    /^data:image\/(jpeg|png|webp);base64,[a-z0-9+/=]+$/i.test(value)
  )
    return value;
  return null;
}
export function requireConsumerBranding(
  value: ConsumerBranding,
  kind: BrandingKind,
  id: string,
  org: string,
) {
  if (
    !value ||
    value.kind !== kind ||
    value.resourceId !== id ||
    value.organizationId !== org ||
    !Number.isInteger(value.revision) ||
    value.revision < 0
  )
    throw new Error("Branding does not match this organization.");
  return value;
}
