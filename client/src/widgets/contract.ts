export const kinds = [
  "team-scoreboard",
  "team-standings",
  "team-bracket",
  "golf-leaderboard",
  "event-schedule",
  "event-results",
  "upcoming-events",
  "event-card",
  "team-schedule",
  "athlete-spotlight",
  "sponsor-spotlight",
  "event-recap",
  "announcement",
] as const;
export type WidgetRow = {
  id: string;
  cells: string[];
  status?: string;
  winner?: "home" | "away" | null;
  startsAt?: string;
};
export type WidgetPayload = {
  schemaVersion: 1;
  id: string;
  revision: number;
  title: string;
  kind: (typeof kinds)[number];
  theme: "light" | "dark";
  accent: string;
  density: "comfortable" | "compact";
  organization: { id: string; name: string; sportKey: string };
  sections: {
    id: string;
    title: string;
    columns: string[];
    rows: WidgetRow[];
  }[];
  publishedAt: string | null;
  refreshedAt: string;
  sourceUrl: string;
  preview?: boolean;
};
export function requireWidget(
  input: unknown,
  id: string,
  assetOrigin: string,
): WidgetPayload {
  const p = input as WidgetPayload;
  const text = (x: unknown): x is string =>
    typeof x === "string" && x.length <= 4000;
  let source: URL;
  try {
    source = new URL(p.sourceUrl);
  } catch {
    throw Error("Invalid widget link.");
  }
  if (
    !p ||
    p.schemaVersion !== 1 ||
    p.id !== id ||
    !Number.isInteger(p.revision) ||
    !text(p.title) ||
    !text(p.organization?.name) ||
    !kinds.includes(p.kind) ||
    !["light", "dark"].includes(p.theme) ||
    !["comfortable", "compact"].includes(p.density) ||
    !/^#[a-f\d]{6}$/i.test(p.accent) ||
    source.origin !== assetOrigin ||
    !["http:", "https:"].includes(source.protocol) ||
    source.username ||
    source.password ||
    !Array.isArray(p.sections) ||
    p.sections.length > 200 ||
    p.sections.some(
      (s) =>
        !text(s.id) ||
        !text(s.title) ||
        !Array.isArray(s.columns) ||
        s.columns.length > 8 ||
        !s.columns.every(text) ||
        !Array.isArray(s.rows) ||
        s.rows.length > 50 ||
        s.rows.some(
          (r) =>
            !text(r.id) ||
            (r.startsAt !== undefined &&
              (typeof r.startsAt !== "string" ||
                !Number.isFinite(Date.parse(r.startsAt)))) ||
            !Array.isArray(r.cells) ||
            r.cells.length > 8 ||
            !r.cells.every(text),
        ),
    ) ||
    !Number.isFinite(Date.parse(p.refreshedAt))
  )
    throw Error("The widget response could not be verified.");
  return p;
}
export function formatCell(value: string) {
  if (/^\d{4}-\d\d-\d\dT/.test(value) && Number.isFinite(Date.parse(value)))
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(value));
  return value;
}
