import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  Flag,
  Loader2,
  MapPin,
  ShieldCheck,
  Users,
  WalletCards,
} from "lucide-react";
import RegistrationLayout from "../components/RegistrationLayout";
import RegistrationClassCard from "../components/RegistrationClassCard";
import RegistrationShareButton from "../components/RegistrationShareButton";
import {
  getPublicRegisteredRacers,
  getRegistrationEventBySlug,
} from "../services/registrationDemoService";
import type {
  PublicRegisteredRacer,
  RegistrationEvent,
} from "../types/registration.types";
import EventRegistrationProgress from "../components/EventRegistrationProgress";
import RecentRegistrations from "../components/RecentRegistrations";

type RegistrationEventPageProps = {
  eventSlug: string;
};

function formatDateRange(startDate: string, endDate: string) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  return `${start.toLocaleDateString(undefined, {
    weekday: "short",
    month: "long",
    day: "numeric",
    year: "numeric",
  })} – ${end.toLocaleDateString(undefined, {
    weekday: "short",
    month: "long",
    day: "numeric",
    year: "numeric",
  })}`;
}

function formatDeadline(date: string) {
  return new Date(date).toLocaleString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export default function RegistrationEventPage({
  eventSlug,
}: RegistrationEventPageProps) {
  const [, navigate] = useLocation();

  const [event, setEvent] = useState<RegistrationEvent | null>(null);
  const [racers, setRacers] = useState<PublicRegisteredRacer[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadEvent() {
      try {
        setLoading(true);
        setError(null);

        const eventData = await getRegistrationEventBySlug(eventSlug);

        if (!eventData) {
          throw new Error("This race event could not be found.");
        }

        const racerData = await getPublicRegisteredRacers(eventData.id);

        if (cancelled) {
          return;
        }

        setEvent(eventData);
        setRacers(racerData);
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || "Unable to load race registration.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadEvent();

    return () => {
      cancelled = true;
    };
  }, [eventSlug]);

  const visibleRacers = useMemo(() => racers.slice(0, 6), [racers]);

  if (loading) {
    return (
      <RegistrationLayout hideHeader>
        <div className="grid min-h-[70vh] place-items-center rounded-[28px] border border-cyan-300/10 bg-[#07111F]/75">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-cyan-200" />

            <p className="mt-3 text-sm font-bold text-white/50">
              Loading race event...
            </p>
          </div>
        </div>
      </RegistrationLayout>
    );
  }

  if (error || !event) {
    return (
      <RegistrationLayout
        eyebrow="Race Registration"
        title="Event unavailable"
        description={
          error || "The requested race registration could not be found."
        }
        backHref="/registration/events"
        backLabel="All Events"
      >
        <div className="rounded-[28px] border border-red-300/15 bg-red-950/20 p-8 text-center">
          <button
            type="button"
            onClick={() => navigate("/registration/events")}
            className="rounded-full bg-cyan-300 px-5 py-3 text-[10px] font-black uppercase tracking-[0.14em] text-[#06111d]"
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
      eyebrow={event.organizationAbbreviation || "Race Event"}
      title={event.name}
      description={event.description}
      backHref="/registration/events"
      backLabel="All Events"
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
            disabled={!registrationOpen}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#FF6B35] px-5 py-3 text-[10px] font-black uppercase tracking-[0.14em] text-white shadow-[0_0_26px_rgba(255,107,53,0.2)] transition hover:bg-[#ff7c4d] disabled:cursor-not-allowed disabled:bg-white/15 disabled:text-white/35"
          >
            Register Now
            <ArrowRight className="h-4 w-4" />
          </button>
        </>
      }
    >
      <div className="space-y-6">
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[22px] border border-cyan-300/10 bg-[#07111F]/78 p-4">
            <CalendarDays className="h-5 w-5 text-cyan-200" />
            <p className="mt-3 text-xs font-black uppercase tracking-[0.12em] text-white/35">
              Race dates
            </p>
            <p className="mt-2 text-sm font-bold leading-6 text-white">
              {formatDateRange(event.startDate, event.endDate)}
            </p>
          </div>

          <div className="rounded-[22px] border border-cyan-300/10 bg-[#07111F]/78 p-4">
            <MapPin className="h-5 w-5 text-[#FFB199]" />
            <p className="mt-3 text-xs font-black uppercase tracking-[0.12em] text-white/35">
              Location
            </p>
            <p className="mt-2 text-sm font-bold leading-6 text-white">
              {event.formattedLocation}
            </p>
          </div>

          <div className="rounded-[22px] border border-cyan-300/10 bg-[#07111F]/78 p-4">
            <Clock3 className="h-5 w-5 text-cyan-200" />
            <p className="mt-3 text-xs font-black uppercase tracking-[0.12em] text-white/35">
              Registration closes
            </p>
            <p className="mt-2 text-sm font-bold leading-6 text-white">
              {formatDeadline(event.registrationCloseDate)}
            </p>
          </div>

          <div className="rounded-[22px] border border-cyan-300/10 bg-[#07111F]/78 p-4">
            <Users className="h-5 w-5 text-[#FFB199]" />
            <p className="mt-3 text-xs font-black uppercase tracking-[0.12em] text-white/35">
              Confirmed racers
            </p>
            <p className="mt-2 text-2xl font-black text-white">
              {racers.length}
            </p>
          </div>
        </section>

        <EventRegistrationProgress event={event} registrations={racers} />

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_330px]">
          <div className="min-w-0 space-y-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-300/8 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-cyan-200">
                <Flag className="h-3.5 w-3.5" />
                Available classes
              </div>

              <h2 className="mt-3 text-2xl font-black uppercase tracking-[-0.035em] text-white">
                Choose your competition
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                Final class selection and race-day choices will be completed
                during registration.
              </p>
            </div>

            <div className="grid gap-3">
              {[...event.classes]
                .sort((a, b) => a.displayOrder - b.displayOrder)
                .map((eventClass) => (
                  <RegistrationClassCard
                    key={eventClass.id}
                    eventClass={eventClass}
                  />
                ))}
            </div>
          </div>

          <aside className="space-y-4">
            <RecentRegistrations registrations={racers} />
            <div className="rounded-[26px] border border-cyan-300/15 bg-[#07111F]/92 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl border border-cyan-300/15 bg-cyan-300/10 text-cyan-200">
                  <CreditCard className="h-5 w-5" />
                </div>

                <div>
                  <h3 className="font-black uppercase text-white">
                    Registration payment
                  </h3>
                  <p className="text-xs text-white/40">Demo payment options</p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {event.allowOnlinePayment ? (
                  <div className="flex items-start gap-3 rounded-[18px] border border-white/10 bg-white/[0.035] p-3">
                    <WalletCards className="mt-0.5 h-4 w-4 shrink-0 text-cyan-200" />
                    <div>
                      <p className="text-sm font-bold text-white">
                        Online card payment
                      </p>
                      <p className="mt-1 text-xs leading-5 text-white/45">
                        Secure payment will be connected to Square during the
                        production integration.
                      </p>
                    </div>
                  </div>
                ) : null}

                {event.allowCashPayment ? (
                  <div className="flex items-start gap-3 rounded-[18px] border border-white/10 bg-white/[0.035] p-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#FFB199]" />
                    <div>
                      <p className="text-sm font-bold text-white">
                        Pay cash in person
                      </p>
                      <p className="mt-1 text-xs leading-5 text-white/45">
                        Cash entries remain pending until confirmed by the
                        organization.
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="mt-5 border-t border-white/10 pt-5">
                <div className="flex justify-between text-sm text-white/55">
                  <span>Corner League fee</span>
                  <span>{formatCurrency(event.platformFee)}</span>
                </div>

                <div className="mt-2 flex justify-between text-sm text-white/55">
                  <span>Demo processing fee</span>
                  <span>{formatCurrency(event.processingFee)}</span>
                </div>
              </div>

              <button
                type="button"
                disabled={!registrationOpen}
                onClick={() =>
                  navigate(`/registration/events/${event.slug}/register`)
                }
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-[#FF6B35] px-5 py-3.5 text-[10px] font-black uppercase tracking-[0.15em] text-white transition hover:bg-[#ff7c4d] disabled:cursor-not-allowed disabled:bg-white/15 disabled:text-white/35"
              >
                {registrationOpen
                  ? "Begin Registration"
                  : "Registration Not Open"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            <div className="rounded-[26px] border border-cyan-300/10 bg-[#07111F]/78 p-5">
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-cyan-200" />

                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.14em] text-white/35">
                    Hosted by
                  </p>
                  <p className="mt-1 text-sm font-black text-white">
                    {event.organizationName}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[26px] border border-cyan-300/10 bg-[#07111F]/78 p-5">
              <ShieldCheck className="h-5 w-5 text-[#FFB199]" />

              <h3 className="mt-3 text-sm font-black uppercase text-white">
                Refund and transfer policy
              </h3>

              <p className="mt-2 text-xs leading-6 text-white/45">
                {event.refundPolicy ||
                  "Refund and class-transfer terms are controlled by the race organization."}
              </p>
            </div>
          </aside>
        </section>

        <section className="rounded-[28px] border border-cyan-300/10 bg-[#07111F]/78 p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-[9px] font-black uppercase tracking-[0.16em] text-cyan-200/55">
                Public entry list
              </div>

              <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.035em] text-white">
                Confirmed racers
              </h2>

              <p className="mt-2 text-sm text-white/45">
                Only confirmed entries are publicly displayed.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                navigate(`/registration/events/${event.slug}/racers`)
              }
              className="inline-flex items-center gap-2 self-start rounded-full border border-white/10 bg-white/[0.05] px-4 py-3 text-[9px] font-black uppercase tracking-[0.13em] text-white/70 transition hover:border-cyan-300/25 hover:bg-cyan-300/10 hover:text-white"
            >
              View Full Entry List
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {visibleRacers.length === 0 ? (
            <div className="mt-5 rounded-[22px] border border-dashed border-white/10 bg-black/15 px-5 py-10 text-center">
              <Users className="mx-auto h-7 w-7 text-white/20" />
              <p className="mt-3 text-sm text-white/45">
                No confirmed registrations have been published yet.
              </p>
            </div>
          ) : (
            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {visibleRacers.map((registration) => (
                <div
                  key={registration.registrationId}
                  className="rounded-[20px] border border-white/10 bg-white/[0.035] p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-cyan-300/15 bg-cyan-300/10 text-sm font-black text-cyan-200">
                      {registration.racer.name
                        .split(" ")
                        .map((part) => part[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-black uppercase text-white">
                        {registration.racer.name}
                      </p>

                      <p className="mt-1 truncate text-xs text-white/40">
                        {registration.racer.formattedLocation ||
                          "Location not listed"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {registration.selectedClasses.map((selection) => (
                      <span
                        key={selection.classId}
                        className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.1em] text-white/60"
                      >
                        {selection.className}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </RegistrationLayout>
  );
}
