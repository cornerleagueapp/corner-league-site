import { useEffect, useRef, useState } from "react";
import Phaser from "phaser";
import { Maximize2, Pause, Play, X } from "lucide-react";
import { createArcadeConfig } from "@/game/core/config";
import type { ArcadeCourse, ArcadeCpuRacer } from "@/services/arcadeService";

type Props = {
  course: ArcadeCourse;
  cpuRacers: ArcadeCpuRacer[];
  onExit: () => void;
};

export default function ArcadeGameCanvas({ course, cpuRacers, onExit }: Props) {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);

  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    const config = createArcadeConfig({
      parent: containerRef.current,
      course,
      cpuRacers,
      onExit,
    });

    gameRef.current = new Phaser.Game(config);

    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, [course, cpuRacers, onExit]);

  const handlePause = () => {
    gameRef.current?.scene.pause("RaceScene");
    setPaused(true);
  };

  const handleResume = () => {
    gameRef.current?.scene.resume("RaceScene");
    setPaused(false);
  };

  const handleFullscreen = async () => {
    const element = frameRef.current;

    if (!element) return;

    try {
      if (!document.fullscreenElement) {
        await element.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error("Fullscreen failed", err);
    }
  };

  const handleEndGame = () => {
    gameRef.current?.destroy(true);
    gameRef.current = null;
    onExit();
  };

  return (
    <div className="min-h-screen bg-[#030913] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-4 flex flex-col gap-3 rounded-[28px] border border-cyan-300/10 bg-[#07111F]/90 p-4 shadow-[0_24px_70px_rgba(0,0,0,0.32)] sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300/70">
              Corner League Arcade
            </div>
            <h1 className="mt-1 text-2xl font-black uppercase tracking-[-0.03em]">
              {course.name}
            </h1>
          </div>

          <div className="flex flex-wrap gap-2">
            {paused ? (
              <button
                type="button"
                onClick={handleResume}
                className="inline-flex h-11 items-center gap-2 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 text-xs font-black uppercase tracking-[0.14em] text-cyan-100 transition hover:bg-cyan-300 hover:text-[#06111d]"
              >
                <Play className="h-4 w-4" />
                Resume
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePause}
                className="inline-flex h-11 items-center gap-2 rounded-2xl border border-yellow-300/20 bg-yellow-300/10 px-4 text-xs font-black uppercase tracking-[0.14em] text-yellow-100 transition hover:bg-yellow-300 hover:text-[#06111d]"
              >
                <Pause className="h-4 w-4" />
                Pause
              </button>
            )}

            <button
              type="button"
              onClick={handleFullscreen}
              className="inline-flex h-11 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-xs font-black uppercase tracking-[0.14em] text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              <Maximize2 className="h-4 w-4" />
              Full Screen
            </button>

            <button
              type="button"
              onClick={handleEndGame}
              className="inline-flex h-11 items-center gap-2 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 text-xs font-black uppercase tracking-[0.14em] text-red-100 transition hover:bg-red-500 hover:text-white"
            >
              <X className="h-4 w-4" />
              End Game
            </button>
          </div>
        </div>

        <div
          ref={frameRef}
          className="overflow-hidden rounded-[30px] border-4 border-black bg-black shadow-[0_30px_90px_rgba(0,0,0,0.45)]"
        >
          <div className="relative mx-auto aspect-video w-full max-w-[1280px] bg-black">
            <div ref={containerRef} className="absolute inset-0" />
          </div>
        </div>

        <div className="mt-4 rounded-[24px] border border-cyan-300/10 bg-[#07111F]/70 p-4 text-sm leading-6 text-white/50">
          Controls: use arrow keys or WASD. Directional controls now move the
          ski toward the direction you press instead of using fixed
          throttle-style controls.
        </div>
      </div>
    </div>
  );
}
