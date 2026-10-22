import { trackGrowth } from "@/lib/growthAnalytics";
import { eventLivestreamUrl } from "@/lib/eventLivestream";
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
import EventRegistrationProgress from "../components/EventRegistrationProgress";
import RecentRegistrations from "../components/RecentRegistrations";
import {
  getPublicRegistrationEntries,
  getRegistrationEventBySlug,
} from "../services/registrationService";
import type {
  PublicRegisteredRacer,
  RegistrationClassSelection,
  RegistrationEvent,
} from "../types/registration.types";

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

function formatDeadline(date?: string | null) {
  if (!date) {
    return "No scheduled deadline";
  }

  return new Date(date).toLocaleString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
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
    if (event?.id) trackGrowth("Event Viewed", event.id);
  }, [event?.id]);

  useEffect(() => {
    let cancelled = false;

    async function loadEvent() {
      try {
        setLoading(true);
        setError(null);

        const [eventData, entriesResponse] = await Promise.all([
          getRegistrationEventBySlug(eventSlug),

          getPublicRegistrationEntries(eventSlug, {
            page: 1,
            limit: 100,
          }),
        ]);

        if (cancelled) {
          return;
        }

        /**
         * Public entries come from the backend one class-entry at a time.
         *
         * The existing frontend cards expect one racer registration with
         * multiple selected classes, so group entries by registration ID.
         */
        const grouped = new Map<string, PublicRegisteredRacer>();

        for (const entry of entriesResponse.items) {
          const selection: RegistrationClassSelection = {
            classId: entry.classEntry.eventClassId,

            className: entry.classEntry.className,

            selectedEventDayIds: entry.classEntry.selectedDays.map(
              (day) => day.id,
            ),

            selectedEventDays: entry.classEntry.selectedDays.map(
              (day, index) => ({
                id: day.id,
                key: day.key,
                label: day.label,
                date: day.date,

                startsAt: null,

                endsAt: null,

                isRegistrationEnabled: true,

                displayOrder: index,
              }),
            ),

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

        setEvent(eventData);

        setRacers([...grouped.values()]);
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
        <div className="grid min-h-[70vh] place-items-center rounded-[28px] border border-cl-accent/10 bg-cl-surface">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-cl-accent" />

            <p className="mt-3 text-sm font-bold text-cl-muted">
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
            className="rounded-full bg-cl-accent px-5 py-3 text-[10px] font-black uppercase tracking-[0.14em] text-cl-contrast"
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
      eyebrow={
        event.organization?.abbreviation ||
        event.organization?.name ||
        "Race Event"
      }
      title={event.name}
      description={event.description}
      backHref="/registration/events"
      backLabel="All Events"
      actions={
        <>
          {eventLivestreamUrl(event.livestreamUrl) && (
            <a
              href={eventLivestreamUrl(event.livestreamUrl)!}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-cl-accent px-5 py-3 text-sm font-black text-cl-contrast"
            >
              Watch stream ↗
            </a>
          )}
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
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-cl-accent px-5 py-3 text-[10px] font-black uppercase tracking-[0.14em] text-cl-contrast shadow-cl-panel transition hover:bg-cl-accent disabled:cursor-not-allowed disabled:bg-cl-subtle disabled:text-cl-muted"
          >
            Register Now
            <ArrowRight className="h-4 w-4" />
          </button>
        </>
      }
    >
      <div className="space-y-6">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[22px] border border-cl-accent/[0.14] bg-cl-canvas p-5 shadow-cl-panel">
            <div className="grid h-10 w-10 place-items-center rounded-2xl border border-cl-accent/[0.15] bg-cl-canvas">
              <CalendarDays className="h-5 w-5 text-cl-accent" />
            </div>

            <p className="mt-4 text-xs font-black uppercase tracking-[0.12em] text-cl-muted">
              Race dates
            </p>

            <p className="mt-2 text-sm font-bold leading-6 text-cl-ink">
              {formatDateRange(event.startDate, event.endDate)}
            </p>
          </div>

          <div className="rounded-[22px] border border-cl-accent/[0.15] bg-cl-canvas p-5 shadow-cl-panel">
            <div className="grid h-10 w-10 place-items-center rounded-2xl border border-cl-accent/[0.15] bg-cl-canvas">
              <MapPin className="h-5 w-5 text-cl-accent" />
            </div>

            <p className="mt-4 text-xs font-black uppercase tracking-[0.12em] text-cl-muted">
              Location
            </p>

            <p className="mt-2 text-sm font-bold leading-6 text-cl-ink">
              {event.formattedLocation || "Location to be announced"}
            </p>
          </div>

          <div className="rounded-[22px] border border-cl-accent/[0.14] bg-cl-canvas p-5 shadow-cl-panel">
            <div className="grid h-10 w-10 place-items-center rounded-2xl border border-cl-accent/[0.15] bg-cl-canvas">
              <Clock3 className="h-5 w-5 text-cl-accent" />
            </div>

            <p className="mt-4 text-xs font-black uppercase tracking-[0.12em] text-cl-muted">
              Registration closes
            </p>

            <p className="mt-2 text-sm font-bold leading-6 text-cl-ink">
              {formatDeadline(event.registrationClosesAt)}
            </p>
          </div>

          <div className="rounded-[22px] border border-cl-accent/[0.15] bg-cl-canvas p-5 shadow-cl-panel">
            <div className="grid h-10 w-10 place-items-center rounded-2xl border border-cl-accent/[0.15] bg-cl-canvas">
              <Users className="h-5 w-5 text-cl-accent" />
            </div>

            <p className="mt-4 text-xs font-black uppercase tracking-[0.12em] text-cl-muted">
              Confirmed racers
            </p>

            <p className="mt-2 text-3xl font-black text-cl-ink">
              {event.confirmedRacerCount}
            </p>
          </div>
        </section>

        <EventRegistrationProgress event={event} registrations={racers} />

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_330px]">
          <div className="min-w-0 space-y-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-cl-accent/[0.15] bg-cl-accent/[0.08] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-cl-accent">
                <Flag className="h-3.5 w-3.5" />
                Available classes
              </div>

              <h2 className="mt-3 text-2xl font-black uppercase tracking-[-0.035em] text-cl-ink">
                Choose your competition
              </h2>

              <p className="mt-2 text-sm leading-6 text-cl-muted">
                Final class selection and event-day choices will be completed
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

            <div className="rounded-[26px] border border-cl-accent/[0.15] bg-cl-surface p-5 shadow-cl-panel">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl border border-cl-accent/[0.15] bg-cl-accent/10 text-cl-accent">
                  <CreditCard className="h-5 w-5" />
                </div>

                <div>
                  <h3 className="font-black uppercase text-cl-ink">
                    Registration payment
                  </h3>

                  <p className="text-xs text-cl-muted">
                    Available payment methods
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {event.allowOnlinePayment ? (
                  <div className="flex items-start gap-3 rounded-[18px] border border-cl-border bg-cl-subtle p-3">
                    <WalletCards className="mt-0.5 h-4 w-4 shrink-0 text-cl-accent" />

                    <div>
                      <p className="text-sm font-bold text-cl-ink">
                        Online card payment
                      </p>

                      <p className="mt-1 text-xs leading-5 text-cl-muted">
                        Secure online checkout is processed through Stripe.
                      </p>
                    </div>
                  </div>
                ) : null}

                {event.allowCashPayment ? (
                  <div className="flex items-start gap-3 rounded-[18px] border border-cl-border bg-cl-subtle p-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-cl-accent" />

                    <div>
                      <p className="text-sm font-bold text-cl-ink">
                        Pay cash in person
                      </p>

                      <p className="mt-1 text-xs leading-5 text-cl-muted">
                        Cash entries remain pending until confirmed by the
                        organization.
                      </p>
                    </div>
                  </div>
                ) : null}

                {event.allowManualPayment ? (
                  <div className="flex items-start gap-3 rounded-[18px] border border-cl-border bg-cl-subtle p-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-cl-success" />

                    <div>
                      <p className="text-sm font-bold text-cl-ink">
                        Organizer-managed payment
                      </p>

                      <p className="mt-1 text-xs leading-5 text-cl-muted">
                        Additional organizer-approved payment options may be
                        available.
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>

              <button
                type="button"
                disabled={!registrationOpen}
                onClick={() =>
                  navigate(`/registration/events/${event.slug}/register`)
                }
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-cl-accent px-5 py-3.5 text-[10px] font-black uppercase tracking-[0.15em] text-cl-contrast transition hover:bg-cl-accent disabled:cursor-not-allowed disabled:bg-cl-subtle disabled:text-cl-muted"
              >
                {registrationOpen
                  ? "Begin Registration"
                  : "Registration Not Open"}

                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            <div className="rounded-[26px] border border-cl-accent/10 bg-cl-surface p-5">
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-cl-accent" />

                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.14em] text-cl-muted">
                    Hosted by
                  </p>

                  <p className="mt-1 text-sm font-black text-cl-ink">
                    {event.organization.name}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[26px] border border-cl-accent/10 bg-cl-surface p-5">
              <ShieldCheck className="h-5 w-5 text-cl-accent" />

              <h3 className="mt-3 text-sm font-black uppercase text-cl-ink">
                Refund and transfer policy
              </h3>

              <p className="mt-2 whitespace-pre-line text-xs leading-6 text-cl-muted">
                {event.refundPolicyText ||
                  "Refund and class-transfer terms are controlled by the race organization."}
              </p>
            </div>
          </aside>
        </section>

        {event.showPublicEntryList !== false ? (
          <section className="rounded-[28px] border border-cl-accent/10 bg-cl-surface p-5 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="text-[9px] font-black uppercase tracking-[0.16em] text-cl-accent">
                  Public entry list
                </div>

                <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.035em] text-cl-ink">
                  Confirmed racers
                </h2>

                <p className="mt-2 text-sm text-cl-muted">
                  Registered entries approved for public display.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  navigate(`/registration/events/${event.slug}/racers`)
                }
                className="inline-flex items-center gap-2 self-start rounded-full border border-cl-border bg-cl-subtle px-4 py-3 text-[9px] font-black uppercase tracking-[0.13em] text-cl-muted transition hover:border-cl-accent/25 hover:bg-cl-accent/10 hover:text-cl-ink"
              >
                View Full Entry List
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            {visibleRacers.length === 0 ? (
              <div className="mt-5 rounded-[22px] border border-dashed border-cl-border bg-cl-surface px-5 py-10 text-center">
                <Users className="mx-auto h-7 w-7 text-cl-muted" />

                <p className="mt-3 text-sm text-cl-muted">
                  No public registrations have been published yet.
                </p>
              </div>
            ) : (
              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {visibleRacers.map((registration) => (
                  <div
                    key={registration.registrationId}
                    className="rounded-[20px] border border-cl-border bg-cl-subtle p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-cl-accent/[0.15] bg-cl-accent/10 text-sm font-black text-cl-accent">
                        {registration.racer.name
                          .split(" ")
                          .map((part) => part[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-black uppercase text-cl-ink">
                          {registration.racer.name}
                        </p>

                        <p className="mt-1 truncate text-xs text-cl-muted">
                          {registration.racer.formattedLocation ||
                            "Location not listed"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {registration.selectedClasses.map((selection) => (
                        <span
                          key={selection.classId}
                          className="rounded-full border border-cl-border bg-cl-surface px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.1em] text-cl-muted"
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
        ) : null}
      </div>
    </RegistrationLayout>
  );
}
