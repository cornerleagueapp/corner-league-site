import { useEffect, useMemo, useState } from "react";

import {
  ArrowRight,
  CalendarDays,
  Flag,
  Loader2,
  Search,
  Users,
  X,
} from "lucide-react";

import { useLocation } from "wouter";

import RegistrationLayout from "../components/RegistrationLayout";

import RegistrationShareButton from "../components/RegistrationShareButton";

import PublicRegisteredRacerCard from "../components/PublicRegisteredRacerCard";

import {
  getPublicRegistrationEntries,
  getRegistrationEventBySlug,
} from "../services/registrationService";

import type {
  PublicRegisteredRacer,
  RegistrationClassSelection,
  RegistrationEvent,
} from "../types/registration.types";

type PublicRegisteredRacersPageProps = {
  eventSlug: string;
};

function groupPublicEntries(
  entries: Awaited<ReturnType<typeof getPublicRegistrationEntries>>["items"],
): PublicRegisteredRacer[] {
  const grouped = new Map<string, PublicRegisteredRacer>();

  for (const entry of entries) {
    const selection: RegistrationClassSelection = {
      classId: entry.classEntry.eventClassId,

      className: entry.classEntry.className,

      selectedEventDayIds: entry.classEntry.selectedDays.map((day) => day.id),

      selectedEventDays: entry.classEntry.selectedDays.map((day, index) => ({
        id: day.id,

        key: day.key,

        label: day.label,

        date: day.date,

        startsAt: null,

        endsAt: null,

        isRegistrationEnabled: true,

        displayOrder: index,
      })),

      estimatedPriceCents: 0,
    };

    const existing = grouped.get(entry.registrationId);

    if (existing) {
      existing.selectedClasses.push(selection);

      continue;
    }

    grouped.set(entry.registrationId, {
      registrationId: entry.registrationId,

      racer: {
        id: entry.racer.id,

        name: entry.racer.name,

        nickname: entry.racer.nickname,

        imageUrl: entry.racer.imageUrl,

        formattedLocation: entry.racer.formattedLocation,

        city: entry.racer.city,

        stateCode: entry.racer.stateCode,

        countryCode: entry.racer.countryCode,

        teamName: entry.racer.teamName,
      },

      selectedClasses: [selection],

      status: entry.registrationStatus,

      registeredAt: entry.registeredAt,
    });
  }

  return [...grouped.values()];
}

