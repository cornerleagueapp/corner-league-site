import { Download, FileText, Printer, Users } from "lucide-react";

import CLLogo from "@assets/corner-league-aqua.png";

import type {
  RaceSchedule,
  RaceScheduleClassConfig,
  RaceScheduleSlot,
} from "../types/organizationRaceSchedule";

type Props = {
  schedule: RaceSchedule;

  classConfigs: RaceScheduleClassConfig[];

  eventName: string;

  organizationName: string;

  eventDate: string;

  dayLabel?: string;
};

type Participant = {
  racerId?: string;
  id?: string;

  racerName?: string;
  name?: string;
};

type PrintableRace = {
  slot: RaceScheduleSlot;

  raceNumber: number;

  classes: Array<{
    eventClassId: string;

    className: string;

    moto: number | null;

    participants: Participant[];
  }>;

  uniqueRacerCount: number;
};

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function participantId(participant: Participant) {
  return String(participant.racerId ?? participant.id ?? "");
}

function participantName(participant: Participant) {
  return (
    participant.racerName?.trim() || participant.name?.trim() || "Unknown Racer"
  );
}

function classNameForSlotClass(slotClass: RaceScheduleSlot["classes"][number]) {
  return (
    slotClass.eventClass.displayName?.trim() ||
    slotClass.eventClass.division?.name?.trim() ||
    "Unnamed Class"
  );
}

