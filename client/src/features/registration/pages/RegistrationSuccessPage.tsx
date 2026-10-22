import { useEffect, useState } from "react";

import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Loader2,
  Trophy,
} from "lucide-react";

import { useLocation } from "wouter";

import RegistrationLayout from "../components/RegistrationLayout";

import RegistrationShareButton from "../components/RegistrationShareButton";

import {
  getMyRegistration,
  getRegistrationEventBySlug,
  getRegistrationPaymentStatus,
  type RegistrationAccountItem,
} from "../services/registrationService";

import type { RegistrationEvent } from "../types/registration.types";

type RegistrationSuccessPageProps = {
  registrationId: string;
};

function formatCurrency(cents: number, currency = "USD") {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
  }).format(Number(cents || 0) / 100);
}

function getEventSlug(registration: RegistrationAccountItem) {
  return registration.event?.publicSlug || registration.event?.slug || "";
}

function getClassName(entry: RegistrationAccountItem["entries"][number]) {
  return (
    entry.eventClass?.displayName?.trim() ||
    entry.division?.name ||
    "Race Class"
  );
}

function getStatusLabel(registration: RegistrationAccountItem) {
  switch (registration.status) {
    case "confirmed":
      return "Confirmed";

    case "pending_cash":
      return "Pending Cash";

    case "pending_payment":
      return "Payment Pending";

    case "waitlisted":
      return "Waitlisted";

    case "partially_refunded":
      return "Partially Refunded";

    case "refunded":
      return "Refunded";

    case "cancelled":
      return "Cancelled";

    default:
      return registration.status
        .replace(/_/g, " ")
        .replace(/\b\w/g, (value) => value.toUpperCase());
  }
}

