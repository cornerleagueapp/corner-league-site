// components/club/ClubPostFeed.tsx
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useLayoutEffect,
  type ReactNode,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/apiClient";
import { useToast } from "@/hooks/use-toast";

/* =========================
   Types
   ========================= */

type FeedPost = {
  id: string;
  content: string;
  createdAt: string;
  mediaUrls?: string[];
  user?: {
    id: string;
    firstName?: string;
    lastName?: string;
    username?: string;
    profilePicture?: string;
  };
  author?: FeedPost["user"];
  reaction?: string | null;
  reactionCount?: number;
  commentCount?: number;
};

type MentionUser = {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  profilePicture?: string;
};

/* =========================
   UI constants
   ========================= */

const REACTIONS = [
  { type: "like", emoji: "👍" },
  { type: "love", emoji: "❤️" },
  { type: "haha", emoji: "😂" },
  { type: "sad", emoji: "😢" },
  { type: "angry", emoji: "😡" },
  { type: "sigh", emoji: "😮‍💨" },
  { type: "clown", emoji: "🤡" },
] as const;

const EMOJI: Record<string, string> = {
  like: "👍",
  love: "❤️",
  haha: "😂",
  sad: "😢",
  angry: "😡",
  sigh: "😮‍💨",
  clown: "🤡",
};

/* =========================
   Link + Mention helpers
   ========================= */

function makeMentionRefresher(
  ctrl: ReturnType<typeof buildMentionController>,
  setState: (s: { open: boolean; list: MentionUser[] }) => void,
  tag: string
) {
  let raf: number | null = null;
  return () => {
    if (raf) cancelAnimationFrame(raf);
    // Wait until the browser updates selectionStart
    raf = requestAnimationFrame(async () => {
      const s = await ctrl.state();
      setState(s);
    });
  };
}

