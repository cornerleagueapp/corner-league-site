// src/pages/scores.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import LiveChatRoom from "@/components/LiveChatRoom";
import AccordionSection from "@/components/AccordionSection";
import RacerSearchModal from "@/components/RacerSearchModal";
import { Search as SearchIcon, X as XIcon } from "lucide-react";
import { useLocation } from "wouter";
import RaceResultsTable, { RaceResults } from "@/components/RaceResultsTable";
import raceCourse from "@/assets/race-course.jpg";

import aquaBanner from "@/assets/aquabanner.png";
import todaysSchedule from "@/assets/todaysSchedule.jpg";

import { aquaResults } from "@/data/aquaResults";

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

function FullBleedBanner({ src, alt }: { src: string; alt: string }) {
  // Breaks out of the centered container to span full viewport width
  return (
    <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen mt-2">
      <div className="relative h-40 sm:h-56 md:h-72 lg:h-80">
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover object-[center_60%]"
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
  const [viewerSrc, setViewerSrc] = useState<string | null>(null);

  // Close on ESC
  useEffect(() => {
    if (!viewerSrc) return;
    const onKey = (e: KeyboardEvent) =>
      e.key === "Escape" && setViewerSrc(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewerSrc]);

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

            <FullBleedBanner
              src={aquaBanner}
              alt="IJSBA World Finals — Lake Havasu"
            />

            <div className="space-y-3">
              <AccordionSection
                labelShow="Show Race Course"
                labelHide="Hide Race Course"
              >
                <div className="space-y-4">
                  <img
                    src={raceCourse}
                    alt="IJSBA World Finals race course"
                    loading="lazy"
                    onClick={() => setViewerSrc(raceCourse)}
                    className="w-full h-auto rounded-xl border border-white/10 bg-white/5 cursor-zoom-in hover:opacity-90 transition"
                  />
                </div>
              </AccordionSection>

              <AccordionSection
                labelShow="Show Monday's Schedule/Results"
                labelHide="Hide Monday's Schedule/Results"
              >
                <div className="space-y-4">
                  {aquaResults.map((race, i) => (
                    <RaceResultsTable
                      key={`${race.raceLabel ?? race.title}-${i}`}
                      data={race}
                      showFinalOnDesktop
                      collapsible
                    />
                  ))}
                </div>
              </AccordionSection>

              <AccordionSection
                labelShow="Show Tuesday's Schedule"
                labelHide="Hide Tuesday's Schedule"
              >
                <div className="space-y-4">
                  <div className="text-sm">
                    1) 6:30 AM Riders Meeting at the Grandstands
                  </div>
                  <div className="text-sm">
                    2) 8:30 AM Registration and Check In at the Trailer in Upper
                    Parking Lot
                  </div>
                  <img
                    src={todaysSchedule}
                    alt="IJSBA World Finals Monday's Schedule"
                    loading="lazy"
                    onClick={() => setViewerSrc(todaysSchedule)}
                    className="w-full h-auto rounded-xl border border-white/10 bg-white/5 cursor-zoom-in hover:opacity-90 transition"
                  />
                </div>
              </AccordionSection>

              <AccordionSection
                labelShow="Show Wednesday's Schedule"
                labelHide="Hide Wednesday's Schedule"
              >
                <div className="space-y-4">
                  <div className="text-sm">Expert Racing</div>
                  <div className="text-sm">More Info to Come...</div>

                  {/* <img
                    src={mondaySchedule}
                    alt="IJSBA World Finals Monday's Schedule"
                    loading="lazy"
                    onClick={() => setViewerSrc(mondaySchedule)}
                    className="w-full h-auto rounded-xl border border-white/10 bg-white/5 cursor-zoom-in hover:opacity-90 transition"
                  /> */}
                </div>
              </AccordionSection>

              <AccordionSection
                labelShow="Show Thursday's Schedule"
                labelHide="Hide Thursday's Schedule"
              >
                <div className="space-y-4">
                  <div className="text-sm">
                    Expert Racing continues. Most vendors have been placed and
                    fully operational.
                  </div>
                  <div className="text-sm">More Info to Come...</div>

                  {/* <img
                    src={mondaySchedule}
                    alt="IJSBA World Finals Monday's Schedule"
                    loading="lazy"
                    onClick={() => setViewerSrc(mondaySchedule)}
                    className="w-full h-auto rounded-xl border border-white/10 bg-white/5 cursor-zoom-in hover:opacity-90 transition"
                  /> */}
                </div>
              </AccordionSection>

              <AccordionSection
                labelShow="Show Friday's Schedule"
                labelHide="Hide Friday's Schedule"
              >
                <div className="space-y-4">
                  <div className="text-sm">
                    Amateur Freestyle, Expert and Pro Am Racing, Awards for all
                    completed classes. Check in for Poker Run- open to the
                    public, no competition membership necessary.
                  </div>
                  <div className="text-sm">More Info to Come...</div>

                  {/* <img
                    src={mondaySchedule}
                    alt="IJSBA World Finals Monday's Schedule"
                    loading="lazy"
                    onClick={() => setViewerSrc(mondaySchedule)}
                    className="w-full h-auto rounded-xl border border-white/10 bg-white/5 cursor-zoom-in hover:opacity-90 transition"
                  /> */}
                </div>
              </AccordionSection>

              <AccordionSection
                labelShow="Show Saturday's Schedule"
                labelHide="Hide Saturday's Schedule"
              >
                <div className="space-y-4">
                  <div className="text-sm">
                    Pro Racing Begins. Pro Freestyle. Morning Endurance Race.
                    Poker Run Check In and Poker Run.
                  </div>
                  <div className="text-sm">
                    Anderson Powersports/Big O Tires Saturday night under the
                    bridge freestyle show. Click here for event info.
                  </div>
                  <div className="text-sm">More Info to Come...</div>

                  {/* <img
                    src={mondaySchedule}
                    alt="IJSBA World Finals Monday's Schedule"
                    loading="lazy"
                    onClick={() => setViewerSrc(mondaySchedule)}
                    className="w-full h-auto rounded-xl border border-white/10 bg-white/5 cursor-zoom-in hover:opacity-90 transition"
                  /> */}
                </div>
              </AccordionSection>

              <AccordionSection
                labelShow="Show Sunday's Schedule"
                labelHide="Hide Sunday's Schedule"
              >
                <div className="space-y-4">
                  <div className="text-sm">
                    Pro Racing. Pro Freestyle. Morning Endurance Race. Awards.
                  </div>
                  <div className="text-sm">More Info to Come...</div>

                  {/* <img
                    src={mondaySchedule}
                    alt="IJSBA World Finals Monday's Schedule"
                    loading="lazy"
                    onClick={() => setViewerSrc(mondaySchedule)}
                    className="w-full h-auto rounded-xl border border-white/10 bg-white/5 cursor-zoom-in hover:opacity-90 transition"
                  /> */}
                </div>
              </AccordionSection>
            </div>

            <div>
              <button
                className="px-4 py-2 rounded-xl border border-white/20 text-white/90 hover:bg-white/10 transition"
                onClick={() => setShowAquaChat((v) => !v)}
              >
                {showAquaChat ? "Hide Chatroom" : "Join Live Chatroom"}
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
    <div className="p-6 max-w-7xl mx-auto overflow-x-hidden">
      <h1 className="text-2xl font-bold text-white mb-4 text-center sm:text-left">
        Live Scores
      </h1>

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

      {viewerSrc && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setViewerSrc(null)}
        >
          <button
            aria-label="Close"
            className="absolute top-4 right-4 rounded-full p-2 bg-white/10 hover:bg-white/20 border border-white/20"
            onClick={(e) => {
              e.stopPropagation();
              setViewerSrc(null);
            }}
          >
            <XIcon className="h-5 w-5 text-white" />
          </button>

          <div
            className="max-w-[95vw] max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={viewerSrc}
              alt="Schedule (full view)"
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            />
          </div>
        </div>
      )}

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
