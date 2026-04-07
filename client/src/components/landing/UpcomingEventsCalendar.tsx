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
    <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-6">
      <div className="mb-6 flex items-center justify-between">
        <button
          type="button"
          onClick={() =>
            setMonthDate(
              (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1),
            )
          }
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white hover:bg-white/10"
        >
          ← Prev
        </button>

        <div className="text-lg font-semibold text-white">
          {formatMonthLabel(monthDate)}
        </div>

        <button
          type="button"
          onClick={() =>
            setMonthDate(
              (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1),
            )
          }
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white hover:bg-white/10"
        >
          Next →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold uppercase tracking-[0.14em] text-white/45">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((label) => (
          <div key={label} className="py-2">
            {label}
          </div>
        ))}
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
              className={`min-h-[82px] rounded-xl border p-2 text-left transition ${
                isSelected
                  ? "border-cyan-300/40 bg-cyan-400/[0.08]"
                  : "border-white/10 bg-white/[0.02] hover:bg-white/[0.05]"
              } ${!inCurrentMonth ? "opacity-35" : ""}`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-sm font-semibold ${
                    isToday ? "text-cyan-300" : "text-white"
                  }`}
                >
                  {day.getDate()}
                </span>

                {eventCount > 0 ? (
                  <span className="rounded-full bg-[#ff9c9c]/20 px-2 py-0.5 text-[10px] font-bold text-[#ffb3b3]">
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
                        className="truncate rounded bg-white/5 px-2 py-1 text-[10px] text-white/80"
                      >
                        {event.name}
                      </div>
                    ))}
                  {eventCount > 2 ? (
                    <div className="text-[10px] text-white/45">
                      +{eventCount - 2} more
                    </div>
                  ) : null}
                </div>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="mt-6 rounded-[18px] border border-white/10 bg-black/20 p-4">
        <div className="text-sm font-bold uppercase tracking-[0.16em] text-white/45">
          {selectedDayKey ? "Selected Day Events" : "Select a day"}
        </div>

        {!selectedDayKey ? (
          <div className="mt-3 text-white/55">
            Click a day on the calendar to view scheduled events.
          </div>
        ) : selectedEvents.length === 0 ? (
          <div className="mt-3 text-white/55">
            No events scheduled for this day.
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {selectedEvents.map((event) => (
              <div
                key={event.id}
                className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <div className="font-semibold text-white">{event.name}</div>
                  <div className="mt-1 text-sm text-white/55">
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
                  <button className="border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white hover:bg-white/10">
                    View Event
                  </button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