export default function RegistrationSuccessPage({
  registrationId,
}: RegistrationSuccessPageProps) {
  const [, navigate] = useLocation();

  const [registration, setRegistration] =
    useState<RegistrationAccountItem | null>(null);

  const [event, setEvent] = useState<RegistrationEvent | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadSuccess() {
      try {
        setLoading(true);
        setError(null);

        /**
         * Ask the payment endpoint first as a lightweight sync point.
         *
         * This is especially useful after returning from Stripe.
         */
        try {
          await getRegistrationPaymentStatus(registrationId);
        } catch {
          // Registration details remain the primary source for this screen.
        }

        const registrationResult = await getMyRegistration(registrationId);

        const eventSlug = getEventSlug(registrationResult);

        let eventResult: RegistrationEvent | null = null;

        if (eventSlug) {
          try {
            eventResult = await getRegistrationEventBySlug(eventSlug);
          } catch {
            eventResult = null;
          }
        }

        if (!cancelled) {
          setRegistration(registrationResult);

          setEvent(eventResult);
        }
      } catch (loadError: any) {
        if (!cancelled) {
          setError(loadError?.message || "Unable to load this registration.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadSuccess();

    return () => {
      cancelled = true;
    };
  }, [registrationId]);

  if (loading) {
    return (
      <RegistrationLayout hideHeader>
        <div className="grid min-h-[70vh] place-items-center rounded-[28px] border border-cl-accent/10 bg-cl-surface">
          <Loader2 className="h-8 w-8 animate-spin text-cl-accent" />
        </div>
      </RegistrationLayout>
    );
  }

  if (error || !registration) {
    return (
      <RegistrationLayout
        eyebrow="Race Registration"
        title="Registration unavailable"
        description={error || "This registration could not be found."}
        backHref="/registration"
        backLabel="Registration Home"
      >
        <div className="rounded-[28px] border border-red-300/15 bg-red-950/20 p-8 text-center">
          <button
            type="button"
            onClick={() => navigate("/registration")}
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-cl-accent px-5 text-[10px] font-black uppercase tracking-[0.14em] text-cl-contrast"
          >
            Registration Home
          </button>
        </div>
      </RegistrationLayout>
    );
  }

  const confirmed = registration.status === "confirmed";

  const pendingCash = registration.status === "pending_cash";

  const pendingPayment = registration.status === "pending_payment";

  const eventSlug = getEventSlug(registration);

  const eventName = event?.name || registration.event?.name || "Race Event";

  const statusLabel = getStatusLabel(registration);

  return (
    <RegistrationLayout hideHeader>
      <div className="mx-auto max-w-4xl">
        <section className="relative overflow-hidden rounded-[32px] border border-cl-accent/[0.15] cl-panel-wash p-5 text-center shadow-cl-panel sm:p-8">
          <div className="relative">
            <div
              className={`mx-auto grid h-20 w-20 place-items-center rounded-full border ${
                confirmed
                  ? "border-emerald-300/30 bg-emerald-300/12 text-cl-success"
                  : "border-cl-accent/25 bg-cl-accent/10 text-cl-accent"
              }`}
            >
              {confirmed ? (
                <CheckCircle2 className="h-10 w-10" />
              ) : (
                <Clock3 className="h-10 w-10" />
              )}
            </div>

            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-cl-accent/[0.15] bg-cl-accent/[0.08] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.18em] text-cl-accent">
              <Trophy className="h-3.5 w-3.5" />
              Corner League Registration
            </div>

            <h1 className="mt-5 text-3xl font-black uppercase leading-[0.95] tracking-[-0.045em] text-cl-ink sm:text-5xl">
              {confirmed
                ? "You’re registered!"
                : pendingCash
                  ? "Registration submitted"
                  : pendingPayment
                    ? "Payment pending"
                    : statusLabel}
            </h1>

            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-cl-muted">
              {confirmed
                ? `${registration.racer.name} is confirmed for ${eventName}.`
                : pendingCash
                  ? `${registration.racer.name} has been entered. Cash payment must be confirmed by the organization.`
                  : pendingPayment
                    ? `${registration.racer.name}'s registration has been created and is waiting for payment confirmation.`
                    : `${registration.racer.name}'s registration status is ${statusLabel}.`}
            </p>

            <div className="mx-auto mt-5 w-fit rounded-full border border-cl-border bg-cl-surface px-4 py-2">
              <span className="text-[9px] font-black uppercase tracking-[0.12em] text-cl-muted">
                Confirmation
              </span>

              <span className="ml-2 font-mono text-sm font-black text-cl-ink">
                {registration.confirmationNumber}
              </span>
            </div>

            <div className="mx-auto mt-7 grid max-w-2xl gap-3 text-left sm:grid-cols-2">
              <div className="rounded-[20px] border border-cl-border bg-cl-surface p-4">
                <p className="text-[9px] font-black uppercase tracking-[0.13em] text-cl-muted">
                  Racer
                </p>

                <p className="mt-2 text-base font-black uppercase text-cl-ink">
                  {registration.racer.name}
                </p>
              </div>

              <div className="rounded-[20px] border border-cl-border bg-cl-surface p-4">
                <p className="text-[9px] font-black uppercase tracking-[0.13em] text-cl-muted">
                  Status
                </p>

                <p className="mt-2 text-base font-black uppercase text-cl-ink">
                  {statusLabel}
                </p>
              </div>

              <div className="rounded-[20px] border border-cl-border bg-cl-surface p-4 sm:col-span-2">
                <p className="text-[9px] font-black uppercase tracking-[0.13em] text-cl-muted">
                  Classes
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {registration.entries.map((entry) => (
                    <span
                      key={entry.id}
                      className="rounded-full border border-cl-border bg-cl-subtle px-3 py-2 text-[9px] font-black uppercase tracking-[0.1em] text-cl-muted"
                    >
                      {getClassName(entry)}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-[20px] border border-cl-border bg-cl-surface p-4">
                <p className="text-[9px] font-black uppercase tracking-[0.13em] text-cl-muted">
                  Payment
                </p>

                <p className="mt-2 text-sm font-black uppercase text-cl-ink">
                  {registration.paymentMethod === "online"
                    ? "Stripe Online Payment"
                    : registration.paymentMethod === "cash"
                      ? "Cash in Person"
                      : registration.paymentMethod.replace(/_/g, " ")}
                </p>

                <p className="mt-1 text-xs text-cl-muted">
                  {registration.paymentStatus}
                </p>
              </div>

              <div className="rounded-[20px] border border-cl-border bg-cl-surface p-4">
                <p className="text-[9px] font-black uppercase tracking-[0.13em] text-cl-muted">
                  Total
                </p>

                <p className="mt-2 text-xl font-black text-cl-ink">
                  {formatCurrency(
                    registration.totalCents,
                    registration.currency || "USD",
                  )}
                </p>

                {registration.amountPaidCents > 0 ? (
                  <p className="mt-1 text-xs text-cl-success">
                    Paid{" "}
                    {formatCurrency(
                      registration.amountPaidCents,
                      registration.currency || "USD",
                    )}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
              {eventSlug ? (
                <button
                  type="button"
                  onClick={() =>
                    navigate(`/registration/events/${eventSlug}/racers`)
                  }
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-cl-accent px-5 text-[10px] font-black uppercase tracking-[0.14em] text-cl-contrast"
                >
                  <ClipboardList className="h-4 w-4" />
                  View Entry List
                </button>
              ) : null}

              <button
                type="button"
                onClick={() => navigate("/registration/my-registrations")}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-cl-border bg-cl-subtle px-5 text-[10px] font-black uppercase tracking-[0.14em] text-cl-muted"
              >
                <CalendarDays className="h-4 w-4" />
                My Registrations
              </button>

              {event ? (
                <RegistrationShareButton
                  eventName={event.name}
                  eventSlug={event.slug}
                  startDate={event.startDate}
                  endDate={event.endDate}
                />
              ) : null}
            </div>

            {eventSlug ? (
              <button
                type="button"
                onClick={() => navigate(`/registration/events/${eventSlug}`)}
                className="mt-6 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-cl-accent"
              >
                Return to Event
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </section>
      </div>
    </RegistrationLayout>
  );
}
