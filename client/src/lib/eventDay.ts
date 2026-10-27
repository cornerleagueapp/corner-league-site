import { localDay } from "./seasonCalendar";
export { localDay };
export function dayDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day, 12);
  return localDay(date) === value ? date : null;
}
export function shiftDay(value: string, amount: number) {
  const date = dayDate(value);
  if (!date) return value;
  date.setDate(date.getDate() + amount);
  return localDay(date);
}
export function dayWindow(value: string) {
  const date = dayDate(value);
  if (!date) throw new Error("Choose a valid date.");
  const from = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const to = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
  return { from: from.toISOString(), to: to.toISOString() };
}
