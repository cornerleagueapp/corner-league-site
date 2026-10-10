import { apiRequest } from "@/lib/apiClient";
import { racerResponseData } from "@/lib/selfRacerLookup";
export type Person = {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  profilePicture?: string | null;
};
export type SocialPost = {
  id: string;
  content: string;
  mediaUrls: string[];
  createdAt: string;
  updatedAt: string;
  author: Person;
  athlete: { id: string; name: string } | null;
  likeCount: number;
  commentCount: number;
  liked: boolean;
  canEdit: boolean;
};
export type SocialComment = {
  id: string;
  content: string;
  createdAt: string;
  author: Person;
  canDelete: boolean;
};
export type Page<T> = {
  items: T[];
  total: number;
  page: number;
  hasNextPage: boolean;
};
export type Preferences = {
  emailFollows: boolean;
  emailLikes: boolean;
  emailComments: boolean;
  emailPosts: boolean;
  emailMessages: boolean;

  follows: boolean;
  likes: boolean;
  comments: boolean;
  posts: boolean;
  messages: boolean;
  allowMessages: "everyone" | "following" | "nobody";
};
export type Thread = {
  id: string;
  peer: Person;
  lastMessage: string | null;
  updatedAt: string;
  unreadCount: number;
};
export type Message = {
  id: string;
  senderId: string;
  sequence: number;
  content: string;
  createdAt: string;
};
export type MessagePage = {
  items: Message[];
  hasMore: boolean;
  before: number | null;
  latestSequence: number;
};
export type Alert = {
  id: string;
  content: string;
  href: string | null;
  isRead: boolean;
  createdAt: string;
  type: string;
};
export type UserFollow = {
  userId: string;
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
  isOwnUser: boolean;
  isBlocked: boolean;
  interactionBlocked: boolean;
};
export async function socialRequest<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  return racerResponseData(
    await apiRequest<unknown>(method, `/community/${path}`, body, {
      refreshOn401: path.startsWith("me/"),
      logoutOn401: path.startsWith("me/"),
    }),
  );
}
export function postPath(signedIn: boolean, suffix = "") {
  return `${signedIn ? "me/" : ""}posts${suffix}`;
}
function person(value: any) {
  return (
    !!value &&
    typeof value.id === "string" &&
    typeof value.username === "string"
  );
}
export function parsePost(value: unknown): SocialPost {
  const p = value as SocialPost;
  if (
    !p ||
    typeof p.id !== "string" ||
    typeof p.content !== "string" ||
    !person(p.author) ||
    !Array.isArray(p.mediaUrls) ||
    !p.mediaUrls.every((url) => typeof url === "string") ||
    !Number.isInteger(p.likeCount) ||
    !Number.isInteger(p.commentCount) ||
    typeof p.liked !== "boolean" ||
    typeof p.canEdit !== "boolean"
  )
    throw new Error("Unable to read this post.");
  return p;
}
export function parsePage<T>(
  value: unknown,
  valid: (item: any) => boolean,
): Page<T> {
  const p = value as Page<T>;
  if (
    !p ||
    !Array.isArray(p.items) ||
    !p.items.every(valid) ||
    !Number.isInteger(p.total) ||
    p.total < 0 ||
    typeof p.hasNextPage !== "boolean"
  )
    throw new Error("Unable to read this list. Please refresh.");
  return p;
}
export async function loadPosts(
  signedIn: boolean,
  filter: { username?: string; athleteId?: string; feed?: string },
  page: number,
) {
  const params = new URLSearchParams({
    page: String(page),
    limit: "12",
    ...filter,
  });
  const value = await socialRequest<unknown>(
    "GET",
    `${postPath(signedIn)}?${params}`,
  );
  return parsePage<SocialPost>(value, (item) => {
    parsePost(item);
    return true;
  });
}
export async function loadPost(signedIn: boolean, id: string) {
  return parsePost(
    await socialRequest(
      "GET",
      postPath(signedIn, `/${encodeURIComponent(id)}`),
    ),
  );
}
export function safeLocalHref(value: unknown): string | null {
  return typeof value === "string" &&
    /^\/(?:(?:posts|community|articles)\/[a-zA-Z0-9-]+|profile\/[^/?#]+|messages\?thread=[a-zA-Z0-9-]+)$/.test(
      value,
    )
    ? value
    : null;
}
export async function loadThreads(page: number) {
  return parsePage<Thread>(
    await socialRequest("GET", `me/threads?page=${page}&limit=20`),
    (item) =>
      typeof item.id === "string" &&
      person(item.peer) &&
      Number.isInteger(item.unreadCount),
  );
}
export async function loadMessages(
  id: string,
  before?: number,
): Promise<MessagePage> {
  const p = await socialRequest<MessagePage>(
    "GET",
    `me/threads/${encodeURIComponent(id)}/messages?limit=30${before ? `&before=${before}` : ""}`,
  );
  if (
    !Array.isArray(p.items) ||
    !p.items.every(
      (m) =>
        typeof m.id === "string" &&
        typeof m.content === "string" &&
        typeof m.senderId === "string" &&
        Number.isInteger(m.sequence),
    ) ||
    typeof p.hasMore !== "boolean" ||
    !Number.isInteger(p.latestSequence)
  )
    throw new Error("Unable to read messages.");
  return p;
}
export const socialError = (error: unknown) =>
  error instanceof Error ? error.message : "Please try again.";

export function parsePreferences(value: unknown): Preferences {
  const p = value as Preferences;
  if (
    !p ||
    !["follows", "likes", "comments", "posts", "messages"].every(
      (key) => typeof (p as any)[key] === "boolean",
    ) ||
    !["everyone", "following", "nobody"].includes(p.allowMessages)
  )
    throw new Error("Unable to read preferences. Please refresh.");
  const result = { ...p };
  for (const key of [
    "emailFollows",
    "emailLikes",
    "emailComments",
    "emailPosts",
    "emailMessages",
  ] as const) {
    if (p[key] !== undefined && typeof p[key] !== "boolean")
      throw new Error("Unable to read email preferences. Please refresh.");
    result[key] = p[key] ?? false;
  }
  return result;
}
export async function loadPreferences() {
  return parsePreferences(await socialRequest("GET", "me/preferences"));
}
export async function loadNotifications(page: number) {
  const value = await socialRequest<Page<Alert> & { unreadCount: number }>(
    "GET",
    `me/notifications?page=${page}&limit=20`,
  );
  parsePage<Alert>(
    value,
    (item) =>
      !!item &&
      typeof item.id === "string" &&
      typeof item.content === "string" &&
      typeof item.isRead === "boolean" &&
      typeof item.createdAt === "string",
  );
  if (!Number.isInteger(value.unreadCount) || value.unreadCount < 0)
    throw new Error("Unable to read notifications.");
  return value;
}
export async function loadPeople(search: string, page: number) {
  return parsePage<Person>(
    await socialRequest(
      "GET",
      `me/people?search=${encodeURIComponent(search)}&page=${page}&limit=20`,
    ),
    person,
  );
}
