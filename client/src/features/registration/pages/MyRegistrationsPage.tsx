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
        <div className="grid min-h-[420px] place-items-center rounded-[28px] border border-cyan-200/[0.12] bg-[#071321]">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-200" />
        </div>
      ) : error ? (
        <div className="rounded-[28px] border border-red-300/20 bg-red-950/20 p-6 text-center">
          <p className="text-sm text-red-100/75">{error}</p>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-white/[0.13] bg-[#071321] px-5 py-14 text-center">
          <CalendarDays className="mx-auto h-9 w-9 text-white/25" />

          <h2 className="mt-4 text-xl font-black uppercase text-white">
            No registrations yet
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/45">
            Race registrations submitted through Corner League will appear here.
          </p>

          <button
            type="button"
            onClick={() => navigate("/registration/events")}
            className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-cyan-300 px-5 text-[10px] font-black uppercase tracking-[0.14em] text-[#06111d]"
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
                className="relative overflow-hidden rounded-[28px] border border-cyan-200/[0.13] bg-[#071321] p-5 shadow-[0_26px_80px_rgba(0,0,0,0.44)] sm:p-6"
              >
                <div className="relative">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] ${
                            confirmed
                              ? "border-emerald-300/25 bg-[#103026] text-emerald-200"
                              : "border-[#FF6B35]/25 bg-[#351B19] text-[#FFB199]"
                          }`}
                        >
                          {confirmed ? (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          ) : (
                            <Clock3 className="h-3.5 w-3.5" />
                          )}

                          {getStatusLabel(registration.status)}
                        </span>

                        <span className="rounded-full border border-white/[0.1] bg-[#0B1929] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-white/55">
                          {registration.racer.name}
                        </span>

                        <span className="rounded-full border border-white/[0.1] bg-[#0B1929] px-3 py-1.5 font-mono text-[9px] font-bold text-white/45">
                          {registration.confirmationNumber}
                        </span>
                      </div>

                      <h2 className="mt-4 text-2xl font-black uppercase tracking-[-0.035em] text-white">
                        {registration.event?.name || "Race Event"}
                      </h2>

                      {registration.event?.formattedLocation ? (
                        <p className="mt-2 text-sm text-slate-400">
                          {registration.event.formattedLocation}
                        </p>
                      ) : null}
                    </div>

                    <div className="shrink-0 rounded-[20px] border border-white/[0.09] bg-[#0A1828] px-5 py-4 text-left lg:text-right">
                      <p className="text-[9px] font-black uppercase tracking-[0.12em] text-white/35">
                        Registration Total
                      </p>

                      <p className="mt-2 text-2xl font-black text-white">
                        {formatCurrency(
                          registration.totalCents,
                          registration.currency || "USD",
                        )}
                      </p>

                      {registration.amountPaidCents > 0 ? (
                        <p className="mt-1 text-[10px] font-bold text-emerald-200/70">
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
                    <div className="rounded-[20px] border border-white/[0.09] bg-[#0A1828] p-4">
                      <div className="grid h-9 w-9 place-items-center rounded-xl border border-cyan-300/15 bg-[#0D2633]">
                        <Flag className="h-4 w-4 text-cyan-200" />
                      </div>

                      <p className="mt-3 text-[9px] font-black uppercase tracking-[0.12em] text-white/35">
                        Classes
                      </p>

                      <div className="mt-2 space-y-1.5">
                        {registration.entries.map((entry) => (
                          <p
                            key={entry.id}
                            className="text-xs font-bold text-white"
                          >
                            {getClassName(entry)}
                          </p>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-[20px] border border-white/[0.09] bg-[#0A1828] p-4">
                      <div className="grid h-9 w-9 place-items-center rounded-xl border border-[#FF6B35]/15 bg-[#2B1B1B]">
                        <ShipWheel className="h-4 w-4 text-[#FFB199]" />
                      </div>

                      <p className="mt-3 text-[9px] font-black uppercase tracking-[0.12em] text-white/35">
                        Watercraft
                      </p>

                      <p className="mt-2 text-xs font-bold leading-5 text-white">
                        {registration.watercraft
                          ? `#${registration.watercraft.boatNumber ?? ""} ${
                              registration.watercraft.manufacturer ??
                              registration.watercraft.make ??
                              ""
                            } ${registration.watercraft.model ?? ""}`
                          : "No watercraft listed"}
                      </p>
                    </div>

                    <div className="rounded-[20px] border border-white/[0.09] bg-[#0A1828] p-4">
                      <div className="grid h-9 w-9 place-items-center rounded-xl border border-cyan-300/15 bg-[#0D2633]">
                        {registration.paymentMethod === "online" ? (
                          <CreditCard className="h-4 w-4 text-cyan-200" />
                        ) : (
                          <WalletCards className="h-4 w-4 text-[#FFB199]" />
                        )}
                      </div>

                      <p className="mt-3 text-[9px] font-black uppercase tracking-[0.12em] text-white/35">
                        Payment
                      </p>

                      <p className="mt-2 text-xs font-bold text-white">
                        {registration.paymentMethod === "online"
                          ? "Stripe Online Payment"
                          : registration.paymentMethod === "cash"
                            ? "Cash in Person"
                            : registration.paymentMethod}
                      </p>

                      <p className="mt-1 text-[10px] text-white/35">
                        {registration.paymentStatus}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-col gap-2 border-t border-white/[0.1] pt-5 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={() =>
                        navigate(`/registration/success/${registration.id}`)
                      }
                      className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/[0.11] bg-[#0B1929] px-4 text-[9px] font-black uppercase tracking-[0.13em] text-white/65"
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
                          className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/[0.11] bg-[#0B1929] px-4 text-[9px] font-black uppercase tracking-[0.13em] text-white/65"
                        >
                          View Event
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            navigate(`/registration/events/${eventSlug}/racers`)
                          }
                          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-cyan-300 px-4 text-[9px] font-black uppercase tracking-[0.13em] text-[#06111d]"
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
