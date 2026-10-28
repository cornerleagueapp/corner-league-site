// Keep these pure definitions in sync across the three Corner League repositories.
export const SPORT_STATS: Record<string, readonly string[]> = {
  basketball: [
    "points",
    "rebounds",
    "assists",
    "steals",
    "blocks",
    "turnovers",
    "minutes",
    "fieldGoalsMade",
    "fieldGoalsAttempted",
    "threePointersMade",
    "threePointersAttempted",
    "freeThrowsMade",
    "freeThrowsAttempted",
    "offensiveRebounds",
    "defensiveRebounds",
    "fouls",
  ],
  soccer: [
    "goals",
    "assists",
    "shots",
    "saves",
    "minutes",
    "shotsOnTarget",
    "passesCompleted",
    "passesAttempted",
    "tackles",
    "goalsConceded",
  ],
  hockey: [
    "goals",
    "assists",
    "shots",
    "saves",
    "penalties",
    "goalsAgainst",
    "faceoffsWon",
    "faceoffsTaken",
    "hits",
    "penaltyMinutes",
  ],
  baseball: [
    "runs",
    "hits",
    "rbi",
    "atBats",
    "doubles",
    "triples",
    "homeRuns",
    "walks",
    "strikeouts",
    "stolenBases",
    "errors",
    "outsPitched",
    "earnedRuns",
  ],
  "american-football": [
    "touchdowns",
    "yards",
    "tackles",
    "passingCompletions",
    "passingAttempts",
    "passingYards",
    "passingTouchdowns",
    "interceptionsThrown",
    "rushingAttempts",
    "rushingYards",
    "rushingTouchdowns",
    "receptions",
    "targets",
    "receivingYards",
    "receivingTouchdowns",
    "sacks",
    "defensiveInterceptions",
  ],
};
export const SIGNED_STATS = [
  "yards",
  "passingYards",
  "rushingYards",
  "receivingYards",
];
export function statLabel(key: string) {
  return (
    (
      {
        fieldGoalPercentage: "FG%",
        threePointPercentage: "3P%",
        freeThrowPercentage: "FT%",
        passPercentage: "Pass completion %",
        savePercentage: "Save %",
        faceoffPercentage: "Faceoff %",
        battingAverage: "Batting average",
        era: "ERA",
        completionPercentage: "Completion %",
      } as Record<string, string>
    )[key] ||
    key
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/_/g, " ")
      .replace(/^./, (v) => v.toUpperCase())
  );
}
export function statTotals(
  rows: { values: Record<string, number> }[],
  sport: string,
) {
  return Object.fromEntries(
    (SPORT_STATS[sport] || []).map((k) => [
      k,
      rows.reduce(
        (n, r) => n + (Number.isFinite(r.values[k]) ? r.values[k] : 0),
        0,
      ),
    ]),
  );
}
export function derivedStatistics(
  t: Record<string, number>,
  sport: string,
): Record<string, number | null> {
  const rate = (n: number, d: number, multiplier = 100, precision = 1) =>
    d > 0
      ? Math.round((n / d) * multiplier * 10 ** precision) / 10 ** precision
      : null;
  if (sport === "basketball")
    return {
      fieldGoalPercentage: rate(t.fieldGoalsMade, t.fieldGoalsAttempted),
      threePointPercentage: rate(t.threePointersMade, t.threePointersAttempted),
      freeThrowPercentage: rate(t.freeThrowsMade, t.freeThrowsAttempted),
    };
  if (sport === "soccer")
    return {
      passPercentage: rate(t.passesCompleted, t.passesAttempted),
      savePercentage: rate(t.saves, t.saves + t.goalsConceded),
    };
  if (sport === "hockey")
    return {
      savePercentage: rate(t.saves, t.saves + t.goalsAgainst),
      faceoffPercentage: rate(t.faceoffsWon, t.faceoffsTaken),
    };
  if (sport === "baseball")
    return {
      battingAverage: rate(t.hits, t.atBats, 1, 3),
      era: rate(t.earnedRuns, t.outsPitched, 27, 2),
    };
  if (sport === "american-football")
    return {
      completionPercentage: rate(t.passingCompletions, t.passingAttempts),
    };
  return {};
}
// Return a useful validation message without changing historic stat-only records.
export function statConsistencyError(
  v: Record<string, number>,
  sport: string,
): string | null {
  const pairs =
    sport === "basketball"
      ? [
          ["fieldGoalsMade", "fieldGoalsAttempted"],
          ["threePointersMade", "threePointersAttempted"],
          ["freeThrowsMade", "freeThrowsAttempted"],
        ]
      : sport === "soccer"
        ? [
            ["shotsOnTarget", "shots"],
            ["passesCompleted", "passesAttempted"],
          ]
        : sport === "hockey"
          ? [["faceoffsWon", "faceoffsTaken"]]
          : sport === "baseball"
            ? v.atBats > 0
              ? [["hits", "atBats"]]
              : []
            : sport === "american-football"
              ? [
                  ["passingCompletions", "passingAttempts"],
                  ["receptions", "targets"],
                ]
              : [];
  for (const [made, attempted] of pairs)
    if (made in v && attempted in v && v[made] > v[attempted])
      return `${statLabel(made)} cannot exceed ${statLabel(attempted).toLowerCase()}.`;
  if (sport === "basketball") {
    if (
      (v.threePointersMade || 0) > (v.fieldGoalsMade || 0) ||
      (v.threePointersAttempted || 0) > (v.fieldGoalsAttempted || 0)
    )
      return "Three-pointers are included in total field goals.";
    if (
      [
        "fieldGoalsMade",
        "fieldGoalsAttempted",
        "threePointersMade",
        "threePointersAttempted",
        "freeThrowsMade",
        "freeThrowsAttempted",
      ].some((k) => v[k] > 0) &&
      v.points !==
        2 * (v.fieldGoalsMade || 0) +
          (v.threePointersMade || 0) +
          (v.freeThrowsMade || 0)
    )
      return "Points must equal 2 × field goals made + three-pointers made + free throws made.";
    if (
      (v.offensiveRebounds || 0) + (v.defensiveRebounds || 0) > 0 &&
      v.rebounds !== (v.offensiveRebounds || 0) + (v.defensiveRebounds || 0)
    )
      return "Rebounds must equal offensive plus defensive rebounds.";
  }
  return null;
}
