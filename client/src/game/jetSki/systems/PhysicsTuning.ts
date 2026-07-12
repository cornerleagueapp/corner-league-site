import type { ArcadeCpuRacer } from "@/services/arcadeService";
import type { RacerStats } from "../../core/types";
import Phaser from "phaser";

export type RaceDifficulty = "junior" | "amateur" | "pro";

export const PLAYER_STATS: RacerStats = {
  maxSpeed: 185,
  acceleration: 520,
  drag: 0.91,
  turnSpeed: 5.2,
  slideFactor: 0.82,
  mistakeChance: 0,
};

type DifficultyProfile = {
  maxSpeedMultiplier: number;
  accelerationMultiplier: number;
  turnMultiplier: number;
  dragBonus: number;
  mistakeMultiplier: number;
  nearBuoySpeedMultiplier: number;
};

export const DIFFICULTY_PROFILES: Record<RaceDifficulty, DifficultyProfile> = {
  junior: {
    maxSpeedMultiplier: 0.72,
    accelerationMultiplier: 0.72,
    turnMultiplier: 0.82,
    dragBonus: -0.008,
    mistakeMultiplier: 2.2,
    nearBuoySpeedMultiplier: 0.68,
  },

  amateur: {
    maxSpeedMultiplier: 0.87,
    accelerationMultiplier: 0.88,
    turnMultiplier: 0.93,
    dragBonus: -0.003,
    mistakeMultiplier: 1.35,
    nearBuoySpeedMultiplier: 0.76,
  },

  pro: {
    maxSpeedMultiplier: 1,
    accelerationMultiplier: 1,
    turnMultiplier: 1,
    dragBonus: 0,
    mistakeMultiplier: 1,
    nearBuoySpeedMultiplier: 0.82,
  },
};

export function cpuStatsFromRacer(
  racer: ArcadeCpuRacer,
  difficulty: RaceDifficulty = "pro",
): RacerStats {
  const profile = DIFFICULTY_PROFILES[difficulty];

  return {
    maxSpeed: (115 + racer.speedRating * 55) * profile.maxSpeedMultiplier,

    acceleration:
      (260 + racer.accelerationRating * 110) * profile.accelerationMultiplier,

    drag: Phaser.Math.Clamp(
      0.89 + racer.consistencyRating * 0.025 + profile.dragBonus,
      0.86,
      0.992,
    ),

    turnSpeed: (2.3 + racer.turnRating * 1.2) * profile.turnMultiplier,

    slideFactor: 0.78 + racer.turnRating * 0.08,

    mistakeChance: Phaser.Math.Clamp(
      racer.mistakeChance * profile.mistakeMultiplier,
      0,
      0.35,
    ),
  };
}
