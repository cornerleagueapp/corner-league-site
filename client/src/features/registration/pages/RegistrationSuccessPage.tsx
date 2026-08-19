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
        <div className="grid min-h-[70vh] place-items-center rounded-[28px] border border-cyan-300/10 bg-[#07111F]/75">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-200" />
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
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-cyan-300 px-5 text-[10px] font-black uppercase tracking-[0.14em] text-[#06111d]"
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
        <section className="relative overflow-hidden rounded-[32px] border border-cyan-300/15 bg-[linear-gradient(135deg,#081827,#07111F_55%,#17151D)] p-5 text-center shadow-[0_32px_100px_rgba(0,0,0,0.48)] sm:p-8">
          <div className="relative">
            <div
              className={`mx-auto grid h-20 w-20 place-items-center rounded-full border ${
                confirmed
                  ? "border-emerald-300/30 bg-emerald-300/12 text-emerald-200"
                  : "border-cyan-300/25 bg-cyan-300/10 text-cyan-200"
              }`}
            >
              {confirmed ? (
                <CheckCircle2 className="h-10 w-10" />
              ) : (
                <Clock3 className="h-10 w-10" />
              )}
            </div>

            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-300/8 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.18em] text-cyan-200">
              <Trophy className="h-3.5 w-3.5" />
              Corner League Registration
            </div>

            <h1 className="mt-5 text-3xl font-black uppercase leading-[0.95] tracking-[-0.045em] text-white sm:text-5xl">
              {confirmed
                ? "You’re registered!"
                : pendingCash
                  ? "Registration submitted"
                  : pendingPayment
                    ? "Payment pending"
                    : statusLabel}
            </h1>

            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-300">
              {confirmed
                ? `${registration.racer.name} is confirmed for ${eventName}.`
                : pendingCash
                  ? `${registration.racer.name} has been entered. Cash payment must be confirmed by the organization.`
                  : pendingPayment
                    ? `${registration.racer.name}'s registration has been created and is waiting for payment confirmation.`
                    : `${registration.racer.name}'s registration status is ${statusLabel}.`}
            </p>

            <div className="mx-auto mt-5 w-fit rounded-full border border-white/10 bg-black/20 px-4 py-2">
              <span className="text-[9px] font-black uppercase tracking-[0.12em] text-white/35">
                Confirmation
              </span>

              <span className="ml-2 font-mono text-sm font-black text-white">
                {registration.confirmationNumber}
              </span>
            </div>

            <div className="mx-auto mt-7 grid max-w-2xl gap-3 text-left sm:grid-cols-2">
              <div className="rounded-[20px] border border-white/10 bg-black/20 p-4">
                <p className="text-[9px] font-black uppercase tracking-[0.13em] text-white/35">
                  Racer
                </p>

                <p className="mt-2 text-base font-black uppercase text-white">
                  {registration.racer.name}
                </p>
              </div>

              <div className="rounded-[20px] border border-white/10 bg-black/20 p-4">
                <p className="text-[9px] font-black uppercase tracking-[0.13em] text-white/35">
                  Status
                </p>

                <p className="mt-2 text-base font-black uppercase text-white">
                  {statusLabel}
                </p>
              </div>

              <div className="rounded-[20px] border border-white/10 bg-black/20 p-4 sm:col-span-2">
                <p className="text-[9px] font-black uppercase tracking-[0.13em] text-white/35">
                  Classes
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {registration.entries.map((entry) => (
                    <span
                      key={entry.id}
                      className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-2 text-[9px] font-black uppercase tracking-[0.1em] text-white/65"
                    >
                      {getClassName(entry)}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-[20px] border border-white/10 bg-black/20 p-4">
                <p className="text-[9px] font-black uppercase tracking-[0.13em] text-white/35">
                  Payment
                </p>

                <p className="mt-2 text-sm font-black uppercase text-white">
                  {registration.paymentMethod === "online"
                    ? "Stripe Online Payment"
                    : registration.paymentMethod === "cash"
                      ? "Cash in Person"
                      : registration.paymentMethod.replace(/_/g, " ")}
                </p>

                <p className="mt-1 text-xs text-white/40">
                  {registration.paymentStatus}
                </p>
              </div>

              <div className="rounded-[20px] border border-white/10 bg-black/20 p-4">
                <p className="text-[9px] font-black uppercase tracking-[0.13em] text-white/35">
                  Total
                </p>

                <p className="mt-2 text-xl font-black text-white">
                  {formatCurrency(
                    registration.totalCents,
                    registration.currency || "USD",
                  )}
                </p>

                {registration.amountPaidCents > 0 ? (
                  <p className="mt-1 text-xs text-emerald-200/70">
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
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-cyan-300 px-5 text-[10px] font-black uppercase tracking-[0.14em] text-[#06111d]"
                >
                  <ClipboardList className="h-4 w-4" />
                  View Entry List
                </button>
              ) : null}

              <button
                type="button"
                onClick={() => navigate("/registration/my-registrations")}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-5 text-[10px] font-black uppercase tracking-[0.14em] text-white/70"
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
                className="mt-6 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-cyan-200"
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
