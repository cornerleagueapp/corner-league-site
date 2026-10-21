import GalleryThumbnail from "@/components/media/GalleryThumbnail";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Camera,
  ChevronRight,
  Image as ImageIcon,
  Play,
  Sparkles,
  UserCircle2,
} from "lucide-react";
import { apiRequest } from "@/lib/apiClient";

export type FeaturedGalleryAthlete = {
  id?: string | null;
  name?: string | null;
  nickname?: string | null;
  profileImageUrl?: string | null;
  imageUrl?: string | null;
};

export type FeaturedGalleryItem = {
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
  isFeatured?: boolean | null;
  createdAt?: string | null;
  athlete?: FeaturedGalleryAthlete | null;
  racerProfile?: {
    id?: string | null;
    athleteId?: string | null;
    name?: string | null;
  } | null;
};

function getMediaUrl(item: FeaturedGalleryItem) {
  return item.thumbnailUrl || item.mediaUrl || item.url || "";
}

function getFullMediaUrl(item: FeaturedGalleryItem) {
  return item.mediaUrl || item.url || item.thumbnailUrl || "";
}

function getAthleteName(item: FeaturedGalleryItem) {
  return item.athlete?.name || item.athlete?.nickname || "Corner League Racer";
}

function getAthleteImage(item: FeaturedGalleryItem) {
  return item.athlete?.profileImageUrl || item.athlete?.imageUrl || "";
}

function isVideo(item: FeaturedGalleryItem) {
  return String(item.type || "").toLowerCase() === "video";
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

  if (!Array.isArray(list)) throw new Error("Gallery response unavailable");
  return list as FeaturedGalleryItem[];
}

function GalleryTile({
  item,
  large = false,
}: {
  item: FeaturedGalleryItem;
  large?: boolean;
}) {
  const [, navigate] = useLocation();

  const mediaUrl = getMediaUrl(item);
  const athleteName = getAthleteName(item);
  const athleteImage = getAthleteImage(item);

  return (
    <button
      type="button"
      onClick={() => navigate("/scores/aqua/gallery")}
      className={`group relative min-w-0 overflow-hidden rounded-[24px] border border-cl-accent/10 bg-cl-surface text-left shadow-cl-panel transition hover:-translate-y-1 hover:border-cl-accent/30 ${
        large ? "" : ""
      }`}
    >
      <div className="aspect-[16/10] overflow-hidden bg-cl-canvas">
        {mediaUrl ? (
          <GalleryThumbnail
            video={isVideo(item)}
            src={isVideo(item) ? item.thumbnailUrl : mediaUrl}
            alt={item.title || athleteName}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full w-full place-items-center bg-cl-surface">
            <ImageIcon className="h-10 w-10 text-cl-accent" />
          </div>
        )}
      </div>

      <div className="absolute left-3 top-3 z-10 inline-flex items-center gap-2 rounded-full border border-cl-border bg-cl-subtle px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-cl-ink backdrop-blur-md">
        {isVideo(item) ? (
          <Play className="h-3.5 w-3.5" />
        ) : (
          <Camera className="h-3.5 w-3.5" />
        )}
        {isVideo(item) ? "Video" : "Photo"}
      </div>

      <div className="relative bg-cl-surface p-4 sm:p-5">
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
              Featured racer gallery
            </div>
          </div>
        </div>

        <h3
          className={`mt-3 line-clamp-2 font-black uppercase leading-tight text-cl-ink ${
            large ? "text-2xl sm:text-3xl" : "text-lg"
          }`}
        >
          {item.title || item.caption || "Race Day Highlight"}
        </h3>

        {large && item.caption ? (
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-cl-muted">
            {item.caption}
          </p>
        ) : null}
      </div>
    </button>
  );
}

export default function FeaturedRacerGallerySection({
  sourcePage,
  limit = 8,
  compact = false,
}: {
  sourcePage: "landing_page" | "aqua_hub";
  limit?: number;
  compact?: boolean;
}) {
  const [items, setItems] = useState<FeaturedGalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(false);
        const list = await fetchFeaturedGallery(limit);

        if (!cancelled) {
          setItems(list);
        }
      } catch {
        if (!cancelled) {
          setItems([]);
          setError(true);
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
  }, [limit, reload]);

  const featured = items[0] ?? null;
  const previewItems = useMemo(
    () => items.slice(1, compact ? 5 : 7),
    [items, compact],
  );

  if (loading) {
    return (
      <section
        role="status"
        aria-busy="true"
        aria-label="Loading featured racer gallery"
        className="mt-10 rounded-[30px] border border-cl-accent/10 bg-cl-surface p-5 shadow-cl-panel sm:p-7"
      >
        <div className="animate-pulse">
          <div className="h-5 w-44 rounded-full bg-cl-accent/10" />
          <div className="mt-4 h-9 w-72 max-w-full rounded bg-cl-subtle" />
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="h-72 rounded-[24px] bg-cl-subtle md:col-span-2" />
            <div className="h-72 rounded-[24px] bg-cl-subtle" />
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section
        role="alert"
        className="mt-10 rounded-2xl border border-cl-danger/30 bg-cl-surface p-6 text-cl-danger"
      >
        <p>Featured racer gallery could not load.</p>
        <button
          type="button"
          className="mt-3 rounded-lg border border-cl-border px-4 py-2 text-cl-ink"
          onClick={() => setReload((n) => n + 1)}
        >
          Try again
        </button>
      </section>
    );
  }

  if (!items.length) {
    return (
      <section className="mt-10 overflow-hidden rounded-[30px] border border-cl-accent/10 cl-panel-wash p-5 shadow-cl-panel sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cl-accent/20 bg-cl-accent/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-cl-accent">
              <Sparkles className="h-3.5 w-3.5" />
              Featured Gallery
            </div>

            <h2 className="mt-4 text-3xl font-black uppercase tracking-[-0.03em] text-cl-ink">
              Racer Gallery Coming Soon
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-cl-muted">
              Featured racer photos and videos will appear here once athletes
              publish featured media from their profiles.
            </p>
          </div>

          <Link
            href="/scores/aqua/gallery"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-cl-accent/20 bg-cl-accent/10 px-5 text-xs font-black uppercase tracking-[0.16em] text-cl-accent transition hover:bg-cl-accent hover:text-cl-contrast"
          >
            Open Gallery
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-10 overflow-hidden rounded-[34px] border border-cl-accent/10 cl-panel-wash p-4 shadow-cl-panel sm:p-6 lg:p-7">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-cl-accent/20 bg-cl-accent/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-cl-accent">
            <Sparkles className="h-3.5 w-3.5" />
            Featured Racer Gallery
          </div>

          <h2 className="mt-4 text-3xl font-black uppercase leading-[0.95] tracking-[-0.04em] text-cl-ink sm:text-4xl">
            Photos, Videos &{" "}
            <span className="cl-title-accent">Race Day Moments</span>
          </h2>

          <p className="mt-3 max-w-2xl text-sm leading-7 text-cl-muted">
            Featured media from claimed racer profiles — highlights, sponsor
            content, race photos, and behind-the-scenes moments.
          </p>
        </div>

        <Link
          href="/scores/aqua/gallery"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-cl-accent/20 bg-cl-accent/10 px-5 text-xs font-black uppercase tracking-[0.16em] text-cl-accent transition hover:bg-cl-accent hover:text-cl-contrast"
        >
          View All
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.12fr_0.88fr]">
        {featured ? <GalleryTile item={featured} large /> : null}

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {previewItems.map((item) => (
            <GalleryTile key={item.id} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
