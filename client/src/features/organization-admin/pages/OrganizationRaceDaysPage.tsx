import { useEffect, useMemo, useState } from "react";

import {
  CalendarDays,
  Check,
  CircleDollarSign,
  Clock3,
  Loader2,
  Power,
  ShieldCheck,
  Trophy,
  Users,
} from "lucide-react";

import { OrganizationAdminLayout } from "../components/OrganizationAdminLayout";

import {
  useOrganizationEventRegistrations,
  useOrganizationEvents,
} from "../hooks/useOrganizationRegistrations";

import {
  useRegistrationEventConfiguration,
  useUpdateRegistrationClass,
  useUpdateRegistrationDay,
} from "../hooks/useOrganizationRaceDays";

import type {
  RegistrationEventClass,
  RegistrationEventDay,
} from "../types/organizationRaceDay";

type Props = {
  organizationId: string;
};

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "Date not set";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(undefined, {
    weekday: "long",

    month: "short",

    day: "numeric",

    year: "numeric",
  });
}

function formatTime(value: string | null | undefined) {
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

function formatMoney(cents: number | undefined, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",

    currency: currency.toUpperCase(),
  }).format(Number(cents ?? 0) / 100);
}

function getClassName(eventClass: RegistrationEventClass) {
  return (
    eventClass.displayName?.trim() ||
    eventClass.division?.name ||
    "Unnamed Class"
  );
}

function getEntryClassId(entry: any) {
  return String(
    entry?.eventClass?.id ??
      entry?.eventClassId ??
      entry?.registrationEventClass?.id ??
      "",
  );
}

function getEntryStatus(entry: any) {
  return String(entry?.status ?? "")
    .trim()
    .toLowerCase();
}

function DayCard({
  day,
  eventId,
}: {
  day: RegistrationEventDay;

  eventId: string;
}) {
  const mutation = useUpdateRegistrationDay(eventId);

  const startsAt = formatTime(day.startsAt);

  const endsAt = formatTime(day.endsAt);

  const toggle = () => {
    if (mutation.isPending) {
      return;
    }

    mutation.mutate({
      dayId: day.id,

      input: {
        isRegistrationEnabled: !day.isRegistrationEnabled,
      },
    });
  };

  return (
    <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-cyan-300/15 bg-cyan-300/10">
            <CalendarDays className="h-5 w-5 text-cyan-200" />
          </div>

          <div className="min-w-0">
            <div className="text-[9px] font-black uppercase tracking-[0.15em] text-cyan-200/60">
              Race Day
            </div>

            <h3 className="mt-1 truncate text-lg font-black text-white">
              {day.label}
            </h3>

            <p className="mt-1 text-sm text-slate-400">
              {formatDate(day.eventDate)}
            </p>

            {startsAt || endsAt ? (
              <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                <Clock3 className="h-3.5 w-3.5" />

                {startsAt ?? "Start TBD"}

                {endsAt ? ` – ${endsAt}` : ""}
              </div>
            ) : null}
          </div>
        </div>

        <button
          type="button"
          onClick={toggle}
          disabled={mutation.isPending}
          className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-[9px] font-black uppercase tracking-[0.13em] transition ${
            day.isRegistrationEnabled
              ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-200"
              : "border-white/10 bg-white/[0.04] text-slate-400"
          }`}
        >
          {mutation.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Power className="h-3.5 w-3.5" />
          )}

          {day.isRegistrationEnabled ? "Open" : "Closed"}
        </button>
      </div>

      <div className="mt-4 border-t border-white/[0.07] pt-4">
        <div className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-600">
          Day Key
        </div>

        <div className="mt-1 font-mono text-xs text-slate-400">
          {day.dayKey}
        </div>
      </div>
    </div>
  );
}

function ClassCard({
  eventClass,
  eventId,
  racerCount,
}: {
  eventClass: RegistrationEventClass;

  eventId: string;

  racerCount: number;
}) {
  const mutation = useUpdateRegistrationClass(eventId);

  const toggle = () => {
    if (mutation.isPending) {
      return;
    }

    mutation.mutate({
      classId: eventClass.id,

      input: {
        isRegistrationOpen: !eventClass.isRegistrationOpen,
      },
    });
  };

  return (
    <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-[9px] font-black uppercase tracking-[0.15em] text-[#FFB199]">
            Registration Class
          </div>

          <h3 className="mt-2 truncate text-lg font-black text-white">
            {getClassName(eventClass)}
          </h3>

          {eventClass.description ? (
            <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">
              {eventClass.description}
            </p>
          ) : null}
        </div>

        <button
          type="button"
          disabled={mutation.isPending}
          onClick={toggle}
          className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-[9px] font-black uppercase tracking-[0.13em] transition ${
            eventClass.isRegistrationOpen
              ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-200"
              : "border-white/10 bg-white/[0.04] text-slate-400"
          }`}
        >
          {mutation.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : eventClass.isRegistrationOpen ? (
            <Check className="h-3.5 w-3.5" />
          ) : (
            <Power className="h-3.5 w-3.5" />
          )}

          {eventClass.isRegistrationOpen ? "Open" : "Closed"}
        </button>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-white/[0.07] bg-black/15 p-3">
          <Users className="h-4 w-4 text-cyan-200" />

          <div className="mt-2 text-lg font-black text-white">{racerCount}</div>

          <div className="mt-1 text-[8px] font-black uppercase tracking-[0.13em] text-slate-600">
            Registered
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.07] bg-black/15 p-3">
          <CircleDollarSign className="h-4 w-4 text-[#FFB199]" />

          <div className="mt-2 text-lg font-black text-white">
            {formatMoney(
              eventClass.basePriceCents,
              eventClass.currency ?? "USD",
            )}
          </div>

          <div className="mt-1 text-[8px] font-black uppercase tracking-[0.13em] text-slate-600">
            Base Price
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {eventClass.capacity != null ? (
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[9px] font-bold text-slate-400">
            Capacity {eventClass.capacity}
          </span>
        ) : (
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[9px] font-bold text-slate-400">
            Unlimited capacity
          </span>
        )}

        {eventClass.allowWaitlist ? (
          <span className="rounded-full border border-amber-300/15 bg-amber-300/[0.06] px-2.5 py-1 text-[9px] font-bold text-amber-100">
            Waitlist
          </span>
        ) : null}
      </div>
    </div>
  );
}

