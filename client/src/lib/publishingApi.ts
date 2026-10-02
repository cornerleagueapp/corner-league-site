import { socialRequest, parsePage, type Person, type Page } from "./socialApi";
export const publishingSports = [
  "general",
  "jet-ski",
  "motocross",
  "boat-racing",
  "running",
  "baseball",
  "football",
  "basketball",
  "golf",
  "other",
];
export const publishingCategories = [
  "discussion",
  "questions",
  "equipment",
  "events",
  "training",
];
export type PublicationKind = "forum" | "article";
export type Publication = {
  id: string;
  kind: PublicationKind;
  title: string;
  body?: string;
  excerpt: string;
  sport: string;
  category: string;
  coverUrl: string | null;
  published: boolean;
  revision: number;
  createdAt: string;
  updatedAt: string;
  author: Person;
  canEdit: boolean;
  score: number;
  vote: number;
  replyCount: number;
};
export type PublicationReply = {
  id: string;
  body: string;
  createdAt: string;
  author: Person;
  canDelete: boolean;
};
export function publicationRoute(kind: PublicationKind) {
  return kind === "forum" ? "/community" : "/articles";
}
export function publicationPath(
  kind: PublicationKind,
  signedIn: boolean,
  suffix = "",
) {
  return `${signedIn ? "me/" : ""}${kind === "forum" ? "forums" : "articles"}${suffix}`;
}
export function isPublication(value: any): value is Publication {
  return (
    !!value &&
    typeof value.id === "string" &&
    ["forum", "article"].includes(value.kind) &&
    typeof value.title === "string" &&
    typeof value.excerpt === "string" &&
    typeof value.published === "boolean" &&
    Number.isInteger(value.revision) &&
    typeof value.sport === "string" &&
    typeof value.category === "string" &&
    typeof value.author?.username === "string" &&
    typeof value.author?.id === "string" &&
    typeof value.canEdit === "boolean" &&
    Number.isFinite(value.score) &&
    [-1, 0, 1].includes(value.vote) &&
    Number.isInteger(value.replyCount) &&
    (value.coverUrl === null || typeof value.coverUrl === "string")
  );
}
export async function loadPublication(
  kind: PublicationKind,
  signedIn: boolean,
  id: string,
) {
  const value = await socialRequest<unknown>(
    "GET",
    publicationPath(kind, signedIn, `/${encodeURIComponent(id)}`),
  );
  if (
    !isPublication(value) ||
    typeof value.body !== "string" ||
    value.kind !== kind
  )
    throw new Error("Publication response is unavailable.");
  return value;
}
export async function loadPublications(
  kind: PublicationKind,
  signedIn: boolean,
  options: {
    page: number;
    sport?: string;
    category?: string;
    search?: string;
    username?: string;
    mine?: boolean;
  },
): Promise<Page<Publication>> {
  const { mine, ...filters } = options;
  const query = new URLSearchParams({
    limit: "20",
    ...Object.fromEntries(
      Object.entries(filters)
        .filter(([, v]) => v !== undefined && v !== "")
        .map(([k, v]) => [k, String(v)]),
    ),
  });
  return parsePage(
    await socialRequest(
      "GET",
      publicationPath(kind, signedIn, `${mine ? "/mine" : ""}?${query}`),
    ),
    isPublication,
  );
}
export async function loadReplies(
  signedIn: boolean,
  id: string,
  page: number,
): Promise<Page<PublicationReply>> {
  return parsePage(
    await socialRequest(
      "GET",
      publicationPath(
        "forum",
        signedIn,
        `/${encodeURIComponent(id)}/replies?page=${page}&limit=20`,
      ),
    ),
    (r: any) =>
      !!r &&
      typeof r.id === "string" &&
      typeof r.body === "string" &&
      typeof r.author?.username === "string" &&
      typeof r.canDelete === "boolean",
  );
}
export function safePublishingUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const u = new URL(value);
    return (u.protocol === "https:" || u.protocol === "http:") &&
      !u.username &&
      !u.password
      ? u.href
      : null;
  } catch {
    return null;
  }
}
export function publishingLabel(value: string) {
  return value
    .split("-")
    .map((x) => x[0]?.toUpperCase() + x.slice(1))
    .join(" ");
}
