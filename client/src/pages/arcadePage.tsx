import { useEffect, useState } from "react";
import ArcadeHome from "@/components/arcade/ArcadeHome";
import ArcadeGameCanvas from "@/components/arcade/ArcadeGameCanvas";
import {
  ArcadeCourse,
  ArcadeCpuRacer,
  getActiveArcadeCourse,
  getArcadeCpuRacers,
} from "@/services/arcadeService";

type ArcadeMode = "loading" | "home" | "race";

const MINIMUM_ARCADE_WIDTH = 1024;

export default function ArcadePage() {
  const [mode, setMode] = useState<ArcadeMode>("loading");
  const [course, setCourse] = useState<ArcadeCourse | null>(null);
  const [cpuRacers, setCpuRacers] = useState<ArcadeCpuRacer[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [canPlayArcade, setCanPlayArcade] = useState<boolean | null>(null);

  useEffect(() => {
    function checkScreenWidth() {
      const isLargeEnough = window.innerWidth >= MINIMUM_ARCADE_WIDTH;

      setCanPlayArcade(isLargeEnough);

      if (!isLargeEnough) {
        setMode("home");
      }
    }

    checkScreenWidth();

    window.addEventListener("resize", checkScreenWidth);

    return () => {
      window.removeEventListener("resize", checkScreenWidth);
    };
  }, []);

  useEffect(() => {
    if (!canPlayArcade) {
      return;
    }

    let isMounted = true;

    async function loadArcade() {
      try {
        setError(null);
        setMode("loading");

        const [activeCourse, racers] = await Promise.all([
          getActiveArcadeCourse(),
          getArcadeCpuRacers(4),
        ]);

        if (!isMounted) {
          return;
        }

        setCourse(activeCourse);
        setCpuRacers(racers);
        setMode("home");
      } catch (err) {
        console.error(err);

        if (isMounted) {
          setError("Unable to load Corner League Arcade.");
        }
      }
    }

    loadArcade();

    return () => {
      isMounted = false;
    };
  }, [canPlayArcade]);

  if (canPlayArcade === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        Loading Corner League Arcade...
      </div>
    );
  }

  if (!canPlayArcade) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
        <div className="w-full max-w-md rounded-2xl border border-white/15 bg-white/5 p-8 text-center shadow-2xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-yellow-400/40 bg-yellow-400/10 text-2xl">
            🕹️
          </div>

          <h1 className="mt-5 text-2xl font-bold">Corner League Arcade</h1>

          <p className="mt-3 text-sm leading-6 text-white/70">
            Games are only able to be played on a computer.
          </p>

          <p className="mt-2 text-xs text-white/45">
            Please open this page on a device with a screen width of at least
            1024 pixels.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black px-4 text-white">
        <div className="max-w-md rounded-2xl border border-red-500/40 bg-red-950/30 p-6 text-center">
          <h1 className="text-2xl font-bold">Arcade Error</h1>

          <p className="mt-2 text-sm text-red-100">{error}</p>
        </div>
      </div>
    );
  }

  if (mode === "loading" || !course) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        Loading Corner League Arcade...
      </div>
    );
  }

  if (mode === "race") {
    return (
      <ArcadeGameCanvas
        course={course}
        cpuRacers={cpuRacers}
        onExit={() => setMode("home")}
      />
    );
  }

  return <ArcadeHome course={course} onPlay={() => setMode("race")} />;
}
