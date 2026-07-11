import type { ArcadeCourse, ArcadeCpuRacer } from "@/services/arcadeService";

export type ArcadeGameData = {
  course: ArcadeCourse;
  cpuRacers: ArcadeCpuRacer[];
  onExit: () => void;
};

export type RacerStats = {
  maxSpeed: number;
  acceleration: number;
  drag: number;
  turnSpeed: number;
  slideFactor: number;
  mistakeChance: number;
};

export type RaceResult = {
  courseId: string;
  displayName: string;
  timeMs: number;
  penalties: number;
  lapsCompleted: number;
  completed: boolean;
};
