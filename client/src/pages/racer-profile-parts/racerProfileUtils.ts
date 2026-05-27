import type { Racer, RacerGalleryItem, RacerSponsor } from "./types";

export function inchesToMeters(inches: number) {
  return inches * 0.0254;
}

export function metersToFeetInches(m?: number | null) {
  if (!m && m !== 0) return null;

  const totalIn = Math.round(m / 0.0254);
  const ft = Math.floor(totalIn / 12);
  const inch = totalIn % 12;

  return `${ft}′${inch}″`;
}

export function calculateAge(dateOfBirth?: string | null) {
  if (!dateOfBirth) return null;

  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }

  return age;
}

export function toDateInputValue(value?: string | null) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toISOString().slice(0, 10);
}

export function logRequestError(
  ctx: string,
  err: any,
  endpoint?: string,
  body?: any,
) {
  try {
    console.groupCollapsed(`%c${ctx} failed`, "color:#f7768e;font-weight:bold");
    if (endpoint) console.log("endpoint:", endpoint);
    if (body) console.log("request body (sent):", body);
    console.log("err.status:", err?.status);
    console.log("err.message:", err?.message);
    console.log("err.body (raw):", err?.body);

    if (err?.body && typeof err.body === "object") {
      console.log("err.body (json):", JSON.stringify(err.body, null, 2));
    }

    console.groupEnd();
  } catch {
    // noop
  }
}

export function humanizeValidationError(err: any): string | undefined {
  const d = err?.body ?? err?.data;

  if (typeof d === "string" && d.trim()) return d;

  if (d && Array.isArray(d.message)) {
    const lines: string[] = [];

    for (const m of d.message) {
      if (typeof m === "string") {
        lines.push(m);
      } else if (m && typeof m === "object") {
        const prop = m.property ? `${m.property}: ` : "";
        const constraints = m.constraints
          ? Object.values(m.constraints).join("; ")
          : JSON.stringify(m);

        lines.push(`${prop}${constraints}`);
      }
    }

    if (lines.length) return lines.join(" • ");
  }

  if (d?.error && typeof d.error === "string") return d.error;
  if (d?.message && typeof d.message === "string") return d.message;

  return undefined;
}

export function isProbablyId(s: string) {
  if (!s) return false;
  if (/^[0-9a-fA-F-]{32,}$/.test(s) && s.includes("-")) return true;
  if (/^[0-9A-Za-z]{20,}$/.test(s)) return true;

  return false;
}

export function slugify(s: string) {
  return s
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function humanizeClassGroupLabel(value?: string | null) {
  if (!value) return "";

  return String(value)
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function mapDetail(rec: any): Racer {
  const a = rec?.athlete ?? {};
  const claimedByUser = a?.claimedByUser ?? rec?.claimedByUser ?? null;

  return {
    id: rec?.id ?? a?.id,
    athleteId: a.id,
    racerName: a.name ?? rec.name ?? "",
    nickname:
      a.nickname ?? a.nick_name ?? rec.nickname ?? rec.nick_name ?? null,
    skillLevel:
      a.skillLevel ??
      a.skill_level ??
      rec.skillLevel ??
      rec.skill_level ??
      "amateur",
    racerAge: a.age ?? rec.age ?? undefined,
    dateOfBirth:
      a.dateOfBirth ??
      a.date_of_birth ??
      rec.dateOfBirth ??
      rec.date_of_birth ??
      null,
    bio: a.bio ?? rec.bio ?? null,
    racerImage: a.image ?? rec.image ?? null,
    headerImageUrl:
      a.headerImageUrl ??
      a.header_image_url ??
      rec.headerImageUrl ??
      rec.header_image_url ??
      null,
    instagramUrl:
      a.instagramUrl ??
      a.instagram_url ??
      rec.instagramUrl ??
      rec.instagram_url ??
      null,
    youtubeUrl:
      a.youtubeUrl ??
      a.youtube_url ??
      rec.youtubeUrl ??
      rec.youtube_url ??
      null,
    tiktokUrl:
      a.tiktokUrl ?? a.tiktok_url ?? rec.tiktokUrl ?? rec.tiktok_url ?? null,
    facebookUrl:
      a.facebookUrl ??
      a.facebook_url ??
      rec.facebookUrl ??
      rec.facebook_url ??
      null,
    websiteUrl:
      a.websiteUrl ??
      a.website_url ??
      rec.websiteUrl ??
      rec.website_url ??
      null,
    location: a.origin ?? rec.origin ?? null,
    boatManufacturers: rec.boatManufacturers ?? rec.team?.name ?? null,
    careerWins: rec.careerWins ?? 0,
    seasonWins: rec.seasonWins ?? 0,
    seasonPodiums: rec.seasonPodiums ?? 0,
    careerWorldFinalsWins:
      rec.careerWorldFinalsWins ?? rec.careerWordFinalsWins ?? 0,
    height: rec.height ?? a.height ?? null,
    weight: a.weight ?? rec.weight ?? null,
    claimedByUserId: claimedByUser?.id ?? null,
    claimedByUsername: claimedByUser?.username ?? null,
    isClaimed: !!claimedByUser?.id,
  };
}

export function mapAthlete(a: any): Racer {
  return {
    id: a?.id ?? a?._id ?? a?.uuid ?? "",
    athleteId: a?.id ?? a?._id ?? a?.uuid ?? "",
    racerName: a?.name ?? a?.fullName ?? a?.displayName ?? "",
    nickname: a?.nickname ?? a?.nick_name ?? null,
    skillLevel: a?.skillLevel ?? a?.skill_level ?? "amateur",
    racerAge: a?.age ?? undefined,
    dateOfBirth: a?.dateOfBirth ?? a?.date_of_birth ?? null,
    bio: a?.bio ?? null,
    racerImage: a?.image ?? a?.avatar ?? a?.photo ?? null,
    headerImageUrl: a?.headerImageUrl ?? a?.header_image_url ?? null,
    instagramUrl: a?.instagramUrl ?? a?.instagram_url ?? null,
    youtubeUrl: a?.youtubeUrl ?? a?.youtube_url ?? null,
    tiktokUrl: a?.tiktokUrl ?? a?.tiktok_url ?? null,
    facebookUrl: a?.facebookUrl ?? a?.facebook_url ?? null,
    websiteUrl: a?.websiteUrl ?? a?.website_url ?? null,
    location: a?.origin ?? a?.country ?? a?.city ?? null,
    boatManufacturers: null,
    careerWins: 0,
    seasonWins: 0,
    seasonPodiums: 0,
    careerWorldFinalsWins: 0,
    height: a?.height ?? null,
    weight: a?.weight ?? null,
    claimedByUserId: a?.claimedByUser?.id ?? null,
    claimedByUsername: a?.claimedByUser?.username ?? null,
    isClaimed: !!a?.claimedByUser?.id,
  };
}

export function toNumOrUndefined(v: any): number | undefined {
  if (v === null || v === undefined || v === "") return undefined;

  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export function getGalleryThumb(item: RacerGalleryItem) {
  return item.thumbnailUrl ?? item.thumbnail_url ?? item.url;
}

export function getSponsorLogo(sponsor: RacerSponsor) {
  return sponsor.logoUrl ?? sponsor.logo_url ?? null;
}

export function getSponsorWebsite(sponsor: RacerSponsor) {
  return sponsor.websiteUrl ?? sponsor.website_url ?? null;
}
