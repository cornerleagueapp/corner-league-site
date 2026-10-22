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
            <Clock3 className="h-5 w-5 text-cl-warning" />
          </div>
          <div>
            <div className="text-[9px] font-black uppercase tracking-[0.14em] text-cl-warning">
              Schedule Block
            </div>
            <h3 className="mt-1 text-lg font-black text-cl-ink">
              {slot.label ?? "Break"}
            </h3>
            {slot.durationMinutes ? (
              <p className="mt-1 text-sm text-cl-warning">
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
    <div className="rounded-[24px] border border-cl-border bg-cl-subtle p-4 sm:p-5">
      <div className="flex gap-4 sm:gap-5">
        <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-[20px] border border-cl-accent/[0.15] bg-cl-accent/[0.07]">
          <span className="text-[8px] font-black uppercase tracking-[0.14em] text-cl-accent">
            Race
          </span>
          <span className="mt-0.5 text-2xl font-black text-cl-ink">
            {slot.raceNumber ?? "—"}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {slot.isCombinedRace ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-cl-accent/[0.15] bg-cl-accent/[0.07] px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.12em] text-cl-accent">
                <Combine className="h-3 w-3" />
                Combined Race
              </span>
            ) : null}
            {rounds.map((r) => (
              <span
                key={r}
                className="rounded-full border border-cl-border bg-cl-subtle px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.12em] text-cl-muted"
              >
                Moto {r}
              </span>
            ))}
          </div>
          <h3 className="mt-3 text-lg font-black text-cl-ink sm:text-xl">
            {slot.label || slot.classes.map(className).join(" + ")}
          </h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {slot.classes.map((c) => (
              <div
                key={c.id ?? `${c.eventClass.id}-${c.roundNumber}`}
                className="rounded-xl border border-cl-border bg-cl-surface px-3 py-2 text-xs font-bold text-cl-muted"
              >
                {className(c)}
              </div>
            ))}
          </div>
          {racerCount > 0 ? (
            <button
              type="button"
              onClick={() => setShowRacers((v) => !v)}
              className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-cl-accent hover:text-cl-accent"
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
        <div className="mt-4 space-y-3 border-t border-cl-border pt-4 sm:ml-20">
          {slot.classes.map((c) => (
            <div
              key={`racers-${c.id}`}
              className="rounded-2xl border border-cl-border bg-cl-surface p-4"
            >
              <div className="text-[9px] font-black uppercase tracking-[0.14em] text-cl-accent">
                {className(c)} · Moto {c.roundNumber}
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {(c.participants ?? []).length ? (
                  (c.participants ?? []).map((p, i) => (
                    <div key={p.racerId} className="text-sm text-cl-muted">
                      <span className="mr-2 text-cl-muted">{i + 1}.</span>
                      {p.racerName}
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-cl-muted">
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
    <section className="overflow-hidden rounded-[28px] border border-cl-border bg-cl-canvas">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-5 p-5 text-left sm:p-6"
      >
        <div>
          <div className="text-[9px] font-black uppercase tracking-[0.18em] text-cl-success">
            Published Race Day
          </div>
          <h2 className="mt-2 text-2xl font-black uppercase text-cl-ink">
            {day.eventDay.label}
          </h2>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-cl-muted">
            <span>{fmtDate(day.eventDay.eventDate)}</span>
            <span>{raceCount} races</span>
            {blockCount ? <span>{blockCount} blocks</span> : null}
            <span>Version {day.schedule.version}</span>
          </div>
        </div>
        <ChevronDown
          className={`h-6 w-6 shrink-0 text-cl-accent transition ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open ? (
        <div className="border-t border-cl-border">
          <div className="bg-gradient-to-br from-cl-accent/[0.06] via-transparent to-cl-accent/[0.03] p-5 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-cl-muted">
                {day.eventDay.eventDate ? (
                  <span className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-cl-accent" />
                    {fmtDate(day.eventDay.eventDate)}
                  </span>
                ) : null}
                {fmtTime(day.eventDay.startsAt) ? (
                  <span className="flex items-center gap-2">
                    <Clock3 className="h-4 w-4 text-cl-accent" />
                    {fmtTime(day.eventDay.startsAt)}
                    {fmtTime(day.eventDay.endsAt)
                      ? ` – ${fmtTime(day.eventDay.endsAt)}`
                      : ""}
                  </span>
                ) : null}
                {day.event?.location ? (
                  <span className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-cl-accent" />
                    {day.event.location}
                  </span>
                ) : null}
              </div>
              <PublicRaceScheduleExportPanel day={day} />
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs text-cl-muted">
              <RefreshCw className="h-3.5 w-3.5" />
              Official updates checked every 30 seconds.
              {day.schedule.publishedAt ? (
                <span className="ml-auto text-cl-success">
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
      <div className="flex min-h-screen items-center justify-center bg-cl-canvas">
        <Loader2 className="h-8 w-8 animate-spin text-cl-accent" />
      </div>
    );
  if (active.isError || !days.length)
    return (
      <div className="min-h-screen bg-cl-canvas px-4 py-12 text-cl-ink">
        <div className="mx-auto max-w-xl rounded-[30px] border border-cl-border bg-cl-canvas p-7 text-center">
          <AlertTriangle className="mx-auto h-8 w-8 text-cl-warning" />
          <h1 className="mt-5 text-2xl font-black uppercase">
            No published schedule
          </h1>
          <p className="mt-3 text-sm leading-6 text-cl-muted">
            The race organization has not published an official race order yet.
          </p>
          <Link
            href="/registration/events"
            className="mt-6 inline-flex rounded-full bg-cl-accent px-5 py-3 text-xs font-black uppercase text-cl-contrast"
          >
            Browse Events
          </Link>
        </div>
      </div>
    );
  const event = eventData?.event ?? single?.event;
  return (
    <div className="min-h-screen bg-cl-canvas text-cl-ink">
      <div className="mx-auto w-full max-w-[1180px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <header className="mb-5 rounded-[30px] border border-cl-border bg-cl-canvas p-5 sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 gap-4">
              {event?.organizer?.logoUrl ? (
                <img
                  src={event.organizer.logoUrl}
                  alt=""
                  className="h-12 w-12 rounded-xl object-contain"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-cl-accent/[0.15] bg-cl-accent/[0.07]">
                  <Radio className="h-5 w-5 text-cl-accent" />
                </div>
              )}
              <div>
                <div className="text-[9px] font-black uppercase tracking-[0.2em] text-cl-accent">
                  Official Event Schedule
                </div>
                <h1 className="mt-2 text-3xl font-black uppercase tracking-[-0.04em] sm:text-4xl">
                  {event?.name}
                </h1>
                <p className="mt-2 text-sm text-cl-muted">
                  Published race orders, classes, participating racers, and
                  downloadable race-day sheets.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={copy}
                className="inline-flex h-10 items-center gap-2 rounded-full border border-cl-border px-4 text-[9px] font-black uppercase tracking-[0.12em]"
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
                className="inline-flex h-10 items-center gap-2 rounded-full border border-cl-accent/[0.15] bg-cl-accent/[0.07] px-4 text-[9px] font-black uppercase tracking-[0.12em] text-cl-accent"
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
