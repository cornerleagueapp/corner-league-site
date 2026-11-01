import { SPORT_STATS, derivedStatistics, statTotals } from "./sportStatistics";
const basketballOrder = [
  "points",
  "rebounds",
  "assists",
  "blocks",
  "steals",
  "turnovers",
  "minutes",
];
/** Presentation order only: never add an unrecorded stat column. */
export function orderedStatKeys(sport: string, keys: Iterable<string>) {
  const available = [...new Set(keys)];
  if (sport !== "basketball") return available;
  const preferred = [
    ...new Set([...basketballOrder, ...(SPORT_STATS[sport] || [])]),
  ];
  return [
    ...preferred.filter((k) => available.includes(k)),
    ...available.filter((k) => !preferred.includes(k)),
  ];
}
const rateInputs: Record<string, string[]> = {
  fieldGoalPercentage: ["fieldGoalsMade", "fieldGoalsAttempted"],
  threePointPercentage: ["threePointersMade", "threePointersAttempted"],
  freeThrowPercentage: ["freeThrowsMade", "freeThrowsAttempted"],
  passPercentage: ["passesCompleted", "passesAttempted"],
  savePercentage: ["saves"],
  faceoffPercentage: ["faceoffsWon", "faceoffsTaken"],
  battingAverage: ["hits", "atBats"],
  era: ["earnedRuns", "outsPitched"],
  completionPercentage: ["passingCompletions", "passingAttempts"],
};
export function recordedDerivedStats(
  rows: { values: Record<string, number> }[],
  sport: string,
): [string, number][] {
  return Object.entries(
    derivedStatistics(statTotals(rows, sport), sport),
  ).filter((entry): entry is [string, number] => {
    const [key, value] = entry;
    const required =
      key === "savePercentage"
        ? [
            ...rateInputs[key],
            sport === "hockey" ? "goalsAgainst" : "goalsConceded",
          ]
        : rateInputs[key] || [];
    return (
      value !== null &&
      Number.isFinite(value) &&
      required.every((k) => rows.some((r) => Number.isFinite(r.values[k])))
    );
  });
}
export function derivedStatDisplay(key: string, value: number) {
  return key.endsWith("Percentage")
    ? `${value.toLocaleString()}%`
    : value.toLocaleString(undefined, { maximumFractionDigits: 3 });
}
