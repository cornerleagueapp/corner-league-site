import { apiFetch } from "./apiClient";
import { racerResponseData } from "./selfRacerLookup";
export type DirectoryItem = {
  id: string;
  name: string;
  username?: string;
  imageUrl?: string | null;
  detail?: string | null;
  profileUrl: string;
  sportKey?: string;
};
export type DirectoryPage = {
  items: DirectoryItem[];
  page: number;
  hasNextPage: boolean;
};
export function parseDirectory(
  value: unknown,
  kind: "users" | "athletes",
  sport: string,
): DirectoryPage {
  const data = racerResponseData(value);
  if (
    !Array.isArray(data.items) ||
    data.items.length > 10 ||
    !Number.isInteger(data.page) ||
    data.page < 1 ||
    typeof data.hasNextPage !== "boolean"
  )
    throw new Error("Invalid search results.");
  for (const item of data.items) {
    if (
      !item ||
      typeof item.id !== "string" ||
      typeof item.name !== "string" ||
      typeof item.profileUrl !== "string"
    )
      throw new Error("Invalid search result.");
    const expected =
      kind === "users"
        ? `/profile/${encodeURIComponent(item.username || "")}`
        : `/racer/${encodeURIComponent(item.id)}${sport === "jet-ski" ? "" : `?sport=${encodeURIComponent(sport)}`}`;
    if (
      item.profileUrl !== expected ||
      (kind === "athletes" && item.sportKey !== sport)
    )
      throw new Error("Search result does not match this sport.");
  }
  return data;
}
export async function directorySearch(
  kind: "users" | "athletes",
  sport: string,
  search: string,
  page: number,
  signedIn: boolean,
  signal?: AbortSignal,
) {
  const q = new URLSearchParams({
    kind,
    search,
    page: String(page),
    ...(kind === "athletes" ? { sportKey: sport } : {}),
  });
  const path = signedIn
    ? "/community/me/directory-search"
    : "/community/directory/athletes";
  const response = await apiFetch(`${path}?${q}`, {
    signal,
    cache: "no-store",
    noRefresh: !signedIn,
    skipAuth: !signedIn,
  });
  if (!response.ok)
    throw new Error(
      response.status === 401
        ? "Please sign in again to search users."
        : "Search is temporarily unavailable. Try again.",
    );
  return parseDirectory(await response.json(), kind, sport);
}
export function safeProfileImage(value?: string | null) {
  return typeof value === "string" &&
    (/^https:\/\//i.test(value) || /^\/(?!\/)/.test(value))
    ? value
    : null;
}
