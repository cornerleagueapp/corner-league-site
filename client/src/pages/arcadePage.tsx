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

export default function ArcadePage() {
  const [mode, setMode] = useState<ArcadeMode>("loading");
  const [course, setCourse] = useState<ArcadeCourse | null>(null);
  const [cpuRacers, setCpuRacers] = useState<ArcadeCpuRacer[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadArcade() {
      try {
        const [activeCourse, racers] = await Promise.all([
          getActiveArcadeCourse(),
          getArcadeCpuRacers(4),
        ]);

        setCourse(activeCourse);
        setCpuRacers(racers);
        setMode("home");
      } catch (err) {
        console.error(err);
        setError("Unable to load Corner League Arcade.");
      }
    }

    loadArcade();
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
        <div className="max-w-md rounded-2xl border border-red-500/40 bg-red-950/30 p-6 text-center">
          <h1 className="text-2xl font-bold">Arcade Error</h1>
          <p className="mt-2 text-sm text-red-100">{error}</p>
        </div>
      </div>
    );
  }

  if (mode === "loading" || !course) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
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
