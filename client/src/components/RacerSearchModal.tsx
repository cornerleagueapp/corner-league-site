// /components/RacerSearchModal.tsx
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { apiFetch, apiRequest } from "@/lib/apiClient";
import { cn } from "@/lib/utils";
import stockAvatar from "@/assets/stockprofilepicture.jpeg";

type RacerLite = {
  id: string | number;
  racerName: string;
  racerImage?: string | null;
  location?: string | null;
  boatManufacturers?: string | null;
};

const LIMIT_CANDIDATES = [50, 25, 10];
const HARD_CAP = 5000;

const DEBUG = true;

const SHOW_ALL_WHEN_EMPTY = true;
const SHOW_ALL_LIMIT = 50;

// --- helpers ---
function toRacerLite(rec: any): RacerLite | null {
  if (!rec) return null;

  if (rec.athlete) {
    const a = rec.athlete;
    return {
      id: rec.id ?? a.id ?? rec.uuid,
      racerName: a.name ?? "",
      racerImage: a.image ?? null,
      location: a.origin ?? null,
      boatManufacturers: rec.boatManufacturers ?? null,
    };
  }

  if (rec.name || rec.origin || rec.image || rec.team) {
    return {
      id: rec.id ?? rec.athleteId ?? rec.uuid,
      racerName: rec.name ?? "",
      racerImage: rec.image ?? null,
      location: rec.origin ?? null,
      boatManufacturers:
        rec.team?.name ??
        rec.teamName ??
        (Array.isArray(rec.teams)
          ? rec.teams
              .map((t: any) => t?.name)
              .filter(Boolean)
              .join(", ")
          : null),
    };
  }

  if (
    rec.racerName ||
    rec.racerImage ||
    rec.location ||
    rec.boatManufacturers
  ) {
    return {
      id: rec.id,
      racerName: rec.racerName ?? "",
      racerImage: rec.racerImage ?? null,
      location: rec.location ?? null,
      boatManufacturers: rec.boatManufacturers ?? null,
    };
  }

  const guessName =
    rec.fullName ||
    rec.displayName ||
    (rec.firstName && rec.lastName ? `${rec.firstName} ${rec.lastName}` : null);

  if (guessName) {
    return {
      id: rec.id ?? rec.uuid,
      racerName: guessName,
      racerImage: rec.avatar ?? rec.photo ?? null,
      location: rec.city ?? rec.country ?? null,
      boatManufacturers: rec.manufacturer ?? rec.brand ?? null,
    };
  }
  return null;
}

function extractRacers(payload: any, usedLimit: number) {
  const buckets = [
    payload?.items,
    payload?.data?.items,
    payload?.racers,
    payload?.data?.racers,
    payload?.data,
    Array.isArray(payload) ? payload : null,
  ].filter(Boolean) as any[];

  const rawList = (buckets.find(Array.isArray) as any[]) ?? [];
  const racers = rawList.map(toRacerLite).filter(Boolean) as RacerLite[];

  const meta = payload?.meta ?? payload?.data?.meta ?? {};
  const hasMoreExplicit =
    typeof meta?.hasNextPage === "boolean"
      ? meta.hasNextPage
      : typeof meta?.nextPage === "number"
      ? true
      : undefined;

  const hasMoreInferred = racers.length > 0 && racers.length === usedLimit;
  return { racers, hasMore: hasMoreExplicit ?? hasMoreInferred ?? false };
}

function buildUrls(pageIndex: number, limit: number) {
  const page = pageIndex + 1;
  return [
    `/athletes?limit=${limit}&page=${page}`,
    `/jet-ski-racer-details?limit=${limit}&page=${page}`,
  ];
}

