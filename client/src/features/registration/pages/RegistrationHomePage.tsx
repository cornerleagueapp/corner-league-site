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

import { getRegistrationEvents } from "../services/registrationService";

import type { RegistrationEvent } from "../types/registration.types";

export default function RegistrationHomePage() {
  const [, navigate] = useLocation();

  const [events, setEvents] = useState<RegistrationEvent[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadRegistrationHome() {
      try {
        setLoading(true);
        setError(null);

        const response = await getRegistrationEvents({
          page: 1,
          limit: 100,
        });

        if (cancelled) {
          return;
        }

        setEvents(response.items);
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
    (total, event) => total + Number(event.confirmedRacerCount || 0),
    0,
  );

  const totalClasses = events.reduce(
    (total, event) => total + Number(event.classCount || 0),
    0,
  );

  /**
   * Public event summaries already contain organization information.
   *
   * We can calculate the organization count from the real event data instead
   * of continuing to depend on the demo organization service.
   */
  const organizationCount = useMemo(() => {
    return new Set(
      events.map((event) => event.organization?.id).filter(Boolean),
    ).size;
  }, [events]);

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
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-cl-border bg-cl-subtle px-4 py-3 text-[10px] font-black uppercase tracking-[0.14em] text-cl-muted transition hover:border-cl-accent/25 hover:bg-cl-accent/10 hover:text-cl-ink"
          >
            <Building2 className="h-4 w-4" />
            Organizations
          </button>

          <button
            type="button"
            onClick={() => navigate("/registration/events")}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-cl-accent px-4 py-3 text-[10px] font-black uppercase tracking-[0.14em] text-cl-contrast transition hover:bg-cl-accent"
          >
            <Search className="h-4 w-4" />
            Find a Race
          </button>
        </>
      }
    >
      {loading ? (
        <div className="grid min-h-[420px] place-items-center rounded-[28px] border border-cl-accent/10 bg-cl-surface">
          <div className="text-center">
            <Loader2 className="mx-auto h-7 w-7 animate-spin text-cl-accent" />

            <p className="mt-3 text-sm font-bold text-cl-muted">
              Loading race registration...
            </p>
          </div>
        </div>
      ) : error ? (
        <div className="rounded-[28px] border border-amber-300/15 bg-amber-950/10 p-6 text-center sm:p-8">
          <CalendarDays className="mx-auto h-8 w-8 text-cl-warning" />

          <h2 className="mt-4 text-xl font-black uppercase text-cl-ink">
            Registration is temporarily unavailable
          </h2>

          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-cl-muted">
            We couldn&apos;t load race registration information right now.
            Please try again shortly.
          </p>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full border border-cl-border bg-cl-subtle px-5 text-[10px] font-black uppercase tracking-[0.14em] text-cl-muted transition hover:border-cl-accent/20 hover:bg-cl-accent/10 hover:text-cl-ink"
          >
            Try Again
          </button>
        </div>
      ) : openEvents.length === 0 ? (
        <div className="rounded-[28px] border border-cl-accent/10 bg-cl-surface px-6 py-12 text-center sm:px-8 sm:py-16">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-cl-accent/[0.15] bg-cl-accent/10 text-cl-accent">
            <CalendarDays className="h-6 w-6" />
          </div>

          <div className="mt-5 text-[9px] font-black uppercase tracking-[0.18em] text-cl-accent">
            Race Registration
          </div>

          <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.035em] text-cl-ink sm:text-3xl">
            No registrations currently open
          </h2>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-cl-muted">
            There are no upcoming race events currently accepting registration.
            Check back soon as organizations publish new events.
          </p>

          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => navigate("/registration/organizations")}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-cl-border bg-cl-subtle px-5 text-[10px] font-black uppercase tracking-[0.14em] text-cl-muted transition hover:border-cl-accent/20 hover:bg-cl-accent/10 hover:text-cl-ink"
            >
              <Building2 className="h-4 w-4" />
              Browse Organizations
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <div className="rounded-[22px] border border-cl-accent/[0.15] bg-cl-canvas p-4 shadow-cl-panel sm:p-5">
              <CalendarDays className="h-5 w-5 text-cl-accent" />

              <div className="mt-4 text-2xl font-black text-cl-ink">
                {openEvents.length}
              </div>

              <div className="mt-1 text-[9px] font-black uppercase tracking-[0.14em] text-cl-muted">
                Upcoming events
              </div>
            </div>

            <div className="rounded-[22px] border border-cl-accent/[0.15] bg-cl-canvas p-4 shadow-cl-panel sm:p-5">
              <Flag className="h-5 w-5 text-cl-accent" />

              <div className="mt-4 text-2xl font-black text-cl-ink">
                {totalClasses}
              </div>

              <div className="mt-1 text-[9px] font-black uppercase tracking-[0.14em] text-cl-muted">
                Race classes
              </div>
            </div>

            <div className="rounded-[22px] border border-cl-accent/[0.15] bg-cl-canvas p-4 shadow-cl-panel sm:p-5">
              <Users className="h-5 w-5 text-cl-accent" />

              <div className="mt-4 text-2xl font-black text-cl-ink">
                {totalConfirmedRacers}
              </div>

              <div className="mt-1 text-[9px] font-black uppercase tracking-[0.14em] text-cl-muted">
                Confirmed entries
              </div>
            </div>

            <div className="rounded-[22px] border border-cl-accent/[0.15] bg-cl-canvas p-4 shadow-cl-panel sm:p-5">
              <Building2 className="h-5 w-5 text-cl-accent" />

              <div className="mt-4 text-2xl font-black text-cl-ink">
                {organizationCount}
              </div>

              <div className="mt-1 text-[9px] font-black uppercase tracking-[0.14em] text-cl-muted">
                Race organizations
              </div>
            </div>
          </section>

          {featuredEvent ? (
            <section>
              <div className="mb-4 flex items-end justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-cl-accent/20 bg-cl-accent/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-cl-accent">
                    <Trophy className="h-3.5 w-3.5" />
                    Featured registration
                  </div>

                  <h2 className="mt-3 text-2xl font-black uppercase tracking-[-0.035em] text-cl-ink sm:text-3xl">
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
              className="group relative overflow-hidden rounded-[26px] border border-cl-accent/10 bg-cl-surface p-5 text-left transition hover:-translate-y-1 hover:border-cl-accent/25"
            >
              <Search className="h-6 w-6 text-cl-accent" />

              <h3 className="mt-5 text-xl font-black uppercase text-cl-ink">
                Find a race
              </h3>

              <p className="mt-2 text-sm leading-6 text-cl-muted">
                Browse upcoming events, locations, race dates, classes, and
                registration deadlines.
              </p>

              <div className="mt-5 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-cl-accent">
                Search events
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </div>
            </button>

            <button
              type="button"
              onClick={() => navigate("/registration/organizations")}
              className="group relative overflow-hidden rounded-[26px] border border-cl-accent/10 bg-cl-surface p-5 text-left transition hover:-translate-y-1 hover:border-cl-accent/25"
            >
              <Building2 className="h-6 w-6 text-cl-accent" />

              <h3 className="mt-5 text-xl font-black uppercase text-cl-ink">
                Race organizations
              </h3>

              <p className="mt-2 text-sm leading-6 text-cl-muted">
                Discover organizations, promoters, upcoming events, and public
                entry information.
              </p>

              <div className="mt-5 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-cl-accent">
                Browse organizations
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </div>
            </button>

            <button
              type="button"
              onClick={() => navigate("/registration/racers")}
              className="group relative overflow-hidden rounded-[26px] border border-cl-accent/10 bg-cl-surface p-5 text-left transition hover:-translate-y-1 hover:border-cl-accent/25"
            >
              <ShieldCheck className="h-6 w-6 text-cl-accent" />

              <h3 className="mt-5 text-xl font-black uppercase text-cl-ink">
                Confirmed racers
              </h3>

              <p className="mt-2 text-sm leading-6 text-cl-muted">
                See which racers have confirmed entries and the classes they are
                competing in.
              </p>

              <div className="mt-5 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-cl-accent">
                View racer lists
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </div>
            </button>
          </section>

          {secondaryEvents.length > 0 ? (
            <section>
              <div className="mb-4 flex items-end justify-between gap-4">
                <div>
                  <div className="text-[9px] font-black uppercase tracking-[0.18em] text-cl-accent">
                    Upcoming schedule
                  </div>

                  <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.035em] text-cl-ink">
                    More race events
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => navigate("/registration/events")}
                  className="hidden items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-cl-accent sm:inline-flex"
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