function formatPrintDate(value: string) {
  if (!value) {
    return "";
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function chunk<T>(values: T[], size: number): T[][] {
  const pages: T[][] = [];

  for (let index = 0; index < values.length; index += size) {
    pages.push(values.slice(index, index + size));
  }

  return pages;
}

function buildPrintableRaces(
  schedule: RaceSchedule,
  classConfigs: RaceScheduleClassConfig[],
): PrintableRace[] {
  const configsByEventClassId = new Map(
    classConfigs.map((config) => [config.eventClass.id, config]),
  );

  const sortedSlots = [...(schedule.slots ?? [])].sort(
    (a, b) => a.displayOrder - b.displayOrder,
  );

  let nextRaceNumber = 1;

  const races: PrintableRace[] = [];

  for (const slot of sortedSlots) {
    if (slot.slotType !== "race") {
      continue;
    }

    const classes = (slot.classes ?? []).map((slotClass) => {
      const config = configsByEventClassId.get(slotClass.eventClass.id);

      const participants = (config?.participants ?? []) as Participant[];

      return {
        eventClassId: slotClass.eventClass.id,

        className: classNameForSlotClass(slotClass),

        moto: slotClass.roundNumber ?? null,

        participants,
      };
    });

    const uniqueParticipants = new Map<string, Participant>();

    for (const eventClass of classes) {
      for (const participant of eventClass.participants) {
        const id = participantId(participant);

        if (!id) {
          continue;
        }

        uniqueParticipants.set(id, participant);
      }
    }

    races.push({
      slot,

      raceNumber: nextRaceNumber,

      classes,

      uniqueRacerCount: uniqueParticipants.size,
    });

    nextRaceNumber += 1;
  }

  return races;
}

function paginateRacerSheets(races: PrintableRace[]) {
  /*
   * Approximate vertical capacity of one
   * US Letter page.
   *
   * Racer names render in two columns,
   * so a 10-racer class costs roughly
   * five printable lines.
   */
  const MAX_PAGE_UNITS = 38;

  const pages: PrintableRace[][] = [];

  let currentPage: PrintableRace[] = [];
  let currentUnits = 0;

  for (const race of races) {
    const racerLines = race.classes.reduce(
      (total, eventClass) =>
        total + Math.max(1, Math.ceil(eventClass.participants.length / 2)),
      0,
    );

    const raceUnits = 3 + race.classes.length + racerLines;

    if (currentPage.length > 0 && currentUnits + raceUnits > MAX_PAGE_UNITS) {
      pages.push(currentPage);

      currentPage = [];
      currentUnits = 0;
    }

    currentPage.push(race);

    currentUnits += raceUnits;
  }

  if (currentPage.length > 0) {
    pages.push(currentPage);
  }

  return pages.length ? pages : [[]];
}

function buildHeader({
  eventName,
  organizationName,
  eventDate,
  documentTitle,
  logoUrl,
}: {
  eventName: string;

  organizationName: string;

  eventDate: string;

  documentTitle: string;

  logoUrl: string;
}) {
  return `
    <header class="document-header">
      <div class="brand-row">
        <div class="brand">
          <img
            src="${escapeHtml(logoUrl)}"
            alt="Corner League"
            class="brand-logo"
          />

          <div>
            <div class="brand-name">
              CORNER LEAGUE SPORTS
            </div>

            <div class="brand-url">
              cornerleague.com
            </div>
          </div>
        </div>

        <div class="document-type">
          ${escapeHtml(documentTitle)}
        </div>
      </div>

      <div class="event-title">
        ${escapeHtml(eventName)}
      </div>

      <div class="event-meta">
        <span>
          ${escapeHtml(organizationName)}
        </span>

        <span class="meta-divider">
          •
        </span>

        <span>
          ${escapeHtml(formatPrintDate(eventDate))}
        </span>
      </div>
    </header>
  `;
}

function buildFooter(page: number, totalPages: number, logoUrl: string) {
  return `
    <footer class="document-footer">
      <div class="footer-brand">
        <img
          src="${escapeHtml(logoUrl)}"
          alt=""
          class="footer-logo"
        />

        <div>
          <strong>
            CORNER LEAGUE SPORTS
          </strong>

          <span>
            cornerleague.com
          </span>
        </div>
      </div>

      <div class="footer-center">
        Official Race Operations
      </div>

      <div class="page-number">
        Page ${page} of ${totalPages}
      </div>
    </footer>
  `;
}

function buildPrintStyles() {
  return `
    <style>
      * {
        box-sizing: border-box;
      }

      html,
      body {
        margin: 0;
        padding: 0;
        background: #e8e8e8;
        color: #111827;
        font-family:
          Arial,
          Helvetica,
          sans-serif;
      }

      body {
        padding: 24px;
      }

      .print-controls {
        position: sticky;
        top: 12px;
        z-index: 50;
        width: 8.5in;
        max-width: 100%;
        margin: 0 auto 18px;
        padding: 12px 16px;
        border: 1px solid #d1d5db;
        border-radius: 12px;
        background: #ffffff;
        box-shadow:
          0 10px 35px rgba(
            0,
            0,
            0,
            0.12
          );

        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
      }

      .print-controls strong {
        display: block;
        font-size: 13px;
      }

      .print-controls span {
        display: block;
        margin-top: 2px;
        color: #6b7280;
        font-size: 11px;
      }

      .print-button {
        border: 0;
        border-radius: 999px;
        background: #111827;
        color: #ffffff;
        cursor: pointer;
        padding: 10px 18px;
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .page {
        position: relative;
        width: 8.5in;
        min-height: 11in;
        margin: 0 auto 18px;
        padding:
          0.26in
          0.34in
          0.38in;
        background: #ffffff;

        box-shadow:
          0 6px 30px rgba(
            0,
            0,
            0,
            0.12
          );

        page-break-after: always;
      }

      .page:last-child {
        page-break-after: auto;
      }

      .document-header {
        border-bottom: 2px solid #111827;
        padding-bottom: 10px;
        margin-bottom: 12px;
      }

      .brand-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 16px;
      }

      .brand {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .brand-logo {
        width: 34px;
        height: 34px;
        object-fit: contain;
      }

      .brand-name {
        font-size: 10px;
        font-weight: 900;
        letter-spacing: 0.18em;
      }

      .brand-url {
        margin-top: 2px;
        color: #6b7280;
        font-size: 8px;
      }

      .document-type {
        color: #4b5563;
        font-size: 9px;
        font-weight: 900;
        letter-spacing: 0.18em;
        text-transform: uppercase;
      }

      .event-title {
        margin-top: 10px;
        font-size: 20px;
        line-height: 1.05;
        font-weight: 900;
        text-transform: uppercase;
      }

      .event-meta {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 7px;
        margin-top: 7px;
        color: #4b5563;
        font-size: 10px;
        font-weight: 600;
      }

      .meta-divider {
        color: #9ca3af;
      }

      .document-footer {
        position: absolute;
        bottom: 0.14in;
        left: 0.34in;
        right: 0.34in;

        display: grid;
        grid-template-columns:
          1fr auto 1fr;
        align-items: center;
        gap: 12px;

        border-top:
          1px solid #d1d5db;

        padding-top: 8px;

        color: #6b7280;
        font-size: 8px;
      }

      .footer-brand {
        display: flex;
        align-items: center;
        gap: 7px;
      }

      .footer-brand strong {
        display: block;
        color: #111827;
        font-size: 8px;
        letter-spacing: 0.12em;
      }

      .footer-brand span {
        display: block;
        margin-top: 1px;
        font-size: 7px;
      }

      .footer-logo {
        width: 22px;
        height: 22px;
        object-fit: contain;
      }

      .footer-center {
        text-align: center;
        text-transform: uppercase;
        letter-spacing: 0.12em;
      }

      .page-number {
        text-align: right;
        color: #111827;
        font-weight: 800;
      }

      table {
        width: 100%;
        border-collapse: collapse;
      }

      th {
        background: #e5e7eb;
        border: 1px solid #9ca3af;
        color: #111827;

        padding: 7px 6px;

        font-size: 8px;
        font-weight: 900;
        letter-spacing: 0.07em;
        text-align: left;
        text-transform: uppercase;
      }

      td {
        border: 1px solid #c7cdd4;
        padding: 6px;

        font-size: 9px;
        line-height: 1.3;
        vertical-align: middle;
      }

      .cell-center {
        text-align: center;
      }

      .race-number {
        font-weight: 900;
        font-size: 10px;
      }

      .class-name {
        font-weight: 700;
      }

      .combined-label {
        margin-left: 5px;
        border: 1px solid #9ca3af;
        border-radius: 999px;
        padding: 2px 5px;
        color: #4b5563;
        font-size: 6px;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .schedule-block-row td {
        background: #9ca3af;
        border-color: #6b7280;
        color: #111827;
        font-weight: 900;
      }

      .block-title {
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-weight: 900;
      }

      .duration {
        color: #1f2937;
        font-size: 8px;
        font-weight: 700;
      }

      .race-sheet {
        border: 1px solid #b8bec6;
        margin-bottom: 8px;
        break-inside: avoid;
      }

      .race-sheet-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;

        background: #e5e7eb;

        border-bottom:
          1px solid #b8bec6;

        padding: 6px 8px;
      }

      .race-sheet-number {
        font-size: 13px;
        font-weight: 900;
      }

      .race-sheet-meta {
        color: #4b5563;
        font-size: 8px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }

      .race-class {
        padding: 6px 8px;
      }

      .race-class +
      .race-class {
        border-top:
          1px solid #d1d5db;
      }

      .race-class-heading {
        display: flex;
        justify-content: space-between;
        gap: 10px;

        margin-bottom: 4px;
      }

      .race-class-name {
        font-size: 10px;
        font-weight: 900;
      }

      .race-class-moto {
        color: #4b5563;
        font-size: 8px;
        font-weight: 800;
        text-transform: uppercase;
      }

      .racers-grid {
        display: grid;
        grid-template-columns:
          repeat(2, minmax(0, 1fr));
        gap: 1px 14px;
      }

      .racer-name {
        padding: 2px 0;
        border-bottom: 1px dotted #d1d5db;
        font-size: 8px;
      }

      .racer-number {
        display: inline-block;
        width: 20px;
        color: #9ca3af;
        font-size: 7px;
      }

      .empty-racers {
        color: #9ca3af;
        font-size: 8px;
        font-style: italic;
      }

      @page {
        size: Letter portrait;
        margin: 0;
      }

      @media print {
        html,
        body {
          background: #ffffff;
        }

        body {
          padding: 0;
        }

        .print-controls {
          display: none !important;
        }

        .page {
          margin: 0;
          box-shadow: none;
          width: 8.5in;
          min-height: 11in;
        }
      }
    </style>
  `;
}

function openPrintableDocument({
  title,
  content,
}: {
  title: string;
  content: string;
}) {
  const printWindow = window.open("", "_blank", "width=1000,height=900");

  if (!printWindow) {
    window.alert("Please allow pop-ups to open the printable race schedule.");

    return;
  }

  printWindow.document.open();

  printWindow.document.write(`
    <!doctype html>

    <html>
      <head>
        <meta charset="utf-8" />

        <title>
          ${escapeHtml(title)}
        </title>

        ${buildPrintStyles()}
      </head>

      <body>
        <div class="print-controls">
          <div>
            <strong>
              ${escapeHtml(title)}
            </strong>

            <span>
              Choose Print for paper or Save as PDF for a downloadable copy.
            </span>
          </div>

          <button
            class="print-button"
            onclick="window.print()"
          >
            Print / Save PDF
          </button>
        </div>

        ${content}

        <script>
          window.addEventListener(
            "load",
            function () {
              setTimeout(
                function () {
                  window.focus();
                  window.print();
                },
                350
              );
            }
          );
        </script>
      </body>
    </html>
  `);

  printWindow.document.close();
}

function buildRaceOrderDocument({
  schedule,
  classConfigs,
  eventName,
  organizationName,
  eventDate,
  logoUrl,
}: Props & {
  logoUrl: string;
}) {
  const sortedSlots = [...(schedule.slots ?? [])].sort(
    (a, b) => a.displayOrder - b.displayOrder,
  );

  const configsByEventClassId = new Map(
    classConfigs.map((config) => [config.eventClass.id, config]),
  );

  const raceNumberBySlotId = new Map<string, number>();

  let nextRaceNumber = 1;

  for (const slot of sortedSlots) {
    if (slot.slotType !== "race") {
      continue;
    }

    raceNumberBySlotId.set(slot.id, nextRaceNumber);

    nextRaceNumber += 1;
  }

  const pages = chunk(sortedSlots, 23);

  const totalPages = Math.max(1, pages.length);

  return pages
    .map((pageSlots, pageIndex) => {
      const rows = pageSlots
        .map((slot) => {
          if (slot.slotType !== "race") {
            return `
              <tr class="schedule-block-row">
                <td class="cell-center">
                  —
                </td>

                <td class="cell-center">
                  BLOCK
                </td>

                <td class="cell-center">
                  —
                </td>

                <td colspan="2">
                  <span class="block-title">
                    ${escapeHtml(slot.label || "Schedule Block")}
                  </span>

                  ${
                    slot.durationMinutes
                      ? `
                        <span class="duration">
                          · ${escapeHtml(slot.durationMinutes)} min
                        </span>
                      `
                      : ""
                  }
                </td>
              </tr>
            `;
          }

          const rounds = Array.from(
            new Set(
              (slot.classes ?? []).map((slotClass) => slotClass.roundNumber),
            ),
          );

          const moto =
            rounds.length === 1
              ? `MOTO ${rounds[0]}`
              : rounds.length
                ? `MOTOS ${rounds.join(", ")}`
                : "—";

          const classNames = (slot.classes ?? [])
            .map((slotClass) => classNameForSlotClass(slotClass))
            .join(" + ");

          const racerIds = new Set<string>();

          for (const slotClass of slot.classes ?? []) {
            const config = configsByEventClassId.get(slotClass.eventClass.id);

            for (const participant of (config?.participants ??
              []) as Participant[]) {
              const id = participantId(participant);

              if (id) {
                racerIds.add(id);
              }
            }
          }

          return `
            <tr>
              <td class="cell-center">
                ${escapeHtml(slot.displayOrder + 1)}
              </td>

              <td class="cell-center">
                ${escapeHtml(moto)}
              </td>

              <td class="cell-center race-number">
                ${escapeHtml(raceNumberBySlotId.get(slot.id) ?? "")}
              </td>

              <td>
                <span class="class-name">
                  ${escapeHtml(classNames || slot.label || "Race")}
                </span>

                ${
                  slot.classes?.length > 1
                    ? `
                      <span class="combined-label">
                        Combined
                      </span>
                    `
                    : ""
                }
              </td>

              <td class="cell-center">
                ${escapeHtml(racerIds.size)}
              </td>
            </tr>
          `;
        })
        .join("");

      return `
        <section class="page">
          ${buildHeader({
            eventName,
            organizationName,
            eventDate,
            documentTitle: "Official Race Order",
            logoUrl,
          })}

          <table>
            <thead>
              <tr>
                <th style="width: 8%">
                  Order
                </th>

                <th style="width: 14%">
                  Moto
                </th>

                <th style="width: 9%">
                  Race
                </th>

                <th>
                  Class / Schedule Item
                </th>

                <th style="width: 10%">
                  Racers
                </th>
              </tr>
            </thead>

            <tbody>
              ${rows}
            </tbody>
          </table>

          ${buildFooter(pageIndex + 1, totalPages, logoUrl)}
        </section>
      `;
    })
    .join("");
}

function buildRacerSheetsDocument({
  schedule,
  classConfigs,
  eventName,
  organizationName,
  eventDate,
  logoUrl,
}: Props & {
  logoUrl: string;
}) {
  const races = buildPrintableRaces(schedule, classConfigs);

  const pages = paginateRacerSheets(races);

  const totalPages = Math.max(1, pages.length);

  return pages
    .map((pageRaces, pageIndex) => {
      const raceBlocks = pageRaces
        .map((race) => {
          const classBlocks = race.classes
            .map((eventClass) => {
              const sortedParticipants = [...eventClass.participants].sort(
                (a, b) => participantName(a).localeCompare(participantName(b)),
              );

              const racers = sortedParticipants.length
                ? `
                      <div class="racers-grid">
                        ${sortedParticipants
                          .map(
                            (participant, index) => `
                              <div class="racer-name">
                                <span class="racer-number">
                                  ${index + 1}.
                                </span>

                                ${escapeHtml(participantName(participant))}
                              </div>
                            `,
                          )
                          .join("")}
                      </div>
                    `
                : `
                      <div class="empty-racers">
                        No racer names available.
                      </div>
                    `;

              return `
                  <div class="race-class">
                    <div class="race-class-heading">
                      <div class="race-class-name">
                        ${escapeHtml(eventClass.className)}
                      </div>

                      <div class="race-class-moto">
                        ${
                          eventClass.moto
                            ? `Moto ${escapeHtml(eventClass.moto)}`
                            : ""
                        }

                        ·

                        ${escapeHtml(eventClass.participants.length)}
                        racers
                      </div>
                    </div>

                    ${racers}
                  </div>
                `;
            })
            .join("");

          const rounds = Array.from(
            new Set(
              race.classes.map((eventClass) => eventClass.moto).filter(Boolean),
            ),
          );

          const motoLabel =
            rounds.length === 1
              ? `Moto ${rounds[0]}`
              : rounds.length
                ? `Motos ${rounds.join(", ")}`
                : "";

          return `
            <article class="race-sheet">
              <div class="race-sheet-header">
                <div class="race-sheet-number">
                  RACE ${escapeHtml(race.raceNumber)}
                </div>

                <div class="race-sheet-meta">
                  ${escapeHtml(motoLabel)}

                  ${
                    race.classes.length > 1
                      ? ` · ${race.classes.length} Combined Classes`
                      : ""
                  }

                  · ${escapeHtml(race.uniqueRacerCount)} Unique Racers
                </div>
              </div>

              ${classBlocks}
            </article>
          `;
        })
        .join("");

      return `
        <section class="page">
          ${buildHeader({
            eventName,
            organizationName,
            eventDate,
            documentTitle: "Race Order · Racer Sheets",
            logoUrl,
          })}

          ${raceBlocks}

          ${buildFooter(pageIndex + 1, totalPages, logoUrl)}
        </section>
      `;
    })
    .join("");
}

export function RaceScheduleExportPanel({
  schedule,
  classConfigs,
  eventName,
  organizationName,
  eventDate,
  dayLabel,
}: Props) {
  const hasSchedule = (schedule.slots?.length ?? 0) > 0;

  const logoUrl = new URL(CLLogo, window.location.href).href;

  const exportRaceOrder = () => {
    const content = buildRaceOrderDocument({
      schedule,
      classConfigs,
      eventName,
      organizationName,
      eventDate,
      dayLabel,
      logoUrl,
    });

    openPrintableDocument({
      title: `${eventName} - ${dayLabel || "Race Day"} - Race Order`,
      content,
    });
  };

  const exportRacerSheets = () => {
    const content = buildRacerSheetsDocument({
      schedule,
      classConfigs,
      eventName,
      organizationName,
      eventDate,
      dayLabel,
      logoUrl,
    });

    openPrintableDocument({
      title: `${eventName} - ${dayLabel || "Race Day"} - Racer Sheets`,
      content,
    });
  };

  return (
    <section className="rounded-[24px] border border-white/10 bg-white/[0.025] p-5 sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.18em] text-cyan-200/60">
            <FileText className="h-4 w-4" />
            Race Documents
          </div>

          <h3 className="mt-2 text-lg font-black uppercase text-white">
            Print & PDF Export
          </h3>

          <p className="mt-2 max-w-2xl text-xs leading-6 text-white/40">
            Generate clean, ink-friendly race-day documents for officials,
            racers, teams, printing, or digital sharing.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            disabled={!hasSchedule}
            onClick={exportRaceOrder}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-5 text-[10px] font-black uppercase tracking-[0.12em] text-cyan-100 transition hover:bg-cyan-300/15 disabled:cursor-not-allowed disabled:opacity-35"
          >
            <Printer className="h-4 w-4" />
            Race Order PDF
          </button>

          <button
            type="button"
            disabled={!hasSchedule}
            onClick={exportRacerSheets}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-cyan-300 px-5 text-[10px] font-black uppercase tracking-[0.12em] text-[#04101C] transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-35"
          >
            <Users className="h-4 w-4" />
            Racer Sheets PDF
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-white/[0.07] bg-black/15 p-4">
          <Download className="h-4 w-4 text-cyan-200" />

          <div className="mt-3 text-xs font-black text-white">
            Official Race Order
          </div>

          <p className="mt-1 text-[11px] leading-5 text-white/35">
            Compact race list with race numbers, motos, combined classes, racer
            counts, practice, lunch, meetings, and other schedule blocks.
          </p>
        </div>

        <div className="rounded-2xl border border-white/[0.07] bg-black/15 p-4">
          <Users className="h-4 w-4 text-[#FFB199]" />

          <div className="mt-3 text-xs font-black text-white">
            Race Order With Racers
          </div>

          <p className="mt-1 text-[11px] leading-5 text-white/35">
            Follows the exact physical race order and expands each class to list
            every racer assigned to that class.
          </p>
        </div>
      </div>

      <p className="mt-4 text-[10px] leading-5 text-white/25">
        The browser print dialog will open automatically. Choose
        <strong className="text-white/40"> Save as PDF </strong>
        to download a digital copy or select a printer for a physical copy.
      </p>
    </section>
  );
}
