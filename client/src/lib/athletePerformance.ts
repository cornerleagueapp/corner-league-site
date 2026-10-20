import type { AthleteHistoryItem } from "@/pages/racer-profile-parts/types";
export type PerformanceResult = AthleteHistoryItem & {
  scope?: string;
  updatedAt?: string;
  organizationId?: string | null;
  isFinalized?: boolean;
};
export type RaceStatus = "finished" | "dnf" | "dns" | "dsq" | "unknown";
export function numeric(value: unknown): number | null {
  if (typeof value !== "number" && (typeof value !== "string" || !value.trim()))
    return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}
export function finishPosition(row: PerformanceResult): number | null {
  const value = numeric(row.position);
  return value !== null && Number.isInteger(value) && value > 0 ? value : null;
}
export function raceStatus(row: PerformanceResult): RaceStatus {
  const status = String(row.status ?? "")
    .trim()
    .toUpperCase()
    .replace(/[_-]/g, " ");
  if (["FIN", "FINISHED"].includes(status)) return "finished";
  if (["DNF", "DID NOT FINISH"].includes(status)) return "dnf";
  if (["DNS", "DID NOT START"].includes(status)) return "dns";
  if (["DSQ", "DQ", "DISQUALIFIED"].includes(status)) return "dsq";
  return !status && finishPosition(row) !== null ? "finished" : "unknown";
}
export function isMoto(row: PerformanceResult) {
  return row.motoId != null || row.motoSequence != null || row.scope === "MOTO";
}
export function classKey(row: PerformanceResult) {
  return (
    (typeof row.divisionName === "string" ? row.divisionName : "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ") || `division:${row.divisionId || "unknown"}`
  );
}
export function eventYear(row: PerformanceResult): string | null {
  const time = Date.parse(row.eventStartDate || "");
  return Number.isFinite(time) ? String(new Date(time).getUTCFullYear()) : null;
}
function dateValue(row: PerformanceResult) {
  const value = Date.parse(row.eventStartDate || "");
  return Number.isFinite(value) ? value : 0;
}
export function cleanResults(history: PerformanceResult[]) {
  const records = new Map<string, PerformanceResult>();
  for (const row of history) {
    if (
      !row ||
      typeof row.resultId !== "string" ||
      !row.resultId ||
      row.isFinalized === false
    )
      continue;
    const key = row.matchId
      ? `${row.matchId}:${isMoto(row) ? (row.motoId ?? `moto-${row.motoSequence ?? row.resultId}`) : "overall"}`
      : row.resultId;
    const old = records.get(key),
      time = Date.parse(row.updatedAt || "") || 0,
      oldTime = Date.parse(old?.updatedAt || "") || 0;
    if (
      !old ||
      time > oldTime ||
      (time === oldTime && row.resultId.localeCompare(old.resultId) > 0)
    )
      records.set(key, row);
  }
  return [...records.values()].sort(
    (a, b) =>
      dateValue(a) - dateValue(b) ||
      String(a.matchId).localeCompare(String(b.matchId)) ||
      (a.motoSequence ?? 0) - (b.motoSequence ?? 0) ||
      a.resultId.localeCompare(b.resultId),
  );
}
export function performanceFilters(rows: PerformanceResult[]) {
  const all = cleanResults(rows),
    years = [...new Set(all.map(eventYear).filter((y): y is string => !!y))]
      .sort()
      .reverse();
  const classes = new Map<string, string>();
  for (const row of all)
    classes.set(classKey(row), row.divisionName?.trim() || "Unspecified class");
  return {
    years,
    classes: [...classes]
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label)),
  };
}
function mean(values: number[]) {
  return values.length
    ? values.reduce((a, b) => a + b, 0) / values.length
    : null;
}
function summary(rows: PerformanceResult[]) {
  const starts = rows.filter(
    (r) => !["dns", "unknown"].includes(raceStatus(r)),
  );
  const finished = starts.filter((r) => raceStatus(r) === "finished");
  const positions = finished
    .map(finishPosition)
    .filter((p): p is number => p !== null);
  const wins = positions.filter((p) => p === 1).length,
    podiums = positions.filter((p) => p <= 3).length,
    averageFinish = mean(positions);
  const points = rows
    .map((r) => numeric(r.score))
    .filter((p): p is number => p !== null);
  return {
    records: rows.length,
    starts: starts.length,
    finished: finished.length,
    classified: positions.length,
    wins,
    podiums,
    dns: rows.filter((r) => raceStatus(r) === "dns").length,
    dnf: rows.filter((r) => raceStatus(r) === "dnf").length,
    dsq: rows.filter((r) => raceStatus(r) === "dsq").length,
    unknown: rows.filter((r) => raceStatus(r) === "unknown").length,
    totalPoints: points.length ? points.reduce((a, b) => a + b, 0) : null,
    pointsRecorded: points.length,
    averageFinish,
    bestFinish: positions.length ? Math.min(...positions) : null,
    winRate: starts.length ? (wins / starts.length) * 100 : null,
    podiumRate: starts.length ? (podiums / starts.length) * 100 : null,
    completionRate: starts.length
      ? (finished.length / starts.length) * 100
      : null,
    finishDeviation:
      positions.length >= 2 && averageFinish !== null
        ? Math.sqrt(
            positions.reduce((sum, p) => sum + (p - averageFinish) ** 2, 0) /
              positions.length,
          )
        : null,
    recentAverage: positions.length ? mean(positions.slice(-5)) : null,
    finishImprovement:
      positions.length >= 10
        ? mean(positions.slice(-10, -5))! - mean(positions.slice(-5))!
        : null,
  };
}
export function analyzePerformance(
  history: PerformanceResult[],
  year = "all",
  division = "all",
) {
  const all = cleanResults(history),
    rows = all.filter(
      (r) =>
        (year === "all" || eventYear(r) === year) &&
        (division === "all" || classKey(r) === division),
    );
  const overall = rows.filter((r) => !isMoto(r)),
    motos = rows.filter(isMoto),
    stats = summary(overall);
  const breakdown = new Map<string, PerformanceResult[]>();
  for (const row of overall) {
    const key = classKey(row);
    breakdown.set(key, [...(breakdown.get(key) || []), row]);
  }
  return {
    rows,
    overall,
    motos,
    stats,
    motoStats: summary(motos),
    undated: all.filter((r) => !eventYear(r)).length,
    classes: [...breakdown].map(([key, items]) => ({
      key,
      label: items[0].divisionName || "Unspecified class",
      ...summary(items),
    })),
  };
}
export type TrendPoint = {
  id: string;
  date: string;
  event: string;
  value: number;
};
export function performanceTrend(
  rows: PerformanceResult[],
  metric: "finish" | "points",
): TrendPoint[] {
  let total = 0;
  const points: TrendPoint[] = [];
  for (const row of rows) {
    if (isMoto(row) || !eventYear(row)) continue;
    const position = finishPosition(row),
      score = numeric(row.score);
    if (
      metric === "finish" &&
      (raceStatus(row) !== "finished" || position === null)
    )
      continue;
    if (metric === "points" && score === null) continue;
    if (score !== null) total += score;
    points.push({
      id: row.resultId,
      date: row.eventStartDate!,
      event: row.eventName || "Event",
      value: metric === "finish" ? position! : total,
    });
  }
  return points.slice(-24);
}
export function displayMetric(value: number | null, digits = 1, suffix = "") {
  return value === null
    ? "—"
    : `${value.toLocaleString(undefined, { maximumFractionDigits: digits, minimumFractionDigits: digits })}${suffix}`;
}
