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
import { Search, X, ChevronRight } from "lucide-react";

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
          : null,
      ) ?? "";

    if (!name.trim()) return null;

    const image = firstNonEmpty(
      a?.image as any,
      rec?.image as any,
      rec?.avatar as any,
      rec?.photo as any,
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
    [],
  );

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
    if (qNorm.length < MIN_QUERY_LENGTH) return [] as RacerLite[];
    return all.filter((r) => matchesQuery(r, qNorm));
  }, [qNorm, all]);

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
    <div className="fixed inset-0 z-[80] overflow-hidden overscroll-none">
      <button
        aria-label="Close"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative z-10 flex h-full items-start justify-center p-3 pt-4 sm:p-4 md:mx-auto md:mt-16 md:h-auto md:max-w-2xl md:px-4">
        <div
          className={cn(
            "box-border flex h-[calc(100vh-16px)] w-[calc(100vw-24px)] min-w-0 max-w-full flex-col overflow-hidden border border-white/10 bg-[#07131f] text-white shadow-2xl",
            "rounded-[24px] md:h-auto md:max-h-[82vh] md:w-full md:rounded-[28px]",
            "bg-[linear-gradient(180deg,rgba(8,24,39,0.98)_0%,rgba(5,17,29,0.98)_100%)]",
          )}
        >
          <div className="sticky top-0 z-10 border-b border-white/10 bg-[linear-gradient(180deg,rgba(8,24,39,0.98)_0%,rgba(6,19,31,0.98)_100%)] px-3 py-4 sm:px-4 md:px-5">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/15 bg-cyan-400/8 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
                  Aqua Search
                </div>
                <h2 className="mt-3 text-lg font-semibold text-white sm:text-xl">
                  Find a Racer
                </h2>
                <p className="mt-1 text-sm text-white/55">
                  Search by racer name, location, or manufacturer.
                </p>
              </div>

              <button
                onClick={onClose}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/80 transition hover:bg-white/10 hover:text-white"
                aria-label="Close search"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="relative min-w-0">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search racers..."
                className="h-12 w-full min-w-0 rounded-2xl border border-white/10 bg-white/[0.05] pl-10 pr-4 text-sm text-white outline-none placeholder:text-white/35 transition focus:border-cyan-300/30 focus:bg-white/[0.07]"
              />
            </div>
          </div>

          <div
            ref={scrollerRef}
            className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden px-2.5 py-3 sm:px-3 md:px-4 md:py-4"
          >
            {qNorm.length < MIN_QUERY_LENGTH ? (
              <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-[24px] border border-dashed border-white/10 bg-white/[0.03] px-5 text-center">
                <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/15 bg-cyan-400/8 text-cyan-300">
                  <Search className="h-5 w-5" />
                </div>
                <div className="text-base font-semibold text-white">
                  Start searching
                </div>
                <div className="mt-2 max-w-md text-sm leading-7 text-white/55">
                  Type at least {MIN_QUERY_LENGTH} characters to search racers
                  by name, hometown, or manufacturer.
                </div>
              </div>
            ) : error ? (
              <div className="flex min-h-[40vh] items-center justify-center rounded-[24px] border border-red-500/25 bg-red-500/10 px-6 text-center text-red-300">
                {error}
              </div>
            ) : loading && all.length === 0 ? (
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex min-w-0 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3"
                  >
                    <div className="h-11 w-11 shrink-0 animate-pulse rounded-full bg-white/10" />
                    <div className="min-w-0 flex-1">
                      <div className="h-4 w-40 animate-pulse rounded bg-white/10" />
                      <div className="mt-2 h-3 w-40 max-w-full animate-pulse rounded bg-white/5 sm:w-56" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-[24px] border border-white/10 bg-white/[0.03] px-6 text-center">
                <div className="text-base font-semibold text-white">
                  No racers found
                </div>
                <div className="mt-2 max-w-md text-sm leading-7 text-white/55">
                  Try a different name, manufacturer, or location.
                </div>
              </div>
            ) : (
              <>
                <div className="mb-3 px-1 text-xs uppercase tracking-[0.16em] text-white/45">
                  {filtered.length} match{filtered.length === 1 ? "" : "es"}
                </div>

                <div className="space-y-3">
                  {filtered.map((r, i) => (
                    <button
                      key={`${String(r.id)}-${i}`}
                      onClick={() => onSelectRacer(r)}
                      className="group flex w-full min-w-0 items-center gap-3 rounded-[22px] border border-white/10 bg-white/[0.04] p-3 text-left transition hover:border-cyan-300/25 hover:bg-white/[0.06]"
                    >
                      <img
                        src={r.racerImage || stockAvatar}
                        onError={(e) => {
                          const img = e.currentTarget as HTMLImageElement;
                          if (img.src !== stockAvatar) img.src = stockAvatar;
                        }}
                        className="h-12 w-12 shrink-0 rounded-full border border-white/10 object-cover"
                      />

                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-white sm:text-base">
                          {r.racerName}
                        </div>

                        <div className="mt-1 truncate text-xs text-white/60 sm:text-sm">
                          {(r.location || "").toString()}
                          {r.boatManufacturers
                            ? ` • ${r.boatManufacturers}`
                            : ""}
                        </div>
                      </div>

                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-cyan-300 transition group-hover:border-cyan-300/25 group-hover:bg-cyan-400/8">
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    </button>
                  ))}
                </div>

                {loadingMore && (
                  <div className="py-5 text-center text-xs uppercase tracking-[0.14em] text-white/45">
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
