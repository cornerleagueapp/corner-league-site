import React, { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useLocation } from "wouter";
import RacerSearchModal from "@/components/RacerSearchModal";
import AquaTabContent from "@/components/scores/AquaTabContent";

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
        className="h-full w-full overflow-hidden rounded-2xl border border-cyan-400/15 bg-[#07131d] shadow-[0_18px_50px_rgba(0,0,0,0.28)]"
        style={{ height: effectiveHeight }}
      >
        <iframe
          src={src}
          title={title}
          className="h-full w-full"
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
      className="relative inline-block w-full text-left sm:w-auto"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-white/30 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10 sm:text-base"
      >
        <span>{TAB_LABELS[active]}</span>
        <ChevronDown
          className={`h-4 w-4 transition-transform sm:h-5 sm:w-5 ${
            open ? "rotate-180" : ""
          }`}
          strokeWidth={3}
        />
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-full origin-top-right rounded-xl border border-white/15 bg-black/90 shadow-xl backdrop-blur-md sm:w-48">
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
  const [location, navigate] = useLocation();
  const [racerSearchOpen, setRacerSearchOpen] = useState(false);

  const isAquaRoute =
    location === "/scores" ||
    location === "/scores/aqua" ||
    location.endsWith("/scores/aqua");

  const [active, setActive] = useState<TabKey>("AQUA");

  useEffect(() => {
    // Normalize /scores -> /scores/aqua so AQUA is the canonical route
    if (location === "/scores") {
      navigate("/scores/aqua", { replace: true });
      setActive("AQUA");
      return;
    }

    if (isAquaRoute) {
      setActive("AQUA");
      return;
    }

    if (location.includes("/scores")) {
      // preserve current tab if already selected, otherwise default non-aqua view
      setActive((prev) => (prev === "AQUA" ? "MLB" : prev));
    }
  }, [location, isAquaRoute, navigate]);

  const MLB_PLAYOFFS_URL =
    "https://widgets.media.sportradar.com/uscommon/en_us/standalone/us.season.mlb.playoffs#border=true&seasonId=125735";
  const MLB_SCORES_URL =
    "https://widgets.media.sportradar.com/uscommon/en_us/standalone/us.season.scores#uniqueTournamentId=109&preMatchLinks=default&liveMatchLinks=default&postMatchLinks=default&numFutureDays=0&border=true&seasonId=125735";
  const NFL_SCORES_URL =
    "https://widgets.media.sportradar.com/uscommon/en_us/standalone/us.season.nfl.scores#disablePitchSwitch=true&enableTeamSelect=true&border=true&preMatchLinks=default&liveMatchLinks=default&postMatchLinks=default&seasonId=2025";
  const NBA_SCORES_URL =
    "https://widgets.media.sportradar.com/uscommon/en_us/standalone/us.season.scores#uniqueTournamentId=132&preMatchLinks=default&liveMatchLinks=default&postMatchLinks=default&numFutureDays=0&border=true&seasonId=131631";
  const NHL_SCORES_URL =
    "https://widgets.media.sportradar.com/uscommon/en_us/standalone/us.season.scores#uniqueTournamentId=234&preMatchLinks=default&liveMatchLinks=default&postMatchLinks=default&numFutureDays=0&border=true&seasonId=131629";
  const NCAAF_SCORES_URL =
    "https://widgets.media.sportradar.com/uscommon/en_us/standalone/us.season.ncaaf.scores#preMatchLinks=default&liveMatchLinks=default&postMatchLinks=default&border=true&seasonId=127983";

  const handleTabChange = (tab: TabKey) => {
    setActive(tab);

    if (tab === "AQUA") {
      navigate("/scores/aqua");
      return;
    }

    // other sports stay on /scores for now
    navigate("/scores");
    setTimeout(() => setActive(tab), 0);
  };

  const content = useMemo(() => {
    if (active === "AQUA") {
      return (
        <AquaTabContent onOpenRacerSearch={() => setRacerSearchOpen(true)} />
      );
    }

    switch (active) {
      case "MLB":
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white/90">
              MLB Playoffs
            </h2>
            <ResponsiveFrame
              src={MLB_PLAYOFFS_URL}
              title="MLB Playoffs"
              strategy="auto"
              initialHeight={450}
              minHeight={450}
              maxHeight={500}
            />

            <h2 className="pt-4 text-xl font-semibold text-white/90">
              MLB Season Scores
            </h2>
            <ResponsiveFrame
              src={MLB_SCORES_URL}
              title="MLB Season Scores"
              strategy="auto"
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
              strategy="auto"
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
              strategy="auto"
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
              strategy="auto"
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
              strategy="auto"
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
    <div className="relative min-h-screen overflow-x-hidden bg-black">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.05),_transparent_22%),radial-gradient(circle_at_80%_18%,_rgba(59,130,246,0.03),_transparent_18%),linear-gradient(to_bottom,_#000000_0%,_#02070b_42%,_#000000_100%)]" />
        <div className="absolute inset-0 opacity-[0.025] [background-image:linear-gradient(rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:72px_72px]" />
        <div className="absolute left-1/2 top-0 h-[260px] w-[260px] -translate-x-1/2 rounded-full bg-cyan-400/4 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl overflow-x-hidden p-6">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] text-center uppercase tracking-[0.18em] text-cyan-300/75">
              Live Sports Hub
            </p>
            <h1 className="text-center text-2xl font-bold text-white sm:text-left">
              Live Scores
            </h1>
          </div>

          <div className="flex flex-col items-stretch gap-1 sm:items-end">
            <span className="text-[11px] uppercase tracking-[0.16em] text-white/60">
              Sport
            </span>
            <TabDropdown active={active} onChange={handleTabChange} />
          </div>
        </div>

        {content}

        <p className="mt-6 text-xs text-white/50">
          Note: These embedded widgets are provided by Sportradar and may take a
          moment to load. Heights are set generously for readability.
        </p>

        <RacerSearchModal
          open={racerSearchOpen}
          onClose={() => setRacerSearchOpen(false)}
          onSelectRacer={(r) => {
            setRacerSearchOpen(false);
            const idStr = encodeURIComponent(String(r.id));
            navigate(`/racer/${idStr}`);
          }}
        />
      </div>
    </div>
  );
}
