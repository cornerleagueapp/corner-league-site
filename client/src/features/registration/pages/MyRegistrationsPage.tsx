import { useEffect, useState } from "react";

import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  Flag,
  Loader2,
  ShipWheel,
  WalletCards,
} from "lucide-react";

import { useLocation } from "wouter";

import RegistrationLayout from "../components/RegistrationLayout";

import {
  getMyRegistrations,
  type RegistrationAccountItem,
} from "../services/registrationService";

function formatCurrency(cents: number, currency = "USD") {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
  }).format(Number(cents || 0) / 100);
}

function getClassName(entry: RegistrationAccountItem["entries"][number]) {
  return (
    entry.eventClass?.displayName?.trim() ||
    entry.division?.name ||
    "Race Class"
  );
}

function getStatusLabel(status: string) {
  switch (status) {
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
      return status
        .replace(/_/g, " ")
        .replace(/\b\w/g, (value) => value.toUpperCase());
  }
}

function getEventSlug(registration: RegistrationAccountItem) {
  return registration.event?.publicSlug || registration.event?.slug || "";
}

export default function MyRegistrationsPage() {
  const [, navigate] = useLocation();

  const [items, setItems] = useState<RegistrationAccountItem[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadRegistrations() {
      try {
        setLoading(true);
        setError(null);

        const response = await getMyRegistrations({
          page: 1,
          limit: 100,
        });

        if (!cancelled) {
          setItems(response.data);
        }
      } catch (loadError: any) {
        if (!cancelled) {
          setError(loadError?.message || "Unable to load your registrations.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadRegistrations();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <RegistrationLayout
      eyebrow="Account Registrations"
      title="My registrations"
      description="View race entries connected to your Corner League account."
      backHref="/registration"
      backLabel="Registration Home"
    >
      {loading ? (
        <div className="grid min-h-[420px] place-items-center rounded-[28px] border border-cl-accent/[0.12] bg-cl-canvas">
          <Loader2 className="h-8 w-8 animate-spin text-cl-accent" />
        </div>
      ) : error ? (
        <div className="rounded-[28px] border border-red-300/20 bg-red-950/20 p-6 text-center">
          <p className="text-sm text-cl-danger">{error}</p>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-cl-border bg-cl-canvas px-5 py-14 text-center">
          <CalendarDays className="mx-auto h-9 w-9 text-cl-muted" />

          <h2 className="mt-4 text-xl font-black uppercase text-cl-ink">
            No registrations yet
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-cl-muted">
            Race registrations submitted through Corner League will appear here.
          </p>

          <button
            type="button"
            onClick={() => navigate("/registration/events")}
            className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-cl-accent px-5 text-[10px] font-black uppercase tracking-[0.14em] text-cl-contrast"
          >
            Find an Event
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="grid gap-5">
          {items.map((registration) => {
            const confirmed = registration.status === "confirmed";

            const eventSlug = getEventSlug(registration);

            return (
              <article
                key={registration.id}
                className="relative overflow-hidden rounded-[28px] border border-cl-accent/[0.13] bg-cl-canvas p-5 shadow-cl-panel sm:p-6"
              >
                <div className="relative">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] ${
                            confirmed
                              ? "border-emerald-300/25 bg-cl-canvas text-cl-success"
                              : "border-cl-accent/25 bg-cl-canvas text-cl-accent"
                          }`}
                        >
                          {confirmed ? (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          ) : (
                            <Clock3 className="h-3.5 w-3.5" />
                          )}

                          {getStatusLabel(registration.status)}
                        </span>

                        <span className="rounded-full border border-cl-border bg-cl-canvas px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-cl-muted">
                          {registration.racer.name}
                        </span>

                        <span className="rounded-full border border-cl-border bg-cl-canvas px-3 py-1.5 font-mono text-[9px] font-bold text-cl-muted">
                          {registration.confirmationNumber}
                        </span>
                      </div>

                      <h2 className="mt-4 text-2xl font-black uppercase tracking-[-0.035em] text-cl-ink">
                        {registration.event?.name || "Race Event"}
                      </h2>

                      {registration.event?.formattedLocation ? (
                        <p className="mt-2 text-sm text-cl-muted">
                          {registration.event.formattedLocation}
                        </p>
                      ) : null}
                    </div>

                    <div className="shrink-0 rounded-[20px] border border-cl-border bg-cl-canvas px-5 py-4 text-left lg:text-right">
                      <p className="text-[9px] font-black uppercase tracking-[0.12em] text-cl-muted">
                        Registration Total
                      </p>

                      <p className="mt-2 text-2xl font-black text-cl-ink">
                        {formatCurrency(
                          registration.totalCents,
                          registration.currency || "USD",
                        )}
                      </p>

                      {registration.amountPaidCents > 0 ? (
                        <p className="mt-1 text-[10px] font-bold text-cl-success">
                          Paid{" "}
                          {formatCurrency(
                            registration.amountPaidCents,
                            registration.currency || "USD",
                          )}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 md:grid-cols-3">
                    <div className="rounded-[20px] border border-cl-border bg-cl-canvas p-4">
                      <div className="grid h-9 w-9 place-items-center rounded-xl border border-cl-accent/[0.15] bg-cl-canvas">
                        <Flag className="h-4 w-4 text-cl-accent" />
                      </div>

                      <p className="mt-3 text-[9px] font-black uppercase tracking-[0.12em] text-cl-muted">
                        Classes
                      </p>

                      <div className="mt-2 space-y-1.5">
                        {registration.entries.map((entry) => (
                          <p
                            key={entry.id}
                            className="text-xs font-bold text-cl-ink"
                          >
                            {getClassName(entry)}
                          </p>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-[20px] border border-cl-border bg-cl-canvas p-4">
                      <div className="grid h-9 w-9 place-items-center rounded-xl border border-cl-accent/[0.15] bg-cl-canvas">
                        <ShipWheel className="h-4 w-4 text-cl-accent" />
                      </div>

                      <p className="mt-3 text-[9px] font-black uppercase tracking-[0.12em] text-cl-muted">
                        Watercraft
                      </p>

                      <p className="mt-2 text-xs font-bold leading-5 text-cl-ink">
                        {registration.watercraft
                          ? `#${registration.watercraft.boatNumber ?? ""} ${
                              registration.watercraft.manufacturer ??
                              registration.watercraft.make ??
                              ""
                            } ${registration.watercraft.model ?? ""}`
                          : "No watercraft listed"}
                      </p>
                    </div>

                    <div className="rounded-[20px] border border-cl-border bg-cl-canvas p-4">
                      <div className="grid h-9 w-9 place-items-center rounded-xl border border-cl-accent/[0.15] bg-cl-canvas">
                        {registration.paymentMethod === "online" ? (
                          <CreditCard className="h-4 w-4 text-cl-accent" />
                        ) : (
                          <WalletCards className="h-4 w-4 text-cl-accent" />
                        )}
                      </div>

                      <p className="mt-3 text-[9px] font-black uppercase tracking-[0.12em] text-cl-muted">
                        Payment
                      </p>

                      <p className="mt-2 text-xs font-bold text-cl-ink">
                        {registration.paymentMethod === "online"
                          ? "Stripe Online Payment"
                          : registration.paymentMethod === "cash"
                            ? "Cash in Person"
                            : registration.paymentMethod}
                      </p>

                      <p className="mt-1 text-[10px] text-cl-muted">
                        {registration.paymentStatus}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-col gap-2 border-t border-cl-border pt-5 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={() =>
                        navigate(`/registration/success/${registration.id}`)
                      }
                      className="inline-flex min-h-11 items-center justify-center rounded-full border border-cl-border bg-cl-canvas px-4 text-[9px] font-black uppercase tracking-[0.13em] text-cl-muted"
                    >
                      View Registration
                    </button>

                    {eventSlug ? (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            navigate(`/registration/events/${eventSlug}`)
                          }
                          className="inline-flex min-h-11 items-center justify-center rounded-full border border-cl-border bg-cl-canvas px-4 text-[9px] font-black uppercase tracking-[0.13em] text-cl-muted"
                        >
                          View Event
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            navigate(`/registration/events/${eventSlug}/racers`)
                          }
                          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-cl-accent px-4 text-[9px] font-black uppercase tracking-[0.13em] text-cl-contrast"
                        >
                          Public Entry List
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </RegistrationLayout>
  );
}
