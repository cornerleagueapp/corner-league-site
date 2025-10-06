// src/components/RaceResultsTable.tsx
import * as React from "react";
import { cn } from "@/lib/utils";
import { Trophy } from "lucide-react";
import AccordionSection from "@/components/AccordionSection";

/** A single rider/row */
export type RiderResult = {
  rank?: number;
  bikeNumber?: string | number;
  plateDot?: string;
  rider: string;
  age?: number | null;
  motos: Array<{ pos?: number | null; laps?: number | null }>;
  finalPos?: number | null;
};

export type RaceResults = {
  raceLabel?: string;
  title: string;
  motoLabels?: string[];
  rows: RiderResult[];
};

function computeFinalPositions(rows: RiderResult[]) {
  const scored = rows.map((r, idx) => {
    const positions = r.motos.map((m) =>
      m?.pos == null ? 999 : Number(m.pos)
    );
    const sum = positions.reduce((a, b) => a + b, 0);
    const best = Math.min(...positions);
    return { idx, sum, best };
  });
  scored.sort((a, b) => (a.sum === b.sum ? a.best - b.best : a.sum - b.sum));
  const computedRank: number[] = new Array(rows.length);
  let place = 1;
  for (const s of scored) computedRank[s.idx] = place++;
  return computedRank;
}

function trophyFor(place?: number | null) {
  switch (place) {
    case 1:
      return { show: true, colorClass: "text-amber-400", label: "1st place" };
    case 2:
      return { show: true, colorClass: "text-gray-300", label: "2nd place" };
    case 3:
      return { show: true, colorClass: "text-[#cd7f32]", label: "3rd place" };
    default:
      return { show: false, colorClass: "", label: "" };
  }
}

// Solid colors
const BG_CONTAINER = "#0f0f0f";
const BG_HEADER = "#151515";
const BG_ROW = "#0f0f0f";
const BG_ROW_HOVER = "#171717";

export default function RaceResultsTable({
  data,
  className,
  showFinalOnDesktop = true,
  collapsible = false,
  labelShow,
  labelHide,
}: {
  data: RaceResults;
  className?: string;
  /** Desktop table shows "Final" column if true */
  showFinalOnDesktop?: boolean;
  /** Wrap the table in an accordion */
  collapsible?: boolean;
  /** Optional custom labels for the accordion header */
  labelShow?: string;
  labelHide?: string;
}) {
  const motoLabels = data.motoLabels?.length
    ? data.motoLabels
    : Array.from(
        { length: Math.max(...data.rows.map((r) => r.motos.length), 1) },
        (_, i) => `Moto ${i + 1}`
      );

  const rowsSorted = React.useMemo(() => {
    return data.rows
      .map((r, i) => ({ r, i }))
      .sort((a, b) => {
        const ar = a.r.rank,
          br = b.r.rank;
        if (ar == null && br == null) return a.i - b.i;
        if (ar == null) return 1;
        if (br == null) return -1;
        if (ar !== br) return ar - br;
        return a.i - b.i;
      })
      .map((x) => x.r);
  }, [data.rows]);

  const computed = React.useMemo(
    () => computeFinalPositions(rowsSorted),
    [rowsSorted]
  );

  // Mobile flag (<= 767.98px)
  const [isMobile, setIsMobile] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia("(max-width: 767.98px)");
    const apply = () => setIsMobile(mq.matches);
    apply();
    mq.addEventListener?.("change", apply);
    return () => mq.removeEventListener?.("change", apply);
  }, []);

  const content = (
    <div
      className={cn("rounded-xl border border-white/10", className)}
      style={{ backgroundColor: BG_CONTAINER }}
    >
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center justify-between border-b border-white/10"
        style={{ backgroundColor: BG_CONTAINER }}
      >
        <div>
          {data.raceLabel && (
            <div className="text-[11px] uppercase tracking-wide text-orange-400/90">
              {data.raceLabel}
            </div>
          )}
          <h3 className="text-lg sm:text-xl font-semibold">{data.title}</h3>
        </div>
      </div>

      {isMobile ? (
        <MobileList
          rows={rowsSorted}
          motoLabels={motoLabels}
          computed={computed}
        />
      ) : (
        <DesktopTable
          rows={rowsSorted}
          motoLabels={motoLabels}
          computed={computed}
          showFinal={showFinalOnDesktop}
        />
      )}

      <div className="px-4 py-2 text-[11px] text-white/60 sm:hidden">
        Tip: swipe the row horizontally if the moto list wraps.
      </div>
    </div>
  );

  if (!collapsible) return content;

  // Use existing AccordionSection wrapper if requested
  const defaultShow =
    labelShow ?? `${data.raceLabel ? `${data.raceLabel} — ` : ""}${data.title}`;
  const defaultHide =
    labelHide ??
    `Hide ${data.raceLabel ? `${data.raceLabel} — ` : ""}${data.title}`;

  return (
    <AccordionSection labelShow={defaultShow} labelHide={defaultHide}>
      {content}
    </AccordionSection>
  );
}

