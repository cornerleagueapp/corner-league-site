// src/components/LiveChatRoom.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import io, { Socket } from "socket.io-client";
import { useAuth } from "@/hooks/useAuth";

type LiveChatRoomProps = {
  roomId: string;
  onClose?: () => void;
};

type ChatMessage = {
  id: string;
  userId: string;
  username: string;
  profilePicture?: string | null;
  message: string;
  createdAt?: string;
};

function getApiUrlFromEnv(): string {
  const fromEnv = (import.meta as any).env?.VITE_API_BASE as string | undefined;
  if (fromEnv?.trim()) return fromEnv.trim();

  const { protocol, hostname, port } = window.location;
  if (hostname === "localhost" && port === "5173") {
    return `${protocol}//${hostname}:4000/api`;
  }
  return `${window.location.origin}/api`;
}

function getAuthToken(): string | null {
  return (
    localStorage.getItem("access_token") ||
    localStorage.getItem("token") ||
    null
  );
}

function formatDayKey(iso?: string) {
  if (!iso) return "Unknown";
  const d = new Date(iso);
  return d.toDateString(); // stable key per day
}

function formatDayLabel(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "long",
    day: "numeric",
  });
}

function formatTime(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toProfilePath(username?: string) {
  if (!username) return "/profile/unknown";
  // simple slug-safe path
  return `/profile/${encodeURIComponent(username)}`;
}

function LiveChatRoom({ roomId, onClose }: LiveChatRoomProps) {
  const { user, isAuthenticated, accessToken } = useAuth() as any;
  const username = user?.username || "AnonymousUser";
  const userId = user?.id ?? user?.userId ?? user?.uid ?? null;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [userCount, setUserCount] = useState<number>(0);
  const [connecting, setConnecting] = useState<boolean>(true);
  const socketRef = useRef<Socket | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const API_URL = useMemo(() => getApiUrlFromEnv(), []);
  const SOCKET_URL = useMemo(() => API_URL.replace(/\/api$/, ""), [API_URL]);
  const authToken = accessToken ?? getAuthToken();

  async function ensureRoom(): Promise<void> {
    try {
      await fetch(`${API_URL}/live-chats/create-chat-room`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({ matchId: roomId }),
      });
    } catch {}
  }

  async function fetchMessages(): Promise<ChatMessage[]> {
    try {
      const res = await fetch(
        `${API_URL}/live-chats/messages/${encodeURIComponent(roomId)}`,
        {
          method: "GET",
          headers: {
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
          },
        }
      );

      if (res.status === 404) {
        await ensureRoom();
        return [];
      }
      if (!res.ok) return [];

      const json = await res.json();
      const raw = (json?.data ?? json ?? []) as any[];

      const list = raw.map((msg) => ({
        id: msg.messageId || String(msg.id || `${Date.now()}_${Math.random()}`),
        userId: msg.userId,
        username: msg.username || "Unknown",
        profilePicture: msg.profilePicture || null,
        message: msg.message_message || msg.message || "",
        createdAt: msg.createdAt ?? msg.timestamp,
      }));

      list.sort(
        (a, b) =>
          new Date(a.createdAt || 0).getTime() -
          new Date(b.createdAt || 0).getTime()
      );

      return list;
    } catch {
      return [];
    }
  }

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    if (nearBottom) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  useEffect(() => {
    // If a socket already exists, don't init again
    if (socketRef.current) return;

    let active = true;

    const init = async () => {
      setConnecting(true);
      await ensureRoom();
      const initial = await fetchMessages();
      if (!active) return;

      setMessages(initial);

      const s = io(SOCKET_URL, {
        path: "/socket.io",
        query: authToken ? { token: authToken } : {},
        transports: ["websocket"],
        autoConnect: true,
      });
      socketRef.current = s;

      s.on("connect", () => {
        s.emit("joinRoom", { matchId: roomId, username });
      });

      s.on("joinRoomSuccess", () => setConnecting(false));

      s.on("joinRoomError", (err: any) => {
        setConnecting(false);
        console.error("joinRoomError:", err?.message || err);
      });

      s.on("userCount", (count: number) => setUserCount(count));

      s.on("newMessage", (incoming: any) => {
        const normalized: ChatMessage = {
          id:
            incoming.messageId ||
            String(incoming.id || `${Date.now()}_${Math.random()}`),
          userId: incoming.userId,
          username: incoming.username || "Unknown",
          profilePicture: incoming.profilePicture || null,
          message: incoming.message || incoming.message_message || "",
          createdAt: incoming.createdAt ?? incoming.timestamp,
        };
        setMessages((prev) => [...prev, normalized]);
      });
    };

    init();

    return () => {
      active = false;
      if (socketRef.current) {
        try {
          socketRef.current.emit("leaveRoom", { matchId: roomId, userId });
        } catch {}
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [roomId, SOCKET_URL, authToken, username, userId]);

  const sendMessage = React.useCallback(() => {
    const socket = socketRef.current;
    if (!socket || !socket.connected) return;
    if (!currentMessage.trim()) return;
    if (!userId) return;

    socket.emit("sendMessage", {
      matchId: roomId,
      userId,
      message: currentMessage.trim(),
    });
    setCurrentMessage("");
  }, [currentMessage, roomId, userId]);

  const unauthenticated = !isAuthenticated || !userId;

  const lastAuthLogRef = useRef<string>("");
  useEffect(() => {
    const snapshot = JSON.stringify({
      isAuthenticated: !!isAuthenticated,
      userId: userId ?? null,
      hasToken: !!authToken,
    });
    if (snapshot !== lastAuthLogRef.current) {
      // eslint-disable-next-line no-console
      console.log("[LiveChat] auth", {
        isAuthenticated,
        hasToken: !!authToken,
      });
      lastAuthLogRef.current = snapshot;
    }
  }, [isAuthenticated, user, userId, authToken]);

  const groupedByDay = React.useMemo(() => {
    const groups: Record<string, ChatMessage[]> = {};
    for (const m of messages) {
      const key = formatDayKey(m.createdAt);
      if (!groups[key]) groups[key] = [];
      groups[key].push(m);
    }
    return Object.entries(groups).sort(
      ([a], [b]) => new Date(a).getTime() - new Date(b).getTime()
    ); // ascending by day
  }, [messages]);

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-red-500" />
          <span className="text-white/90 text-sm">
            {connecting ? "Connecting…" : `${userCount} online`}
          </span>
        </div>
        {onClose && (
          <button
            className="text-white/70 hover:text-white text-sm"
            onClick={onClose}
          >
            Close
          </button>
        )}
      </div>

      {/* Messages */}
      <div
        ref={listRef}
        className="rounded-xl border border-white/10 bg-white/5 p-3 h-[420px] overflow-y-auto"
      >
        {messages.length === 0 ? (
          <div className="h-full grid place-items-center text-white/60 text-sm">
            No messages yet — say hi 👋
          </div>
        ) : (
          <div className="space-y-6">
            {groupedByDay.map(([dayKey, dayMsgs]) => (
              <div key={dayKey} className="space-y-3">
                {/* Day separator */}
                <div className="relative my-2">
                  <div className="h-px bg-white/10 z-0" />
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-10">
                    <span className="px-3 text-xs text-white/70 bg-neutral-900 rounded-full border border-white/10 shadow-sm">
                      {formatDayLabel(dayMsgs[0]?.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Messages in this day */}
                <ul className="space-y-4">
                  {dayMsgs
                    .sort(
                      (a, b) =>
                        new Date(a.createdAt || 0).getTime() -
                        new Date(b.createdAt || 0).getTime()
                    )
                    .map((m) => {
                      const profileHref = toProfilePath(m.username);
                      const isSelf =
                        m.userId === userId || m.username === user?.username;
                      return (
                        <li key={m.id} className="flex gap-3 items-start">
                          <a href={profileHref} className="shrink-0">
                            <img
                              className="w-8 h-8 rounded-full object-cover hover:opacity-90 transition"
                              src={
                                m.profilePicture ||
                                "https://static.cdn-asset-placeholder.com/avatar.png"
                              }
                              alt={m.username}
                            />
                          </a>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-baseline gap-2">
                              <a
                                href={profileHref}
                                className={
                                  (isSelf ? "text-amber-400" : "text-white") +
                                  " font-semibold hover:underline"
                                }
                                aria-current={isSelf ? "true" : undefined}
                                title={m.username}
                              >
                                {m.username}
                              </a>
                              {m.createdAt && (
                                <span className="text-[11px] text-white/50">
                                  {formatTime(m.createdAt)}
                                </span>
                              )}
                            </div>
                            <div className="text-white/90 text-sm leading-relaxed break-words mt-0.5">
                              {m.message}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="mt-3 flex items-center gap-2">
        <input
          className="flex-1 px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white placeholder-white/40"
          placeholder={unauthenticated ? "Sign in to chat" : "Type a message…"}
          value={currentMessage}
          onChange={(e) => setCurrentMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") sendMessage();
          }}
          disabled={unauthenticated}
        />
        <button
          onClick={sendMessage}
          disabled={unauthenticated || !currentMessage.trim()}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-violet-600 via-fuchsia-600 to-orange-500 text-white disabled:opacity-50"
        >
          Send
        </button>
      </div>

      {unauthenticated && (
        <p className="mt-2 text-xs text-white/60">
          You must be signed in to send messages.
        </p>
      )}
    </div>
  );
}

LiveChatRoom.displayName = "LiveChatRoom";

export default React.memo(LiveChatRoom);
