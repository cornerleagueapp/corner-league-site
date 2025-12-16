// components/AthleteSearchModal.tsx
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { apiRequest } from "@/lib/apiClient";
import { cn } from "@/lib/utils";
import stockAvatar from "@/assets/stockprofilepicture.jpeg";

export type AthleteLite = {
  id: string | number;
  detailId?: string | number;
  name: string;
  image?: string | null;
  location?: string | null;
  boatManufacturers?: string | null;
};

const HARD_CAP = 5000;
const LIMIT = 50;
const MIN_QUERY_LENGTH = 2;
const TARGET_MATCHES = 10;
const AUTOSCAN_MAX_PAGES = 10;

function firstNonEmpty(...vals: Array<string | null | undefined>) {
  for (const v of vals) if (typeof v === "string" && v.trim()) return v;
  return null;
}

function toAthleteLite(rec: any): AthleteLite | null {
  if (!rec) return null;

  const a = rec.athlete ?? rec;

  const name =
    firstNonEmpty(
      a?.name,
      rec?.fullName,
      rec?.displayName,
      a?.firstName && a?.lastName ? `${a.firstName} ${a.lastName}` : null
    ) ?? "";
  if (!name.trim()) return null;

  const image = firstNonEmpty(a?.image, rec?.image, rec?.avatar, rec?.photo);
  const loc = firstNonEmpty(a?.origin, rec?.origin, rec?.city, rec?.country);
  const manufacturers =
    rec.boatManufacturers ??
    rec.team?.name ??
    rec.teamName ??
    (Array.isArray(rec.teams)
      ? rec.teams
          .map((t: any) => t?.name)
          .filter(Boolean)
          .join(", ")
      : null);

  const athleteId = rec?.athlete?.id ?? null;
  if (!athleteId) return null;

  const detailId = rec?.id ?? rec?.detailId ?? undefined;

  return {
    id: athleteId,
    detailId,
    name,
    image: image ?? null,
    location: loc ?? null,
    boatManufacturers: manufacturers ?? null,
  };
}

function extractAthletes(payload: any, usedLimit: number) {
  const buckets = [
    payload?.items,
    payload?.data?.items,
    payload?.racers,
    payload?.data?.racers,
    payload?.athletes,
    payload?.data?.athletes,
    payload?.data,
    Array.isArray(payload) ? payload : null,
  ].filter(Boolean) as any[];

  const raw = (buckets.find(Array.isArray) as any[]) ?? [];
  const athletes = raw.map(toAthleteLite).filter(Boolean) as AthleteLite[];

  const meta = payload?.meta ?? payload?.data?.meta ?? {};
  const hasMoreExplicit =
    typeof meta?.hasNextPage === "boolean"
      ? meta.hasNextPage
      : typeof meta?.nextPage === "number"
      ? true
      : undefined;

  const hasMore = hasMoreExplicit ?? athletes.length === usedLimit;
  return { athletes, hasMore };
}

function buildUrl(pageIndex: number, limit: number) {
  const p = new URLSearchParams();
  p.set("page", String(pageIndex + 1));
  p.set("limit", String(limit));
  p.set("order", "DESC");
  p.set("sortBy", "createdAt");
  // Endpoint you already use to list racers:
  return `/jet-ski-racer-details?${p.toString()}`;
}

function matchesQuery(a: AthleteLite, qNorm: string) {
  return [a.name, a.location, a.boatManufacturers]
    .filter(Boolean)
    .some((t) => String(t).toLowerCase().includes(qNorm));
}