/* ------------------------- Mobile: card/list layout ------------------------ */
function MobileList({
  rows,
  motoLabels,
  computed,
}: {
  rows: RiderResult[];
  motoLabels: string[];
  computed: number[];
}) {
  return (
    <div className="p-3 space-y-3">
      {rows.map((r, idx) => {
        const final = r.finalPos ?? computed[idx] ?? null;
        const trophy = trophyFor(final);
        return (
          <div
            key={idx}
            className="rounded-xl border border-white/10 px-3 py-2"
            style={{ backgroundColor: BG_ROW }}
          >
            {/* Rank + Rider (Boat # hidden on mobile) */}
            <div className="flex items-center gap-2">
              <span className="tabular-nums text-white/60">
                {r.rank ?? idx + 1}
              </span>
              <span className="inline-flex items-center gap-1 text-white">
                {trophy.show ? (
                  <Trophy
                    aria-label={trophy.label}
                    className={`h-4 w-4 ${trophy.colorClass}`}
                  />
                ) : null}
                <span className="truncate max-w-[75vw]">{r.rider}</span>
              </span>
            </div>

            {/* Motos + Final (Final visible on mobile) */}
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
              {motoLabels.map((ml, i) => {
                const pos = r.motos[i]?.pos;
                return (
                  <span key={i} className="text-xs text-white/80">
                    <span className="text-white/50">
                      {ml.replace("Moto ", "M")}:{" "}
                    </span>
                    <span className="tabular-nums">{pos ?? "—"}</span>
                  </span>
                );
              })}
              <span className="text-xs text-white/80">
                <span className="text-white/50">Final: </span>
                <span className="tabular-nums">{final ?? "—"}</span>
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------- Desktop: sticky table -------------------------- */
function DesktopTable({
  rows,
  motoLabels,
  computed,
  showFinal,
}: {
  rows: RiderResult[];
  motoLabels: string[];
  computed: number[];
  showFinal: boolean;
}) {
  // Fixed widths for sticky columns on desktop only
  const W_RANK = 56,
    W_BIKE = 96,
    W_RIDER = 240,
    W_AGE = 72;
  const LEFT_RANK = 0,
    LEFT_BIKE = LEFT_RANK + W_RANK,
    LEFT_RIDER = LEFT_BIKE + W_BIKE,
    LEFT_AGE = LEFT_RIDER + W_RIDER;

  return (
    <div
      className="relative w-full overflow-x-auto"
      role="region"
      aria-label="Race results table"
    >
      <table
        className="border-separate border-spacing-0 text-sm w-max"
        style={{ backgroundColor: BG_CONTAINER }}
      >
        <thead>
          <tr className="text-white/70" style={{ backgroundColor: BG_HEADER }}>
            <th
              className="text-left font-semibold px-3 py-2 sticky left-0 z-30"
              style={{
                width: W_RANK,
                left: LEFT_RANK,
                backgroundColor: BG_HEADER,
              }}
            >
              Rank
            </th>
            <th
              className="text-left font-semibold px-3 py-2 sticky z-30"
              style={{
                width: W_BIKE,
                left: LEFT_BIKE,
                backgroundColor: BG_HEADER,
              }}
            >
              Boat #
            </th>
            <th
              className="text-left font-semibold px-3 py-2 sticky z-30"
              style={{
                width: W_RIDER,
                left: LEFT_RIDER,
                backgroundColor: BG_HEADER,
              }}
            >
              Rider
            </th>
            <th
              className="text-left font-semibold px-3 py-2 md:sticky z-30"
              style={{
                width: W_AGE,
                left: LEFT_AGE,
                backgroundColor: BG_HEADER,
              }}
            >
              Age
            </th>

            {motoLabels.map((ml, i) => (
              <th
                key={i}
                className="text-left font-semibold px-3 py-2 whitespace-nowrap"
                style={{ backgroundColor: BG_HEADER }}
              >
                {ml}
              </th>
            ))}
            {showFinal ? (
              <th
                className="text-left font-semibold px-3 py-2 whitespace-nowrap"
                style={{ backgroundColor: BG_HEADER }}
              >
                Final
              </th>
            ) : null}
          </tr>
        </thead>

        <tbody>
          {rows.map((r, idx) => {
            const final = r.finalPos ?? computed[idx] ?? null;
            const trophy = trophyFor(final);
            return (
              <tr
                key={idx}
                className="border-b border-white/5 transition-colors"
                style={{ backgroundColor: BG_ROW }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = BG_ROW_HOVER)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = BG_ROW)
                }
              >
                <td
                  className="px-3 py-2 sticky left-0 z-20"
                  style={{
                    width: W_RANK,
                    left: LEFT_RANK,
                    backgroundColor: BG_ROW,
                  }}
                >
                  <span className="tabular-nums">{r.rank ?? idx + 1}</span>
                </td>
                <td
                  className="px-3 py-2 sticky z-20"
                  style={{
                    width: W_BIKE,
                    left: LEFT_BIKE,
                    backgroundColor: BG_ROW,
                  }}
                >
                  <span className="inline-flex items-center gap-2">
                    {r.plateDot && (
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full"
                        style={{ background: r.plateDot }}
                      />
                    )}
                    <span className="inline-block rounded-md bg-white/10 px-2 py-1 border border-white/15 text-xs">
                      {r.bikeNumber ?? "—"}
                    </span>
                  </span>
                </td>
                <td
                  className="px-3 py-2 sticky z-20"
                  style={{
                    width: W_RIDER,
                    left: LEFT_RIDER,
                    backgroundColor: BG_ROW,
                  }}
                >
                  <span className="inline-flex items-center gap-1.5 text-white">
                    {trophy.show ? (
                      <Trophy
                        aria-label={trophy.label}
                        className={`h-4 w-4 ${trophy.colorClass}`}
                      />
                    ) : null}
                    {r.rider}
                  </span>
                </td>
                <td
                  className="px-3 py-2 md:sticky z-20"
                  style={{
                    width: W_AGE,
                    left: LEFT_AGE,
                    backgroundColor: BG_ROW,
                  }}
                >
                  <span className="tabular-nums">{r.age ?? "—"}</span>
                </td>

                {motoLabels.map((_, i) => {
                  const pos = r.motos[i]?.pos;
                  return (
                    <td
                      key={i}
                      className="px-3 py-2 whitespace-nowrap"
                      style={{ backgroundColor: BG_ROW }}
                    >
                      {pos == null ? (
                        <span className="text-white/50">—</span>
                      ) : (
                        <span className="tabular-nums">{pos}</span>
                      )}
                    </td>
                  );
                })}

                {showFinal ? (
                  <td
                    className="px-3 py-2 whitespace-nowrap font-medium"
                    style={{ backgroundColor: BG_ROW }}
                  >
                    <span className="tabular-nums">{final ?? "—"}</span>
                  </td>
                ) : null}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
