import { useMemo } from "react";

import {
  AlertTriangle,
  CalendarDays,
  Clock3,
  Combine,
  Flag,
  Loader2,
  MapPin,
  Radio,
  RefreshCw,
  Trophy,
  Users,
} from "lucide-react";

import { Link } from "wouter";

import { usePublicRaceSchedule } from "../hooks/usePublicRaceSchedule";

import type { PublicRaceScheduleSlot } from "../types/publicRaceSchedule";

type Props = {
  dayId: string;
};

function getClassName(slotClass: PublicRaceScheduleSlot["classes"][number]) {
  return (
    slotClass.eventClass.displayName?.trim() ||
    slotClass.eventClass.division?.name?.trim() ||
    "Unnamed Class"
  );
}

function getRoundNumbers(slot: PublicRaceScheduleSlot) {
  return Array.from(new Set(slot.classes.map((item) => item.roundNumber))).sort(
    (a, b) => a - b,
  );
}

function formatDate(value?: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

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

function formatTime(value?: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleTimeString(undefined, {
    hour: "numeric",

    minute: "2-digit",
  });
}

function formatPublishedAt(value?: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString(undefined, {
    month: "short",

    day: "numeric",

    hour: "numeric",

    minute: "2-digit",
  });
}

function RaceSlotCard({ slot }: { slot: PublicRaceScheduleSlot }) {
  const isRace = slot.slotType === "race";

  if (!isRace) {
    return (
      <div className="relative overflow-hidden rounded-[22px] border border-amber-300/15 bg-amber-300/[0.055] p-4 sm:p-5">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-amber-300/15 bg-amber-300/10">
            <Clock3 className="h-5 w-5 text-amber-200" />
          </div>

          <div className="min-w-0">
            <div className="text-[9px] font-black uppercase tracking-[0.14em] text-amber-100/50">
              Scheduled Break
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
  }

  const rounds = getRoundNumbers(slot);

  const racerCount = Number(slot.analysisMetadata?.racerCount ?? 0);

  return (
    <div className="group rounded-[24px] border border-white/10 bg-white/[0.025] p-4 transition hover:border-cyan-300/15 hover:bg-white/[0.04] sm:p-5">
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

            {rounds.map((round) => (
              <span
                key={round}
                className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.12em] text-slate-400"
              >
                Round {round}
              </span>
            ))}
          </div>

          <h3 className="mt-3 text-lg font-black text-white sm:text-xl">
            {slot.label || slot.classes.map(getClassName).join(" + ")}
          </h3>

          <div className="mt-3 flex flex-wrap gap-2">
            {slot.classes.map((slotClass) => (
              <div
                key={
                  slotClass.id ??
                  `${slotClass.eventClass.id}-${slotClass.roundNumber}`
                }
                className="rounded-xl border border-white/[0.07] bg-black/15 px-3 py-2 text-xs font-bold text-slate-300"
              >
                {getClassName(slotClass)}
              </div>
            ))}
          </div>

          {racerCount > 0 ? (
            <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
              <Users className="h-3.5 w-3.5" />
              {racerCount} racer
              {racerCount === 1 ? "" : "s"}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function PublicRaceSchedulePage({ dayId }: Props) {
  const scheduleQuery = usePublicRaceSchedule(dayId);

  const data = scheduleQuery.data;

  const slots = useMemo(
    () =>
      [...(data?.schedule?.slots ?? [])].sort(
        (a, b) => a.displayOrder - b.displayOrder,
      ),
    [data?.schedule?.slots],
  );

  const raceCount = slots.filter((slot) => slot.slotType === "race").length;

  const breakCount = slots.filter((slot) => slot.slotType === "break").length;

  if (scheduleQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#030913]">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-200" />
      </div>
    );
  }

  if (scheduleQuery.isError || !data) {
    return (
      <div className="min-h-screen bg-[#030913] px-4 py-12 text-white">
        <div className="mx-auto max-w-xl rounded-[30px] border border-white/10 bg-[#07111F] p-7 text-center">
          <AlertTriangle className="mx-auto h-8 w-8 text-amber-200" />

          <div className="mt-5 text-[9px] font-black uppercase tracking-[0.18em] text-amber-200">
            Race Order Unavailable
          </div>

          <h1 className="mt-2 text-2xl font-black uppercase text-white">
            No published schedule
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-400">
            The race organization has not published an official race order for
            this race day yet, or it may have temporarily returned the schedule
            to draft.
          </p>

          <Link
            href="/registration/events"
            className="mt-6 inline-flex rounded-full bg-cyan-300 px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-[#04101C]"
          >
            Browse Events
          </Link>
        </div>
      </div>
    );
  }

  const startTime = formatTime(data.eventDay?.startsAt);

  const endTime = formatTime(data.eventDay?.endsAt);

  return (
    <div className="min-h-screen bg-[#030913] text-white">
      <div className="mx-auto w-full max-w-[1180px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <section className="overflow-hidden rounded-[32px] border border-white/10 bg-[#07111F] shadow-[0_30px_100px_rgba(0,0,0,0.38)]">
          <div className="border-b border-white/10 bg-gradient-to-br from-cyan-300/[0.08] via-transparent to-[#FF6B35]/[0.04] p-5 sm:p-7 lg:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/15 bg-emerald-300/[0.08] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-emerald-200">
                  <Radio className="h-3.5 w-3.5" />
                  Official Race Order
                </div>

                {data.event?.name ? (
                  <div className="mt-5 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200/60">
                    {data.event.name}
                  </div>
                ) : null}

                <h1 className="mt-2 text-3xl font-black uppercase tracking-[-0.04em] text-white sm:text-4xl">
                  {data.eventDay.label}
                </h1>

                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-400">
                  {data.eventDay.eventDate ? (
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-cyan-200" />

                      {formatDate(data.eventDay.eventDate)}
                    </div>
                  ) : null}

                  {startTime ? (
                    <div className="flex items-center gap-2">
                      <Clock3 className="h-4 w-4 text-cyan-200" />

                      {startTime}

                      {endTime ? ` – ${endTime}` : ""}
                    </div>
                  ) : null}

                  {data.event?.location ? (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-[#FFB199]" />

                      {data.event.location}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <div className="rounded-[18px] border border-white/10 bg-black/15 px-4 py-3">
                  <Flag className="h-4 w-4 text-cyan-200" />

                  <div className="mt-2 text-xl font-black text-white">
                    {raceCount}
                  </div>

                  <div className="text-[8px] font-black uppercase tracking-[0.14em] text-slate-500">
                    Races
                  </div>
                </div>

                <div className="rounded-[18px] border border-white/10 bg-black/15 px-4 py-3">
                  <Clock3 className="h-4 w-4 text-amber-200" />

                  <div className="mt-2 text-xl font-black text-white">
                    {breakCount}
                  </div>

                  <div className="text-[8px] font-black uppercase tracking-[0.14em] text-slate-500">
                    Breaks
                  </div>
                </div>

                <div className="rounded-[18px] border border-white/10 bg-black/15 px-4 py-3">
                  <Trophy className="h-4 w-4 text-[#FFB199]" />

                  <div className="mt-2 text-xl font-black text-white">
                    {data.schedule.version}
                  </div>

                  <div className="text-[8px] font-black uppercase tracking-[0.14em] text-slate-500">
                    Version
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 border-t border-white/[0.07] pt-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <RefreshCw className="h-3.5 w-3.5" />
                This page automatically checks for official updates.
              </div>

              {data.schedule.publishedAt ? (
                <div className="text-xs font-bold text-emerald-200/60">
                  Published {formatPublishedAt(data.schedule.publishedAt)}
                </div>
              ) : null}
            </div>
          </div>

          <div className="p-4 sm:p-6 lg:p-7">
            {!slots.length ? (
              <div className="rounded-[24px] border border-dashed border-white/10 p-12 text-center">
                <Flag className="mx-auto h-8 w-8 text-slate-700" />

                <h2 className="mt-4 font-black text-white">
                  Race order is empty
                </h2>
              </div>
            ) : (
              <div className="space-y-3">
                {slots.map((slot) => (
                  <RaceSlotCard key={slot.id} slot={slot} />
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
