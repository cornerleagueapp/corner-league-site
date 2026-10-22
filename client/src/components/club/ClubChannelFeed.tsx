//components/club/ClubChannelFeed.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { apiRequest } from "@/lib/apiClient";

type Msg = {
  id: string;
  content: string;
  createdAt: string;
  mediaUrls?: string[];
  sender?: {
    id: string;
    firstName?: string;
    lastName?: string;
    profilePicture?: string;
  };
  reaction?: string | null;
  reactionCount?: number;
};

type Page = {
  items: Msg[];
  nextCursor: string | null;
  hasMore: boolean;
};

const REACTIONS = [
  { type: "like", emoji: "👍" },
  { type: "love", emoji: "❤️" },
  { type: "haha", emoji: "😂" },
  { type: "sad", emoji: "😢" },
  { type: "angry", emoji: "😡" },
  { type: "sigh", emoji: "😮‍💨" },
  { type: "clown", emoji: "🤡" },
];

function normalize(m: any): Msg {
  return {
    id: String(m?.id),
    content: String(m?.content ?? ""),
    createdAt: m?.createdAt ?? new Date().toISOString(),
    mediaUrls: Array.isArray(m?.mediaUrls) ? m.mediaUrls : [],
    sender: {
      id: String(m?.sender?.id ?? ""),
      firstName: m?.sender?.firstName ?? "",
      lastName: m?.sender?.lastName ?? "",
      profilePicture: m?.sender?.profilePicture ?? "",
    },
    reaction: m?.reaction ?? null,
    reactionCount: m?.reactionCount ?? 0,
  };
}

async function getReaction(messageId: string, userId: string) {
  const r = await apiRequest<any>(
    "GET",
    `/club-channel-reactions/${messageId}/${userId}`,
  );
  return r?.data?.reaction ?? null;
}
async function getReactionCount(messageId: string) {
  const r = await apiRequest<any>(
    "GET",
    `/club-channel-reactions/count/${messageId}`,
  );
  return r?.data?.count ?? 0;
}
async function createReaction(
  messageId: string,
  userId: string,
  reaction: string,
) {
  return apiRequest("POST", "/club-channel-reactions", {
    clubChannelMessageId: messageId,
    userId,
    reaction,
  });
}
async function deleteReaction(messageId: string, userId: string) {
  return apiRequest("DELETE", `/club-channel-reactions/${messageId}/${userId}`);
}

