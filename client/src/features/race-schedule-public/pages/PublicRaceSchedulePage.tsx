import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  Combine,
  Copy,
  Loader2,
  MapPin,
  Radio,
  RefreshCw,
  Share2,
  Users,
} from "lucide-react";
import { Link } from "wouter";
import { PublicRaceScheduleExportPanel } from "../components/PublicRaceScheduleExportPanel";
import {
  usePublicEventRaceSchedule,
  usePublicRaceSchedule,
} from "../hooks/usePublicRaceSchedule";
import type {
  PublicRaceScheduleDayResponse,
  PublicRaceScheduleSlot,
} from "../types/publicRaceSchedule";

type Props = { dayId?: string; eventSlug?: string };
const className = (c: PublicRaceScheduleSlot["classes"][number]) =>
  c.eventClass.displayName?.trim() ||
  c.eventClass.division?.name?.trim() ||
  "Unnamed Class";
const fmtDate = (v?: string | null) => {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime())
    ? v
    : d.toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });
};
const fmtTime = (v?: string | null) => {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime())
    ? null
    : d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
};
const fmtPublished = (v?: string | null) => {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime())
    ? v
    : d.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
};

function RaceSlotCard({ slot }: { slot: PublicRaceScheduleSlot }) {
  const [showRacers, setShowRacers] = useState(false);
  if (slot.slotType !== "race")
    return (
      <div className="rounded-[22px] border border-amber-300/15 bg-amber-300/[0.055] p-4 sm:p-5">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-300/15 bg-amber-300/10">
            <Clock3 className="h-5 w-5 text-amber-200" />
          </div>
          <div>
            <div className="text-[9px] font-black uppercase tracking-[0.14em] text-amber-100/50">
              Schedule Block
            </div>
            <h3 className="mt-1 text-lg font-black text-white">
              {slot.label ?? "Break"}
            </h3>
            {slot.durationMinutes ? (
              <p className="mt-1 text-sm text-amber-100/60">
                {slot.durationMinutes} minutes
              </p>
            ) : null}
          </div>
        </div>
      </div>
    );
  const rounds = Array.from(
    new Set(slot.classes.map((c) => c.roundNumber)),
  ).sort((a, b) => a - b);
  const participants = slot.classes.flatMap((c) => c.participants ?? []);
  const racerCount = new Set(participants.map((p) => p.racerId)).size;
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/[0.025] p-4 sm:p-5">
      <div className="flex gap-4 sm:gap-5">
        <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-[20px] border border-cyan-300/15 bg-cyan-300/[0.07]">
          <span className="text-[8px] font-black uppercase tracking-[0.14em] text-cyan-200/50">
            Race
          </span>
          <span className="mt-0.5 text-2xl font-black text-white">
            {slot.raceNumber ?? "—"}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {slot.isCombinedRace ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-300/15 bg-purple-300/[0.07] px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.12em] text-purple-200">
                <Combine className="h-3 w-3" />
                Combined Race
              </span>
            ) : null}
            {rounds.map((r) => (
              <span
                key={r}
                className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.12em] text-slate-400"
              >
                Moto {r}
              </span>
            ))}
          </div>
          <h3 className="mt-3 text-lg font-black text-white sm:text-xl">
            {slot.label || slot.classes.map(className).join(" + ")}
          </h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {slot.classes.map((c) => (
              <div
                key={c.id ?? `${c.eventClass.id}-${c.roundNumber}`}
                className="rounded-xl border border-white/[0.07] bg-black/15 px-3 py-2 text-xs font-bold text-slate-300"
              >
                {className(c)}
              </div>
            ))}
          </div>
          {racerCount > 0 ? (
            <button
              type="button"
              onClick={() => setShowRacers((v) => !v)}
              className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-cyan-200/70 hover:text-cyan-100"
            >
              <Users className="h-3.5 w-3.5" />
              {racerCount} racer{racerCount === 1 ? "" : "s"}
              <ChevronDown
                className={`h-4 w-4 transition ${showRacers ? "rotate-180" : ""}`}
              />
            </button>
          ) : null}
        </div>
      </div>
      {showRacers ? (
        <div className="mt-4 space-y-3 border-t border-white/[0.07] pt-4 sm:ml-20">
          {slot.classes.map((c) => (
            <div
              key={`racers-${c.id}`}
              className="rounded-2xl border border-white/[0.07] bg-black/15 p-4"
            >
              <div className="text-[9px] font-black uppercase tracking-[0.14em] text-cyan-200/60">
                {className(c)} · Moto {c.roundNumber}
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {(c.participants ?? []).length ? (
                  (c.participants ?? []).map((p, i) => (
                    <div key={p.racerId} className="text-sm text-slate-300">
                      <span className="mr-2 text-slate-600">{i + 1}.</span>
                      {p.racerName}
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-slate-500">
                    No racer names available.
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function DayAccordion({
  day,
  open,
  onToggle,
}: {
  day: PublicRaceScheduleDayResponse;
  open: boolean;
  onToggle: () => void;
}) {
  const slots = useMemo(
    () =>
      [...(day.schedule.slots ?? [])].sort(
        (a, b) => a.displayOrder - b.displayOrder,
      ),
    [day.schedule.slots],
  );
  const raceCount = slots.filter((s) => s.slotType === "race").length;
  const blockCount = slots.length - raceCount;
  return (
    <section className="overflow-hidden rounded-[28px] border border-white/10 bg-[#07111F]">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-5 p-5 text-left sm:p-6"
      >
        <div>
          <div className="text-[9px] font-black uppercase tracking-[0.18em] text-emerald-200/70">
            Published Race Day
          </div>
          <h2 className="mt-2 text-2xl font-black uppercase text-white">
            {day.eventDay.label}
          </h2>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
            <span>{fmtDate(day.eventDay.eventDate)}</span>
            <span>{raceCount} races</span>
            {blockCount ? <span>{blockCount} blocks</span> : null}
            <span>Version {day.schedule.version}</span>
          </div>
        </div>
        <ChevronDown
          className={`h-6 w-6 shrink-0 text-cyan-200 transition ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open ? (
        <div className="border-t border-white/10">
          <div className="bg-gradient-to-br from-cyan-300/[0.06] via-transparent to-[#FF6B35]/[0.03] p-5 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-400">
                {day.eventDay.eventDate ? (
                  <span className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-cyan-200" />
                    {fmtDate(day.eventDay.eventDate)}
                  </span>
                ) : null}
                {fmtTime(day.eventDay.startsAt) ? (
                  <span className="flex items-center gap-2">
                    <Clock3 className="h-4 w-4 text-cyan-200" />
                    {fmtTime(day.eventDay.startsAt)}
                    {fmtTime(day.eventDay.endsAt)
                      ? ` – ${fmtTime(day.eventDay.endsAt)}`
                      : ""}
                  </span>
                ) : null}
                {day.event?.location ? (
                  <span className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-[#FFB199]" />
                    {day.event.location}
                  </span>
                ) : null}
              </div>
              <PublicRaceScheduleExportPanel day={day} />
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
              <RefreshCw className="h-3.5 w-3.5" />
              Official updates checked every 30 seconds.
              {day.schedule.publishedAt ? (
                <span className="ml-auto text-emerald-200/60">
                  Published {fmtPublished(day.schedule.publishedAt)}
                </span>
              ) : null}
            </div>
          </div>
          <div className="space-y-3 p-4 sm:p-6">
            {slots.map((slot) => (
              <RaceSlotCard key={slot.id} slot={slot} />
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default function PublicRaceSchedulePage({ dayId, eventSlug }: Props) {
  const dayQuery = usePublicRaceSchedule(eventSlug ? null : dayId);
  const eventQuery = usePublicEventRaceSchedule(eventSlug);
  const active = eventSlug ? eventQuery : dayQuery;
  const eventData = eventQuery.data;
  const single = dayQuery.data;
  const days = eventSlug ? (eventData?.days ?? []) : single ? [single] : [];
  const [openDays, setOpenDays] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (days.length)
      setOpenDays((current) =>
        current.size ? current : new Set([days[0].eventDay.id]),
      );
  }, [days.map((d) => d.eventDay.id).join("|")]);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {}
  };
  const share = async () => {
    const d = {
      title: `${eventData?.event.name || single?.event?.name || "Corner League"} Race Schedule`,
      text: "View the official Corner League race schedule.",
      url: window.location.href,
    };
    if (navigator.share) {
      try {
        await navigator.share(d);
        return;
      } catch {}
    }
    await copy();
  };
  if (active.isLoading)
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#030913]">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-200" />
      </div>
    );
  if (active.isError || !days.length)
    return (
      <div className="min-h-screen bg-[#030913] px-4 py-12 text-white">
        <div className="mx-auto max-w-xl rounded-[30px] border border-white/10 bg-[#07111F] p-7 text-center">
          <AlertTriangle className="mx-auto h-8 w-8 text-amber-200" />
          <h1 className="mt-5 text-2xl font-black uppercase">
            No published schedule
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            The race organization has not published an official race order yet.
          </p>
          <Link
            href="/registration/events"
            className="mt-6 inline-flex rounded-full bg-cyan-300 px-5 py-3 text-xs font-black uppercase text-[#04101C]"
          >
            Browse Events
          </Link>
        </div>
      </div>
    );
  const event = eventData?.event ?? single?.event;
  return (
    <div className="min-h-screen bg-[#030913] text-white">
      <div className="mx-auto w-full max-w-[1180px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <header className="mb-5 rounded-[30px] border border-white/10 bg-[#07111F] p-5 sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 gap-4">
              {event?.organizer?.logoUrl ? (
                <img
                  src={event.organizer.logoUrl}
                  alt=""
                  className="h-12 w-12 rounded-xl object-contain"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-300/15 bg-cyan-300/[0.07]">
                  <Radio className="h-5 w-5 text-cyan-200" />
                </div>
              )}
              <div>
                <div className="text-[9px] font-black uppercase tracking-[0.2em] text-cyan-200/60">
                  Official Event Schedule
                </div>
                <h1 className="mt-2 text-3xl font-black uppercase tracking-[-0.04em] sm:text-4xl">
                  {event?.name}
                </h1>
                <p className="mt-2 text-sm text-slate-400">
                  Published race orders, classes, participating racers, and
                  downloadable race-day sheets.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={copy}
                className="inline-flex h-10 items-center gap-2 rounded-full border border-white/10 px-4 text-[9px] font-black uppercase tracking-[0.12em]"
              >
                <>
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  {copied ? "Copied" : "Copy Link"}
                </>
              </button>
              <button
                onClick={share}
                className="inline-flex h-10 items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-300/[0.07] px-4 text-[9px] font-black uppercase tracking-[0.12em] text-cyan-100"
              >
                <Share2 className="h-4 w-4" />
                Share
              </button>
            </div>
          </div>
        </header>
        <div className="space-y-4">
          {days.map((day) => (
            <DayAccordion
              key={day.eventDay.id}
              day={day}
              open={openDays.has(day.eventDay.id)}
              onToggle={() =>
                setOpenDays((current) => {
                  const next = new Set(current);
                  next.has(day.eventDay.id)
                    ? next.delete(day.eventDay.id)
                    : next.add(day.eventDay.id);
                  return next;
                })
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}
