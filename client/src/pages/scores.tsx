// src/pages/scores.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import LiveChatRoom from "@/components/LiveChatRoom";
import AccordionSection from "@/components/AccordionSection";
import RacerSearchModal from "@/components/RacerSearchModal";
import { Search as SearchIcon, X as XIcon } from "lucide-react";
import { useLocation } from "wouter";
import RaceResultsTable, { RaceResults } from "@/components/RaceResultsTable";
import raceCourse from "@/assets/race-course.jpg";

// import aquaBanner from "@/assets/aquabanner.png";
import aquaBanner from "@/assets/banner3.jpg";
import todaysSchedule from "@/assets/todaysSchedule.jpg";
import schedule1 from "@/assets/race-schedule1.jpg";
import schedule2 from "@/assets/race-schedule2.jpg";
import schedule3 from "@/assets/race-schedule3.jpg";

import {
  aquaResults,
  aquaResultsTwo,
  aquaResultsThree,
  aquaResultsFour,
  aquaResultsFive,
  aquaResultsSix,
} from "@/data/aquaResults";

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

              {/* <button
                onClick={() => setRacerSearchOpen(true)}
                className="h-9 w-9 grid place-items-center rounded-full bg-white/10 border border-white/10 hover:bg-white/15"
                aria-label="Search racers"
                title="Search racers"
              >
                <SearchIcon size={18} />
              </button> */}
            </div>

            <FullBleedBanner
              src={aquaBanner}
              alt="IJSBA World Finals — Lake Havasu"
            />

            <div className="space-y-3">
              {/* Responsive 16:9 YouTube embed */}
              <div className="relative w-full overflow-hidden rounded-xl border border-white/10 bg-white/5">
                <div className="relative pt-[56.25%]">{/* 16:9 */}</div>
                <iframe
                  src="https://www.youtube.com/embed/FSBIv0dKTCA?si=6thOjZF5fIZw0qqo&autoplay=1&mute=1&playsinline=1&modestbranding=1&rel=0"
                  title="YouTube video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="absolute inset-0 h-full w-full border-0"
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              </div>

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
                labelShow="Show Race Week Schedule"
                labelHide="Hide Schedule"
              >
                <div className="space-y-4">
                  <img
                    src={schedule1}
                    alt="IJSBA World Finals race course"
                    loading="lazy"
                    onClick={() => setViewerSrc(schedule1)}
                    className="w-full h-auto rounded-xl border border-white/10 bg-white/5 cursor-zoom-in hover:opacity-90 transition"
                  />
                  <img
                    src={schedule2}
                    alt="IJSBA World Finals race course"
                    loading="lazy"
                    onClick={() => setViewerSrc(schedule2)}
                    className="w-full h-auto rounded-xl border border-white/10 bg-white/5 cursor-zoom-in hover:opacity-90 transition"
                  />
                  <img
                    src={schedule3}
                    alt="IJSBA World Finals race course"
                    loading="lazy"
                    onClick={() => setViewerSrc(schedule3)}
                    className="w-full h-auto rounded-xl border border-white/10 bg-white/5 cursor-zoom-in hover:opacity-90 transition"
                  />
                </div>
              </AccordionSection>

              <AccordionSection
                labelShow="Show Monday's Results"
                labelHide="Hide Monday's Results"
              >
                <div className="space-y-4">
                  <div className="text-sm">Ai Analysis:</div>
                  <div className="text-sm">
                    - Start = destiny. Nearly every winner protected lane choice
                    and nailed the first two buoys; consistency beat raw pace in
                    3-moto scoring.
                  </div>
                  <div className="text-sm">
                    - Clean sweeps/near-sweeps: Jeremy Poper (Master Ski GP)
                    1-1-1—pure control. Decarli (Novice Ski Stock) and Baldwin
                    (Novice Runabout Stock) won by stacking 1–2s, not hero laps.
                  </div>
                  <div className="text-sm">
                    - Best adaptation: Kristine Mercado (Am Rec Lites) went 3 →
                    1 → 1 after feeling it out—then backed it up with P2 in
                    Novice 1100. Big multi-class day.
                  </div>
                  <div className="text-sm">
                    - Bounce-back of the day: Angela Ventus had a messy Novice
                    RA Stock opener (13th) but answered with a perfect 1-1 to
                    win Novice 1100 Stock.
                  </div>
                  <div className="text-sm">
                    - Women’s headline: Emy Garcia (Am Women’s Ski Lites)
                    settled in with a P4, then controlled the class with
                    back-to-back wins.
                  </div>
                  <div className="text-sm">
                    - Youth wave: Teen winners (Baldwin, Garcia, Christie, Sato)
                    showed maturity—late-moto composure in chop was the
                    separator.
                  </div>
                  <div className="text-sm">
                    - “What could’ve been” speed: Angelo Ventus (Novice RA
                    Stock) flashed a Moto-2 win but paid for a bad Moto-1;
                    fixing lap-one chaos puts him in the title fight.
                  </div>
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
                labelShow="Show Tuesday's Results"
                labelHide="Hide Tuesday's Results"
              >
                <div className="space-y-4">
                  <div className="text-sm">Ai Analysis</div>
                  <div className="text-sm">
                    - Overall winners kept it boring—in a good way. When gate
                    drops were tidy, three-moto scoring rewarded calm repetition
                    more than flashes.
                  </div>
                  <div className="text-sm">
                    - Clean sweeps: Attapon Kunsa (Pro Am Vet RA Ltd) 1-1-1;
                    Jeremy Poper (Master Ski Modified 1500) 1-1-1; Anton Ignacio
                    (Runabout NA) 1-1-1. Textbook execution.
                  </div>
                  <div className="text-sm">
                    - Triple lockstep: Master Ski Modified’s entire podium ran
                    the table—Poper 1-1-1, Dufaud 2-2-2, Playan 3-3-3. Zero
                    chaos up front; all the variance lived P4–P10.
                  </div>
                  <div className="text-sm">
                    - Late closer of the day: Jack Cobb (Novice Ski Lites)
                    turned an 8 in Moto-1 into the overall with back-to-back
                    wins (8-1-1). That’s championship poise.
                  </div>
                  <div className="text-sm">
                    - “Clutch Moto 3” finishes: • Franco Tobler (Am Ski Mod
                    1500) sealed it with a 1 in the decider (1-2-1) over Lukas
                    Cervera (2-1-2).
                  </div>
                  <div className="text-sm">
                    - Alain Wyss (Am Vet Ski Stock) protected the points with
                    1-1-2 while Jonathan Phan’s Moto-3 win salvaged P2 overall.
                  </div>
                  <div className="text-sm">
                    - Consistency beats raw pace (again): Patrick Parker’s 2-2-1
                    topped Matthew Johnson despite Johnson’s early 1-1—Moto-3
                    discipline swung Sport Spec.
                  </div>
                  <div className="text-sm">
                    - Multi-class notables: Philippe Dufaud podiums in two (P3
                    in Am Vet Ski Stock; P2 in Master Ski Modified). Kristine
                    Mercado juggled classes—solid P4 in Amateur RA 1100.
                  </div>
                  <div className="text-sm">
                    - Best rebound program: Angelo Ventus (Am RA 1100) opened
                    with a 2, then stacked 1-1 for the overall ahead of Ryan
                    Smith (1-4-3).
                  </div>
                  <div className="text-sm">
                    - Youth headline: Teen winners Parker (Sport Spec) and Sadie
                    Mir (Am Women Ski Stock, 2-1-1) handled pressure in finals.
                    Kaylee & Kendra Kennedy kept piling top-5s in Novice Lites.
                  </div>
                  <div className="text-sm">
                    - Penalty/DNS gravity: The back half of Master Ski Modified
                    and Sport Spec shuffled mostly from DNFs/DNS—front-runners
                    who simply finished every lap banked free positions.
                  </div>

                  {aquaResultsTwo.map((race, i) => (
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
                labelShow="Show Wednesday's Results"
                labelHide="Hide Wednesday's Results"
              >
                <div className="space-y-4">
                  <div className="text-sm">Ai Analysis:</div>

                  <div className="text-sm">
                    - Dominant sweeps: Britton Reinhard (Am Ski Lites) and Sugar
                    Sato (Jr 13–15) both went 1-1-1. Ty Smith shadowed with
                    2-2-2.
                  </div>
                  <div className="text-sm">
                    - Race of the day: Pro Am Ski Mod 1500—Ryder Wildeboer
                    (1-2-1) edged Harley Ritchie (2-1-2) after three tight
                    motos.
                  </div>
                  <div className="text-sm">
                    - Clutch Moto 3s: Cash McClure won the Jr 10–12 decider to
                    lock P2 overall; Patrick Parker and James Munroe Jr salvaged
                    places with steadier last heats.
                  </div>
                  <div className="text-sm">
                    - Execution over raw speed: Tory Snyder won Am RA 1100 with
                    2-1-1 by staying tidy; rivals bled points on later motos.
                  </div>
                  <div className="text-sm">
                    - DNS/DNF tax: Luka Martino (no starts) and Anton Ignacio
                    (DNS) slid to the bottom; Jack Eidt’s DNS fixed him at P18
                    despite pace.
                  </div>
                  <div className="text-sm">
                    - Quiet climbers: Haigen Smith rose 16→9 overall in Am Ski
                    Lites; Joaquin Taiano held P9 in Pro Am Mod by avoiding
                    mistakes.
                  </div>
                  <div className="text-sm">
                    - Runabout podium: Abdullah Alfadhel (1-1-2) controlled the
                    overall; Seddini Khalil (3-2-1) P2; Massimo Casarini (2-4-3)
                    P3.
                  </div>
                  <div className="text-sm">
                    - Juniors: Travis Billings (1-1-2) looked title-ready;
                    Payton Benson steady P4. In 13–15s, Sato/Smith left little
                    air; Wyatt Kennedy P3.
                  </div>
                  <div className="text-sm">
                    - Deepest field: Amateur Ski Lites—Britton perfect, mid-pack
                    chaos shuffled results (Mark Queen Jr’s 15 in Moto 3 dropped
                    him to P5).
                  </div>

                  {aquaResultsThree.map((race, i) => (
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
                labelShow="Show Thursday's Results"
                labelHide="Hide Thursday's Results"
              >
                <div className="space-y-4">
                  <div className="text-sm">Ai Analysis:</div>
                  <div className="text-sm">
                    - Big winners: River Crawford dominated Amateur Ski Modified
                    1100 with a clean 1-1-1. Anton Ignacio swept Pro Am Runabout
                    1100 Stock (1-1-1). Michael Prodanovich controlled Vintage
                    SC (1-1 for the overall).
                  </div>
                  <div className="text-sm">
                    - Race of the day – Pro Am Runabout Super Stock (Race 4):
                    Juan Lezcano sealed it with a clutch Moto-3 win (1-5-1).
                    James Bamburg (4-1-3) took P2, James Munroe Jr (3-4-2) P3.
                  </div>
                  <div className="text-sm">
                    - Master Ski Stock (Race 3): Philippe Dufaud was clinical
                    (2-1-1) over Kevin Decarli (1-2-2). Bill Kuckert’s late slip
                    made it P3.
                  </div>
                  <div className="text-sm">
                    - Pro Am Ski Lites: Lukas Cervera won on consistency
                    (1-2-2). Deven Farthing’s Moto-3 win locked P2; River
                    Crawford settled P3 after a costly M3.
                  </div>
                  <div className="text-sm">
                    - Quiet climbers: Erik Gruenwald (Am Ski Mod 1100) worked up
                    to P4 with 7-5-3. Brice Chambers turned 7-4-4 into P5 in Pro
                    Am Lites.
                  </div>
                  <div className="text-sm">
                    - Attrition watch: Partial runs/DNS hurt results—Richard
                    Longacre (Vintage SC) and a couple Super Stock names slid
                    down despite speed.
                  </div>
                  <div className="text-sm">
                    - Takeaway: The day favored riders who protected their
                    average—starts, clean water, and no penalties. Crawford and
                    Ignacio looked untouchable; Lezcano and Dufaud won their
                    classes by nailing the money moto.
                  </div>

                  {aquaResultsFour.map((race, i) => (
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
                labelShow="Show Friday's Schedule"
                labelHide="Hide Friday's Schedule"
              >
                <div className="space-y-4">
                  <div className="text-sm">Ai Analysis:</div>

                  <div className="text-sm">
                    - Expert Ski GP (Race 1): Lukas Cervera closed like a
                    pro—2-1-1 for the overall. Hugo Pastorello (1-4-3) and
                    Franco Tobler (4-2-2) rounded out a tidy podium. Mid-pack
                    drama decided places: Ian Roberts (10-7-DNS) still salvaged
                    P9, while Ryland Webster’s DSQ in Moto-3 froze him at P10
                    despite pace.
                  </div>
                  <div className="text-sm">
                    - Pro Am Runabout 1100 Open (Race 2): Worakit Mongkolporn
                    kept it clinical—1-1-2 for P1. Louie Buhisan’s late push
                    (2-2-1) made it close but not enough. Kodai Taguchi
                    consistent (3-4-3) for P3; Josh Teague and Nick McMillan
                    locked 4–5 with steady finishes.
                  </div>
                  <div className="text-sm">
                    - Pro Am Ski 4-Stroke Lites (Race 3): Sugar Sato swept the
                    table (1-1-1). Kashe Crawford shadowed with a perfect 2-2-2.
                    Sophia Benson (4-3-4) won the “best of the rest” fight as
                    Brice Chambers climbed 7-4-3 to P4—classic consistency over
                    flash.
                  </div>
                  <div className="text-sm">
                    - Jr Ski 13–15 Modified 1100 (Race 4): Sebastian Wilcox won
                    the war with a composed 2-1-3. Kashe Crawford again showed
                    top-end speed (1-6-1) but the rough Moto-2 kept him P2
                    overall. Baron Mernik (4-2-2) grabbed P3 by keeping the
                    floor high.
                  </div>
                  <div className="text-sm">
                    - Pro Sport GP (Race 5): Simon Belcher authored a textbook
                    sweep (1-1-1). Brandon Warner’s 2-2-2 shows the same pace,
                    just one step behind off the line. Massimo Casarini (3-3-4)
                    edged Talan Farthing (4-4-3) for P3 on the strength of early
                    motos. DNS in Moto-1 capped Ricky Trevizo and Suphathat
                    Footrakul at 5–6.
                  </div>
                  <div className="text-sm">
                    - Pro Am Ski Stock (Race 6): Alain Wyss looked like the
                    adult in the room—1-2-2 gave him control of the class. Jake
                    Wilson’s clutch Moto-3 win (3-4-1) underlined the raw speed,
                    while Josh Simon (2-3-3) banked another podium with zero
                    drama. The “mechanical tax” hit hard: Davi Prado’s
                    9-1-DNF/DNS erased a podium bid; David Zipperian never got
                    rolling (DNS/DNS).
                  </div>

                  {aquaResultsFive.map((race, i) => (
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
                labelShow="Show Saturday's Schedule"
                labelHide="Hide Saturday's Schedule"
              >
                <div className="space-y-4">
                  <div className="text-sm">Ai Analysis:</div>

                  <div className="text-sm">
                    - Junior Ski 10–12 Stock (Race 1): Cash McClure closed like
                    a champ—3-1-1 → P1 overall. Vittorio Casarini (1-2-2) had
                    the early edge but couldn’t match McClure’s last two motos.
                    Christian Bain steady for P3 (2-3-3). Clear pattern: the
                    rider who improved across motos won the day; hole-shots
                    decided clean water.
                  </div>
                  <div className="text-sm">
                    - Pro Am Women Ski (Race 3): Emy Garcia was clinical: 1-1-2
                    → P1. Britton Reinhard mirror-matched (2-2-1) for P2, with
                    River Varner lock-step 3-3-3 for P3. The podium came down to
                    mistake-free laps; the top three basically ran their own
                    races.
                  </div>
                  <div className="text-sm">
                    - Pro Am Runabout Stock (Race 4): Vanjae Ramgeet won it on
                    consistency—7-3-1 → P1 overall after nailing the money moto.
                    Brian Baldwin (2-7-3 → P2) and Brandon Warner (4-4-6 → P3)
                    rounded the box. Big swings decided the rest: Seddini
                    Khalil’s 1-6-DNS dropped him to P10; Nicolas Rius double-DNS
                    after a P5 opener.
                  </div>
                  <div className="text-sm">
                    - Junior Ski 13–15 Stock (Race 5): Ty Smith delivered a
                    composed 2-1-1 → P1 overall. Gavin Hoggard led early but
                    settled 1-3-3 → P2. Jack Cobb (4-2-2) took P3. The title
                    fight rewarded second-half discipline.
                  </div>
                  <div className="text-sm">
                    - Vintage Ski (Race 6): A textbook wire-to-wire: Andrew
                    Cecere 1-1 → P1 overall, Nick Scholten 2-2 → P2, Dan
                    Fitzgerald 3-3 → P3. Behind them, the story was
                    attrition/traffic: mid-pack shuffles (e.g., Justin Treder
                    14-5) showed how one clean start flips positions.
                  </div>
                  <div className="text-sm">
                    - Pro Runabout GP (Race 7): Seddini Khalil took command with
                    2-1-1 → P1 overall. Massimo Casarini was next best on
                    average (1-2-2 → P2). Valentina Lezcano (4-3-3) and Juan
                    Lezcano (3-4-4) filled P3/P4. Khalil’s pace + mistake-free
                    execution made this feel inevitable by the final.
                  </div>
                  <div className="text-sm">
                    - Pro Ski GP (Race 2) — Halfway update (2 motos today, 2
                    tomorrow): It’s tight and volatile. Harley Ritchie rebounded
                    from an average opener to win Moto-2 (8, 1). Revin Harris is
                    the metronome (4, 4). Mao Sato started hot then slipped (2,
                    8). Ryder Wildeboer showed the largest swing (1, 12).
                    Sebastion Girello climbed (12, 3). With two motos left
                    tomorrow, this one’s wide open—Ritchie carries the momentum,
                    Harris carries the consistency, and Sato/Wildeboer have the
                    outright speed if they tidy the starts.
                  </div>

                  {aquaResultsSix.map((race, i) => (
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
                labelShow="Show Sunday's Schedule"
                labelHide="Hide Sunday's Schedule"
              >
                <div className="space-y-4">
                  <div className="text-sm">More Info to Come...</div>

                  <img
                    src={todaysSchedule}
                    alt="IJSBA World Finals Monday's Schedule"
                    loading="lazy"
                    onClick={() => setViewerSrc(todaysSchedule)}
                    className="w-full h-auto rounded-xl border border-white/10 bg-white/5 cursor-zoom-in hover:opacity-90 transition"
                  />
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
