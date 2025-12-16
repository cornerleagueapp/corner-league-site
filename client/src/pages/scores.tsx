// src/pages/scores.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

import AquaScoresSection from "@/components/AquaScoresSection";

type TabKey = "AQUA" | "MLB" | "NBA" | "NFL" | "NHL" | "NCAAF";
const TAB_ORDER: TabKey[] = ["AQUA", "MLB", "NBA", "NFL", "NHL", "NCAAF"];

const TAB_LABELS: Record<TabKey, string> = {
  AQUA: "AQUA",
  MLB: "MLB",
  NBA: "NBA",
  NFL: "NFL",
  NHL: "NHL",
  NCAAF: "NCAAF",
};

type ResizeStrategy = "auto" | "scroll";

function ResponsiveFrame({
  src,
  title,
  strategy = "auto",
  initialHeight = 900,
  minHeight = 600,
  maxHeight = 1600,
}: {
  src: string;
  title: string;
  strategy?: ResizeStrategy;
  initialHeight?: number;
  minHeight?: number;
  maxHeight?: number;
}) {
  const [height, setHeight] = useState(initialHeight);

  useEffect(() => {
    if (strategy !== "auto") return;

    const handler = (event: MessageEvent) => {
      if (
        typeof event.origin === "string" &&
        !event.origin.includes("widgets.media.sportradar.com")
      ) {
        return;
      }

      const d: any = event.data;
      const maybe =
        (d && (d.height || d?.data?.height || d?.payload?.height)) ?? null;

      if (typeof maybe === "number" && Number.isFinite(maybe)) {
        const clamped = Math.max(minHeight, Math.min(maybe, maxHeight));
        setHeight(clamped);
      }
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [strategy, minHeight, maxHeight]);

  const effectiveHeight = strategy === "scroll" ? initialHeight : height;

  return (
    <div className="w-full">
      <div
        className="w-full overflow-hidden rounded-2xl shadow-lg border border-white/10 bg-white/5"
        style={{ height: effectiveHeight }}
      >
        <iframe
          src={src}
          title={title}
          className="w-full h-full"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </div>
  );
}

function TabDropdown({
  active,
  onChange,
}: {
  active: TabKey;
  onChange: (tab: TabKey) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div
      ref={wrapperRef}
      className="relative inline-block text-left w-full sm:w-auto"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-white/30 bg-white/5 px-4 py-2 text-sm sm:text-base font-semibold text-white hover:bg-white/10 transition"
      >
        <span>{TAB_LABELS[active]}</span>
        <ChevronDown
          className={`h-4 w-4 sm:h-5 sm:w-5 transition-transform ${
            open ? "rotate-180" : ""
          }`}
          strokeWidth={3}
        />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-full sm:w-48 origin-top-right rounded-xl border border-white/15 bg-black/90 shadow-xl backdrop-blur-md z-30">
          <div className="py-1">
            {TAB_ORDER.filter((key) => key !== active).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  onChange(key);
                  setOpen(false);
                }}
                className="block w-full px-4 py-2 text-left text-sm text-white/90 hover:bg-white/10"
              >
                {TAB_LABELS[key]}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ScoresPage() {
  const [active, setActive] = useState<TabKey>("AQUA");

  const MLB_PLAYOFFS_URL =
    "https://widgets.media.sportradar.com/uscommon/en_us/standalone/us.season.mlb.playoffs#border=true&seasonId=125735";
  const MLB_SCORES_URL =
    "https://widgets.media.sportradar.com/uscommon/en_us/standalone/us.season.scores#uniqueTournamentId=109&preMatchLinks=default&liveMatchLinks=default&postMatchLinks=default&numFutureDays=0&border=true&seasonId=125735";
  const NFL_SCORES_URL =
    "https://widgets.media.sportradar.com/uscommon/en_us/standalone/us.season.nfl.scores#disablePitchSwitch=true&enableTeamSelect=true&enablePlayerSelect=true&border=true&preMatchLinks=default&liveMatchLinks=default&postMatchLinks=default&seasonId=2025";
  const NBA_SCORES_URL =
    "https://widgets.media.sportradar.com/uscommon/en_us/standalone/us.season.scores#uniqueTournamentId=132&preMatchLinks=default&liveMatchLinks=default&postMatchLinks=default&numFutureDays=0&border=true&seasonId=131631";
  const NHL_SCORES_URL =
    "https://widgets.media.sportradar.com/uscommon/en_us/standalone/us.season.scores#uniqueTournamentId=234&preMatchLinks=default&liveMatchLinks=default&postMatchLinks=default&numFutureDays=0&border=true&seasonId=131629";
  const NCAAF_SCORES_URL =
    "https://widgets.media.sportradar.com/uscommon/en_us/standalone/us.season.ncaaf.scores#preMatchLinks=default&liveMatchLinks=default&postMatchLinks=default&border=true&seasonId=127983";

  const MLB_PLAYOFFS_STRATEGY: ResizeStrategy = "auto";
  const MLB_SCORES_STRATEGY: ResizeStrategy = "auto";
  const NFL_SCORES_STRATEGY: ResizeStrategy = "auto";
  const NBA_SCORES_STRATEGY: ResizeStrategy = "auto";
  const NHL_SCORES_STRATEGY: ResizeStrategy = "auto";
  const NCAAF_SCORES_STRATEGY: ResizeStrategy = "auto";

  const content = useMemo(() => {
    switch (active) {
      case "AQUA":
        return <AquaScoresSection />;
      case "MLB":
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white/90">
              MLB Playoffs
            </h2>
            <ResponsiveFrame
              src={MLB_PLAYOFFS_URL}
              title="MLB Playoffs"
              strategy={MLB_PLAYOFFS_STRATEGY}
              initialHeight={450}
              minHeight={450}
              maxHeight={500}
            />

            <h2 className="text-xl font-semibold text-white/90 pt-4">
              MLB Season Scores
            </h2>
            <ResponsiveFrame
              src={MLB_SCORES_URL}
              title="MLB Season Scores"
              strategy={MLB_SCORES_STRATEGY}
              initialHeight={700}
              minHeight={700}
              maxHeight={800}
            />
          </div>
        );
      case "NFL":
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white/90">NFL Scores</h2>
            <ResponsiveFrame
              src={NFL_SCORES_URL}
              title="NFL Season Scores"
              strategy={NFL_SCORES_STRATEGY}
              initialHeight={700}
              minHeight={700}
              maxHeight={800}
            />
          </div>
        );
      case "NBA":
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white/90">NBA Scores</h2>
            <ResponsiveFrame
              src={NBA_SCORES_URL}
              title="NBA Season Scores"
              strategy={NBA_SCORES_STRATEGY}
              initialHeight={700}
              minHeight={700}
              maxHeight={800}
            />
          </div>
        );
      case "NHL":
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white/90">NHL Scores</h2>
            <ResponsiveFrame
              src={NHL_SCORES_URL}
              title="NHL Season Scores"
              strategy={NHL_SCORES_STRATEGY}
              initialHeight={700}
              minHeight={700}
              maxHeight={800}
            />
          </div>
        );
      case "NCAAF":
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white/90">
              NCAAF Scores
            </h2>
            <ResponsiveFrame
              src={NCAAF_SCORES_URL}
              title="NCAAF Season Scores"
              strategy={NCAAF_SCORES_STRATEGY}
              initialHeight={700}
              minHeight={700}
              maxHeight={800}
            />
          </div>
        );
      default:
        return null;
    }
  }, [
    active,
    MLB_PLAYOFFS_URL,
    MLB_SCORES_URL,
    NFL_SCORES_URL,
    NBA_SCORES_URL,
    NHL_SCORES_URL,
    NCAAF_SCORES_URL,
  ]);

  return (
    <div className="p-6 max-w-7xl mx-auto overflow-x-hidden">
      {/* Header + dropdown */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-white text-center sm:text-left">
          Live Scores
        </h1>
        <div className="flex flex-col items-stretch sm:items-end gap-1">
          <span className="text-[11px] uppercase tracking-[0.16em] text-white/60">
            Sport
          </span>
          <TabDropdown active={active} onChange={setActive} />
        </div>
      </div>

      {/* Content */}
      {content}

      <p className="mt-6 text-xs text-white/50">
        Note: These embedded widgets are provided by Sportradar and may take a
        moment to load. Heights are set generously for readability.
      </p>
    </div>
  );
}
