import React from "react";
import { Link } from "wouter";
import type { EventItem } from "@/hooks/useScoresLandingData";

type Props = {
  events: EventItem[];
};

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function startOfWeek(date: Date) {
  const copy = new Date(date);
  const day = copy.getDay();
  copy.setDate(copy.getDate() - day);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function endOfWeek(date: Date) {
  const copy = new Date(date);
  const day = copy.getDay();
  copy.setDate(copy.getDate() + (6 - day));
  copy.setHours(23, 59, 59, 999);
  return copy;
}

function formatDayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatMonthLabel(date: Date) {
  return date.toLocaleDateString([], {
    month: "long",
    year: "numeric",
  });
}

function formatTime(dateString: string) {
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return "TBD";
  return d.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function buildCalendarDays(monthDate: Date) {
  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);
  const gridStart = startOfWeek(monthStart);
  const gridEnd = endOfWeek(monthEnd);

  const days: Date[] = [];
  const cursor = new Date(gridStart);

  while (cursor <= gridEnd) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return days;
}

export default function UpcomingEventsCalendar({ events }: Props) {
  const [monthDate, setMonthDate] = React.useState(() => new Date());
  const [selectedDayKey, setSelectedDayKey] = React.useState<string | null>(
    null,
  );

  const dayMap = React.useMemo(() => {
    const map = new Map<string, EventItem[]>();

    for (const event of events) {
      const d = new Date(event.startDate);
      if (Number.isNaN(d.getTime())) continue;

      const key = formatDayKey(d);
      const existing = map.get(key) ?? [];
      existing.push(event);
      map.set(key, existing);
    }

    for (const [key, list] of map.entries()) {
      list.sort(
        (a, b) =>
          new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
      );
      map.set(key, list);
    }

    return map;
  }, [events]);

  const days = React.useMemo(() => buildCalendarDays(monthDate), [monthDate]);

  const selectedEvents = React.useMemo(() => {
    if (!selectedDayKey) return [];
    return dayMap.get(selectedDayKey) ?? [];
  }, [selectedDayKey, dayMap]);

  const todayKey = formatDayKey(new Date());
  const monthIndex = monthDate.getMonth();

  return (
    <div className="relative min-w-0 overflow-hidden rounded-[30px] border border-cyan-300/10 bg-[#07111F]/80 p-4 shadow-[0_24px_70px_rgba(0,0,0,0.34)] sm:p-6">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-[#FF6B35]/10 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.04] [background-image:linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:64px_64px]" />
      </div>

      <div className="relative">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200/70">
              Calendar View
            </div>

            <div className="mt-2 text-2xl font-black uppercase tracking-[-0.03em] text-white sm:text-3xl">
              {formatMonthLabel(monthDate)}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex">
            <button
              type="button"
              onClick={() =>
                setMonthDate(
                  (prev) =>
                    new Date(prev.getFullYear(), prev.getMonth() - 1, 1),
                )
              }
              className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-white/75 transition hover:border-cyan-300/25 hover:bg-cyan-300/10 hover:text-white"
            >
              Prev
            </button>

            <button
              type="button"
              onClick={() =>
                setMonthDate(
                  (prev) =>
                    new Date(prev.getFullYear(), prev.getMonth() + 1, 1),
                )
              }
              className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-cyan-100 transition hover:border-cyan-200/40 hover:bg-cyan-300 hover:text-[#06111d]"
            >
              Next
            </button>
          </div>
        </div>

        <div className="overflow-x-auto pb-2 [scrollbar-width:thin] [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-cyan-300/20">
          <div className="min-w-[720px]">
            <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-black uppercase tracking-[0.16em] text-white/45">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                (label) => (
                  <div key={label} className="py-2">
                    {label}
                  </div>
                ),
              )}
            </div>

            <div className="mt-2 grid grid-cols-7 gap-2">
              {days.map((day) => {
                const key = formatDayKey(day);
                const inCurrentMonth = day.getMonth() === monthIndex;
                const eventCount = dayMap.get(key)?.length ?? 0;
                const isSelected = selectedDayKey === key;
                const isToday = key === todayKey;

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedDayKey(key)}
                    className={`min-h-[92px] rounded-2xl border p-2 text-left transition ${
                      isSelected
                        ? "border-cyan-300/40 bg-cyan-400/[0.1] shadow-[0_0_24px_rgba(34,211,238,0.12)]"
                        : "border-white/10 bg-white/[0.025] hover:border-cyan-300/20 hover:bg-cyan-300/[0.05]"
                    } ${!inCurrentMonth ? "opacity-35" : ""}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-sm font-black ${
                          isToday ? "text-cyan-300" : "text-white"
                        }`}
                      >
                        {day.getDate()}
                      </span>

                      {eventCount > 0 ? (
                        <span className="rounded-full border border-[#FF6B35]/20 bg-[#FF6B35]/10 px-2 py-0.5 text-[10px] font-black text-[#FFB199]">
                          {eventCount}
                        </span>
                      ) : null}
                    </div>

                    {eventCount > 0 ? (
                      <div className="mt-3 space-y-1">
                        {dayMap
                          .get(key)
                          ?.slice(0, 2)
                          .map((event) => (
                            <div
                              key={event.id}
                              className="truncate rounded-lg border border-white/10 bg-white/[0.05] px-2 py-1 text-[10px] text-white/80"
                            >
                              {event.name}
                            </div>
                          ))}

                        {eventCount > 2 ? (
                          <div className="text-[10px] font-bold text-cyan-200/70">
                            +{eventCount - 2} more
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-[24px] border border-cyan-300/10 bg-black/25 p-4 sm:p-5">
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200/70">
            {selectedDayKey ? "Selected Day Events" : "Select a day"}
          </div>

          {!selectedDayKey ? (
            <div className="mt-3 text-sm leading-7 text-slate-300">
              Click a day on the calendar to view scheduled events.
            </div>
          ) : selectedEvents.length === 0 ? (
            <div className="mt-3 text-sm leading-7 text-slate-300">
              No events scheduled for this day.
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {selectedEvents.map((event) => (
                <div
                  key={event.id}
                  className="grid min-w-0 gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition hover:border-cyan-300/20 hover:bg-cyan-300/[0.05] md:grid-cols-[minmax(0,1fr)_auto] md:items-center"
                >
                  <div className="min-w-0">
                    <div className="break-words font-black uppercase leading-snug tracking-[0.04em] text-white">
                      {event.name}
                    </div>

                    <div className="mt-2 break-words text-sm leading-6 text-white/55">
                      {event.organizationName || "Organization"} •{" "}
                      {event.location || "Location TBD"} •{" "}
                      {formatTime(event.startDate)}
                    </div>
                  </div>

                  <Link
                    href={`/aqua-organizations/event-details/${event.id}?orgId=${encodeURIComponent(
                      event.organizationId || "",
                    )}`}
                  >
                    <button className="w-full rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-cyan-100 transition hover:border-cyan-200/40 hover:bg-cyan-300 hover:text-[#06111d] md:w-auto">
                      View Event
                    </button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
