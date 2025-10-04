// src/pages/scores.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import LiveChatRoom from "@/components/LiveChatRoom";
import AccordionSection from "@/components/AccordionSection";
import RacerSearchModal from "@/components/RacerSearchModal";
import { Search as SearchIcon } from "lucide-react";
import { useLocation } from "wouter";

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

const AQUA_ROOM_ID = "aqua_world_finals_2025";

type ResizeStrategy = "auto" | "scroll";

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "px-4 py-2 rounded-xl border transition",
        active
          ? "bg-white text-black border-white dark:bg-neutral-100 dark:text-neutral-900 dark:border-neutral-200"
          : "bg-transparent text-white/80 border-white/20 hover:bg-white/10",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

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
  const containerRef = useRef<HTMLDivElement | null>(null);

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
        ref={containerRef}
        className="w-full overflow-hidden rounded-2xl shadow-lg border border-white/10 bg-white/5"
        style={{ height: effectiveHeight }}
      >
        <iframe
          src={src}
          title={title}
          className={[
            "w-full",
            strategy === "scroll" ? "h-full" : "h-full",
          ].join(" ")}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </div>
  );
}

export default function ScoresPage() {
  const [active, setActive] = useState<TabKey>("AQUA");
  const [showAquaChat, setShowAquaChat] = useState(false);
  const [racerSearchOpen, setRacerSearchOpen] = useState(false);
  const [, navigate] = useLocation();

  const MLB_PLAYOFFS_URL =
    "https://widgets.media.sportradar.com/uscommon/en_us/standalone/us.season.mlb.playoffs#border=true&seasonId=125735";
  const MLB_SCORES_URL =
    "https://widgets.media.sportradar.com/uscommon/en_us/standalone/us.season.scores#uniqueTournamentId=109&preMatchLinks=default&liveMatchLinks=default&postMatchLinks=default&numFutureDays=0&border=true&seasonId=125735";
  const NFL_SCORES_URL =
    "https://widgets.media.sportradar.com/uscommon/en_us/standalone/us.season.nfl.scores#disablePitchSwitch=true&enableTeamSelect=true&enablePlayerSelect=true&border=true&preMatchLinks=default&liveMatchLinks=default&postMatchLinks=default&seasonId=2025";
  const NBA_SCORES_URL =
    "https://widgets.media.sportradar.com/uscommon/en_us/standalone/us.season.scores#uniqueTournamentId=132&preMatchLinks=default&liveMatchLinks=default&postMatchLinks=default&numFutureDays=0&border=true&seasonId=131631";
  const NHL_SCORES_URL =
    "https://widgets.media.sportradar.com/uscommon/en_us/standalone/us.season.scores#uniqueTournamentId=234&preMatchLinks=default&liveMatchLinks=default&postMatchLinks=default&numFutureDays=0&border=true&seasonId=131629https://widgets.media.sportradar.com/uscommon/en_us/standalone/us.season.scores#uniqueTournamentId=234&preMatchLinks=default&liveMatchLinks=default&postMatchLinks=default&numFutureDays=0&border=true&seasonId=131629";
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
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white/90">
                  IJSBA World Finals, Lake Havasu
                </h2>
                <h3 className="text-sm font-semibold text-white/60">
                  October 6th - 12th
                </h3>
              </div>

              <button
                onClick={() => setRacerSearchOpen(true)}
                className="h-9 w-9 grid place-items-center rounded-full bg-white/10 border border-white/10 hover:bg-white/15"
                aria-label="Search racers"
                title="Search racers"
              >
                <SearchIcon size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <AccordionSection
                labelShow="Show Race List"
                labelHide="Hide Race List"
              >
                <div className="text-sm">Race List coming soon.</div>
              </AccordionSection>

              <AccordionSection
                labelShow="Show Race Results"
                labelHide="Hide Race Results"
              >
                <div className="text-sm">Race Results coming soon.</div>
              </AccordionSection>
            </div>

            <div>
              <button
                className="px-4 py-2 rounded-xl border border-white/20 text-white/90 hover:bg-white/10 transition"
                onClick={() => setShowAquaChat((v) => !v)}
              >
                {showAquaChat ? "Hide Chatroom" : "Join Chatroom"}
              </button>
            </div>

            {showAquaChat && (
              <div className="pt-2">
                <LiveChatRoom roomId={AQUA_ROOM_ID} />
              </div>
            )}
          </div>
        );
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
  }, [active, showAquaChat]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-4">Live Scores</h1>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {TAB_ORDER.map((key) => (
          <TabButton
            key={key}
            active={active === key}
            onClick={() => setActive(key)}
          >
            {TAB_LABELS[key]}
          </TabButton>
        ))}
      </div>

      {/* Content */}
      {content}

      <p className="mt-6 text-xs text-white/50">
        Note: These embedded widgets are provided by Sportradar and may take a
        moment to load. Heights are set generously for readability
      </p>

      <RacerSearchModal
        open={racerSearchOpen}
        onClose={() => setRacerSearchOpen(false)}
        onSelectRacer={(r) => {
          setRacerSearchOpen(false);
          const slug = String(r.racerName || r.id)
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");
          navigate(`/racer/${encodeURIComponent(slug || String(r.id))}`);
        }}
      />
    </div>
  );
}
