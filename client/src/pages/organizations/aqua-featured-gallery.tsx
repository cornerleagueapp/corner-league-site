import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft,
  Camera,
  Image as ImageIcon,
  Play,
  Search,
  Sparkles,
  UserCircle2,
} from "lucide-react";
import { apiRequest } from "@/lib/apiClient";
import { PageSEO } from "@/seo/usePageSEO";

type GalleryAthlete = {
  id?: string | null;
  name?: string | null;
  nickname?: string | null;
  profileImageUrl?: string | null;
  imageUrl?: string | null;
};

type GalleryItem = {
  id: string;
  athleteId?: string | null;
  type?: "image" | "video" | string | null;
  url?: string | null;
  mediaUrl?: string | null;
  thumbnailUrl?: string | null;
  title?: string | null;
  caption?: string | null;
  createdAt?: string | null;
  athlete?: GalleryAthlete | null;
};

function getMediaUrl(item: GalleryItem) {
  return item.thumbnailUrl || item.mediaUrl || item.url || "";
}

function getFullMediaUrl(item: GalleryItem) {
  return item.mediaUrl || item.url || item.thumbnailUrl || "";
}

function getAthleteName(item: GalleryItem) {
  return item.athlete?.name || item.athlete?.nickname || "Corner League Racer";
}

function getAthleteImage(item: GalleryItem) {
  return item.athlete?.profileImageUrl || item.athlete?.imageUrl || "";
}

function formatDate(value?: string | null) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";

  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

async function fetchFeaturedGallery(limit: number) {
  const res = await apiRequest<any>(
    "GET",
    `/athletes/featured-gallery?limit=${encodeURIComponent(String(limit))}`,
  );

  const list =
    res?.media ??
    res?.gallery ??
    res?.data?.media ??
    res?.data?.gallery ??
    res?.data ??
    res;

  return Array.isArray(list) ? (list as GalleryItem[]) : [];
}