const TLD_PART = "(com|org|net|io|app|ai|dev|co|tv|xyz|gg|gov|edu)";
const SCHEME_RE = /\bhttps?:\/\/[^\s)]+/gi;
const BARE_RE = new RegExp(
  `\\b(?:[a-z0-9-]+\\.)+${TLD_PART}(?:\\/[^\\s)]*)?`,
  "gi"
);
const MENTION_RE = /(^|[\s.,;:!?()'"[\]-])@([a-z0-9_]{2,30})\b/gi;

function normalizeUrl(u: string) {
  return /^https?:\/\//i.test(u) ? u : `https://${u}`;
}

function execAll(re: RegExp, text: string) {
  const rx = new RegExp(re.source, re.flags);
  const out: Array<{ start: number; end: number; val: string }> = [];
  let m: RegExpExecArray | null;
  while ((m = rx.exec(text)) !== null) {
    const val = re === MENTION_RE ? `@${m[2]}` : m[0];
    const start = re === MENTION_RE ? m.index + (m[1]?.length ?? 0) : m.index;
    out.push({ start, end: start + val.length, val });
  }
  return out;
}

function renderTextWithLinks(
  text: string,
  onLinkClick: (url: string) => void
): ReactNode[] {
  if (!text) return [""];
  const linkMatches = [...execAll(SCHEME_RE, text), ...execAll(BARE_RE, text)];
  const mentionMatches = execAll(MENTION_RE, text).map((m) => ({
    ...m,
    mention: true as const,
  }));

  const matches = [
    ...linkMatches.map((m) => ({ ...m, link: true as const })),
    ...mentionMatches,
  ].sort((a, b) => a.start - b.start);

  const merged: typeof matches = [];
  for (const m of matches) {
    if (!merged.length || m.start > merged[merged.length - 1].end)
      merged.push(m);
  }

  const out: ReactNode[] = [];
  let i = 0;
  merged.forEach((m, idx) => {
    if (m.start > i) out.push(text.slice(i, m.start));

    if ("link" in m) {
      const raw = text.slice(m.start, m.end);
      out.push(
        <button
          key={`lnk-${idx}-${m.start}`}
          className="text-[#4ea1ff] underline hover:opacity-90"
          onClick={() => onLinkClick(normalizeUrl(raw))}
          type="button"
        >
          {raw}
        </button>
      );
    } else {
      const disp = text.slice(m.start, m.end);
      out.push(
        <span
          key={`men-${idx}-${m.start}`}
          className="text-amber-400 font-medium"
        >
          {disp}
        </span>
      );
    }
    i = m.end;
  });
  if (i < text.length) out.push(text.slice(i));
  return out;
}

/* =========================
   Shared utils
   ========================= */

function formatWhen(d?: string) {
  if (!d) return "";
  const dt = new Date(d);
  const datePart = dt.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const timePart = dt.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${datePart} • ${timePart}`;
}

function timeAgo(d?: string | number | Date) {
  if (!d) return "";
  const t = new Date(d).getTime();
  const now = Date.now();
  const s = Math.max(0, Math.floor((now - t) / 1000));
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const dys = Math.floor(h / 24);
  const w = Math.floor(dys / 7);

  if (s < 5) return "just now";
  if (s < 60) return `${s}${s === 1 ? "s" : "s"} ago`;
  if (m < 60) return `${m}${m === 1 ? "m" : "m"} ago`;
  if (h < 24) return `${h}${h === 1 ? "h" : "h"} ago`;
  if (dys < 7) return `${dys}${dys === 1 ? "d" : "d"} ago`;
  return `${w}${w === 1 ? "w" : "w"} ago`;
}

function buildWebPostUrl(postId: string, openComments = false) {
  if (typeof window === "undefined")
    return `/?post=${postId}${openComments ? "&comments=1" : ""}`;
  const url = new URL(window.location.href);
  url.searchParams.set("post", postId);
  if (openComments) url.searchParams.set("comments", "1");
  return url.toString();
}

function onlyTopLevelCount(list: any[]) {
  return (Array.isArray(list) ? list : []).filter(
    (c) => c?.parentComment == null
  ).length;
}

function normalizePost(p: any): FeedPost {
  const author = p?.user ?? p?.author ?? {};
  return {
    id: String(p?.id),
    content: String(p?.content ?? ""),
    createdAt: p?.createdAt ?? new Date().toISOString(),
    mediaUrls: Array.isArray(p?.mediaUrls) ? p.mediaUrls : [],
    user: {
      id: String(author?.id ?? ""),
      firstName: author?.firstName ?? "",
      lastName: author?.lastName ?? "",
      username: author?.username ?? "",
      profilePicture: author?.profilePicture ?? "",
    },
  };
}

/* =========================
   API helpers
   ========================= */

async function searchUsers(query: string) {
  const q = (query ?? "").trim().toLowerCase();

  try {
    const r = await apiRequest<any>("GET", "/users");
    const raw: MentionUser[] = Array.isArray(r?.data?.users)
      ? r.data.users
      : Array.isArray(r?.data)
      ? r.data
      : [];

    // “@” only: show first 8 so the UI proves it’s working
    if (!q) {
      const pick = raw.slice(0, 8);

      return pick;
    }

    const seen = new Set<string>();
    const out = raw
      .filter((u) => {
        const username = (u?.username ?? "").toLowerCase();
        const first = (u?.firstName ?? "").toLowerCase();
        const last = (u?.lastName ?? "").toLowerCase();
        const full = `${first} ${last}`.trim();

        const match =
          username.includes(q) ||
          first.includes(q) ||
          last.includes(q) ||
          full.includes(q);

        if (match && !seen.has(u.id)) {
          seen.add(u.id);
          return true;
        }
        return false;
      })
      .slice(0, 8);

    return out;
  } catch (e) {
    return [];
  }
}

async function createComment(postId: string, userId: string, content: string) {
  return apiRequest("POST", "/club-social/club-comments", {
    clubPostId: postId,
    userId,
    content,
  });
}
async function getReaction(postId: string, userId: string) {
  const r = await apiRequest<any>(
    "GET",
    `/club-social/club-post-reactions/${postId}/${userId}`
  );
  return r?.data?.reaction?.reaction ?? null;
}
async function getReactionCount(postId: string) {
  const r = await apiRequest<any>(
    "GET",
    `/club-social/club-post-reactions/count/${postId}`
  );
  return r?.data?.count ?? 0;
}
async function getComments(postId: string) {
  const r = await apiRequest<any>(
    "GET",
    `/club-social/club-comments/${postId}/comments`
  );
  return r?.data?.comments ?? [];
}
async function createReaction(
  postId: string,
  userId: string,
  reaction: string
) {
  return apiRequest("POST", "/club-social/club-post-reactions", {
    clubPostId: postId,
    userId,
    reaction,
  });
}
async function deleteReaction(postId: string, userId: string) {
  return apiRequest(
    "DELETE",
    `/club-social/club-post-reactions/${postId}/${userId}`
  );
}
async function deletePost(clubId: string, postId: string, userId: string) {
  return apiRequest(
    "DELETE",
    `/club-social/club-posts/${clubId}/${postId}/${userId}`
  );
}

/* =========================
   Mentions UI + controller
   ========================= */

function MentionSuggestions({
  users,
  open,
  onPick,
}: {
  users: MentionUser[];
  open: boolean;
  onPick: (u: MentionUser) => void;
}) {
  if (!open) return null;
  return (
    <div className="absolute bottom-full mb-2 left-0 right-0 max-h-60 overflow-y-auto rounded-lg border border-white/10 bg-[#1a1a1a] shadow-lg z-[9999]">
      {users.length === 0 ? (
        <div className="px-3 py-2 text-sm text-white/50">No matches</div>
      ) : (
        users.map((u) => (
          <button
            key={u.id}
            onMouseDown={(e) => {
              e.preventDefault();
              onPick(u);
            }}
            className="w-full flex items-center gap-3 px-3 py-2 hover:bg-white/5 text-left"
            type="button"
          >
            <img
              src={u.profilePicture || "https://unavatar.io/placeholder"}
              className="h-7 w-7 rounded-full object-cover"
              alt=""
            />
            <div className="text-sm">
              <div className="font-medium text-white">@{u.username}</div>
              <div className="text-white/50 text-xs">
                {u.firstName} {u.lastName}
              </div>
            </div>
          </button>
        ))
      )}
    </div>
  );
}

/* =========================
   Mentions: controller
   ========================= */

function buildMentionController(
  getText: () => string,
  setText: (v: string) => void
) {
  let caret = 0;
  return {
    setCaret(pos: number) {
      caret = pos;
    },
    async state() {
      const text = getText();
      const before = text.slice(0, caret);
      const AT_RX = /(^|[\s.,;:!?()[\]'"-])[@＠]([^\s@＠]{0,30})$/u;
      const m = AT_RX.exec(before);
      if (!m) return { open: false, list: [] as MentionUser[] } as const;

      const frag = m[2] ?? "";
      const list = await searchUsers(frag.toLowerCase());
      return { open: true, list } as const;
    },

    applyPick(user: MentionUser, opts?: { addSpace?: boolean }): number {
      const text = getText();
      const left = text.slice(0, caret);
      const right = text.slice(caret);

      const insertion =
        `@${user.username}` + (opts?.addSpace ?? true ? " " : "");

      const triggerMatch = /[@＠][^\s@＠]{0,30}$/u.exec(left);
      const start = triggerMatch
        ? left.length - triggerMatch[0].length
        : left.length;

      const next = left.slice(0, start) + insertion + right;
      setText(next);

      const newCaret = start + insertion.length;
      caret = newCaret;
      return newCaret;
    },
  };
}

/* =========================
   Comments Modal
   ========================= */

function CommentsModal({
  post,
  userId,
  onClose,
  onLinkClick,
  onToggleLike,
  onSelectReaction,
  onCommentMade,
}: {
  post: FeedPost;
  userId?: string;
  onClose: () => void;
  onLinkClick: (url: string) => void;
  onToggleLike: (p: FeedPost) => Promise<void> | void;
  onSelectReaction: (p: FeedPost, value: string) => Promise<void> | void;
  onCommentMade?: () => void | Promise<void>;
}) {
  const { toast } = useToast();
  const [draft, setDraft] = useState("");

  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const pendingCaretRef = useRef<number | null>(null);

  const ctrlCmt = buildMentionController(() => draft, setDraft);
  const [mentionCmt, setMentionCmt] = useState({
    open: false,
    list: [] as MentionUser[],
  });
  const refreshCmt = makeMentionRefresher(ctrlCmt, setMentionCmt, "modal");

  useEffect(() => {
    (async () => {
      const s = await ctrlCmt.state();
      setMentionCmt(s);
    })();
  }, [draft]);

  useLayoutEffect(() => {
    if (pendingCaretRef.current != null && inputRef.current) {
      const el = inputRef.current;
      el.focus();
      el.selectionStart = el.selectionEnd = pendingCaretRef.current;
      pendingCaretRef.current = null;
    }
  }, [draft]);

  const {
    data: comments,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["club-post-comments", post.id],
    queryFn: async () => {
      const r = await apiRequest<any>(
        "GET",
        `/club-social/club-comments/${post.id}/comments`
      );
      return (r?.data?.comments ?? []) as Array<{
        id: string;
        content: string;
        createdAt: string;
        user?: {
          firstName?: string;
          lastName?: string;
          username?: string;
          profilePicture?: string;
        };
      }>;
    },
    enabled: !!post.id,
  });

  async function submitComment() {
    const content = draft.trim();
    if (!content || !userId) return;
    await createComment(post.id, userId, content);
    setDraft("");
    await refetch();
    await onCommentMade?.();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl rounded-xl border border-white/10 bg-[#151515] text-white shadow-xl max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <button
          className="absolute right-3 top-3 m-2 text-white/60 hover:text-white"
          onClick={onClose}
          aria-label="Close"
          type="button"
        >
          ✕
        </button>

        {/* Post preview */}
        <div className="p-5 border-b border-white/10 shrink-0">
          <header className="flex items-center gap-3">
            <img
              src={
                post.user?.profilePicture || "https://unavatar.io/placeholder"
              }
              className="h-8 w-8 rounded-full object-cover"
              alt=""
            />
            <div className="text-sm">
              <div className="font-medium flex items-center gap-1">
                {post.user?.firstName} {post.user?.lastName}
                {post.user?.username ? (
                  <span className="text-white/60 text-[11px]">
                    @{post.user.username}
                  </span>
                ) : null}
              </div>
              <div className="text-white/50 text-xs">
                {formatWhen(post.createdAt)}
              </div>
            </div>
          </header>

          <div className="mt-3 text-sm whitespace-pre-wrap">
            {renderTextWithLinks(post.content, onLinkClick)}
          </div>

          {post.mediaUrls?.[0] && (
            <img
              src={post.mediaUrls[0]}
              className="mt-3 rounded-lg border border-gray-800 w-full max-h-[240px] object-contain"
              alt=""
            />
          )}

          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={() => onToggleLike(post)}
              className="rounded-full px-3 py-1 bg-white/5 border border-white/10 hover:bg-white/10 text-sm"
              title="Like"
              type="button"
            >
              {post.reaction ? EMOJI[post.reaction] ?? "👍" : "♡"}
            </button>
            <div className="text-white/70 text-sm">
              {post.reactionCount ?? 0}
            </div>

            <button
              onClick={async () => {
                try {
                  const link = buildWebPostUrl(post.id, true);
                  await navigator.clipboard.writeText(link);
                  toast({ title: "Link copied to clipboard" });
                } catch {}
              }}
              className="rounded-full px-3 py-1 bg-white/5 border border-white/10 hover:bg-white/10 text-sm"
              type="button"
            >
              Share
            </button>

            <div className="ml-auto flex gap-1">
              {REACTIONS.map((r) => (
                <button
                  key={r.type}
                  onClick={() => onSelectReaction(post, r.type)}
                  className="px-2 text-lg"
                  title={r.type}
                  type="button"
                >
                  {r.emoji}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Comments list (scrolls) */}
        <div className="p-5 flex-1 overflow-y-auto min-h-0">
          <div className="text-lg font-semibold mb-4">Comments</div>

          {isLoading ? (
            <div className="text-white/70">Loading…</div>
          ) : comments && comments.length ? (
            <div className="space-y-4">
              {comments.map((c) => (
                <div
                  key={c.id}
                  className="flex gap-3 border-b border-white/5 pb-4 last:border-b-0"
                >
                  <img
                    src={
                      c.user?.profilePicture ||
                      "https://unavatar.io/placeholder"
                    }
                    className="h-8 w-8 rounded-full object-cover"
                    alt=""
                  />
                  <div className="flex-1">
                    <div className="text-xs text-white/60 mb-1 flex items-center gap-1">
                      <span className="text-white font-medium">
                        {c.user?.firstName} {c.user?.lastName}
                      </span>
                      {c.user?.username ? (
                        <span className="text-white/60 text-[11px]">
                          @{c.user.username}
                        </span>
                      ) : null}
                      <span className="text-white/40">
                        • {timeAgo(c.createdAt)}
                      </span>
                    </div>

                    <div className="text-sm whitespace-pre-wrap">
                      {renderTextWithLinks(c.content, onLinkClick)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-white/70">No comments yet.</div>
          )}
        </div>

        {/* Composer (sticky) */}
        <div className="p-5 border-t border-white/10 shrink-0">
          <div className="relative">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={draft}
                onChange={(e) => {
                  setDraft(e.target.value);
                  const el = e.currentTarget;
                  setTimeout(() => {
                    ctrlCmt.setCaret(el.selectionStart ?? 0);
                    refreshCmt(); // <-- refresh after caret set
                  }, 0);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    submitComment();
                  }
                  const el = e.currentTarget;
                  setTimeout(() => {
                    ctrlCmt.setCaret(el.selectionStart ?? 0);
                    refreshCmt();
                  }, 0);
                }}
                onClick={(e) => {
                  const el = e.currentTarget;
                  ctrlCmt.setCaret(el.selectionStart ?? 0);
                  refreshCmt();
                }}
                rows={2}
                placeholder="Write a comment…"
                className="flex-1 resize-none rounded-lg bg-white/5 border border-white/10 p-2 text-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/20"
              />
              <button
                onClick={submitComment}
                disabled={!draft.trim() || !userId}
                className="shrink-0 px-4 py-2 rounded-lg bg-white text-black disabled:opacity-50"
                type="button"
              >
                Comment
              </button>
            </div>

            <MentionSuggestions
              users={mentionCmt.list}
              open={mentionCmt.open}
              onPick={(u) => {
                if (inputRef.current) {
                  ctrlCmt.setCaret(
                    inputRef.current.selectionStart ?? draft.length
                  );
                }
                const pos = ctrlCmt.applyPick(u, { addSpace: true });
                pendingCaretRef.current = pos;
                setMentionCmt({ open: false, list: [] });
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================
   Main feed
   ========================= */

export default function ClubPostsFeed({
  clubId,
  userId,
  isMember,
  clubName,
}: {
  clubId: string;
  userId?: string;
  isMember?: boolean;
  clubName?: string;
}) {
  const { toast } = useToast();
  const [composer, setComposer] = useState("");
  const [showPickerFor, setShowPickerFor] = useState<string | null>(null);
  const [linkToOpen, setLinkToOpen] = useState<string | null>(null);
  const [commentsFor, setCommentsFor] = useState<FeedPost | null>(null);
  const [visibleCount, setVisibleCount] = useState(20);

  // mention state for the feed composer
  const feedRef = useRef<HTMLTextAreaElement | null>(null);
  const pendingFeedCaretRef = useRef<number | null>(null);

  const ctrlFeed = buildMentionController(() => composer, setComposer);
  const [mentionFeed, setMentionFeed] = useState({
    open: false,
    list: [] as MentionUser[],
  });
  const refreshFeed = makeMentionRefresher(ctrlFeed, setMentionFeed, "feed");

  useEffect(() => {
    (async () => {
      const s = await ctrlFeed.state();
      setMentionFeed(s);
    })();
  }, [composer]);

  useLayoutEffect(() => {
    if (pendingFeedCaretRef.current != null && feedRef.current) {
      const el = feedRef.current;
      el.focus();
      el.selectionStart = el.selectionEnd = pendingFeedCaretRef.current;
      pendingFeedCaretRef.current = null;
    }
  }, [composer]);

  // Load posts with counts/reactions
  const {
    data: posts,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["club-posts-feed", clubId, userId],
    enabled: !!clubId,
    queryFn: async () => {
      const base = await apiRequest<any>(
        "GET",
        `/club-social/club-posts-feed/${userId ?? ""}/${clubId}`
      );
      const raw = base?.data?.posts ?? [];
      const enriched = await Promise.all(
        raw.map(async (p: any) => {
          const post = normalizePost(p);
          try {
            const [r, c, comments] = await Promise.all([
              userId
                ? getReaction(post.id, String(userId))
                : Promise.resolve(null),
              getReactionCount(post.id),
              getComments(post.id),
            ]);
            return {
              ...post,
              reaction: r,
              reactionCount: c,
              commentCount: onlyTopLevelCount(comments),
            };
          } catch {
            return {
              ...post,
              reaction: null,
              reactionCount: 0,
              commentCount: 0,
            };
          }
        })
      );
      return enriched as FeedPost[];
    },
  });

  useEffect(() => {
    if (!posts) return;
    setVisibleCount((v) => Math.min(Math.max(v, 20), posts.length));
  }, [posts]);

  const canPost = Boolean(isMember && userId);

  async function onCreatePost() {
    const content = composer.trim();
    if (!content || !userId) return;
    try {
      await apiRequest("POST", "/club-social/club-posts", {
        userId,
        clubId,
        content,
        mediaUrls: [],
      });
      setComposer("");
      toast({ title: "Posted to club" });
      await refetch();
    } catch (e: any) {
      toast({
        title: "Failed to post",
        description: e?.message ?? "",
        variant: "destructive",
      });
    }
  }

  // Optimistic sync between modal and feed
  function patchIfModalTarget(id: string, patch: Partial<FeedPost>) {
    setCommentsFor((cur) =>
      cur && cur.id === id ? { ...cur, ...patch } : cur
    );
  }

  async function toggleLike(post: FeedPost) {
    if (!userId) {
      toast({
        title: "Sign in required",
        description: "You must be logged in to react.",
        variant: "destructive",
      });
      return;
    }
    // optimistic next state
    const nextReaction = post.reaction ? null : "like";
    const nextCount = (post.reactionCount ?? 0) + (post.reaction ? -1 : 1);
    patchIfModalTarget(post.id, {
      reaction: nextReaction,
      reactionCount: Math.max(0, nextCount),
    });

    try {
      if (post.reaction) await deleteReaction(post.id, userId);
      else await createReaction(post.id, userId, "like");
      await refetch();
    } catch (e: any) {
      // revert
      patchIfModalTarget(post.id, {
        reaction: post.reaction,
        reactionCount: post.reactionCount,
      });
      const msg = String(e?.message ?? "");
      if (
        msg.includes("401") ||
        e?.status === 401 ||
        e?.response?.status === 401
      ) {
        toast({
          title: "Unauthorized",
          description: "Your session may have expired. Please sign in again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Reaction failed",
          description: msg,
          variant: "destructive",
        });
      }
    }
  }

  async function selectReaction(post: FeedPost, value: string) {
    if (!userId) return;
    // optimistic
    const was = post.reaction;
    const add = was ? 0 : 1;
    patchIfModalTarget(post.id, {
      reaction: value,
      reactionCount: Math.max(0, (post.reactionCount ?? 0) + add),
    });
    try {
      if (post.reaction) await deleteReaction(post.id, userId);
      await createReaction(post.id, userId, value);
      setShowPickerFor(null);
      await refetch();
    } catch {
      // revert
      patchIfModalTarget(post.id, {
        reaction: was,
        reactionCount: post.reactionCount,
      });
    }
  }

  async function onDelete(post: FeedPost) {
    if (!userId) return;
    if (!confirm("Delete this post?")) return;
    try {
      await deletePost(clubId, post.id, userId);
      await refetch();
      toast({ title: "Deleted" });
    } catch (e: any) {
      toast({
        title: "Delete failed",
        description: e?.message ?? "",
        variant: "destructive",
      });
    }
  }

  function share(post: FeedPost) {
    const url = `cornerleague://club-post/${post.id}`;
    if (navigator.share) {
      navigator
        .share({ title: "Corner League", text: "Check out this post", url })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      toast({ title: "Link copied" });
    }
  }

  function speak(post: FeedPost) {
    try {
      const u = new SpeechSynthesisUtterance(post.content);
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch {}
  }

  const grouped = useMemo(() => {
    if (!posts?.length) return [];
    const out: Array<{
      type: "date" | "post";
      date?: string;
      post?: FeedPost;
    }> = [];
    let last = "";
    for (const p of posts) {
      const header = new Date(p.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      if (header !== last) {
        out.push({ type: "date", date: header });
        last = header;
      }
      out.push({ type: "post", post: p });
    }
    return out;
  }, [posts]);

  // long-press handler state (prevents click when picker opens)
  const longPress = useRef<{
    tid: number | null;
    did: boolean;
    id: string | null;
  }>({ tid: null, did: false, id: null });

  return (
    <div className="max-w-3xl">
      {/* Composer */}
      {canPost && (
        <div className="mb-4 rounded-xl border border-gray-800 bg-[#121212] p-4">
          <div className="relative">
            <textarea
              ref={feedRef}
              value={composer}
              onChange={(e) => {
                setComposer(e.target.value);
                const el = e.currentTarget;
                setTimeout(() => {
                  ctrlFeed.setCaret(el.selectionStart ?? 0);
                  refreshFeed();
                }, 0);
              }}
              onKeyDown={(e) => {
                const el = e.currentTarget;
                setTimeout(() => {
                  ctrlFeed.setCaret(el.selectionStart ?? 0);
                  refreshFeed();
                }, 0);
              }}
              onClick={(e) => {
                const el = e.currentTarget;
                ctrlFeed.setCaret(el.selectionStart ?? 0);
                refreshFeed();
              }}
              placeholder="Share something with the club..."
              className="w-full bg-transparent outline-none resize-none h-20 text-sm"
            />

            <MentionSuggestions
              users={mentionFeed.list}
              open={mentionFeed.open}
              onPick={(u) => {
                if (feedRef.current) {
                  ctrlFeed.setCaret(
                    feedRef.current.selectionStart ?? composer.length
                  );
                }
                const pos = ctrlFeed.applyPick(u, { addSpace: true });
                pendingFeedCaretRef.current = pos;
                setMentionFeed({ open: false, list: [] });
              }}
            />
          </div>

          <div className="mt-3 flex justify-end">
            <button
              onClick={onCreatePost}
              disabled={!composer.trim()}
              className="px-4 py-2 rounded-md bg-white text-black hover:bg-gray-200 disabled:opacity-60"
              type="button"
            >
              Post
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && (!posts || posts.length === 0) && (
        <div className="text-white/60 text-sm">
          {isMember
            ? "No posts yet in this club."
            : `Join ${clubName ?? "this club"} to view posts.`}
        </div>
      )}

      {/* Feed */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-white/70">Loading posts…</div>
        ) : (
          // render only the first `visibleCount` posts (with their date headers)
          (() => {
            if (!grouped.length) return null;
            // compute how many rows to show that cover the first `visibleCount` posts
            let postShown = 0;
            const limited: typeof grouped = [];
            for (const row of grouped) {
              if (row.type === "date") {
                // include date headers as needed while there are posts to show
                if (postShown < visibleCount) limited.push(row);
              } else if (row.type === "post") {
                if (postShown < visibleCount) {
                  limited.push(row);
                  postShown += 1;
                } else {
                  break;
                }
              }
            }
            return limited.map((row, i) =>
              row.type === "date" ? (
                <div
                  key={`d-${i}`}
                  className="flex items-center justify-center gap-3 my-3"
                >
                  <div className="h-px bg-gray-700 flex-1" />
                  <div className="text-sm text-white/80">{row.date}</div>
                  <div className="h-px bg-gray-700 flex-1" />
                </div>
              ) : (
                <article
                  key={row.post!.id}
                  className="rounded-xl border border-gray-800 bg-[#111111] p-4"
                >
                  <header className="flex items-center gap-3">
                    <img
                      src={
                        row.post!.user?.profilePicture ||
                        "https://unavatar.io/placeholder"
                      }
                      className="h-8 w-8 rounded-full object-cover"
                      alt=""
                    />
                    <div className="text-sm">
                      <div className="font-medium flex items-center gap-1">
                        {row.post!.user?.firstName} {row.post!.user?.lastName}
                        {row.post!.user?.username ? (
                          <span className="text-white/60 text-[11px]">
                            @{row.post!.user!.username}
                          </span>
                        ) : null}
                      </div>
                      <div className="text-white/50 text-xs">
                        {formatWhen(row.post!.createdAt)}
                      </div>
                    </div>
                  </header>

                  <div className="mt-3 text-sm whitespace-pre-wrap">
                    {renderTextWithLinks(row.post!.content, (url) =>
                      setLinkToOpen(url)
                    )}
                  </div>

                  {row.post!.mediaUrls?.[0] && (
                    <img
                      src={row.post!.mediaUrls[0]}
                      className="mt-3 rounded-lg border border-gray-800 max-h-[420px] object-cover"
                      alt=""
                    />
                  )}

                  <footer className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={(e) => {
                          if (
                            longPress.current.did &&
                            longPress.current.id === row.post!.id
                          ) {
                            longPress.current.did = false;
                            return; // swallow click triggered by long-press
                          }
                          toggleLike(row.post!); // single tap = 👍 like
                        }}
                        onPointerDown={(e) => {
                          e.preventDefault();
                          longPress.current.id = row.post!.id;
                          longPress.current.did = false;
                          longPress.current.tid = window.setTimeout(() => {
                            setShowPickerFor(row.post!.id);
                            longPress.current.did = true;
                          }, 350);
                        }}
                        onPointerUp={() => {
                          if (longPress.current.tid) {
                            clearTimeout(longPress.current.tid);
                            longPress.current.tid = null;
                          }
                        }}
                        onPointerLeave={() => {
                          if (longPress.current.tid) {
                            clearTimeout(longPress.current.tid);
                            longPress.current.tid = null;
                          }
                        }}
                        className="rounded-full px-3 py-1 bg-white/5 border border-white/10 hover:bg-white/10 text-sm"
                        title="Like"
                        type="button"
                      >
                        {row.post!.reaction
                          ? EMOJI[row.post!.reaction] ?? "👍"
                          : "♡"}
                      </button>
                      <div className="text-white/70 text-sm">
                        {row.post!.reactionCount ?? 0}
                      </div>
                      <button
                        onClick={() => setCommentsFor(row.post!)}
                        className="text-white/50 text-sm hover:underline"
                        title="View comments"
                        type="button"
                      >
                        {row.post!.commentCount ?? 0} comments
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => share(row.post!)}
                        className="rounded-full px-3 py-1 bg-white text-black hover:bg-gray-200 text-sm"
                        type="button"
                      >
                        Share
                      </button>
                      {row.post!.user?.id === userId && (
                        <button
                          onClick={() => onDelete(row.post!)}
                          className="rounded-full px-3 py-1 bg-red-600 hover:bg-red-700 text-sm"
                          type="button"
                        >
                          Delete
                        </button>
                      )}
                      <button
                        onClick={() => speak(row.post!)}
                        className="rounded-full px-3 py-1 bg-white/5 border border-white/10 hover:bg-white/10 text-sm"
                        type="button"
                      >
                        🔊
                      </button>
                    </div>
                  </footer>

                  {/* Reaction picker */}
                  {showPickerFor === row.post!.id && (
                    <div
                      className="mt-2 flex gap-2 rounded-full border border-gray-700 bg-[#222] px-3 py-2"
                      onMouseLeave={() => setShowPickerFor(null)}
                    >
                      {REACTIONS.map((r) => (
                        <button
                          key={r.type}
                          onClick={() => selectReaction(row.post!, r.type)}
                          className="text-xl"
                          title={r.type}
                          type="button"
                        >
                          {r.emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </article>
              )
            );
          })()
        )}
      </div>

      {!isLoading && posts && posts.length > visibleCount && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={() => setVisibleCount((v) => v + 20)}
            className="px-4 py-2 rounded-full bg-white text-black hover:bg-gray-200"
            type="button"
          >
            Load more
          </button>
        </div>
      )}

      {/* Link modal */}
      {linkToOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setLinkToOpen(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative w-full max-w-md rounded-xl border border-white/10 bg-[#151515] p-5 text-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute right-3 top-3 text-white/60 hover:text-white"
              onClick={() => setLinkToOpen(null)}
              aria-label="Close"
              type="button"
            >
              ✕
            </button>

            <div className="text-lg font-semibold mb-2">You clicked on</div>
            <div className="break-all text-white/80 mb-4">{linkToOpen}</div>

            <div className="flex items-center justify-end gap-2">
              <button
                className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 hover:bg-white/10"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(linkToOpen);
                    toast({ title: "Link copied" });
                  } catch {}
                }}
                type="button"
              >
                Copy link
              </button>
              <button
                className="rounded-lg bg-white px-3 py-2 text-black hover:bg-gray-200"
                onClick={() => {
                  window.open(linkToOpen!, "_blank", "noopener,noreferrer");
                  setLinkToOpen(null);
                }}
                type="button"
              >
                Open link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comments modal */}
      {commentsFor && (
        <CommentsModal
          post={commentsFor}
          userId={userId}
          onClose={() => setCommentsFor(null)}
          onLinkClick={(u) => setLinkToOpen(u)}
          onToggleLike={toggleLike}
          onSelectReaction={selectReaction}
          onCommentMade={refetch}
        />
      )}
    </div>
  );
}
