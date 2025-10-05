// src/pages/racer-profile.tsx
import React, { useEffect, useMemo, useState } from "react";
import { PageSEO } from "@/seo/usePageSEO";
import { apiRequest } from "@/lib/apiClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import stockAvatar from "@/assets/stockprofilepicture.jpeg";
import { X as XIcon, Share2, Search as SearchIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import RacerSearchModal from "@/components/RacerSearchModal";

type Racer = {
  id: string | number;
  racerName: string;
  racerAge?: number;
  bio?: string | null;
  racerImage?: string | null;
  location?: string | null;
  boatManufacturers?: string | null;
  careerWins?: number;
  seasonWins?: number;
  seasonPodiums?: number;
  careerWorldFinalsWins?: number;
  seasonWorldFinalsWins?: number;
};

function slugify(s: string) {
  return s
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function RacerProfilePage({ nameParam }: { nameParam: string }) {
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const [racer, setRacer] = useState<Racer | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        // pull the list; API example is list-based
        const res = await apiRequest<any>("GET", "/jet-ski-racer-details");
        const racers: Racer[] =
          (res?.racers as any) ?? (res?.data?.racers as any) ?? res?.data ?? [];

        // match by slug of racerName
        const targetSlug = decodeURIComponent(nameParam || "").toLowerCase();
        const found =
          racers.find(
            (r) => slugify(String(r.racerName || "")) === targetSlug
          ) ||
          // fallback: try raw name match
          racers.find(
            (r) =>
              String(r.racerName || "")
                .trim()
                .toLowerCase() === targetSlug
          );

        if (!found) {
          throw new Error("Racer not found");
        }
        if (!cancelled) setRacer(found);
      } catch (e: any) {
        if (!cancelled) setErr(e?.message || "Failed to load racer");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [nameParam]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090D16] text-white grid place-items-center">
        <PageSEO title="Racer • Corner League" />
        <div className="animate-pulse text-white/70">Loading racer…</div>
      </div>
    );
  }

  if (err || !racer) {
    return (
      <div className="min-h-screen bg-[#090D16] text-white grid place-items-center">
        <PageSEO title="Racer • Corner League" />
        <div className="text-center space-y-3">
          <div className="text-xl font-semibold">Couldn’t load this racer</div>
          <div className="text-white/70">{err || "Not found"}</div>
          <Button
            onClick={() => window.history.back()}
            className="bg-white text-black"
          >
            Go back
          </Button>
        </div>
      </div>
    );
  }

  const stats = [
    { label: "Career Wins", value: racer.careerWins ?? 0, trophy: true },
    { label: "Season Wins", value: racer.seasonWins ?? 0 },
    { label: "Season Podiums", value: racer.seasonPodiums ?? 0 },
  ];

  const title = racer.racerName || "Racer";
  const chips = [
    racer.location && { label: racer.location },
    racer.boatManufacturers && { label: racer.boatManufacturers },
    typeof racer.racerAge === "number" && { label: `${racer.racerAge} yrs` },
  ].filter(Boolean) as { label: string }[];

  return (
    <div className="min-h-screen bg-[#090D16] text-white">
      <PageSEO title={`${title} • Corner League`} />

      {/* top-right search */}
      <div className="mx-auto max-w-5xl px-4 pt-4 flex justify-end">
        <button
          onClick={() => setSearchOpen(true)}
          className="h-9 w-9 grid place-items-center rounded-full bg-white/10 border border-white/10 hover:bg-white/15"
          aria-label="Search racers"
        >
          <SearchIcon size={18} />
        </button>
      </div>

      <div className="mx-auto max-w-5xl px-4 mt-8">
        {/* header */}
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="p-[2px] rounded-full bg-gradient-to-tr from-violet-500 via-fuchsia-500 to-amber-400 inline-block self-center sm:self-auto">
            <img
              src={racer.racerImage || stockAvatar}
              onError={(e) => {
                const img = e.currentTarget as HTMLImageElement;
                if (img.src !== stockAvatar) img.src = stockAvatar;
              }}
              className="h-28 w-28 sm:h-36 sm:w-36 rounded-full object-cover bg-black"
            />
          </div>

          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-semibold leading-tight text-center sm:text-left">
              {title}
            </h1>

            <div className="mt-1 flex flex-wrap items-center justify-center sm:justify-start gap-2">
              {chips.length === 0 ? (
                <p className="text-sm text-white/70">AQUA Racer</p>
              ) : (
                chips.map((c, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-0.5 rounded-full border border-white/10 text-[11px] text-white/90"
                  >
                    {c.label}
                  </span>
                ))
              )}
            </div>

            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {stats.map((s) => (
                <StatBox
                  key={s.label}
                  label={s.label}
                  value={s.value}
                  trophy={s.trophy}
                />
              ))}
            </div>
          </div>

          <div className="flex w-full gap-2 self-center sm:self-end sm:w-auto justify-center sm:justify-end">
            <Button
              onClick={async () => {
                const url = new URL(window.location.href);
                try {
                  await navigator.clipboard.writeText(url.toString());
                  toast({ title: "Copied to clipboard" });
                } catch {}
              }}
              className="h-11 sm:h-9 sm:w-auto bg-white text-black hover:bg-white/90"
            >
              Share
            </Button>
          </div>
        </div>

        {/* tabs substitute */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* left column: bio */}
          <div className="order-2 lg:order-1 lg:col-span-1 space-y-6">
            <Card className="bg-white/5 border-white/10 p-4">
              <div className="text-sm text-white/80 mb-2">About</div>
              <p className="text-white/80 text-sm whitespace-pre-wrap">
                {racer.bio || "Bio coming soon."}
              </p>
            </Card>

            <Card className="bg-white/5 border-white/10 p-4">
              <div className="text-sm text-white/80 mb-3">World Finals</div>
              <div className="grid grid-cols-2 gap-3">
                <MiniStat
                  label="Career WF Wins"
                  value={racer.careerWorldFinalsWins ?? 0}
                />
                <MiniStat
                  label="Season WF Wins"
                  value={racer.seasonWorldFinalsWins ?? 0}
                />
              </div>
            </Card>
          </div>

          {/* main column */}
          <div className="order-1 lg:order-2 lg:col-span-2 space-y-3">
            <Card className="bg-white/5 border-white/10 p-4">
              <div className="text-white/80 text-sm">
                Race media & posts coming soon.
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* lightbox (if you later add racer gallery) */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            onClick={() => setLightboxUrl(null)}
            className="absolute top-4 right-4 h-9 w-9 grid place-items-center rounded-full bg-white text-black"
            aria-label="Close image"
          >
            <XIcon size={18} />
          </button>
          <img
            src={lightboxUrl}
            className="max-h-[85vh] max-w-[92vw] rounded-xl border border-white/10 object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* racer search modal */}
      <RacerSearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelectRacer={(r) => {
          setSearchOpen(false);
          const slug = slugify(String(r.racerName || r.id));
          navigate(`/racer/${encodeURIComponent(slug)}`);
        }}
      />
    </div>
  );
}

function StatBox({
  label,
  value,
  trophy,
}: {
  label: string;
  value: number;
  trophy?: boolean;
}) {
  return (
    <div className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3">
      <div className="text-2xl font-semibold flex items-center gap-2">
        {value}
        {trophy && <span>🏆</span>}
      </div>
      <div className="text-sm text-white/70">{label}</div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-2">
      <div className="text-lg font-semibold">{value}</div>
      <div className="text-xs text-white/60">{label}</div>
    </div>
  );
}
