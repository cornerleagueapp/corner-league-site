import type { seasonStats } from "./seasonStatistics";
import { statLabel } from "./sportStatistics";
export const basketballRates = {
  fieldGoalPercentage: {
    label: "FG% · Field goals",
    made: "fieldGoalsMade",
    attempts: "fieldGoalsAttempted",
  },
  threePointPercentage: {
    label: "3P% · Three-pointers",
    made: "threePointersMade",
    attempts: "threePointersAttempted",
  },
  freeThrowPercentage: {
    label: "FT% · Free throws",
    made: "freeThrowsMade",
    attempts: "freeThrowsAttempted",
  },
} as const;
export function leaderCategories(sport: string, metrics: string[]) {
  return [
    ...metrics.map((key) => ({ key, label: statLabel(key) })),
    ...(sport === "basketball"
      ? Object.entries(basketballRates).map(([key, rate]) => ({
          key,
          label: rate.label,
        }))
      : []),
  ];
}
export function percentageCategory(sport: string, metric: string) {
  return sport === "basketball" &&
    Object.prototype.hasOwnProperty.call(basketballRates, metric)
    ? basketballRates[metric as keyof typeof basketballRates]
    : null;
}
export function playerLeaders(
  players: ReturnType<typeof seasonStats>["players"],
  sport: string,
  metric: string,
) {
  const rate = percentageCategory(sport, metric);
  return players
    .flatMap((p) => {
      if (!rate)
        return [
          {
            ...p,
            value: p.totals[metric] || 0,
            made: null as number | null,
            attempts: null as number | null,
          },
        ];
      // Only complete, valid shooting rows contribute to the numerator and denominator.
      const recorded = p.rows.filter(
        (r) =>
          Number.isFinite(r.values[rate.made]) &&
          Number.isFinite(r.values[rate.attempts]) &&
          r.values[rate.made] >= 0 &&
          r.values[rate.attempts] >= 0 &&
          r.values[rate.made] <= r.values[rate.attempts],
      );
      const made = recorded.reduce((sum, r) => sum + r.values[rate.made], 0),
        attempts = recorded.reduce(
          (sum, r) => sum + r.values[rate.attempts],
          0,
        );
      return attempts > 0
        ? [{ ...p, value: (made / attempts) * 100, made, attempts }]
        : [];
    })
    .sort(
      (a, b) =>
        b.value - a.value ||
        (rate ? (b.attempts || 0) - (a.attempts || 0) : 0) ||
        a.name.localeCompare(b.name),
    )
    .slice(0, 10);
}