export default function ClubChannelFeed({
  channelId,
  clubId,
  userId,
}: {
  channelId: string;
  clubId: string;
  userId?: string;
}) {
  const qc = useQueryClient();
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  const [draft, setDraft] = useState("");

  const sendMessage = useMutation({
    mutationFn: async () => {
      const content = draft.trim();
      if (!content || !userId) return;
      await apiRequest("POST", `/club-channels/${channelId}/messages`, {
        clubId,
        channelId,
        userId,
        content,
        mediaUrls: [],
      });
    },
    onSuccess: async () => {
      setDraft("");
      await qc.invalidateQueries({
        queryKey: ["club-channel", channelId, clubId, userId],
      });
      // nudge scroll to bottom after refresh
      setTimeout(() => {
        const el = scrollerRef.current;
        if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
      }, 50);
    },
  });

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ["club-channel", channelId, clubId, userId] as const,
      enabled: !!channelId && !!clubId,
      initialPageParam: null as string | null,
      queryFn: async ({ pageParam }) => {
        const params = new URLSearchParams();
        params.set("channelId", channelId);
        params.set("clubId", clubId);
        if (userId) params.set("userId", userId);
        if (pageParam) params.set("cursor", String(pageParam));

        const res = await apiRequest<any>(
          "GET",
          `/club-channels/${channelId}/messages?${params.toString()}`,
        );
        const msgs: any[] = Array.isArray(res?.data?.messages)
          ? res.data.messages
          : [];

        const enriched = await Promise.all(
          msgs.map(async (m: any) => {
            const base = normalize(m);
            try {
              const [r, c] = await Promise.all([
                userId ? getReaction(base.id, userId) : Promise.resolve(null),
                getReactionCount(base.id),
              ]);
              return { ...base, reaction: r, reactionCount: c };
            } catch {
              return base;
            }
          }),
        );

        const nextCursor: string | null = res?.meta?.nextCursor ?? null;
        const hasMore: boolean = !!res?.meta?.hasMore;

        return { items: enriched, nextCursor, hasMore } as Page;
      },
      getNextPageParam: (lastPage: Page) =>
        lastPage.hasMore ? lastPage.nextCursor : undefined,
    });

  const flat = useMemo(
    () => (data?.pages ?? []).flatMap((p: Page) => p.items),
    [data],
  );

  // autoload more when reaching top (inverted-like)
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const onScroll = () => {
      if (el.scrollTop < 80 && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    };
    el.addEventListener("scroll", onScroll);
    return () => {
      el?.removeEventListener("scroll", onScroll);
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  async function onToggleLike(m: Msg) {
    if (!userId) return;
    if (m.reaction) await deleteReaction(m.id, userId);
    else await createReaction(m.id, userId, "like");
    qc.invalidateQueries({
      queryKey: ["club-channel", channelId, clubId, userId],
    });
  }

  async function onPickReaction(m: Msg, val: string) {
    if (!userId) return;
    if (m.reaction) await deleteReaction(m.id, userId);
    await createReaction(m.id, userId, val);
    qc.invalidateQueries({
      queryKey: ["club-channel", channelId, clubId, userId],
    });
  }

  return (
    <div className="rounded-xl border border-cl-border bg-cl-canvas">
      <div
        ref={scrollerRef}
        className="h-[60vh] min-h-[400px] max-h-[70vh] overflow-y-auto flex flex-col-reverse p-4"
      >
        <div />

        {isLoading ? (
          <div className="text-cl-muted">Loading…</div>
        ) : flat.length === 0 ? (
          <div className="text-center text-cl-ink py-16">
            Say something, Post something. Do you…
            <div className="mt-6 opacity-80 text-4xl">💬</div>
          </div>
        ) : (
          flat.map((m: Msg) => (
            <div
              key={m.id}
              className="py-3 border-b border-cl-border last:border-b-0"
            >
              <div className="flex gap-3">
                <img
                  src={
                    m.sender?.profilePicture ||
                    "https://unavatar.io/placeholder"
                  }
                  className="h-10 w-10 rounded-full object-cover"
                  alt=""
                />
                <div className="flex-1">
                  <div className="flex items-baseline gap-2 text-xs text-cl-muted">
                    <span className="font-medium text-cl-ink">
                      {m.sender?.firstName} {m.sender?.lastName}
                    </span>
                    <time>{new Date(m.createdAt).toLocaleString()}</time>
                  </div>
                  <div className="mt-2 inline-block max-w-[80%] rounded-2xl rounded-tl-none border border-cl-border bg-cl-subtle px-4 py-2 text-sm">
                    {m.content}
                  </div>
                  {m.mediaUrls?.[0] && (
                    <img
                      src={m.mediaUrls[0]}
                      className="mt-2 rounded-lg border border-cl-border max-h-[360px] object-cover"
                      alt=""
                    />
                  )}

                  <div className="mt-2 flex items-center gap-3">
                    <button
                      onClick={() => onToggleLike(m)}
                      className="rounded-full px-3 py-1 bg-cl-subtle border border-cl-border hover:bg-cl-subtle text-sm"
                      title="Like"
                    >
                      {m.reaction ? "❤️" : "♡"}
                    </button>
                    <span className="text-cl-muted text-sm">
                      {m.reactionCount ?? 0}
                    </span>

                    <div className="ml-auto flex gap-1">
                      {REACTIONS.map((r) => (
                        <button
                          key={r.type}
                          onClick={() => onPickReaction(m, r.type)}
                          className="px-2 text-lg"
                          title={r.type}
                        >
                          {r.emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}

        {hasNextPage && (
          <div className="py-3 text-center text-cl-muted">
            {isFetchingNextPage ? "Loading more…" : "Scroll for more"}
          </div>
        )}
      </div>

      {/* composer */}
      <div className="border-t border-cl-border p-3 bg-cl-canvas">
        <div className="flex items-end gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage.mutate();
              }
            }}
            rows={2}
            placeholder="Write a message…"
            className="flex-1 resize-none rounded-lg bg-cl-subtle border border-cl-border p-2 text-sm text-cl-ink placeholder-cl-muted focus:outline-none focus:ring-2 focus:ring-cl-accent/20"
          />
          <button
            onClick={() => sendMessage.mutate()}
            disabled={!draft.trim() || sendMessage.isPending}
            className="shrink-0 px-4 py-2 rounded-lg bg-cl-surface text-cl-ink disabled:opacity-50"
          >
            {sendMessage.isPending ? "Sending…" : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
