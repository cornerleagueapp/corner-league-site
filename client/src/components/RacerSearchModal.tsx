// /components/RacerSearchModal.tsx
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

type RacerLite = {
  id: string | number;
  racerName: string;
  racerImage?: string | null;
  location?: string | null;
  boatManufacturers?: string | null;
};

const HARD_CAP = 5000;
const LIMIT = 50;
const MIN_QUERY_LENGTH = 2;
const TARGET_MATCHES = 10;
const AUTOSCAN_MAX_PAGES = 10;

function toRacerLite(rec: any): RacerLite | null {
  if (!rec) return null;

  function firstNonEmpty(
    ...vals: Array<string | null | undefined>
  ): string | null {
    for (const v of vals) {
      if (typeof v === "string" && v.trim().length > 0) return v;
    }
    return null;
  }

  if (rec.athlete) {
    const a = rec.athlete;

    const name =
      firstNonEmpty(
        a?.name,
        rec?.name,
        rec?.fullName,
        rec?.displayName,
        a?.firstName && a?.lastName ? `${a.firstName} ${a.lastName}` : null,
        rec?.firstName && rec?.lastName
          ? `${rec.firstName} ${rec.lastName}`
          : null
      ) ?? "";

    if (!name.trim()) return null;

    const image = firstNonEmpty(
      a?.image as any,
      rec?.image as any,
      rec?.avatar as any,
      rec?.photo as any
    );

    const loc = firstNonEmpty(a?.origin, rec?.origin, rec?.city, rec?.country);

    return {
      id: rec.id ?? a.id ?? rec.uuid,
      racerName: name,
      racerImage: image ?? null,
      location: loc ?? null,
      boatManufacturers:
        rec.boatManufacturers ??
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

  // fallback flat-ish
  if (
    rec.name ||
    rec.origin ||
    rec.image ||
    rec.team ||
    rec.fullName ||
    rec.displayName ||
    (rec.firstName && rec.lastName)
  ) {
    const name =
      typeof rec.name === "string" && rec.name.trim()
        ? rec.name
        : typeof rec.fullName === "string" && rec.fullName.trim()
        ? rec.fullName
        : typeof rec.displayName === "string" && rec.displayName.trim()
        ? rec.displayName
        : rec.firstName && rec.lastName
        ? `${rec.firstName} ${rec.lastName}`
        : "";

    if (!name.trim()) return null;

    return {
      id: rec.id ?? rec.athleteId ?? rec.uuid,
      racerName: name,
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

  // already-compact form
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

  const hasMoreFallback = racers.length === usedLimit;
  const hasMore = hasMoreExplicit ?? hasMoreFallback;

  return { racers, hasMore };
}

function buildUrl(pageIndex: number, limit: number) {
  const page = pageIndex + 1;
  const p = new URLSearchParams();
  p.set("page", String(page));
  p.set("limit", String(limit));
  p.set("order", "DESC");
  p.set("sortBy", "createdAt");

  return `/jet-ski-racer-details?${p.toString()}`;
}

function matchesQuery(r: RacerLite, qNorm: string) {
  return [r.racerName, r.location, r.boatManufacturers]
    .filter(Boolean)
    .some((t) => String(t).toLowerCase().includes(qNorm));
}

function dedupeByIdAndName(list: RacerLite[]): RacerLite[] {
  const seen = new Set<string>();
  const out: RacerLite[] = [];
  for (const r of list) {
    const k =
      (r.id != null ? `id:${String(r.id)}` : "") +
      `|name:${String(r.racerName).trim().toLowerCase()}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(r);
  }
  return out;
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
      try {
        const path = buildUrl(idx, LIMIT);
        const res = await apiRequest<any>("GET", path);
        const { racers, hasMore } = extractRacers(res, LIMIT);
        return { racers, hasMore };
      } catch (e: any) {
        setError(e?.message || "Failed to load racers");
        return { racers: [], hasMore: false };
      }
    },
    []
  );

  // initial load (or when modal re-opens)
  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    setError(null);
    setAll([]);
    setHasMore(true);
    setPageIndex(0);
    setLoading(true);

    (async () => {
      const { racers, hasMore: more } = await fetchPage(0);
      if (cancelled) return;
      const next = dedupeByIdAndName(racers).slice(0, HARD_CAP);
      setAll(next);
      setHasMore(more && next.length < HARD_CAP);
      setPageIndex(1);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [open, fetchPage]);

  // infinite scroll loader
  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore || all.length >= HARD_CAP) return;
    setLoadingMore(true);
    try {
      const { racers, hasMore: more } = await fetchPage(pageIndex);
      const merged = dedupeByIdAndName([...all, ...racers]).slice(0, HARD_CAP);
      setAll(merged);
      setHasMore(more && merged.length < HARD_CAP);
      setPageIndex(pageIndex + 1);
    } finally {
      setLoadingMore(false);
    }
  }, [all, fetchPage, hasMore, loadingMore, pageIndex]);

  // scroll listener
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

  // client-side filter based on q
  const qNorm = q.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (qNorm.length < MIN_QUERY_LENGTH) return [] as RacerLite[];
    return all.filter((r) => matchesQuery(r, qNorm));
  }, [qNorm, all]);

  // auto-scan more pages while user is searching to try and surface deeper matches
  useEffect(() => {
    if (!open) return;
    if (qNorm.length < MIN_QUERY_LENGTH) return;
    if (!hasMore) return;

    let cancelled = false;

    (async () => {
      let pagesScanned = 0;
      while (
        !cancelled &&
        hasMore &&
        filtered.length < TARGET_MATCHES &&
        pagesScanned < AUTOSCAN_MAX_PAGES
      ) {
        if (loadingMore) break;
        await loadMore();
        pagesScanned += 1;
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
                    key={`${String(r.id)}-${i}`}
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