export default function PublicRegisteredRacersPage({
  eventSlug,
}: PublicRegisteredRacersPageProps) {
  const [, navigate] = useLocation();

  const [event, setEvent] = useState<RegistrationEvent | null>(null);

  const [registrations, setRegistrations] = useState<PublicRegisteredRacer[]>(
    [],
  );

  const [query, setQuery] = useState("");

  const [classId, setClassId] = useState("all");

  /**
   * This is now an actual event-day UUID rather than
   * "saturday" / "sunday".
   */
  const [dayId, setDayId] = useState("all");

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadPage() {
      try {
        setLoading(true);
        setError(null);

        const [eventResult, entriesResult] = await Promise.all([
          getRegistrationEventBySlug(eventSlug),

          getPublicRegistrationEntries(eventSlug, {
            page: 1,
            limit: 100,
          }),
        ]);

        if (cancelled) {
          return;
        }

        setEvent(eventResult);

        setRegistrations(groupPublicEntries(entriesResult.items));
      } catch (loadError: any) {
        if (!cancelled) {
          setError(
            loadError?.message || "Unable to load the public entry list.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadPage();

    return () => {
      cancelled = true;
    };
  }, [eventSlug]);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return registrations.filter((registration) => {
      const matchesSearch =
        !normalizedQuery ||
        [
          registration.racer.name,

          registration.racer.nickname,

          registration.racer.raceNumber,

          registration.racer.teamName,

          registration.racer.formattedLocation,
        ].some((value) =>
          String(value ?? "")
            .toLowerCase()
            .includes(normalizedQuery),
        );

      const matchesClass =
        classId === "all" ||
        registration.selectedClasses.some(
          (selection) => selection.classId === classId,
        );

      const matchesDay =
        dayId === "all" ||
        registration.selectedClasses.some((selection) =>
          selection.selectedEventDayIds.includes(dayId),
        );

      return matchesSearch && matchesClass && matchesDay;
    });
  }, [registrations, query, classId, dayId]);

  const groupedByClass = useMemo(() => {
    if (!event) {
      return [];
    }

    return [...event.classes]
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((eventClass) => ({
        eventClass,

        registrations: filtered.filter((registration) =>
          registration.selectedClasses.some(
            (selection) => selection.classId === eventClass.id,
          ),
        ),
      }))
      .filter((group) => group.registrations.length > 0);
  }, [event, filtered]);

  const enabledEventDays = useMemo(
    () =>
      event
        ? [...event.eventDays]
            .filter((day) => day.isRegistrationEnabled)
            .sort((a, b) => a.displayOrder - b.displayOrder)
        : [],
    [event],
  );

  if (loading) {
    return (
      <RegistrationLayout hideHeader>
        <div className="grid min-h-[70vh] place-items-center">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-200" />
        </div>
      </RegistrationLayout>
    );
  }

  if (error || !event) {
    return (
      <RegistrationLayout
        title="Entry list unavailable"
        description={
          error ||
          "The requested event and its public entry list could not be loaded."
        }
        backHref="/registration/events"
        backLabel="All Events"
      >
        <div className="rounded-[28px] border border-red-300/15 bg-red-950/20 p-8 text-center">
          <p className="text-sm leading-6 text-red-100/70">
            Return to the event directory and select another race event.
          </p>

          <button
            type="button"
            onClick={() => navigate("/registration/events")}
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-cyan-300 px-5 text-[10px] font-black uppercase tracking-[0.14em] text-[#06111d] transition hover:bg-cyan-200"
          >
            Browse Events
          </button>
        </div>
      </RegistrationLayout>
    );
  }

  const registrationOpen = event.registrationStatus === "open";

  return (
    <RegistrationLayout
      eyebrow="Public Entry List"
      title={`${event.name} Racers`}
      description="Browse confirmed racers publicly entered in each class for this event."
      backHref={`/registration/events/${event.slug}`}
      backLabel="Back to Event"
      actions={
        <>
          <RegistrationShareButton
            eventName={event.name}
            eventSlug={event.slug}
            startDate={event.startDate}
            endDate={event.endDate}
          />

          <button
            type="button"
            disabled={!registrationOpen}
            onClick={() =>
              navigate(`/registration/events/${event.slug}/register`)
            }
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#FF6B35] px-5 text-[10px] font-black uppercase tracking-[0.14em] text-white transition hover:bg-[#ff7c4d] disabled:cursor-not-allowed disabled:bg-white/15 disabled:text-white/35"
          >
            Register Now
            <ArrowRight className="h-4 w-4" />
          </button>
        </>
      }
    >
      <div className="space-y-5">
        <section className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-[22px] border border-cyan-300/10 bg-[#07111F]/78 p-4">
            <Users className="h-5 w-5 text-cyan-200" />

            <p className="mt-3 text-2xl font-black text-white">
              {registrations.length}
            </p>

            <p className="mt-1 text-[9px] font-black uppercase tracking-[0.13em] text-white/35">
              Confirmed Racers
            </p>
          </div>

          <div className="rounded-[22px] border border-cyan-300/10 bg-[#07111F]/78 p-4">
            <Flag className="h-5 w-5 text-[#FFB199]" />

            <p className="mt-3 text-2xl font-black text-white">
              {groupedByClass.length}
            </p>

            <p className="mt-1 text-[9px] font-black uppercase tracking-[0.13em] text-white/35">
              Active Classes
            </p>
          </div>

          <div className="rounded-[22px] border border-cyan-300/10 bg-[#07111F]/78 p-4">
            <CalendarDays className="h-5 w-5 text-cyan-200" />

            <p className="mt-3 text-2xl font-black text-white">
              {enabledEventDays.length}
            </p>

            <p className="mt-1 text-[9px] font-black uppercase tracking-[0.13em] text-white/35">
              Event Days
            </p>
          </div>
        </section>

        <section className="rounded-[26px] border border-cyan-300/10 bg-[#07111F]/82 p-4 sm:p-5">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto]">
            <label className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />

              <input
                value={query}
                onChange={(inputEvent) => setQuery(inputEvent.target.value)}
                placeholder="Search racer, number, team, or location..."
                className="h-12 w-full rounded-[16px] border border-white/10 bg-white/[0.045] pl-11 pr-10 text-sm text-white outline-none placeholder:text-white/30 focus:border-cyan-300/30"
              />

              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Clear racer search"
                  className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-white/35 hover:bg-white/10 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </label>

            <select
              value={classId}
              onChange={(selectEvent) => setClassId(selectEvent.target.value)}
              className="h-12 rounded-[16px] border border-white/10 bg-[#0A1422] px-4 text-sm text-white outline-none focus:border-cyan-300/30"
            >
              <option value="all">All Classes</option>

              {[...event.classes]
                .sort((a, b) => a.displayOrder - b.displayOrder)
                .map((eventClass) => (
                  <option key={eventClass.id} value={eventClass.id}>
                    {eventClass.name}
                  </option>
                ))}
            </select>

            <select
              value={dayId}
              onChange={(selectEvent) => setDayId(selectEvent.target.value)}
              className="h-12 rounded-[16px] border border-white/10 bg-[#0A1422] px-4 text-sm text-white outline-none focus:border-cyan-300/30"
            >
              <option value="all">All Days</option>

              {enabledEventDays.map((day) => (
                <option key={day.id} value={day.id}>
                  {day.label}
                </option>
              ))}
            </select>
          </div>
        </section>

        {groupedByClass.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-white/10 bg-[#07111F]/65 px-5 py-14 text-center">
            <Users className="mx-auto h-8 w-8 text-white/20" />

            <h2 className="mt-4 text-xl font-black uppercase text-white">
              No racers found
            </h2>

            <p className="mt-2 text-sm text-white/40">
              Try changing the racer search, class, or event day filter.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {groupedByClass.map((group) => (
              <section key={group.eventClass.id}>
                <div className="mb-4 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.15em] text-cyan-200/55">
                      Race Class
                    </p>

                    <h2 className="mt-2 text-2xl font-black uppercase text-white">
                      {group.eventClass.name}
                    </h2>
                  </div>

                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-[9px] font-black uppercase tracking-[0.12em] text-white/55">
                    {group.registrations.length} Racer
                    {group.registrations.length === 1 ? "" : "s"}
                  </span>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  {group.registrations.map((registration) => (
                    <PublicRegisteredRacerCard
                      key={`${group.eventClass.id}-${registration.registrationId}`}
                      registration={{
                        ...registration,

                        selectedClasses: registration.selectedClasses.filter(
                          (selection) =>
                            selection.classId === group.eventClass.id,
                        ),
                      }}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </RegistrationLayout>
  );
}
