import type { ArcadeCpuRacer } from "@/services/arcadeService";
import type { RacerStats } from "../../core/types";

export const PLAYER_STATS: RacerStats = {
  maxSpeed: 185,
  acceleration: 520,
  drag: 0.91,
  turnSpeed: 5.2,
  slideFactor: 0.82,
  mistakeChance: 0,
};

export function cpuStatsFromRacer(racer: ArcadeCpuRacer): RacerStats {
  return {
    maxSpeed: 115 + racer.speedRating * 55,
    acceleration: 260 + racer.accelerationRating * 110,
    drag: 0.89 + racer.consistencyRating * 0.025,
    turnSpeed: 2.3 + racer.turnRating * 1.2,
    slideFactor: 0.78 + racer.turnRating * 0.08,
    mistakeChance: racer.mistakeChance,
  };
}