export default function AquaFeaturedGalleryPage() {
  const [, navigate] = useLocation();

  const [items, setItems] = useState<GalleryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "image" | "video">("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        const list = await fetchFeaturedGallery(60);

        if (!cancelled) {
          setItems(list);
        }
      } catch {
        if (!cancelled) {
          setItems([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedItem) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previous || "";
    };
  }, [selectedItem]);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();

    return items.filter((item) => {
      const type = String(item.type || "image").toLowerCase();

      if (filter !== "all" && type !== filter) {
        return false;
      }

      if (!q) return true;

      return [
        item.title,
        item.caption,
        getAthleteName(item),
        item.athlete?.nickname,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [filter, items, query]);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#030913] text-white">
      <PageSEO
        title="Aqua Featured Gallery • Corner League"
        description="Featured racer photos, videos, highlights, and race day moments from the Corner League Aqua community."
        canonicalPath="/scores/aqua/gallery"
      />

      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[#030913]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.13),transparent_30%),radial-gradient(circle_at_82%_18%,rgba(255,107,53,0.10),transparent_28%),radial-gradient(circle_at_50%_55%,rgba(7,17,31,0.82),transparent_58%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,9,19,0.20)_0%,rgba(3,9,19,0.76)_52%,rgba(3,9,19,0.98)_100%)]" />
        <div className="absolute inset-0 opacity-[0.035] [background-image:linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:72px_72px]" />
      </div>

      <main className="relative z-10 mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => navigate("/scores/aqua")}
          className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-300/10 px-4 py-2 text-sm font-bold text-cyan-100 transition hover:bg-cyan-300 hover:text-[#06111d]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Aqua Hub
        </button>

        <section className="overflow-hidden rounded-[38px] border border-cyan-300/10 bg-[linear-gradient(135deg,rgba(34,211,238,0.12)_0%,rgba(7,17,31,0.94)_48%,rgba(255,107,53,0.10)_100%)] p-6 shadow-[0_34px_100px_rgba(0,0,0,0.46)] sm:p-8 lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_360px] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200">
                <Sparkles className="h-3.5 w-3.5" />
                Featured Racer Gallery
              </div>

              <h1 className="mt-6 max-w-4xl bg-[linear-gradient(90deg,#FFFFFF_0%,#7CF4FF_50%,#FF7849_100%)] bg-clip-text text-4xl font-black uppercase italic tracking-[0.04em] text-transparent sm:text-6xl lg:text-7xl">
                Aqua Race Day Media
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300">
                Browse featured photos, videos, sponsor moments, highlights, and
                behind-the-scenes content from racer profile galleries.
              </p>

              <div className="mt-6 flex flex-wrap gap-2 text-xs text-white/55">
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
                  Featured media:{" "}
                  <span className="font-bold text-white">{items.length}</span>
                </span>

                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
                  Sport: <span className="font-bold text-white">Aqua</span>
                </span>
              </div>
            </div>

            <div className="rounded-[28px] border border-cyan-300/10 bg-black/25 p-4">
              <div className="mb-3 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-300/70">
                Search Gallery
              </div>

              <div className="flex h-12 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4">
                <Search className="h-4 w-4 text-white/35" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search racer, caption, title..."
                  className="h-full min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/25"
                />
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2">
                {(["all", "image", "video"] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFilter(value)}
                    className={`rounded-2xl border px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] transition ${
                      filter === value
                        ? "border-cyan-300/30 bg-cyan-300 text-[#06111d]"
                        : "border-white/10 bg-white/[0.04] text-white/55 hover:bg-white/10"
                    }`}
                  >
                    {value === "all"
                      ? "All"
                      : value === "image"
                        ? "Photos"
                        : "Videos"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8">
          {loading ? (
            <div className="rounded-[30px] border border-cyan-300/10 bg-[#07111F]/80 p-8 text-center text-white/55 shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
              Loading featured gallery…
            </div>
          ) : filteredItems.length ? (
            <div className="columns-1 gap-5 sm:columns-2 xl:columns-3">
              {filteredItems.map((item, index) => {
                const mediaUrl = getMediaUrl(item);
                const athleteName = getAthleteName(item);
                const athleteImage = getAthleteImage(item);
                const tall = index % 5 === 0 || index % 7 === 0;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedItem(item)}
                    className="group mb-5 block w-full break-inside-avoid overflow-hidden rounded-[28px] border border-cyan-300/10 bg-[#07111F]/80 p-3 text-left shadow-[0_24px_70px_rgba(0,0,0,0.26)] transition hover:-translate-y-1 hover:border-cyan-300/25"
                  >
                    <div
                      className={`relative overflow-hidden rounded-[22px] bg-black ${
                        tall ? "aspect-[4/5]" : "aspect-[4/3]"
                      }`}
                    >
                      {mediaUrl ? (
                        <img
                          src={mediaUrl}
                          alt={item.title || athleteName}
                          className="h-full w-full object-cover opacity-85 transition duration-500 group-hover:scale-105 group-hover:opacity-100"
                          loading="lazy"
                        />
                      ) : (
                        <div className="grid h-full w-full place-items-center bg-[#06111d]">
                          <ImageIcon className="h-10 w-10 text-cyan-100/60" />
                        </div>
                      )}

                      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,9,19,0.04)_0%,rgba(3,9,19,0.14)_42%,rgba(3,9,19,0.84)_100%)]" />

                      <div className="absolute left-3 top-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/45 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-white backdrop-blur-md">
                        {String(item.type || "image").toLowerCase() ===
                        "video" ? (
                          <Play className="h-3.5 w-3.5" />
                        ) : (
                          <Camera className="h-3.5 w-3.5" />
                        )}
                        {String(item.type || "image").toLowerCase() === "video"
                          ? "Video"
                          : "Photo"}
                      </div>
                    </div>

                    <div className="px-1 py-4">
                      <div className="flex items-center gap-3">
                        <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full border border-cyan-300/25 bg-cyan-300/15">
                          {athleteImage ? (
                            <img
                              src={athleteImage}
                              alt={athleteName}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <UserCircle2 className="h-5 w-5 text-cyan-100" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="truncate text-sm font-black text-white">
                            {athleteName}
                          </div>
                          <div className="truncate text-xs text-white/40">
                            {formatDate(item.createdAt) || "Featured media"}
                          </div>
                        </div>
                      </div>

                      <h3 className="mt-4 line-clamp-2 text-lg font-black uppercase leading-tight text-white">
                        {item.title || item.caption || "Race Day Highlight"}
                      </h3>

                      {item.caption ? (
                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/55">
                          {item.caption}
                        </p>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="rounded-[30px] border border-cyan-300/10 bg-[#07111F]/80 p-8 text-center shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-cyan-300/20 bg-cyan-300/10">
                <Camera className="h-6 w-6 text-cyan-100" />
              </div>

              <h2 className="mt-5 text-2xl font-black text-white">
                No featured gallery media yet
              </h2>

              <p className="mx-auto mt-2 max-w-xl text-sm leading-7 text-white/50">
                Once racers mark photos or videos as featured, they will appear
                here for the Aqua community.
              </p>
            </div>
          )}
        </section>
      </main>

      {selectedItem ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center px-4">
          <button
            type="button"
            aria-label="Close media preview"
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            onClick={() => setSelectedItem(null)}
          />

          <div className="relative z-10 max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-[30px] border border-cyan-300/10 bg-[#07111F] shadow-[0_34px_100px_rgba(0,0,0,0.56)]">
            <div className="grid max-h-[92vh] grid-cols-1 overflow-y-auto lg:grid-cols-[1fr_340px]">
              <div className="grid min-h-[320px] place-items-center bg-black">
                {String(selectedItem.type || "image").toLowerCase() ===
                "video" ? (
                  <video
                    src={getFullMediaUrl(selectedItem)}
                    controls
                    className="max-h-[72vh] w-full object-contain"
                  />
                ) : (
                  <img
                    src={getFullMediaUrl(selectedItem)}
                    alt={selectedItem.title || "Gallery media"}
                    className="max-h-[72vh] w-full object-contain"
                  />
                )}
              </div>

              <aside className="p-5">
                <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full border border-cyan-300/25 bg-cyan-300/15">
                    {getAthleteImage(selectedItem) ? (
                      <img
                        src={getAthleteImage(selectedItem)}
                        alt={getAthleteName(selectedItem)}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <UserCircle2 className="h-6 w-6 text-cyan-100" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="truncate text-sm font-black text-white">
                      {getAthleteName(selectedItem)}
                    </div>
                    <div className="text-xs text-white/40">
                      {formatDate(selectedItem.createdAt)}
                    </div>
                  </div>
                </div>

                <h2 className="mt-6 text-2xl font-black uppercase leading-tight text-white">
                  {selectedItem.title || "Race Day Highlight"}
                </h2>

                {selectedItem.caption ? (
                  <p className="mt-3 text-sm leading-7 text-white/60">
                    {selectedItem.caption}
                  </p>
                ) : null}

                {selectedItem.athleteId ? (
                  <button
                    type="button"
                    onClick={() =>
                      navigate(
                        `/racer/${encodeURIComponent(String(selectedItem.athleteId))}?kind=athlete`,
                      )
                    }
                    className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-full bg-cyan-300 px-5 text-xs font-black uppercase tracking-[0.14em] text-[#06111d] transition hover:bg-cyan-200"
                  >
                    View Racer Profile
                  </button>
                ) : null}

                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="mt-3 inline-flex h-11 w-full items-center justify-center rounded-full border border-white/10 bg-white/[0.04] px-5 text-xs font-black uppercase tracking-[0.14em] text-white/70 transition hover:bg-white/10"
                >
                  Close
                </button>
              </aside>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
