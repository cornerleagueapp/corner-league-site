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
  type?: "image" | "video" | string | null;
  url?: string | null;
  mediaUrl?: string | null;
  thumbnailUrl?: string | null;
  title?: string | null;
  caption?: string | null;
  isFeatured?: boolean | null;
  createdAt?: string | null;
  athlete?: FeaturedGalleryAthlete | null;
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

  return Array.isArray(list) ? (list as FeaturedGalleryItem[]) : [];
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
      className={`group relative min-w-0 overflow-hidden rounded-[24px] border border-cyan-300/10 bg-[#07111F]/80 text-left shadow-[0_18px_50px_rgba(0,0,0,0.26)] transition hover:-translate-y-1 hover:border-cyan-300/30 ${
        large ? "min-h-[360px] sm:min-h-[420px]" : "min-h-[220px]"
      }`}
    >
      <div className="absolute inset-0 bg-black">
        {mediaUrl ? (
          <img
            src={mediaUrl}
            alt={item.title || athleteName}
            className="h-full w-full object-cover opacity-80 transition duration-500 group-hover:scale-105 group-hover:opacity-95"
            loading="lazy"
          />
        ) : (
          <div className="grid h-full w-full place-items-center bg-[#06111d]">
            <ImageIcon className="h-10 w-10 text-cyan-100/60" />
          </div>
        )}

        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,9,19,0.12)_0%,rgba(3,9,19,0.28)_42%,rgba(3,9,19,0.92)_100%)]" />
      </div>

      <div className="absolute left-3 top-3 z-10 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/45 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-white backdrop-blur-md">
        {isVideo(item) ? (
          <Play className="h-3.5 w-3.5" />
        ) : (
          <Camera className="h-3.5 w-3.5" />
        )}
        {isVideo(item) ? "Video" : "Photo"}
      </div>

      <div className="absolute inset-x-0 bottom-0 z-10 p-4 sm:p-5">
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
            <div className="truncate text-xs text-white/50">
              Featured racer gallery
            </div>
          </div>
        </div>

        <h3
          className={`mt-3 line-clamp-2 font-black uppercase leading-tight text-white ${
            large ? "text-2xl sm:text-3xl" : "text-lg"
          }`}
        >
          {item.title || item.caption || "Race Day Highlight"}
        </h3>

        {large && item.caption ? (
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/70">
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

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        const list = await fetchFeaturedGallery(limit);

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
  }, [limit]);

  const featured = items[0] ?? null;
  const previewItems = useMemo(
    () => items.slice(1, compact ? 5 : 7),
    [items, compact],
  );

  if (loading) {
    return (
      <section className="mt-10 rounded-[30px] border border-cyan-300/10 bg-[#07111F]/80 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.28)] sm:p-7">
        <div className="animate-pulse">
          <div className="h-5 w-44 rounded-full bg-cyan-300/10" />
          <div className="mt-4 h-9 w-72 max-w-full rounded bg-white/10" />
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="h-72 rounded-[24px] bg-white/[0.04] md:col-span-2" />
            <div className="h-72 rounded-[24px] bg-white/[0.04]" />
          </div>
        </div>
      </section>
    );
  }

  if (!items.length) {
    return (
      <section className="mt-10 overflow-hidden rounded-[30px] border border-cyan-300/10 bg-[linear-gradient(135deg,rgba(34,211,238,0.10)_0%,rgba(7,17,31,0.96)_48%,rgba(255,107,53,0.08)_100%)] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.28)] sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200">
              <Sparkles className="h-3.5 w-3.5" />
              Featured Gallery
            </div>

            <h2 className="mt-4 text-3xl font-black uppercase tracking-[-0.03em] text-white">
              Racer Gallery Coming Soon
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
              Featured racer photos and videos will appear here once athletes
              publish featured media from their profiles.
            </p>
          </div>

          <Link href="/scores/aqua/gallery">
            <button className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-5 text-xs font-black uppercase tracking-[0.16em] text-cyan-100 transition hover:bg-cyan-300 hover:text-[#06111d]">
              Open Gallery
              <ChevronRight className="h-4 w-4" />
            </button>
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-10 overflow-hidden rounded-[34px] border border-cyan-300/10 bg-[linear-gradient(135deg,rgba(34,211,238,0.10)_0%,rgba(7,17,31,0.96)_48%,rgba(255,107,53,0.08)_100%)] p-4 shadow-[0_28px_80px_rgba(0,0,0,0.34)] sm:p-6 lg:p-7">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200">
            <Sparkles className="h-3.5 w-3.5" />
            Featured Racer Gallery
          </div>

          <h2 className="mt-4 text-3xl font-black uppercase leading-[0.95] tracking-[-0.04em] text-white sm:text-4xl">
            Photos, Videos &{" "}
            <span className="bg-[linear-gradient(90deg,#19E3FF_0%,#FF7849_100%)] bg-clip-text text-transparent">
              Race Day Moments
            </span>
          </h2>

          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
            Featured media from claimed racer profiles — highlights, sponsor
            content, race photos, and behind-the-scenes moments.
          </p>
        </div>

        <Link href="/scores/aqua/gallery">
          <button className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-5 text-xs font-black uppercase tracking-[0.16em] text-cyan-100 transition hover:bg-cyan-300 hover:text-[#06111d]">
            View All
            <ChevronRight className="h-4 w-4" />
          </button>
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
