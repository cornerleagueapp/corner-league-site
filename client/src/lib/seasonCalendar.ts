/** Calendar days use the viewer's local timezone, never UTC string slicing. */
export function localDay(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  if (!Number.isFinite(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function monthCells(month: Date): (Date | null)[] {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const count = new Date(
    month.getFullYear(),
    month.getMonth() + 1,
    0,
  ).getDate();
  return Array.from(
    { length: Math.ceil((first.getDay() + count) / 7) * 7 },
    (_, i) => {
      const day = i - first.getDay() + 1;
      return day < 1 || day > count
        ? null
        : new Date(month.getFullYear(), month.getMonth(), day);
    },
  );
}
export function initialMonth(games: { startsAt: string }[], now = new Date()) {
  const dates = games
    .map((g) => new Date(g.startsAt))
    .filter((d) => Number.isFinite(d.getTime()))
    .sort((a, b) => a.getTime() - b.getTime());
  const first = dates.find((d) => d >= now) || dates[0] || now;
  return new Date(first.getFullYear(), first.getMonth(), 1);
}
export function shiftMonth(month: Date, delta: number) {
  return new Date(month.getFullYear(), month.getMonth() + delta, 1);
}
export function gamesInMonth<T extends { startsAt: string }>(
  games: T[],
  month: Date,
  day = "",
): T[] {
  const prefix = localDay(month).slice(0, 7);
  return games
    .filter((g) => {
      const key = localDay(g.startsAt);
      return key && (day ? key === day : key.startsWith(prefix));
    })
    .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
}
