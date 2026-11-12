const diamondPositions = ["P", "C", "1B", "2B", "3B", "SS", "LF", "CF", "RF"];

const diamondPositionLabels: Record<string, string> = {
  P: "Pitcher",
  C: "Catcher",
  "1B": "First base",
  "2B": "Second base",
  "3B": "Third base",
  SS: "Shortstop",
  LF: "Left field",
  CF: "Center field",
  RF: "Right field",
};

const newPositionLabels: Record<string, Record<string, string>> = {
  volleyball: { S: "Setter", OH: "Outside hitter", MB: "Middle blocker", OPP: "Opposite hitter", L: "Libero", DS: "Defensive specialist" },
  "flag-football": { QB: "Quarterback", C: "Center", WR: "Receiver", RB: "Running back", RUSH: "Rusher", CB: "Cornerback", S: "Safety", LB: "Linebacker" },
};

export function positionLabel(sport: string, code: string) {
  const label = sport === "baseball" || sport === "softball" ? diamondPositionLabels[code] : newPositionLabels[sport]?.[code];
  return label ? `${label} (${code})` : code;
}

export const positionOptions: Record<string, string[]> = {
  basketball: ["PG", "SG", "SF", "PF", "C"],
  soccer: ["GK", "DF", "MF", "FW"],
  hockey: ["G", "D", "C", "LW", "RW"],
  baseball: diamondPositions,
  softball: diamondPositions,
  volleyball: Object.keys(newPositionLabels.volleyball),
  "flag-football": Object.keys(newPositionLabels["flag-football"]),
  "american-football": [
    "QB",
    "RB",
    "WR",
    "TE",
    "OL",
    "DL",
    "LB",
    "CB",
    "S",
    "K",
    "P",
  ],
};
