import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { RefreshCw, Plus, Send } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import UserPicker from "@/components/community/UserPicker";
import { loadMessages, loadThreads, socialRequest } from "@/lib/socialApi";
import {
  Pagination,
  SocialFailure,
  socialBox,
  socialButton,
  socialInput,
} from "@/components/community/SocialPosts";
function Conversation({ threadId, name }: { threadId: string; name?: string }) {
  const { user } = useAuth();
  const cache = useQueryClient();
  const [before, setBefore] = useState<number>();
  const [content, setContent] = useState("");
  const requestId = useRef<string>();
  const bottom = useRef<HTMLDivElement>(null);
  const acked = useRef(0);
  const displayed = useRef(0);
  useEffect(() => {
    requestId.current = undefined;
  }, [content]);
  const query = useQuery({
    queryKey: ["direct-messages", user?.id, threadId, before],
    queryFn: () => loadMessages(threadId, before),
    enabled: !!user?.id,
    retry: false,
    refetchInterval: before ? false : 5000,
    refetchIntervalInBackground: false,
  });
  const read = useMutation({
    mutationFn: (sequence: number) =>
      socialRequest("PUT", `me/threads/${threadId}/read`, { sequence }),
    onSuccess: () =>
      void cache.invalidateQueries({ queryKey: ["direct-threads"] }),
  });
  useEffect(() => {
    const lastVisible = query.data?.items.at(-1)?.sequence;
    if (
      !before &&
      lastVisible &&
      lastVisible > acked.current &&
      document.visibilityState === "visible"
    ) {
      acked.current = lastVisible;
      read.mutate(lastVisible, {
        onError: () => {
          acked.current = 0;
        },
      });
    }
    if (!before && lastVisible && displayed.current !== lastVisible) {
      bottom.current?.scrollIntoView({ block: "nearest" });
      displayed.current = lastVisible;
    }
  }, [query.data, before]);
  const send = useMutation({
    mutationFn: () => {
      requestId.current ??= crypto.randomUUID();
      return socialRequest("POST", `me/threads/${threadId}/messages`, {
        content,
        clientRequestId: requestId.current,
      });
    },
    onSuccess: () => {
      setContent("");
      requestId.current = undefined;
      setBefore(undefined);
      void cache.invalidateQueries({
        queryKey: ["direct-messages", user?.id, threadId],
      });
      void cache.invalidateQueries({ queryKey: ["direct-threads", user?.id] });
    },
  });
  return (
    <section className={`${socialBox} flex min-h-[460px] min-w-0 flex-col`}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="min-w-0 break-words font-bold">
          {name ? `@${name}` : "Conversation"}
        </h2>
        <button
          aria-label="Refresh conversation"
          className={socialButton}
          onClick={() => void query.refetch()}
        >
          <RefreshCw size={16} />
        </button>
      </div>
      {before ? (
        <button className={socialButton} onClick={() => setBefore(undefined)}>
          Back to latest messages
        </button>
      ) : null}
      <div
        className="my-3 max-h-[55vh] flex-1 space-y-3 overflow-y-auto"
        aria-live="polite"
      >
        {query.isPending ? (
          <p role="status">Loading messages…</p>
        ) : query.isError ? (
          <SocialFailure error={query.error} />
        ) : (
          <>
            {query.data.hasMore && (
              <button
                className={socialButton}
                onClick={() => setBefore(query.data.before ?? undefined)}
              >
                Older messages
              </button>
            )}
            {!query.data.items.length && (
              <p className="py-6 text-center text-white/50">
                Start the conversation.
              </p>
            )}
            {query.data.items.map((message) => (
              <article
                key={message.id}
                className={`max-w-[90%] rounded-2xl p-3 ${message.senderId === String(user?.id) ? "ml-auto bg-cyan-300/15" : "mr-auto bg-white/5"}`}
              >
                <p className="whitespace-pre-wrap break-words text-sm text-white/90">
                  {message.content}
                </p>
                <p className="mt-2 text-[10px] text-white/45">
                  {message.senderId === String(user?.id) ? "You · " : ""}
                  {new Date(message.createdAt).toLocaleString()}
                </p>
              </article>
            ))}
            <div ref={bottom} />
          </>
        )}
      </div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          send.mutate();
        }}
        className="flex flex-wrap gap-2"
      >
        <textarea
          aria-label="Write a direct message"
          maxLength={4000}
          rows={2}
          value={content}
          onChange={(event) => setContent(event.target.value)}
          disabled={send.isPending}
          className={`${socialInput} min-w-0 flex-1`}
        />
        <button
          type="submit"
          className={socialButton}
          disabled={send.isPending || !content.trim() || query.isError}
        >
          <Send size={16} />
          {send.isPending ? "Sending…" : "Send"}
        </button>
      </form>
      {send.isError && <SocialFailure error={send.error} />}
      {read.isError && (
        <p role="status" className="mt-2 text-xs text-amber-200">
          Read status has not synced yet.
        </p>
      )}
    </section>
  );
}
export default function MessagesPage() {
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  const cache = useQueryClient();
  const [page, setPage] = useState(1);
  const [searchOpen, setSearchOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(() =>
    new URLSearchParams(window.location.search).get("thread"),
  );
  useEffect(() => {
    const update = () =>
      setSelected(new URLSearchParams(window.location.search).get("thread"));
    update();
    window.addEventListener("popstate", update);
    return () => window.removeEventListener("popstate", update);
  }, [location]);
  const threads = useQuery({
    queryKey: ["direct-threads", user?.id, page],
    queryFn: () => loadThreads(page),
    enabled: !!user?.id,
    retry: false,
    refetchInterval: 10000,
    refetchIntervalInBackground: false,
  });
  const select = (id: string) => {
    setSelected(id);
    navigate(`/messages?thread=${encodeURIComponent(id)}`);
  };
  const open = useMutation({
    mutationFn: (targetUserId: string) =>
      socialRequest<{ id: string }>("POST", "me/threads", { targetUserId }),
    onSuccess: (data) => {
      setSearchOpen(false);
      select(data.id);
      void cache.invalidateQueries({ queryKey: ["direct-threads", user?.id] });
    },
  });
  const peer = threads.data?.items.find(
    (thread) => thread.id === selected,
  )?.peer;
  return (
    <main className="mx-auto max-w-6xl space-y-5 p-4 py-8 text-white">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-cyan-200">
            Corner League community
          </p>
          <h1 className="mt-2 text-3xl font-black">Messages</h1>
        </div>
        <button className={socialButton} onClick={() => setSearchOpen(true)}>
          <Plus size={16} />
          New message
        </button>
      </header>
      {open.isError && <SocialFailure error={open.error} />}
      <div className="grid gap-5 md:grid-cols-[280px_minmax(0,1fr)]">
        <aside className={socialBox}>
          <div className="mb-3 flex justify-between">
            <h2 className="font-bold">Conversations</h2>
            <button
              aria-label="Refresh conversations"
              className={socialButton}
              onClick={() => void threads.refetch()}
            >
              <RefreshCw size={16} />
            </button>
          </div>
          {threads.isPending ? (
            <p role="status">Loading conversations…</p>
          ) : threads.isError ? (
            <SocialFailure error={threads.error} />
          ) : (
            <>
              {!threads.data.items.length && (
                <p className="text-sm text-white/50">No messages yet.</p>
              )}
              {threads.data.items.map((thread) => (
                <button
                  key={thread.id}
                  onClick={() => select(thread.id)}
                  aria-pressed={thread.id === selected}
                  className={`mb-2 w-full rounded-xl border p-3 text-left ${thread.id === selected ? "border-cyan-300/35 bg-cyan-300/10" : "border-white/10"}`}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate font-bold">
                      @{thread.peer.username}
                    </span>
                    {thread.unreadCount > 0 && (
                      <span
                        aria-label={`${thread.unreadCount} unread messages`}
                        className="rounded-full bg-cyan-300 px-2 text-xs font-bold text-black"
                      >
                        {thread.unreadCount}
                      </span>
                    )}
                  </span>
                  <span className="mt-1 block truncate text-xs text-white/50">
                    {thread.lastMessage || "Start a conversation"}
                  </span>
                </button>
              ))}
              <Pagination
                page={page}
                hasNext={threads.data.hasNextPage}
                setPage={setPage}
              />
            </>
          )}
        </aside>
        {selected ? (
          <Conversation
            key={`${user?.id}:${selected}`}
            threadId={selected}
            name={peer?.username}
          />
        ) : (
          <section
            className={`${socialBox} grid min-h-80 place-items-center text-center text-white/50`}
          >
            Choose a conversation or start a new one.
          </section>
        )}
      </div>
      <UserPicker
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelectUser={(person) => open.mutate(String(person.id))}
      />
    </main>
  );
}
