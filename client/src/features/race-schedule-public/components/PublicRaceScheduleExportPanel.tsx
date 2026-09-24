import { Download, FileText, Image as ImageIcon, Users } from "lucide-react";
import type {
  PublicRaceScheduleDayResponse,
  PublicRaceScheduleSlot,
} from "../types/publicRaceSchedule";

type Props = { day: PublicRaceScheduleDayResponse };
const className = (c: PublicRaceScheduleSlot["classes"][number]) =>
  c.eventClass.displayName?.trim() ||
  c.eventClass.division?.name?.trim() ||
  "Unnamed Class";
const safeName = (v: string) =>
  v
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
const slotsFor = (day: PublicRaceScheduleDayResponse) =>
  [...(day.schedule.slots ?? [])].sort(
    (a, b) => a.displayOrder - b.displayOrder,
  );
const esc = (v: unknown) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");

function printDocument(day: PublicRaceScheduleDayResponse, racers: boolean) {
  const title = racers ? "Racer / Class Sheets" : "Official Race Schedule";
  const body = slotsFor(day)
    .map((slot) => {
      if (slot.slotType !== "race")
        return `<div class="block"><b>${esc(slot.label || "Schedule Block")}</b>${slot.durationMinutes ? ` · ${slot.durationMinutes} minutes` : ""}</div>`;
      const classes = slot.classes
        .map((c) => {
          const names = (c.participants ?? [])
            .map((p, i) => `${i + 1}. ${esc(p.racerName)}`)
            .join("<br>");
          return `<div class="class"><b>${esc(className(c))}</b> · Moto ${c.roundNumber}${racers ? `<div class="racers">${names || "No racer names available."}</div>` : ""}</div>`;
        })
        .join("");
      return `<section class="race"><div class="raceNo">RACE ${slot.raceNumber ?? "—"}</div>${classes}</section>`;
    })
    .join("");
  const win = window.open("", "_blank", "noopener,noreferrer");
  if (!win) return;
  win.document.write(
    `<!doctype html><html><head><title>${esc(day.event?.name || "Corner League")} - ${title}</title><style>@page{size:letter;margin:.45in}*{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#101820;margin:0}.header{border-bottom:3px solid #101820;padding-bottom:14px;margin-bottom:18px}.eyebrow{font-size:10px;letter-spacing:2px;font-weight:800;color:#53727d}.header h1{font-size:24px;margin:5px 0}.meta{font-size:12px;color:#53616a}.race,.block{break-inside:avoid;border:1px solid #d9e1e5;border-radius:10px;padding:12px;margin:0 0 10px}.raceNo{font-size:11px;font-weight:900;letter-spacing:1.5px;margin-bottom:8px}.class{padding:7px 0;border-top:1px solid #edf1f3;font-size:13px}.class:first-of-type{border-top:0}.racers{margin-top:7px;line-height:1.65;color:#34444d}.block{background:#f7f4ec}.footer{margin-top:20px;border-top:1px solid #d9e1e5;padding-top:10px;font-size:10px;color:#718087}</style></head><body><header class="header"><div class="eyebrow">CORNER LEAGUE SPORTS · ${esc(title)}</div><h1>${esc(day.event?.name || "Race Event")}</h1><div class="meta">${esc(day.eventDay.label)} · ${esc(day.eventDay.eventDate || "")} · Version ${day.schedule.version}</div></header>${body}<div class="footer">Official published schedule · cornerleague.com</div><script>window.onload=()=>window.print();</script></body></html>`,
  );
  win.document.close();
}

function wrap(ctx: CanvasRenderingContext2D, text: string, max: number) {
  const out: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(next).width > max) {
      out.push(line);
      line = word;
    } else line = next;
  }
  if (line) out.push(line);
  return out;
}

function downloadPng(day: PublicRaceScheduleDayResponse, racers: boolean) {
  const slots = slotsFor(day);
  const canvas = document.createElement("canvas");
  canvas.width = 1400;
  let height = 280;
  for (const slot of slots) {
    height +=
      slot.slotType !== "race"
        ? 90
        : 100 +
          slot.classes.length * 60 +
          (racers
            ? slot.classes.reduce(
                (n, c) => n + Math.max(1, c.participants?.length ?? 0) * 34,
                0,
              )
            : 0);
  }
  canvas.height = Math.min(Math.max(height, 700), 16000);
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#101820";
  ctx.font = "800 20px Arial";
  ctx.fillText("CORNER LEAGUE SPORTS", 70, 70);
  ctx.font = "900 44px Arial";
  ctx.fillText(day.event?.name || "Race Event", 70, 125);
  ctx.font = "700 22px Arial";
  ctx.fillStyle = "#53616a";
  ctx.fillText(
    `${day.eventDay.label} · ${racers ? "Racer / Class Sheets" : "Official Race Schedule"} · Version ${day.schedule.version}`,
    70,
    165,
  );
  ctx.strokeStyle = "#d9e1e5";
  ctx.beginPath();
  ctx.moveTo(70, 195);
  ctx.lineTo(1330, 195);
  ctx.stroke();
  let y = 245;
  for (const slot of slots) {
    ctx.fillStyle = "#101820";
    ctx.font = "900 19px Arial";
    if (slot.slotType !== "race") {
      ctx.fillText(
        `${slot.label || "Schedule Block"}${slot.durationMinutes ? ` · ${slot.durationMinutes} minutes` : ""}`,
        80,
        y,
      );
      y += 75;
      continue;
    }
    ctx.fillText(`RACE ${slot.raceNumber ?? "—"}`, 80, y);
    y += 38;
    for (const c of slot.classes) {
      ctx.font = "700 24px Arial";
      for (const line of wrap(
        ctx,
        `${className(c)} · Moto ${c.roundNumber}`,
        1200,
      )) {
        ctx.fillText(line, 100, y);
        y += 30;
      }
      if (racers) {
        ctx.font = "400 20px Arial";
        ctx.fillStyle = "#53616a";
        const ps = c.participants ?? [];
        if (!ps.length) {
          ctx.fillText("No racer names available.", 125, y);
          y += 32;
        } else
          ps.forEach((p, i) => {
            ctx.fillText(`${i + 1}. ${p.racerName}`, 125, y);
            y += 32;
          });
        ctx.fillStyle = "#101820";
      }
      y += 18;
    }
    y += 30;
  }
  const a = document.createElement("a");
  a.download = `${safeName(day.event?.name || "race-event")}-${safeName(day.eventDay.label)}-${racers ? "racer-class-sheets" : "race-schedule"}.png`;
  a.href = canvas.toDataURL("image/png");
  a.click();
}

export function PublicRaceScheduleExportPanel({ day }: Props) {
  const cls =
    "inline-flex h-10 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 text-[9px] font-black uppercase tracking-[0.12em] text-slate-200 transition hover:border-cyan-300/20 hover:bg-cyan-300/[0.06]";
  return (
    <div className="flex flex-wrap gap-2">
      <button className={cls} onClick={() => printDocument(day, false)}>
        <FileText className="h-3.5 w-3.5" />
        Schedule PDF
      </button>
      <button className={cls} onClick={() => printDocument(day, true)}>
        <Users className="h-3.5 w-3.5" />
        Racer/Class PDF
      </button>
      <button className={cls} onClick={() => downloadPng(day, false)}>
        <ImageIcon className="h-3.5 w-3.5" />
        Schedule PNG
      </button>
      <button className={cls} onClick={() => downloadPng(day, true)}>
        <Download className="h-3.5 w-3.5" />
        Racer/Class PNG
      </button>
    </div>
  );
}