function dedupe(list: AthleteLite[]) {
  const seen = new Set<string>();
  const out: AthleteLite[] = [];
  for (const r of list) {
    const key =
      (r.id != null ? `id:${String(r.id)}` : "") +
      `|name:${String(r.name).trim().toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(r);
  }
  return out;
}

export default function AthleteSearchModal({
  open,
  onClose,
  onPick, // single-pick callback
}: {
  open: boolean;
  onClose: () => void;
  onPick: (athlete: AthleteLite) => void;
}) {
  const [q, setQ] = useState("");
  const [all, setAll] = useState<AthleteLite[]>([]);
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

  const fetchPage = useCallback(async (idx: number) => {
    setError(null);
    try {
      const path = buildUrl(idx, LIMIT);
      const res = await apiRequest<any>("GET", path);
      return extractAthletes(res, LIMIT);
    } catch (e: any) {
      setError(e?.message || "Failed to load athletes");
      return { athletes: [], hasMore: false };
    }
  }, []);

  // initial load
  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    setError(null);
    setAll([]);
    setHasMore(true);
    setPageIndex(0);
    setLoading(true);

    (async () => {
      const { athletes, hasMore } = await fetchPage(0);
      if (cancelled) return;
      const next = dedupe(athletes).slice(0, HARD_CAP);
      setAll(next);
      setHasMore(hasMore && next.length < HARD_CAP);
      setPageIndex(1);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [open, fetchPage]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore || all.length >= HARD_CAP) return;
    setLoadingMore(true);
    try {
      const { athletes, hasMore: more } = await fetchPage(pageIndex);
      const merged = dedupe([...all, ...athletes]).slice(0, HARD_CAP);
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

  const qNorm = q.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (qNorm.length < MIN_QUERY_LENGTH) return [] as AthleteLite[];
    return all.filter((r) => matchesQuery(r, qNorm));
  }, [qNorm, all]);

  // auto-scan more pages to surface deeper matches
  useEffect(() => {
    if (!open) return;
    if (qNorm.length < MIN_QUERY_LENGTH) return;
    if (!hasMore) return;

    let cancelled = false;
    (async () => {
      let pages = 0;
      while (
        !cancelled &&
        hasMore &&
        filtered.length < TARGET_MATCHES &&
        pages < AUTOSCAN_MAX_PAGES
      ) {
        if (loadingMore) break;
        await loadMore();
        pages += 1;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, qNorm, filtered.length, hasMore, loadMore, loadingMore]);

  if (!open) return null;

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
                className="flex-1 h-10 rounded-lg bg-white/5 border border-white/10 px-3 text-sm outline-none placeholder:text-white/60 focus:bg-white/7 text-white"
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
            className="p-2 max-h-[calc(100vh-60px)] overflow-y-auto"
          >
            {qNorm.length < MIN_QUERY_LENGTH ? (
              <div className="py-12 text-center text-white/60">
                Start typing at least {MIN_QUERY_LENGTH} characters to search
                racers…
              </div>
            ) : error ? (
              <div className="py-12 text-center text-red-400">{error}</div>
            ) : loading && all.length === 0 ? (
              <div className="py-12 text-center text-white/60">Loading…</div>
            ) : filtered.length === 0 ? (
              <div className="py-12 text-center text-white/60">
                No racers found.
              </div>
            ) : (
              <>
                {filtered.map((r, i) => (
                  <button
                    key={`${String(r.id)}-${String(r.detailId ?? i)}`}
                    onClick={() => {
                      onPick(r);
                      onClose();
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/7 text-left"
                  >
                    <img
                      src={r.image || stockAvatar}
                      onError={(e) => {
                        const img = e.currentTarget as HTMLImageElement;
                        if (img.src !== stockAvatar) img.src = stockAvatar;
                      }}
                      className="h-9 w-9 rounded-full object-cover"
                    />
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-white truncate">
                        {r.name}
                      </div>
                      <div className="text-xs text-white/70 truncate">
                        {(r.location || "").toString()}
                        {r.boatManufacturers ? ` • ${r.boatManufacturers}` : ""}
                      </div>
                    </div>
                  </button>
                ))}
                {loadingMore && (
                  <div className="py-4 text-center text-xs text-white/50">
                    Loading more…
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