export default function OrganizationRaceDaysPage({ organizationId }: Props) {
  const eventsQuery = useOrganizationEvents(organizationId);

  const events = eventsQuery.data ?? [];

  const [selectedEventId, setSelectedEventId] = useState("");

  useEffect(() => {
    if (selectedEventId || !events.length) {
      return;
    }

    const now = Date.now();

    const upcoming = [...events]
      .filter((event) => {
        const value = new Date(event.startDate ?? "").getTime();

        return !Number.isNaN(value) && value >= now;
      })
      .sort(
        (a, b) =>
          new Date(a.startDate ?? "").getTime() -
          new Date(b.startDate ?? "").getTime(),
      )[0];

    setSelectedEventId(upcoming?.id ?? events[0].id);
  }, [events, selectedEventId]);

  const configurationQuery = useRegistrationEventConfiguration(selectedEventId);

  const registrationsQuery = useOrganizationEventRegistrations(selectedEventId);

  const configuration = configurationQuery.data;

  const settings = configuration?.settings ?? null;

  const classRacerCounts = useMemo(() => {
    const result = new Map<string, Set<string>>();

    const registrations = registrationsQuery.data?.registrations ?? [];

    for (const registration of registrations) {
      const registrationKey = String(
        registration.id ??
          registration.registrationId ??
          registration.confirmationNumber ??
          "",
      );

      for (const entry of registration.entries ?? []) {
        const status = getEntryStatus(entry);

        if (status === "cancelled" || status === "canceled") {
          continue;
        }

        const classId = getEntryClassId(entry);

        if (!classId) {
          continue;
        }

        const racers = result.get(classId) ?? new Set<string>();

        racers.add(String(registration.racer?.id ?? registrationKey));

        result.set(classId, racers);
      }
    }

    return new Map(
      [...result.entries()].map(([classId, racers]) => [classId, racers.size]),
    );
  }, [registrationsQuery.data]);

  return (
    <OrganizationAdminLayout organizationId={organizationId}>
      <section>
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200">
              Event Operations
            </div>

            <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.03em] text-white sm:text-3xl">
              Race Days & Classes
            </h2>

            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">
              Review the competition days and classes attached to this event.
              Registration availability can be controlled here before race
              scheduling is generated.
            </p>
          </div>

          <div className="w-full xl:w-[360px]">
            <label className="mb-2 block text-[9px] font-black uppercase tracking-[0.16em] text-slate-500">
              Event
            </label>

            <select
              value={selectedEventId}
              onChange={(event) => setSelectedEventId(event.target.value)}
              className="h-12 w-full rounded-2xl border border-white/10 bg-[#07111F] px-4 text-sm font-bold text-white outline-none transition focus:border-cyan-300/30"
            >
              {!events.length ? (
                <option value="">No events available</option>
              ) : null}

              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {eventsQuery.isLoading ? (
          <div className="flex min-h-[400px] items-center justify-center">
            <Loader2 className="h-7 w-7 animate-spin text-cyan-200" />
          </div>
        ) : !events.length ? (
          <div className="mt-8 rounded-[26px] border border-dashed border-white/10 bg-white/[0.025] px-6 py-14 text-center">
            <CalendarDays className="mx-auto h-8 w-8 text-slate-700" />

            <h3 className="mt-4 text-lg font-black text-white">
              No organization events
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Create an event before configuring race days.
            </p>
          </div>
        ) : configurationQuery.isLoading ? (
          <div className="flex min-h-[400px] items-center justify-center">
            <Loader2 className="h-7 w-7 animate-spin text-cyan-200" />
          </div>
        ) : configurationQuery.isError ? (
          <div className="mt-8 rounded-[24px] border border-red-300/15 bg-red-300/[0.05] p-6">
            <h3 className="font-black text-red-100">
              Unable to load event configuration
            </h3>

            <p className="mt-2 text-sm leading-6 text-red-100/60">
              Confirm that registration settings have been configured for this
              event and that your account has event-management permission.
            </p>
          </div>
        ) : !settings ? (
          <div className="mt-8 rounded-[26px] border border-amber-300/15 bg-amber-300/[0.045] p-6">
            <ShieldCheck className="h-6 w-6 text-amber-200" />

            <h3 className="mt-4 text-lg font-black text-white">
              Registration configuration has not been created
            </h3>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              This event exists, but registration settings must be initialized
              before race days and registration classes can be managed here.
            </p>
          </div>
        ) : (
          <>
            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                <CalendarDays className="h-5 w-5 text-cyan-200" />

                <div className="mt-4 text-2xl font-black text-white">
                  {settings.eventDays.length}
                </div>

                <div className="mt-1 text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">
                  Race Days
                </div>
              </div>

              <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                <Trophy className="h-5 w-5 text-[#FFB199]" />

                <div className="mt-4 text-2xl font-black text-white">
                  {settings.eventClasses.length}
                </div>

                <div className="mt-1 text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">
                  Classes
                </div>
              </div>

              <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                <Users className="h-5 w-5 text-emerald-200" />

                <div className="mt-4 text-2xl font-black text-white">
                  {registrationsQuery.data?.total ?? 0}
                </div>

                <div className="mt-1 text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">
                  Registrations
                </div>
              </div>
            </div>

            <section className="mt-8">
              <div>
                <div className="text-[9px] font-black uppercase tracking-[0.18em] text-cyan-200/60">
                  Schedule Foundation
                </div>

                <h3 className="mt-2 text-xl font-black uppercase text-white">
                  Race Days
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  These days become the foundation for independent race
                  schedules.
                </p>
              </div>

              {!settings.eventDays.length ? (
                <div className="mt-4 rounded-[22px] border border-dashed border-white/10 p-8 text-center text-sm text-slate-500">
                  No race days have been configured.
                </div>
              ) : (
                <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {settings.eventDays.map((day) => (
                    <DayCard key={day.id} day={day} eventId={selectedEventId} />
                  ))}
                </div>
              )}
            </section>

            <section className="mt-10">
              <div>
                <div className="text-[9px] font-black uppercase tracking-[0.18em] text-[#FFB199]">
                  Competition Setup
                </div>

                <h3 className="mt-2 text-xl font-black uppercase text-white">
                  Event Classes
                </h3>

                <p className="mt-2 max-w-3xl text-sm text-slate-500">
                  These classes will feed the race-scheduling engine. Racer
                  counts are shown to help promoters identify classes that may
                  need to be combined later.
                </p>
              </div>

              {!settings.eventClasses.length ? (
                <div className="mt-4 rounded-[22px] border border-dashed border-white/10 p-8 text-center text-sm text-slate-500">
                  No registration classes have been configured.
                </div>
              ) : (
                <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {settings.eventClasses.map((eventClass) => (
                    <ClassCard
                      key={eventClass.id}
                      eventClass={eventClass}
                      eventId={selectedEventId}
                      racerCount={classRacerCounts.get(eventClass.id) ?? 0}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </section>
    </OrganizationAdminLayout>
  );
}
