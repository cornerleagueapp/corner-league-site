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
  riderHref?: string;
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
      m?.pos == null ? 999 : Number(m.pos),
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
      return { show: true, colorClass: "text-amber-300", label: "1st place" };
    case 2:
      return { show: true, colorClass: "text-slate-200", label: "2nd place" };
    case 3:
      return { show: true, colorClass: "text-[#CD7F32]", label: "3rd place" };
    default:
      return { show: false, colorClass: "", label: "" };
  }
}

function podiumRankClass(place?: number | null) {
  switch (place) {
    case 1:
      return "border-amber-300/25 bg-amber-300/10 text-amber-100";
    case 2:
      return "border-slate-200/20 bg-slate-200/10 text-slate-100";
    case 3:
      return "border-[#CD7F32]/25 bg-[#CD7F32]/10 text-[#FFD9A8]";
    default:
      return "border-white/10 bg-white/[0.04] text-white/70";
  }
}

function resultText(value?: number | null) {
  if (value == null) return "—";
  return String(value);
}

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
        (_, i) => `Moto ${i + 1}`,
      );

  const rowsSorted = React.useMemo(() => {
    return data.rows
      .map((r, i) => ({ r, i }))
      .sort((a, b) => {
        const ar = a.r.rank;
        const br = b.r.rank;

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
    [rowsSorted],
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
      className={cn(
        "min-w-0 overflow-hidden rounded-[28px] border border-cyan-300/10 bg-[#07111F]/80 shadow-[0_24px_70px_rgba(0,0,0,0.28)]",
        className,
      )}
    >
      <div className="border-b border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045)_0%,rgba(255,255,255,0.015)_100%)] px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            {data.raceLabel ? (
              <div className="mb-2 inline-flex w-fit items-center gap-2 rounded-full border border-[#FF6B35]/20 bg-[#FF6B35]/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-[#FFB199]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#FF7849]" />
                {data.raceLabel}
              </div>
            ) : null}

            <h3 className="min-w-0 break-words text-xl font-black uppercase leading-tight tracking-[-0.02em] text-white sm:text-2xl">
              {data.title}
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
            <div className="rounded-2xl border border-cyan-300/10 bg-cyan-300/[0.06] px-4 py-2">
              <div className="text-[9px] font-black uppercase tracking-[0.18em] text-white/40">
                Entries
              </div>
              <div className="mt-0.5 text-lg font-black text-cyan-200">
                {rowsSorted.length}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2">
              <div className="text-[9px] font-black uppercase tracking-[0.18em] text-white/40">
                Scoring
              </div>
              <div className="mt-0.5 text-lg font-black text-white">
                {motoLabels.length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {rowsSorted.length === 0 ? (
        <div className="p-5 text-sm leading-7 text-slate-300">
          No results have been posted for this class yet.
        </div>
      ) : isMobile ? (
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

      <div className="border-t border-white/10 px-4 py-3 text-[11px] leading-5 text-white/45 sm:hidden">
        Tip: final positions are shown on each card. Tap racer names to view
        profiles when available.
      </div>
    </div>
  );

  if (!collapsible) return content;

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
    <div className="space-y-3 p-3 sm:p-4">
      {rows.map((r, idx) => {
        const final = r.finalPos ?? computed[idx] ?? null;
        const rank = r.rank ?? idx + 1;
        const trophy = trophyFor(final);

        return (
          <div
            key={`${r.rider}-${idx}`}
            className="min-w-0 overflow-hidden rounded-[24px] border border-cyan-300/10 bg-black/25 p-4 shadow-[0_16px_40px_rgba(0,0,0,0.18)]"
          >
            <div className="flex min-w-0 items-start gap-3">
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border text-lg font-black tabular-nums ${podiumRankClass(
                  final,
                )}`}
              >
                {rank}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 items-start gap-2">
                  {trophy.show ? (
                    <Trophy
                      aria-label={trophy.label}
                      className={`mt-0.5 h-4 w-4 shrink-0 ${trophy.colorClass}`}
                    />
                  ) : null}

                  {r.riderHref ? (
                    <a
                      href={r.riderHref}
                      className="min-w-0 break-words text-base font-black uppercase leading-snug text-white underline-offset-4 transition hover:text-cyan-300 hover:underline"
                    >
                      {r.rider}
                    </a>
                  ) : (
                    <span className="min-w-0 break-words text-base font-black uppercase leading-snug text-white">
                      {r.rider}
                    </span>
                  )}
                </div>

                <div className="mt-2 flex flex-wrap gap-2">
                  {r.bikeNumber != null ? (
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-white/60">
                      Boat #{r.bikeNumber}
                    </span>
                  ) : null}

                  {r.age != null ? (
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-white/60">
                      Age {r.age}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              {motoLabels.map((ml, i) => {
                const pos = r.motos[i]?.pos;

                return (
                  <div
                    key={`${ml}-${i}`}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2"
                  >
                    <div className="text-[9px] font-black uppercase tracking-[0.14em] text-white/35">
                      {ml.replace("Moto ", "M")}
                    </div>
                    <div className="mt-1 text-lg font-black tabular-nums text-white">
                      {resultText(pos)}
                    </div>
                  </div>
                );
              })}

              <div
                className={`rounded-2xl border px-3 py-2 ${podiumRankClass(
                  final,
                )}`}
              >
                <div className="text-[9px] font-black uppercase tracking-[0.14em] opacity-70">
                  Final
                </div>
                <div className="mt-1 text-lg font-black tabular-nums">
                  {resultText(final)}
                </div>
              </div>
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
  const W_RANK = 72;
  const W_BIKE = 104;
  const W_RIDER = 280;
  const W_AGE = 76;

  const LEFT_RANK = 0;
  const LEFT_BIKE = LEFT_RANK + W_RANK;
  const LEFT_RIDER = LEFT_BIKE + W_BIKE;
  const LEFT_AGE = LEFT_RIDER + W_RIDER;

  const stickyCellBase =
    "sticky z-20 border-b border-white/10 bg-[#07111F] px-3 py-4";
  const headerCellBase =
    "sticky z-30 border-b border-white/10 bg-[#0B1828] px-3 py-3 text-left text-[10px] font-black uppercase tracking-[0.16em] text-white/45";

  return (
    <div
      className="relative w-full overflow-x-auto [scrollbar-width:thin] [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-cyan-300/20"
      role="region"
      aria-label="Race results table"
    >
      <table className="w-max min-w-full border-separate border-spacing-0 text-sm">
        <thead>
          <tr>
            <th
              className={headerCellBase}
              style={{
                width: W_RANK,
                left: LEFT_RANK,
              }}
            >
              Rank
            </th>

            <th
              className={headerCellBase}
              style={{
                width: W_BIKE,
                left: LEFT_BIKE,
              }}
            >
              Boat #
            </th>

            <th
              className={headerCellBase}
              style={{
                width: W_RIDER,
                left: LEFT_RIDER,
              }}
            >
              Rider
            </th>

            <th
              className={headerCellBase}
              style={{
                width: W_AGE,
                left: LEFT_AGE,
              }}
            >
              Age
            </th>

            {motoLabels.map((ml, i) => (
              <th
                key={`${ml}-${i}`}
                className="border-b border-white/10 bg-[#0B1828] px-3 py-3 text-left text-[10px] font-black uppercase tracking-[0.16em] text-white/45"
              >
                <span className="whitespace-nowrap">{ml}</span>
              </th>
            ))}

            {showFinal ? (
              <th className="border-b border-white/10 bg-[#0B1828] px-3 py-3 text-left text-[10px] font-black uppercase tracking-[0.16em] text-cyan-200/65">
                Final
              </th>
            ) : null}
          </tr>
        </thead>

        <tbody>
          {rows.map((r, idx) => {
            const final = r.finalPos ?? computed[idx] ?? null;
            const rank = r.rank ?? idx + 1;
            const trophy = trophyFor(final);

            return (
              <tr
                key={`${r.rider}-${idx}`}
                className="group transition-colors hover:bg-cyan-300/[0.035]"
              >
                <td
                  className={stickyCellBase}
                  style={{
                    width: W_RANK,
                    left: LEFT_RANK,
                  }}
                >
                  <span
                    className={`inline-flex h-9 min-w-9 items-center justify-center rounded-full border px-2 text-sm font-black tabular-nums ${podiumRankClass(
                      final,
                    )}`}
                  >
                    {rank}
                  </span>
                </td>

                <td
                  className={stickyCellBase}
                  style={{
                    width: W_BIKE,
                    left: LEFT_BIKE,
                  }}
                >
                  <span className="inline-flex items-center gap-2">
                    {r.plateDot ? (
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full"
                        style={{ background: r.plateDot }}
                      />
                    ) : null}

                    <span className="inline-block rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs font-black tabular-nums text-white/75">
                      {r.bikeNumber ?? "—"}
                    </span>
                  </span>
                </td>

                <td
                  className={stickyCellBase}
                  style={{
                    width: W_RIDER,
                    left: LEFT_RIDER,
                  }}
                >
                  <span className="inline-flex max-w-[245px] items-center gap-1.5 text-white">
                    {trophy.show ? (
                      <Trophy
                        aria-label={trophy.label}
                        className={`h-4 w-4 shrink-0 ${trophy.colorClass}`}
                      />
                    ) : null}

                    {r.riderHref ? (
                      <a
                        href={r.riderHref}
                        className="truncate font-black uppercase tracking-[-0.01em] underline-offset-4 transition hover:text-cyan-300 hover:underline"
                      >
                        {r.rider}
                      </a>
                    ) : (
                      <span className="truncate font-black uppercase tracking-[-0.01em]">
                        {r.rider}
                      </span>
                    )}
                  </span>
                </td>

                <td
                  className={stickyCellBase}
                  style={{
                    width: W_AGE,
                    left: LEFT_AGE,
                  }}
                >
                  <span className="tabular-nums text-white/75">
                    {r.age ?? "—"}
                  </span>
                </td>

                {motoLabels.map((_, i) => {
                  const pos = r.motos[i]?.pos;

                  return (
                    <td
                      key={`${r.rider}-${i}`}
                      className="border-b border-white/10 bg-[#07111F] px-3 py-4 group-hover:bg-[#081D2D]"
                    >
                      {pos == null ? (
                        <span className="text-white/35">—</span>
                      ) : (
                        <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] px-2 text-sm font-black tabular-nums text-white">
                          {pos}
                        </span>
                      )}
                    </td>
                  );
                })}

                {showFinal ? (
                  <td className="border-b border-white/10 bg-[#07111F] px-3 py-4 group-hover:bg-[#081D2D]">
                    <span
                      className={`inline-flex h-9 min-w-9 items-center justify-center rounded-full border px-2 text-sm font-black tabular-nums ${podiumRankClass(
                        final,
                      )}`}
                    >
                      {final ?? "—"}
                    </span>
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
