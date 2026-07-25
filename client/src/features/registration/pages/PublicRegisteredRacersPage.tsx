import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import {
  ArrowRight,
  CalendarDays,
  Flag,
  Loader2,
  Search,
  Users,
  X,
} from "lucide-react";
import RegistrationLayout from "../components/RegistrationLayout";
import RegistrationShareButton from "../components/RegistrationShareButton";
import PublicRegisteredRacerCard from "../components/PublicRegisteredRacerCard";
import {
  getPublicRegisteredRacers,
  getRegistrationEventBySlug,
} from "../services/registrationDemoService";
import type {
  PublicRegisteredRacer,
  RegistrationEvent,
  RegistrationRaceDay,
} from "../types/registration.types";

type PublicRegisteredRacersPageProps = {
  eventSlug: string;
};

type DayFilter = "all" | RegistrationRaceDay;

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
  const [day, setDay] = useState<DayFilter>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadPage() {
      try {
        const eventResult = await getRegistrationEventBySlug(eventSlug);

        if (!eventResult) {
          return;
        }

        const registrationsResult = await getPublicRegisteredRacers(
          eventResult.id,
        );

        if (!cancelled) {
          setEvent(eventResult);
          setRegistrations(registrationsResult);
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
        day === "all" ||
        registration.selectedClasses.some((selection) =>
          selection.raceDays.includes(day),
        );

      return matchesSearch && matchesClass && matchesDay;
    });
  }, [registrations, query, classId, day]);

  const groupedByClass = useMemo(() => {
    if (!event) {
      return [];
    }

    return event.classes
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

  if (loading) {
    return (
      <RegistrationLayout hideHeader>
        <div className="grid min-h-[70vh] place-items-center">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-200" />
        </div>
      </RegistrationLayout>
    );
  }

  if (!event) {
    return (
      <RegistrationLayout
        title="Entry list unavailable"
        description="The requested event and its public entry list could not be loaded."
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
            onClick={() =>
              navigate(`/registration/events/${event.slug}/register`)
            }
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#FF6B35] px-5 text-[10px] font-black uppercase tracking-[0.14em] text-white transition hover:bg-[#ff7c4d]"
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
            <p className="mt-3 text-2xl font-black text-white">2</p>
            <p className="mt-1 text-[9px] font-black uppercase tracking-[0.13em] text-white/35">
              Race Days
            </p>
          </div>
        </section>

        <section className="rounded-[26px] border border-cyan-300/10 bg-[#07111F]/82 p-4 sm:p-5">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto]">
            <label className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />

              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search racer, number, team, or location..."
                className="h-12 w-full rounded-[16px] border border-white/10 bg-white/[0.045] pl-11 pr-10 text-sm text-white outline-none placeholder:text-white/30 focus:border-cyan-300/30"
              />

              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-white/35 hover:bg-white/10 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </label>

            <select
              value={classId}
              onChange={(event) => setClassId(event.target.value)}
              className="h-12 rounded-[16px] border border-white/10 bg-[#0A1422] px-4 text-sm text-white outline-none focus:border-cyan-300/30"
            >
              <option value="all">All Classes</option>

              {event.classes.map((eventClass) => (
                <option key={eventClass.id} value={eventClass.id}>
                  {eventClass.name}
                </option>
              ))}
            </select>

            <select
              value={day}
              onChange={(event) => setDay(event.target.value as DayFilter)}
              className="h-12 rounded-[16px] border border-white/10 bg-[#0A1422] px-4 text-sm text-white outline-none focus:border-cyan-300/30"
            >
              <option value="all">All Days</option>
              <option value="saturday">Saturday</option>
              <option value="sunday">Sunday</option>
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
              Try changing the racer search, class, or day filter.
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