export default function RacerSearchModal({
  open,
  onClose,
  onSelectRacer,
}: {
  open: boolean;
  onClose: () => void;
  onSelectRacer: (r: RacerLite) => void;
}) {
  const [q, setQ] = useState("");
  const [all, setAll] = useState<RacerLite[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  const [debugLast, setDebugLast] = useState<{
    path?: string;
    count?: number;
  } | null>(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    if (open) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev || "";
    };
  }, [open]);

  const fetchPage = useCallback(
    async (idx: number): Promise<{ racers: RacerLite[]; hasMore: boolean }> => {
      setError(null);

      for (const limit of LIMIT_CANDIDATES) {
        const [athletesUrl, legacyUrl] = buildUrls(idx, limit);

        try {
          const res1 = await apiRequest<any>("GET", athletesUrl);
          const { racers, hasMore } = extractRacers(res1, limit);
          if (DEBUG) {
            // eslint-disable-next-line no-console
            console.log("[RacerSearch] GET", athletesUrl, {
              raw: res1,
              mappedCount: racers.length,
              hasMore,
            });
            setDebugLast({ path: athletesUrl, count: racers.length });
          }
          if (racers.length || hasMore) {
            return { racers, hasMore };
          }
        } catch (e: any) {
          if (DEBUG) {
            // eslint-disable-next-line no-console
            console.warn("[RacerSearch] athletes fetch error", e);
          }
          if (e?.status === 401 || e?.status === 403) {
            throw new Error("Please sign in to search racers.");
          }
        }

        try {
          const res2 = await apiRequest<any>("GET", legacyUrl);
          const { racers, hasMore } = extractRacers(res2, limit);
          if (DEBUG) {
            // eslint-disable-next-line no-console
            console.log("[RacerSearch] GET", legacyUrl, {
              raw: res2,
              mappedCount: racers.length,
              hasMore,
            });
            setDebugLast({ path: legacyUrl, count: racers.length });
          }
          if (racers.length || hasMore) {
            return { racers, hasMore };
          }
        } catch (e) {
          if (DEBUG) {
            // eslint-disable-next-line no-console
            console.warn("[RacerSearch] legacy fetch error", e);
          }
        }
      }

      for (const path of ["/athletes", "/jet-ski-racer-details"]) {
        try {
          const fb = await apiRequest<any>("GET", path);
          const { racers } = extractRacers(fb, 999999);
          if (DEBUG) {
            // eslint-disable-next-line no-console
            console.log("[RacerSearch] FALLBACK GET", path, {
              raw: fb,
              mappedCount: racers.length,
            });
            setDebugLast({ path, count: racers.length });
          }
          return { racers, hasMore: false };
        } catch (e: any) {
          if (DEBUG) {
            // eslint-disable-next-line no-console
            console.warn("[RacerSearch] fallback fetch error", path, e);
          }
          if (e?.status === 401 || e?.status === 403) {
            throw new Error("Please sign in to search racers.");
          }
        }
      }

      throw new Error("Failed to load racers");
    },
    []
  );

  // initial load when opened
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
        const { racers, hasMore: more } = await fetchPage(0);
        if (cancelled) return;
        const next = racers.slice(0, HARD_CAP);
        if (DEBUG) {
          // eslint-disable-next-line no-console
          console.log("[RacerSearch] initial load mappedCount", next.length);
        }
        setAll(next);
        setHasMore(more && next.length < HARD_CAP);
        setPageIndex(1);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load racers");
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
      const { racers, hasMore: more } = await fetchPage(pageIndex);
      const merged = [...all, ...racers].slice(0, HARD_CAP);
      if (DEBUG) {
        // eslint-disable-next-line no-console
        console.log("[RacerSearch] loadMore mergedCount", merged.length);
      }
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

  // client-side filter after type
  const qNorm = q.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!qNorm) {
      if (SHOW_ALL_WHEN_EMPTY) return all.slice(0, SHOW_ALL_LIMIT);
      return [] as RacerLite[];
    }
    return all.filter((r) =>
      [r.racerName, r.location, r.boatManufacturers]
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
                placeholder="Search racers…"
                className="flex-1 h-10 rounded-lg bg-white/5 border border-white/10 px-3 text-sm outline-none placeholder:text-white/40 focus:bg-white/7 text-white"
              />
              <button
                onClick={onClose}
                className="h-9 px-3 rounded-md border border-white/10 text-white/80 hover:text-white"
              >
                Close
              </button>
            </div>

            {/* DEBUG: tiny status line to confirm counts */}
            {DEBUG && (
              <div className="mt-2 text-[11px] text-white/50">
                Loaded: {all.length} total
                {debugLast?.path ? ` • last: ${debugLast.path}` : ""}
                {typeof debugLast?.count === "number"
                  ? ` • lastCount: ${debugLast.count}`
                  : ""}
              </div>
            )}
          </div>

          <div
            ref={scrollerRef}
            className="p-2 max-h[calc(100vh-60px)] md:max-h-[calc(100vh-60px)] overflow-y-auto"
          >
            {error ? (
              <div className="py-12 text-center text-red-400">{error}</div>
            ) : loading ? (
              <div className="py-12 text-center text-white/60">Loading…</div>
            ) : qEmpty && !SHOW_ALL_WHEN_EMPTY && all.length === 0 ? (
              <div className="py-12 text-center text-white/60">
                Start typing to search racers…
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-12 text-center text-white/60">
                No racers found.
              </div>
            ) : (
              <>
                {filtered.map((r) => (
                  <button
                    key={String(r.id)}
                    onClick={() => onSelectRacer(r)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/7 text-left"
                  >
                    <img
                      src={r.racerImage || stockAvatar}
                      onError={(e) => {
                        const img = e.currentTarget as HTMLImageElement;
                        if (img.src !== stockAvatar) img.src = stockAvatar;
                      }}
                      className="h-9 w-9 rounded-full object-cover"
                    />
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-white truncate">
                        {r.racerName}
                      </div>
                      <div className="text-xs text-white/70 truncate">
                        {(r.location || "").toString()}
                        {r.boatManufacturers ? ` • ${r.boatManufacturers}` : ""}
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
