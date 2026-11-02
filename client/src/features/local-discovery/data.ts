export type LocalOpportunity = {
  id: string;
  imageUrl?: string | null;
  title: string;
  summary: string;
  sport: string;
  city: string;
  county: string;
  audience: string;
  eligibility: string;
  type: string;
  sourceUrl: string;
  actionUrl: string;
  startsAt: string | null;
  endsAt: string | null;
  registrationOpensAt: string | null;
  registrationClosesAt: string | null;
  sourcePublishedAt: string | null;
  lastVerifiedAt: string;
  expiresAt: string;
  source: { name: string; url: string };
};
export function safeSourceUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    const u = new URL(value);
    return u.protocol === "https:" && !u.username && !u.password;
  } catch {
    return false;
  }
}
export function localOpportunity(value: unknown): LocalOpportunity {
  const d = value as LocalOpportunity;
  if (
    !d ||
    ![
      d.id,
      d.title,
      d.summary,
      d.sport,
      d.city,
      d.county,
      d.type,
      d.audience,
    ].every((v) => typeof v === "string" && v.length > 0) ||
    !d.source ||
    typeof d.source.name !== "string" ||
    !safeSourceUrl(d.source.url) ||
    !safeSourceUrl(d.sourceUrl) ||
    !safeSourceUrl(d.actionUrl) ||
    (d.imageUrl != null && !safeSourceUrl(d.imageUrl)) ||
    ![d.lastVerifiedAt, d.expiresAt].every(
      (v) => typeof v === "string" && Number.isFinite(Date.parse(v)),
    ) ||
    ![
      d.startsAt,
      d.endsAt,
      d.registrationOpensAt,
      d.registrationClosesAt,
      d.sourcePublishedAt,
    ].every(
      (v) =>
        v === null || (typeof v === "string" && Number.isFinite(Date.parse(v))),
    )
  )
    throw Error("Local listing is unavailable.");
  return d;
}
export const localKind: Record<string, string> = {
  registration: "Registration opportunity",
  event: "Local event",
  "open-play": "Open play",
  announcement: "News & updates",
};
export const localSport = (sport: string) =>
  sport
    .split("-")
    .map((v) => v.charAt(0).toUpperCase() + v.slice(1))
    .join(" ");
export const localDate = (v: string) =>
  new Date(v).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
