import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  Flag,
  Loader2,
  Search,
  ShieldCheck,
  Trophy,
  Users,
} from "lucide-react";
import RegistrationLayout from "../components/RegistrationLayout";
import RegistrationEventCard from "../components/RegistrationEventCard";
import {
  getRegistrationEvents,
  getRegistrationOrganizations,
} from "../services/registrationDemoService";
import type {
  RegistrationEvent,
  RegistrationOrganization,
} from "../types/registration.types";

export default function RegistrationHomePage() {
  const [, navigate] = useLocation();

  const [events, setEvents] = useState<RegistrationEvent[]>([]);
  const [organizations, setOrganizations] = useState<
    RegistrationOrganization[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadRegistrationHome() {
      try {
        setLoading(true);
        setError(null);

        const [eventData, organizationData] = await Promise.all([
          getRegistrationEvents(),
          getRegistrationOrganizations(),
        ]);

        if (cancelled) {
          return;
        }

        setEvents(eventData);
        setOrganizations(organizationData);
      } catch (err: any) {
        if (!cancelled) {
          setError(
            err?.message || "Unable to load Corner League registration.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadRegistrationHome();

    return () => {
      cancelled = true;
    };
  }, []);

  const openEvents = useMemo(
    () =>
      events.filter(
        (event) =>
          event.registrationStatus === "open" ||
          event.registrationStatus === "upcoming",
      ),
    [events],
  );

  const featuredEvent =
    openEvents.find((event) => event.registrationStatus === "open") ??
    openEvents[0] ??
    null;

  const secondaryEvents = openEvents
    .filter((event) => event.id !== featuredEvent?.id)
    .slice(0, 3);

  const totalConfirmedRacers = events.reduce(
    (total, event) => total + event.confirmedRacerCount,
    0,
  );

  const totalClasses = events.reduce(
    (total, event) => total + event.classes.length,
    0,
  );

  return (
    <RegistrationLayout
      eyebrow="Race Registration"
      title="Find your next starting line"
      description="Browse upcoming events, view available race classes, register through Corner League, and see who is confirmed to compete."
      actions={
        <>
          <button
            type="button"
            onClick={() => navigate("/registration/organizations")}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-3 text-[10px] font-black uppercase tracking-[0.14em] text-white/75 transition hover:border-cyan-300/25 hover:bg-cyan-300/10 hover:text-white"
          >
            <Building2 className="h-4 w-4" />
            Organizations
          </button>

          <button
            type="button"
            onClick={() => navigate("/registration/events")}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-cyan-300 px-4 py-3 text-[10px] font-black uppercase tracking-[0.14em] text-[#06111d] transition hover:bg-cyan-200"
          >
            <Search className="h-4 w-4" />
            Find a Race
          </button>
        </>
      }
    >
      {loading ? (
        <div className="grid min-h-[420px] place-items-center rounded-[28px] border border-cyan-300/10 bg-[#07111F]/75">
          <div className="text-center">
            <Loader2 className="mx-auto h-7 w-7 animate-spin text-cyan-200" />

            <p className="mt-3 text-sm font-bold text-white/55">
              Loading race registration...
            </p>
          </div>
        </div>
      ) : error ? (
        <div className="rounded-[28px] border border-red-300/15 bg-red-950/20 p-6 text-center">
          <h2 className="text-xl font-black uppercase text-white">
            Registration unavailable
          </h2>

          <p className="mt-2 text-sm text-red-100/70">{error}</p>
        </div>
      ) : (
        <div className="space-y-6">
          <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <div className="rounded-[22px] border border-cyan-300/10 bg-[#07111F]/78 p-4 sm:p-5">
              <CalendarDays className="h-5 w-5 text-cyan-200" />

              <div className="mt-4 text-2xl font-black text-white">
                {openEvents.length}
              </div>

              <div className="mt-1 text-[9px] font-black uppercase tracking-[0.14em] text-white/40">
                Upcoming events
              </div>
            </div>

            <div className="rounded-[22px] border border-cyan-300/10 bg-[#07111F]/78 p-4 sm:p-5">
              <Flag className="h-5 w-5 text-[#FFB199]" />

              <div className="mt-4 text-2xl font-black text-white">
                {totalClasses}
              </div>

              <div className="mt-1 text-[9px] font-black uppercase tracking-[0.14em] text-white/40">
                Race classes
              </div>
            </div>

            <div className="rounded-[22px] border border-cyan-300/10 bg-[#07111F]/78 p-4 sm:p-5">
              <Users className="h-5 w-5 text-cyan-200" />

              <div className="mt-4 text-2xl font-black text-white">
                {totalConfirmedRacers}
              </div>

              <div className="mt-1 text-[9px] font-black uppercase tracking-[0.14em] text-white/40">
                Confirmed entries
              </div>
            </div>

            <div className="rounded-[22px] border border-cyan-300/10 bg-[#07111F]/78 p-4 sm:p-5">
              <Building2 className="h-5 w-5 text-[#FFB199]" />

              <div className="mt-4 text-2xl font-black text-white">
                {organizations.length}
              </div>

              <div className="mt-1 text-[9px] font-black uppercase tracking-[0.14em] text-white/40">
                Race organizations
              </div>
            </div>
          </section>

          {featuredEvent ? (
            <section>
              <div className="mb-4 flex items-end justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-[#FF6B35]/20 bg-[#FF6B35]/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-[#FFB199]">
                    <Trophy className="h-3.5 w-3.5" />
                    Featured registration
                  </div>

                  <h2 className="mt-3 text-2xl font-black uppercase tracking-[-0.035em] text-white sm:text-3xl">
                    Registration is open
                  </h2>
                </div>
              </div>

              <RegistrationEventCard event={featuredEvent} featured />
            </section>
          ) : null}

          <section className="grid gap-4 lg:grid-cols-3">
            <button
              type="button"
              onClick={() => navigate("/registration/events")}
              className="group relative overflow-hidden rounded-[26px] border border-cyan-300/10 bg-[#07111F]/82 p-5 text-left transition hover:-translate-y-1 hover:border-cyan-300/25"
            >
              <Search className="h-6 w-6 text-cyan-200" />

              <h3 className="mt-5 text-xl font-black uppercase text-white">
                Find a race
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                Browse upcoming events, locations, race dates, classes, and
                registration deadlines.
              </p>

              <div className="mt-5 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-cyan-200">
                Search events
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </div>
            </button>

            <button
              type="button"
              onClick={() => navigate("/registration/organizations")}
              className="group relative overflow-hidden rounded-[26px] border border-cyan-300/10 bg-[#07111F]/82 p-5 text-left transition hover:-translate-y-1 hover:border-cyan-300/25"
            >
              <Building2 className="h-6 w-6 text-[#FFB199]" />

              <h3 className="mt-5 text-xl font-black uppercase text-white">
                Race organizations
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                Discover organizations, promoters, upcoming events, and public
                entry information.
              </p>

              <div className="mt-5 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-cyan-200">
                Browse organizations
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </div>
            </button>

            <button
              type="button"
              onClick={() => navigate("/registration/racers")}
              className="group relative overflow-hidden rounded-[26px] border border-cyan-300/10 bg-[#07111F]/82 p-5 text-left transition hover:-translate-y-1 hover:border-cyan-300/25"
            >
              <ShieldCheck className="h-6 w-6 text-cyan-200" />

              <h3 className="mt-5 text-xl font-black uppercase text-white">
                Confirmed racers
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                See which racers have confirmed entries and the classes they are
                competing in.
              </p>

              <div className="mt-5 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-cyan-200">
                View racer lists
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </div>
            </button>
          </section>

          {secondaryEvents.length > 0 ? (
            <section>
              <div className="mb-4 flex items-end justify-between gap-4">
                <div>
                  <div className="text-[9px] font-black uppercase tracking-[0.18em] text-cyan-200/60">
                    Upcoming schedule
                  </div>

                  <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.035em] text-white">
                    More race events
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => navigate("/registration/events")}
                  className="hidden items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-cyan-200 sm:inline-flex"
                >
                  View all
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                {secondaryEvents.map((event) => (
                  <RegistrationEventCard key={event.id} event={event} />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )}
    </RegistrationLayout>
  );
}
