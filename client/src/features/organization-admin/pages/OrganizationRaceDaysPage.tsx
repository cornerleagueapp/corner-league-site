import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Check,
  CircleDollarSign,
  Clock3,
  Loader2,
  Plus,
  Power,
  ShieldCheck,
  Trophy,
  Users,
  X,
} from "lucide-react";
import { OrganizationAdminLayout } from "../components/OrganizationAdminLayout";
import {
  useOrganizationEventRegistrations,
  useOrganizationEvents,
} from "../hooks/useOrganizationRegistrations";
import {
  useCreateRegistrationClass,
  useCreateRegistrationDay,
  useRegistrationEventConfiguration,
  useRegistrationEventDivisions,
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

function combineDateAndTime(
  dateValue: string,
  timeValue: string,
): string | null {
  if (!dateValue || !timeValue) {
    return null;
  }

  const date = new Date(`${dateValue}T${timeValue}:00`);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
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

  const [dayModalOpen, setDayModalOpen] = useState(false);

  const [classModalOpen, setClassModalOpen] = useState(false);

  const [dayForm, setDayForm] = useState({
    label: "",
    eventDate: "",
    startsAt: "",
    endsAt: "",
  });

  const [classForm, setClassForm] = useState({
    divisionId: "",
    displayName: "",
    description: "",
    basePrice: "",
    capacity: "",
    allowWaitlist: false,
  });

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

  const configuration = configurationQuery.data;

  const settings = configuration?.settings ?? null;

  const hasRegistrationConfiguration =
    configurationQuery.isSuccess && !!settings;

  const registrationsQuery = useOrganizationEventRegistrations(
    selectedEventId,
    hasRegistrationConfiguration,
  );

  const divisionsQuery = useRegistrationEventDivisions(
    selectedEventId,
    hasRegistrationConfiguration,
  );

  const createDayMutation = useCreateRegistrationDay(selectedEventId);

  const createClassMutation = useCreateRegistrationClass(selectedEventId);

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

  const createRaceDay = async () => {
    if (!dayForm.label.trim() || !dayForm.eventDate) {
      return;
    }

    const dayKey =
      dayForm.label
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") ||
      `day-${settings?.eventDays.length ?? 0 + 1}`;

    await createDayMutation.mutateAsync({
      dayKey,

      label: dayForm.label.trim(),

      eventDate: dayForm.eventDate,

      startsAt: combineDateAndTime(dayForm.eventDate, dayForm.startsAt),

      endsAt: combineDateAndTime(dayForm.eventDate, dayForm.endsAt),

      isRegistrationEnabled: true,

      displayOrder: settings?.eventDays.length ?? 0,
    });

    setDayForm({
      label: "",
      eventDate: "",
      startsAt: "",
      endsAt: "",
    });

    setDayModalOpen(false);
  };

  const createRegistrationClass = async () => {
    if (!classForm.divisionId) {
      return;
    }

    const parsedPrice = Number(classForm.basePrice);

    const parsedCapacity = classForm.capacity
      ? Number(classForm.capacity)
      : null;

    await createClassMutation.mutateAsync({
      divisionId: classForm.divisionId,

      displayName: classForm.displayName.trim() || null,

      description: classForm.description.trim() || null,

      pricingModel: "flat",

      basePriceCents:
        Number.isFinite(parsedPrice) && parsedPrice >= 0
          ? Math.round(parsedPrice * 100)
          : 0,

      currency: "USD",

      capacity:
        parsedCapacity !== null &&
        Number.isFinite(parsedCapacity) &&
        parsedCapacity > 0
          ? parsedCapacity
          : null,

      allowWaitlist: classForm.allowWaitlist,

      minimumSelectedDays: 1,

      maximumSelectedDays: null,

      isRegistrationOpen: true,

      displayOrder: settings?.eventClasses.length ?? 0,
    });

    setClassForm({
      divisionId: "",
      displayName: "",
      description: "",
      basePrice: "",
      capacity: "",
      allowWaitlist: false,
    });

    setClassModalOpen(false);
  };

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
          <div className="mt-8 rounded-[26px] border border-cyan-300/15 bg-cyan-300/[0.035] p-6 sm:p-7">
            <ShieldCheck className="h-6 w-6 text-cyan-200" />

            <div className="mt-4 text-[9px] font-black uppercase tracking-[0.16em] text-cyan-200">
              Registration Setup Required
            </div>

            <h3 className="mt-2 text-xl font-black uppercase text-white">
              Race days are not ready yet
            </h3>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
              This event exists, but registration has not been configured yet.
              Set up registration first, then return here to create race days
              and registration classes.
            </p>

            <a
              href={`/organizations/${encodeURIComponent(
                organizationId,
              )}/admin/settings?eventId=${encodeURIComponent(selectedEventId)}`}
              className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-cyan-300 px-5 text-[10px] font-black uppercase tracking-[0.14em] text-[#04101C] transition hover:bg-cyan-200"
            >
              Set Up Registration
            </a>
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
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
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

                <button
                  type="button"
                  onClick={() => setDayModalOpen(true)}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-cyan-300 px-5 text-[10px] font-black uppercase tracking-[0.14em] text-[#04101C] transition hover:bg-cyan-200"
                >
                  <Plus className="h-4 w-4" />
                  Add Race Day
                </button>
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
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
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

                <button
                  type="button"
                  disabled={!divisionsQuery.data?.length}
                  onClick={() => setClassModalOpen(true)}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#FF6B35]/25 bg-[#FF6B35]/10 px-5 text-[10px] font-black uppercase tracking-[0.14em] text-[#FFB199] transition hover:bg-[#FF6B35] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Plus className="h-4 w-4" />
                  Add Class
                </button>
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

        {dayModalOpen ? (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <div className="w-full max-w-xl rounded-[28px] border border-white/10 bg-[#07111F] p-5 shadow-[0_30px_100px_rgba(0,0,0,0.55)] sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[9px] font-black uppercase tracking-[0.18em] text-cyan-200">
                    Event Setup
                  </div>

                  <h3 className="mt-2 text-xl font-black uppercase text-white">
                    Add Race Day
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => setDayModalOpen(false)}
                  className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-slate-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-6 space-y-4">
                <label className="block">
                  <span className="mb-2 block text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">
                    Day Name *
                  </span>

                  <input
                    value={dayForm.label}
                    onChange={(event) =>
                      setDayForm((current) => ({
                        ...current,
                        label: event.target.value,
                      }))
                    }
                    placeholder="Saturday"
                    className="h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none focus:border-cyan-300/30"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">
                    Event Date *
                  </span>

                  <input
                    type="date"
                    value={dayForm.eventDate}
                    onChange={(event) =>
                      setDayForm((current) => ({
                        ...current,
                        eventDate: event.target.value,
                      }))
                    }
                    className="h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none focus:border-cyan-300/30"
                  />
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label>
                    <span className="mb-2 block text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">
                      Start Time
                    </span>

                    <input
                      type="time"
                      value={dayForm.startsAt}
                      onChange={(event) =>
                        setDayForm((current) => ({
                          ...current,
                          startsAt: event.target.value,
                        }))
                      }
                      className="h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none focus:border-cyan-300/30"
                    />
                  </label>

                  <label>
                    <span className="mb-2 block text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">
                      End Time
                    </span>

                    <input
                      type="time"
                      value={dayForm.endsAt}
                      onChange={(event) =>
                        setDayForm((current) => ({
                          ...current,
                          endsAt: event.target.value,
                        }))
                      }
                      className="h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none focus:border-cyan-300/30"
                    />
                  </label>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setDayModalOpen(false)}
                  className="h-11 rounded-full border border-white/10 px-5 text-[10px] font-black uppercase tracking-[0.13em] text-slate-400"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={
                    !dayForm.label.trim() ||
                    !dayForm.eventDate ||
                    createDayMutation.isPending
                  }
                  onClick={createRaceDay}
                  className="inline-flex h-11 items-center gap-2 rounded-full bg-cyan-300 px-5 text-[10px] font-black uppercase tracking-[0.13em] text-[#04101C] disabled:opacity-40"
                >
                  {createDayMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  Create Day
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {classModalOpen ? (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-[28px] border border-white/10 bg-[#07111F] p-5 shadow-[0_30px_100px_rgba(0,0,0,0.55)] sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[9px] font-black uppercase tracking-[0.18em] text-[#FFB199]">
                    Competition Setup
                  </div>

                  <h3 className="mt-2 text-xl font-black uppercase text-white">
                    Add Registration Class
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => setClassModalOpen(false)}
                  className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-slate-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-6 space-y-4">
                <label className="block">
                  <span className="mb-2 block text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">
                    Division *
                  </span>

                  <select
                    value={classForm.divisionId}
                    onChange={(event) =>
                      setClassForm((current) => ({
                        ...current,
                        divisionId: event.target.value,
                      }))
                    }
                    className="h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none focus:border-cyan-300/30"
                  >
                    <option value="">Select division</option>

                    {(divisionsQuery.data ?? []).map((division) => (
                      <option key={division.id} value={division.id}>
                        {division.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">
                    Display Name
                  </span>

                  <input
                    value={classForm.displayName}
                    onChange={(event) =>
                      setClassForm((current) => ({
                        ...current,
                        displayName: event.target.value,
                      }))
                    }
                    placeholder="Optional custom class name"
                    className="h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none focus:border-cyan-300/30"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">
                    Description
                  </span>

                  <textarea
                    value={classForm.description}
                    onChange={(event) =>
                      setClassForm((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                    rows={3}
                    className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/30"
                  />
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label>
                    <span className="mb-2 block text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">
                      Base Price
                    </span>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={classForm.basePrice}
                      onChange={(event) =>
                        setClassForm((current) => ({
                          ...current,
                          basePrice: event.target.value,
                        }))
                      }
                      placeholder="150.00"
                      className="h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none focus:border-cyan-300/30"
                    />
                  </label>

                  <label>
                    <span className="mb-2 block text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">
                      Capacity
                    </span>

                    <input
                      type="number"
                      min="1"
                      value={classForm.capacity}
                      onChange={(event) =>
                        setClassForm((current) => ({
                          ...current,
                          capacity: event.target.value,
                        }))
                      }
                      placeholder="Unlimited"
                      className="h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none focus:border-cyan-300/30"
                    />
                  </label>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setClassForm((current) => ({
                      ...current,
                      allowWaitlist: !current.allowWaitlist,
                    }))
                  }
                  className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                >
                  <div className="text-left">
                    <div className="text-sm font-black text-white">
                      Allow Waitlist
                    </div>

                    <div className="mt-1 text-xs text-slate-500">
                      Allow racers to join a waitlist when capacity is reached.
                    </div>
                  </div>

                  <div
                    className={`relative h-6 w-11 rounded-full ${
                      classForm.allowWaitlist ? "bg-cyan-300" : "bg-white/10"
                    }`}
                  >
                    <div
                      className={`absolute top-1 h-4 w-4 rounded-full bg-[#04101C] transition ${
                        classForm.allowWaitlist ? "left-6" : "left-1"
                      }`}
                    />
                  </div>
                </button>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setClassModalOpen(false)}
                  className="h-11 rounded-full border border-white/10 px-5 text-[10px] font-black uppercase tracking-[0.13em] text-slate-400"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={
                    !classForm.divisionId || createClassMutation.isPending
                  }
                  onClick={createRegistrationClass}
                  className="inline-flex h-11 items-center gap-2 rounded-full bg-[#FF6B35] px-5 text-[10px] font-black uppercase tracking-[0.13em] text-white disabled:opacity-40"
                >
                  {createClassMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  Create Class
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </section>
    </OrganizationAdminLayout>
  );
}
