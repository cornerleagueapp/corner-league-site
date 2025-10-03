// /components/userSearchModal.tsx
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import { apiFetch, apiRequest } from "@/lib/apiClient";
import { cn } from "@/lib/utils";
import stockAvatar from "../assets/stockprofilepicture.jpeg";

type UserLite = {
  id: string | number;
  username: string;
  firstName?: string;
  lastName?: string;
  profilePicture?: string | null;
};

const LIMIT_CANDIDATES = [50, 25, 10];
const HARD_CAP = 5000;

function extractUsers(payload: any, usedLimit: number) {
  const users: UserLite[] = Array.isArray(payload?.users)
    ? payload.users
    : Array.isArray(payload?.data?.users)
    ? payload.data.users
    : Array.isArray(payload?.data)
    ? payload.data
    : [];

  const meta = payload?.meta ?? payload?.data?.meta ?? {};
  const hasMoreExplicit =
    typeof meta?.hasNextPage === "boolean" ? meta.hasNextPage : undefined;

  const hasMoreInferred = users.length > 0 && users.length === usedLimit;

  return {
    users,
    hasMore: hasMoreExplicit ?? hasMoreInferred,
  };
}

function buildUsersUrl(pageIndex: number, limit: number) {
  const page = pageIndex + 1;
  return `/users?limit=${limit}&page=${page}`;
}

export default function UserSearchModal({
  open,
  onClose,
  onSelectUser,
}: {
  open: boolean;
  onClose: () => void;
  onSelectUser: (u: UserLite) => void;
}) {
  const [q, setQ] = useState("");
  const [all, setAll] = useState<UserLite[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    if (open) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev || "";
    };
  }, [open]);

  const fetchPage = useCallback(
    async (idx: number): Promise<{ users: UserLite[]; hasMore: boolean }> => {
      setError(null);

      for (const limit of LIMIT_CANDIDATES) {
        const path = buildUsersUrl(idx, limit);
        try {
          const res = await apiFetch(path);
          const raw = await res.text();
          const json = raw ? JSON.parse(raw) : null;
          if (!res.ok) continue;

          const { users, hasMore } = extractUsers(json, limit);
          return { users, hasMore };
        } catch {
          continue;
        }
      }

      try {
        const fb = await apiRequest<{
          users?: UserLite[];
          data?: { users?: UserLite[] };
        }>("GET", "/users");
        const users: UserLite[] =
          (fb?.users as any) ?? (fb?.data?.users as any) ?? [];
        return { users, hasMore: false };
      } catch (e: any) {
        setError(e?.message || "Failed to load users");
        return { users: [], hasMore: false };
      }
    },
    []
  );

  // Initial load
  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    setError(null);
    setAll([]);
    setHasMore(true);
    setPageIndex(0);
    setLoading(true);

    (async () => {
      try {
        const { users, hasMore: more } = await fetchPage(0);
        if (cancelled) return;
        const next = users.slice(0, HARD_CAP);
        setAll(next);
        setHasMore(more && next.length < HARD_CAP);
        setPageIndex(1);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load users");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, fetchPage]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore || all.length >= HARD_CAP) return;
    setLoadingMore(true);
    try {
      const { users, hasMore: more } = await fetchPage(pageIndex);
      const merged = [...all, ...users].slice(0, HARD_CAP);
      setAll(merged);
      setHasMore(more && merged.length < HARD_CAP);
      setPageIndex(pageIndex + 1);
    } finally {
      setLoadingMore(false);
    }
  }, [all, fetchPage, hasMore, loadingMore, pageIndex]);

  useEffect(() => {
    if (!open) return;
    const el = scrollerRef.current;
    if (!el) return;
    const onScroll = () => {
      const nearBottom =
        el.scrollTop + el.clientHeight >= el.scrollHeight - 200;
      if (nearBottom) loadMore();
    };
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, [open, loadMore]);

  // Hide everything until the user types
  const qNorm = q.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!qNorm) return [] as UserLite[];
    return all.filter((u) =>
      [u.username, u.firstName, u.lastName]
        .filter(Boolean)
        .some((t) => String(t).toLowerCase().includes(qNorm))
    );
  }, [qNorm, all]);

  if (!open) return null;

  const qEmpty = qNorm.length === 0;

  return (
    <div className="fixed inset-0 z-[80]">
      <button
        aria-label="Close"
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />

      <div className="relative z-10 mx-auto md:mt-20 md:max-w-xl">
        <div
          className={cn(
            "bg-[#0b0f18] border border-white/10 rounded-none md:rounded-xl w-full",
            "fixed inset-0 md:static md:h-auto"
          )}
        >
          <div className="p-4 border-b border-white/10 sticky top-0 bg-[#0b0f18]">
            <div className="flex items-center gap-2">
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search users…"
                className="flex-1 h-10 rounded-lg bg-white/5 border border-white/10 px-3 text-sm outline-none placeholder:text-white/40 focus:bg-white/7 text-white"
              />
              <button
                onClick={onClose}
                className="h-9 px-3 rounded-md border border-white/10 text-white/80 hover:text-white"
              >
                Close
              </button>
            </div>
          </div>

          <div
            ref={scrollerRef}
            className="p-2 max-h-[calc(100vh-60px)] md:max-h-[calc(100vh-60px)] overflow-y-auto"
          >
            {qEmpty ? (
              <div className="py-12 text-center text-white/60">
                Start typing to search users…
              </div>
            ) : error ? (
              <div className="py-12 text-center text-red-400">{error}</div>
            ) : filtered.length === 0 ? (
              <div className="py-12 text-center text-white/60">
                No users found.
              </div>
            ) : (
              <>
                {filtered.map((u) => (
                  <button
                    key={String(u.id)}
                    onClick={() => onSelectUser(u)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/7 text-left"
                  >
                    <img
                      src={u.profilePicture || stockAvatar}
                      onError={(e) => {
                        const img = e.currentTarget as HTMLImageElement;
                        if (img.src !== stockAvatar) img.src = stockAvatar;
                      }}
                      alt={`${u.username} avatar`}
                      className="h-9 w-9 rounded-full object-cover"
                    />
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-white truncate">
                        {(u.firstName || "") + " " + (u.lastName || "")}
                      </div>
                      <div className="text-xs text-white/70 truncate">
                        @{u.username}
                      </div>
                    </div>
                  </button>
                ))}

                {hasMore && (
                  <div className="py-3 flex justify-center">
                    <button
                      onClick={loadMore}
                      disabled={loadingMore}
                      className="px-4 py-2 rounded-md border border-white/10 text-white/90 bg-white/5 hover:bg-white/7 disabled:opacity-60"
                    >
                      {loadingMore ? "Loading…" : "Load more"}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
