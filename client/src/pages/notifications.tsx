// pages/notifications.tsx
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/apiClient";
import { useToast } from "@/hooks/use-toast";

type NotificationRow = {
  id: string;
  type:
    | "post_comment"
    | "post_like"
    | "follow"
    | "mention"
    | "tag"
    | "system"
    | string; // allow forward-compat
  content: string;
  userId: string; // recipient
  isRead: boolean;
  profilePicture?: string | null;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  // optional relational ids
  notificationUserId?: string | null;
  notificationSenderId?: string | null;
  profilePostId?: string | null;
  clubPostId?: string | null;
};

type NotificationsResponse = {
  notifications: NotificationRow[];
  meta?: {
    page: number;
    limit: number;
    itemCount: number;
    pageCount: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
  };
};

function timeAgo(iso: string) {
  const d = new Date(iso);
  const diff = Math.max(0, Date.now() - d.getTime());
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const dys = Math.floor(h / 24);
  if (dys < 7) return `${dys}d ago`;
  return d.toLocaleDateString();
}

function getCreatedAt(n: NotificationRow) {
  return n.createdAt ?? n.created_at ?? new Date().toISOString();
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const userId = user?.id as string | undefined; // notifications endpoints take userId
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  // ----- fetch -----
  const { data, isLoading, isFetching, error } = useQuery({
    enabled: !!userId,
    queryKey: ["/notifications", userId, page, search],
    retry: false,
    queryFn: async (): Promise<NotificationsResponse> => {
      if (!userId) throw new Error("Missing user id");
      const params = new URLSearchParams();
      // params.set("order", "DESC");
      // params.set("sortBy", "created_at");
      params.set("page", String(page));
      params.set("limit", "10");
      if (search.trim()) params.set("search", search.trim());

      try {
        return await apiRequest(
          "GET",
          `/notifications/${encodeURIComponent(
            String(userId)
          )}?${params.toString()}`
        );
      } catch (e: any) {
        const msg =
          e?.message ||
          e?.response?.data?.message ||
          "Failed to fetch notifications";
        console.error("Notifications GET failed:", e);
        throw new Error(msg);
      }
    },
  });

  const notifications = data?.notifications ?? [];
  const meta = data?.meta;

  // ----- mutations -----
  const markAllMutation = useMutation({
    mutationFn: async () =>
      apiRequest(
        "PATCH",
        `/notifications/mark-all-as-read/${encodeURIComponent(userId!)}`
      ),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["/notifications", userId] });
      const prev = queryClient.getQueryData<any>([
        "/notifications",
        userId,
        page,
        search,
      ]);
      // optimistic: flip everything on current pages in cache
      queryClient.setQueriesData(
        { queryKey: ["/notifications", userId] },
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            notifications: (old.notifications ?? []).map(
              (n: NotificationRow) => ({
                ...n,
                isRead: true,
              })
            ),
          };
        }
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) {
        queryClient.setQueriesData(
          { queryKey: ["/notifications", userId] },
          ctx.prev
        );
      }
      toast({
        title: "Couldn’t mark all as read",
        description: "Please try again.",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      toast({
        title: "All caught up",
        description: "All notifications marked as read.",
      });
      queryClient.invalidateQueries({ queryKey: ["/notifications", userId] });
    },
  });

  const markOneMutation = useMutation({
    mutationFn: async (notif: NotificationRow) =>
      apiRequest(
        "PATCH",
        `/notifications/mark-as-read/${encodeURIComponent(
          notif.id
        )}/${encodeURIComponent(userId!)}`
      ),
    onMutate: async (notif) => {
      await queryClient.cancelQueries({ queryKey: ["/notifications", userId] });
      const prev = queryClient.getQueryData<any>([
        "/notifications",
        userId,
        page,
        search,
      ]);
      queryClient.setQueriesData(
        { queryKey: ["/notifications", userId] },
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            notifications: (old.notifications ?? []).map((n: NotificationRow) =>
              n.id === notif.id ? { ...n, isRead: true } : n
            ),
          };
        }
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) {
        queryClient.setQueriesData(
          { queryKey: ["/notifications", userId] },
          ctx.prev
        );
      }
      toast({
        title: "Couldn’t update notification",
        description: "Please try again.",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/notifications", userId] });
    },
  });

  // ----- ui helpers -----
  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  );

  // ----- empty state -----
  if (!userId) {
    return (
      <div className="p-6 text-white/80">
        Please sign in to view your notifications.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* header */}
      <div className="border-b border-gray-800 bg-gray-900/60 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Title row */}
          <div className="flex items-center justify-center md:justify-start gap-2">
            <h1 className="text-2xl font-semibold text-center md:text-left">
              Notifications
            </h1>
            {unreadCount > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-600/20 text-blue-300 border border-blue-500/30">
                {unreadCount} new
              </span>
            )}
          </div>

          {/* Controls: search + button */}
          <div
            className="
        w-full
        grid grid-cols-[1fr_auto] gap-3
        md:w-auto md:grid-cols-none md:flex md:items-center
      "
          >
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search notifications…"
              className="
          w-full md:w-64
          px-3 py-2 rounded-md
          bg-gray-800 border border-gray-700
          text-sm focus:outline-none focus:ring-2 focus:ring-blue-500
        "
            />

            <button
              onClick={() => markAllMutation.mutate()}
              disabled={markAllMutation.isPending || unreadCount === 0}
              className="
          px-3 py-2 rounded-md
          bg-white/10 hover:bg-white/15
          border border-white/10 text-sm
          disabled:opacity-50
        "
            >
              {markAllMutation.isPending ? "Marking…" : "Mark all as read"}
            </button>
          </div>
        </div>
      </div>

      {/* list */}
      <div className="max-w-4xl mx-auto p-4">
        <div className="rounded-lg border border-gray-800 bg-[#111827a1]">
          {isLoading ? (
            <div className="p-8 text-white/60">Loading…</div>
          ) : error ? (
            <div className="p-6 text-red-300">
              Couldn’t load notifications.
              <div className="mt-1 text-sm text-red-400/90">
                {(error as any)?.message ?? "Server error"}
              </div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-10 text-center text-white/60">
              You’re all caught up. 🎉
            </div>
          ) : (
            <ul className="divide-y divide-white/5">
              {notifications.map((n) => (
                <li
                  key={n.id}
                  className={`flex items-start gap-3 px-4 py-3 ${
                    n.isRead ? "bg-transparent" : "bg-blue-500/5"
                  } hover:bg-white/5`}
                >
                  {/* dot cue */}
                  <div className="pt-2">
                    <span
                      className={`inline-block h-2 w-2 rounded-full ${
                        n.isRead
                          ? "bg-transparent border border-white/20"
                          : "bg-blue-400"
                      }`}
                      title={n.isRead ? "Read" : "Unread"}
                    />
                  </div>

                  {/* avatar */}
                  <img
                    src={
                      n.profilePicture ||
                      "https://placehold.co/40x40/111827/FFFFFF?text=👤"
                    }
                    alt=""
                    className="h-8 w-8 rounded-full object-cover border border-white/10"
                  />

                  {/* content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm leading-5">
                        {/* We already get a cooked 'content' string from API */}
                        {n.content}
                      </p>
                      <span className="ml-3 shrink-0 text-xs text-white/50">
                        {timeAgo(getCreatedAt(n))}
                      </span>
                    </div>

                    {/* Activity line (type) */}
                    <div className="mt-1 text-xs text-white/40 capitalize">
                      {n.type.replace(/_/g, " ")}
                    </div>
                  </div>

                  {/* actions */}
                  {!n.isRead && (
                    <button
                      onClick={() => markOneMutation.mutate(n)}
                      className="text-xs px-2 py-1 rounded-md border border-white/10 hover:bg-white/10"
                    >
                      Mark read
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}

          {/* footer / pagination */}
          {meta?.hasNextPage && (
            <div className="p-3 flex justify-center">
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={isFetching}
                className="px-4 py-2 rounded-md bg-[#f7f7f7] text-black hover:bg-gray-300 disabled:opacity-50"
              >
                {isFetching ? "Loading…" : "Load more"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
