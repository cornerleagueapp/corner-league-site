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
  racerProfileId?: string | null;
  jetSkiRacerDetailsId?: string | null;
  type?: "image" | "video" | string | null;
  url?: string | null;
  mediaUrl?: string | null;
  thumbnailUrl?: string | null;
  title?: string | null;
  caption?: string | null;
  createdAt?: string | null;
  athlete?: GalleryAthlete | null;
  racerProfile?: {
    id?: string | null;
    athleteId?: string | null;
    name?: string | null;
  } | null;
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

function getRacerProfileId(item: GalleryItem) {
  return (
    item.racerProfileId ||
    item.jetSkiRacerDetailsId ||
    item.racerProfile?.id ||
    ""
  );
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
    <div className="relative min-h-screen overflow-x-hidden bg-cl-canvas text-cl-ink">
      <PageSEO
        title="Aqua Featured Gallery • Corner League"
        description="Featured racer photos, videos, highlights, and race day moments from the Corner League Aqua community."
        canonicalPath="/scores/aqua/gallery"
      />

      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-cl-canvas" />


        <div className="absolute inset-0 opacity-[0.035] [background-image:linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:72px_72px]" />
      </div>

      <main className="relative z-10 mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => navigate("/scores/aqua")}
          className="mb-5 inline-flex items-center gap-2 rounded-full border border-cl-accent/15 bg-cl-accent/10 px-4 py-2 text-sm font-bold text-cl-accent transition hover:bg-cl-accent hover:text-cl-contrast"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Aqua Hub
        </button>

        <section className="overflow-hidden rounded-[38px] border border-cl-accent/10 cl-panel-wash p-6 shadow-cl-panel sm:p-8 lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_360px] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-cl-accent/25 bg-cl-accent/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-cl-accent">
                <Sparkles className="h-3.5 w-3.5" />
                Featured Racer Gallery
              </div>

              <h1 className="mt-6 max-w-4xl cl-title-accent  text-4xl font-black uppercase italic tracking-[0.04em]  sm:text-6xl lg:text-7xl">
                Aqua Race Day Media
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-8 text-cl-muted">
                Browse featured photos, videos, sponsor moments, highlights, and
                behind-the-scenes content from racer profile galleries.
              </p>

              <div className="mt-6 flex flex-wrap gap-2 text-xs text-cl-muted">
                <span className="rounded-full border border-cl-border bg-cl-subtle px-3 py-1.5">
                  Featured media:{" "}
                  <span className="font-bold text-cl-ink">{items.length}</span>
                </span>

                <span className="rounded-full border border-cl-border bg-cl-subtle px-3 py-1.5">
                  Sport: <span className="font-bold text-cl-ink">Aqua</span>
                </span>
              </div>
            </div>

            <div className="rounded-[28px] border border-cl-accent/10 bg-cl-subtle p-4">
              <div className="mb-3 text-[10px] font-black uppercase tracking-[0.18em] text-cl-accent">
                Search Gallery
              </div>

              <div className="flex h-12 items-center gap-3 rounded-2xl border border-cl-border bg-cl-subtle px-4">
                <Search className="h-4 w-4 text-cl-muted" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search racer, caption, title..."
                  className="h-full min-w-0 flex-1 bg-transparent text-sm text-cl-ink outline-none placeholder:text-cl-muted"
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
                        ? "border-cl-accent/30 bg-cl-accent text-cl-contrast"
                        : "border-cl-border bg-cl-subtle text-cl-muted hover:bg-cl-subtle"
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
            <div className="rounded-[30px] border border-cl-accent/10 bg-cl-surface p-8 text-center text-cl-muted shadow-cl-panel">
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
                    className="group mb-5 block w-full break-inside-avoid overflow-hidden rounded-[28px] border border-cl-accent/10 bg-cl-surface p-3 text-left shadow-cl-panel transition hover:-translate-y-1 hover:border-cl-accent/25"
                  >
                    <div
                      className={`relative overflow-hidden rounded-[22px] bg-cl-canvas ${
                        tall ? "aspect-[4/5]" : "aspect-[4/3]"
                      }`}
                    >
                      {mediaUrl ? (
                        <img
                          src={mediaUrl}
                          alt={item.title || athleteName}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="grid h-full w-full place-items-center bg-cl-surface">
                          <ImageIcon className="h-10 w-10 text-cl-accent" />
                        </div>
                      )}



                      <div className="absolute left-3 top-3 inline-flex items-center gap-2 rounded-full border border-cl-border bg-cl-subtle px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-cl-ink backdrop-blur-md">
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
                        <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full border border-cl-accent/25 bg-cl-accent/15">
                          {athleteImage ? (
                            <img
                              src={athleteImage}
                              alt={athleteName}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <UserCircle2 className="h-5 w-5 text-cl-accent" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="truncate text-sm font-black text-cl-ink">
                            {athleteName}
                          </div>
                          <div className="truncate text-xs text-cl-muted">
                            {formatDate(item.createdAt) || "Featured media"}
                          </div>
                        </div>
                      </div>

                      <h3 className="mt-4 line-clamp-2 text-lg font-black uppercase leading-tight text-cl-ink">
                        {item.title || item.caption || "Race Day Highlight"}
                      </h3>

                      {item.caption ? (
                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-cl-muted">
                          {item.caption}
                        </p>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="rounded-[30px] border border-cl-accent/10 bg-cl-surface p-8 text-center shadow-cl-panel">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-cl-accent/20 bg-cl-accent/10">
                <Camera className="h-6 w-6 text-cl-accent" />
              </div>

              <h2 className="mt-5 text-2xl font-black text-cl-ink">
                No featured gallery media yet
              </h2>

              <p className="mx-auto mt-2 max-w-xl text-sm leading-7 text-cl-muted">
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
            className="absolute inset-0 bg-cl-subtle backdrop-blur-sm"
            onClick={() => setSelectedItem(null)}
          />

          <div className="relative z-10 max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-[30px] border border-cl-accent/10 bg-cl-surface shadow-cl-panel">
            <div className="grid max-h-[92vh] grid-cols-1 overflow-y-auto lg:grid-cols-[1fr_340px]">
              <div className="grid min-h-[320px] place-items-center bg-cl-canvas">
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
                  <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full border border-cl-accent/25 bg-cl-accent/15">
                    {getAthleteImage(selectedItem) ? (
                      <img
                        src={getAthleteImage(selectedItem)}
                        alt={getAthleteName(selectedItem)}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <UserCircle2 className="h-6 w-6 text-cl-accent" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="truncate text-sm font-black text-cl-ink">
                      {getAthleteName(selectedItem)}
                    </div>
                    <div className="text-xs text-cl-muted">
                      {formatDate(selectedItem.createdAt)}
                    </div>
                  </div>
                </div>

                <h2 className="mt-6 text-2xl font-black uppercase leading-tight text-cl-ink">
                  {selectedItem.title || "Race Day Highlight"}
                </h2>

                {selectedItem.caption ? (
                  <p className="mt-3 text-sm leading-7 text-cl-muted">
                    {selectedItem.caption}
                  </p>
                ) : null}

                {getRacerProfileId(selectedItem) ? (
                  <button
                    type="button"
                    onClick={() =>
                      navigate(
                        `/racer/${encodeURIComponent(String(getRacerProfileId(selectedItem)))}`,
                      )
                    }
                    className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-full bg-cl-accent px-5 text-xs font-black uppercase tracking-[0.14em] text-cl-contrast transition hover:bg-cl-accent"
                  >
                    View Racer Profile
                  </button>
                ) : null}

                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="mt-3 inline-flex h-11 w-full items-center justify-center rounded-full border border-cl-border bg-cl-subtle px-5 text-xs font-black uppercase tracking-[0.14em] text-cl-muted transition hover:bg-cl-subtle"
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
