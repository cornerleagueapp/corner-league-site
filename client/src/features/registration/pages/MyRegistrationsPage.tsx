import { useEffect, useState } from "react";
import { useLocation } from "wouter";
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
import { useAuth } from "@/hooks/useAuth";
import RegistrationLayout from "../components/RegistrationLayout";
import {
  getDemoRegistrationsForUser,
  getRegistrationEventBySlug,
} from "../services/registrationDemoService";
import type {
  DemoRegistration,
  RegistrationEvent,
} from "../types/registration.types";

type RegistrationWithEvent = {
  registration: DemoRegistration;
  event: RegistrationEvent | null;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export default function MyRegistrationsPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();

  const [items, setItems] = useState<RegistrationWithEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const userId =
    (user as any)?.id ?? (user as any)?.userId ?? (user as any)?.uuid ?? null;

  useEffect(() => {
    let cancelled = false;

    async function loadRegistrations() {
      try {
        setLoading(true);

        const registrations = await getDemoRegistrationsForUser(
          userId ? String(userId) : null,
        );

        const result = await Promise.all(
          registrations.map(async (registration) => ({
            registration,
            event: await getRegistrationEventBySlug(registration.eventSlug),
          })),
        );

        if (!cancelled) {
          setItems(result);
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
  }, [userId]);

  return (
    <RegistrationLayout
      eyebrow="Account Registrations"
      title="My registrations"
      description="View race entries connected to your Corner League account."
      backHref="/registration"
      backLabel="Registration Home"
    >
      {loading ? (
        <div className="grid min-h-[420px] place-items-center rounded-[28px] border border-cyan-200/[0.12] bg-[#071321] shadow-[0_24px_70px_rgba(0,0,0,0.38)]">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-200" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-white/[0.13] bg-[#071321] px-5 py-14 text-center shadow-[0_24px_70px_rgba(0,0,0,0.38)]">
          <CalendarDays className="mx-auto h-9 w-9 text-white/25" />

          <h2 className="mt-4 text-xl font-black uppercase text-white">
            No registrations yet
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/45">
            Race entries submitted through this frontend demo will appear here.
          </p>

          <button
            type="button"
            onClick={() => navigate("/registration/events")}
            className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-cyan-300 px-5 text-[10px] font-black uppercase tracking-[0.14em] text-[#06111d] shadow-[0_10px_30px_rgba(34,211,238,0.16)] transition hover:bg-cyan-200"
          >
            Find an Event
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="grid gap-5">
          {items.map(({ registration, event }) => {
            const confirmed = registration.status === "confirmed";

            return (
              <article
                key={registration.id}
                className="relative overflow-hidden rounded-[28px] border border-cyan-200/[0.13] bg-[#071321] p-5 shadow-[0_26px_80px_rgba(0,0,0,0.44),inset_0_1px_0_rgba(255,255,255,0.035)] sm:p-6"
              >
                <div className="pointer-events-none absolute inset-0">
                  <div className="absolute -right-24 -top-24 h-56 w-56 rounded-full bg-cyan-400/[0.055] blur-3xl" />

                  <div className="absolute -bottom-28 left-[35%] h-60 w-60 rounded-full bg-[#FF6B35]/[0.045] blur-3xl" />

                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/30 to-transparent" />
                </div>

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

                          {confirmed ? "Confirmed" : "Pending Cash"}
                        </span>

                        <span className="rounded-full border border-white/[0.1] bg-[#0B1929] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-white/55">
                          {registration.racer.name}
                        </span>
                      </div>

                      <h2 className="mt-4 text-2xl font-black uppercase tracking-[-0.035em] text-white">
                        {event?.name || registration.eventSlug}
                      </h2>

                      {event ? (
                        <p className="mt-2 text-sm text-slate-400">
                          {event.formattedLocation}
                        </p>
                      ) : null}
                    </div>

                    <div className="shrink-0 rounded-[20px] border border-white/[0.09] bg-[#0A1828] px-5 py-4 text-left shadow-sm lg:text-right">
                      <p className="text-[9px] font-black uppercase tracking-[0.12em] text-white/35">
                        Registration Total
                      </p>

                      <p className="mt-2 text-2xl font-black text-white">
                        {formatCurrency(registration.pricing.total)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 md:grid-cols-3">
                    <div className="rounded-[20px] border border-white/[0.09] bg-[#0A1828] p-4 shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
                      <div className="grid h-9 w-9 place-items-center rounded-xl border border-cyan-300/15 bg-[#0D2633]">
                        <Flag className="h-4 w-4 text-cyan-200" />
                      </div>

                      <p className="mt-3 text-[9px] font-black uppercase tracking-[0.12em] text-white/35">
                        Classes
                      </p>

                      <div className="mt-2 space-y-1.5">
                        {registration.selectedClasses.map((selection) => (
                          <p
                            key={selection.classId}
                            className="text-xs font-bold text-white"
                          >
                            {selection.className}
                          </p>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-[20px] border border-white/[0.09] bg-[#0A1828] p-4 shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
                      <div className="grid h-9 w-9 place-items-center rounded-xl border border-[#FF6B35]/15 bg-[#2B1B1B]">
                        <ShipWheel className="h-4 w-4 text-[#FFB199]" />
                      </div>

                      <p className="mt-3 text-[9px] font-black uppercase tracking-[0.12em] text-white/35">
                        Watercraft
                      </p>

                      <p className="mt-2 text-xs font-bold leading-5 text-white">
                        #{registration.watercraft.boatNumber}{" "}
                        {registration.watercraft.make}{" "}
                        {registration.watercraft.model}
                      </p>
                    </div>

                    <div className="rounded-[20px] border border-white/[0.09] bg-[#0A1828] p-4 shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
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
                          ? "Online Demo Payment"
                          : "Cash in Person"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-col gap-2 border-t border-white/[0.1] pt-5 sm:flex-row sm:justify-end">
                    {event ? (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            navigate(`/registration/events/${event.slug}`)
                          }
                          className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/[0.11] bg-[#0B1929] px-4 text-[9px] font-black uppercase tracking-[0.13em] text-white/65 transition hover:border-cyan-300/20 hover:bg-[#102438] hover:text-white"
                        >
                          View Event
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              `/registration/events/${event.slug}/racers`,
                            )
                          }
                          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-cyan-300 px-4 text-[9px] font-black uppercase tracking-[0.13em] text-[#06111d] shadow-[0_10px_30px_rgba(34,211,238,0.14)] transition hover:bg-cyan-200"
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
