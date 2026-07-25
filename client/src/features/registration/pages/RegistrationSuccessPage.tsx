import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Loader2,
  Trophy,
} from "lucide-react";
import RegistrationLayout from "../components/RegistrationLayout";
import RegistrationShareButton from "../components/RegistrationShareButton";
import {
  getDemoRegistrationById,
  getRegistrationEventBySlug,
} from "../services/registrationDemoService";
import type {
  DemoRegistration,
  RegistrationEvent,
} from "../types/registration.types";

type RegistrationSuccessPageProps = {
  registrationId: string;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export default function RegistrationSuccessPage({
  registrationId,
}: RegistrationSuccessPageProps) {
  const [, navigate] = useLocation();

  const [registration, setRegistration] = useState<DemoRegistration | null>(
    null,
  );

  const [event, setEvent] = useState<RegistrationEvent | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadSuccess() {
      try {
        setLoading(true);

        const registrationResult =
          await getDemoRegistrationById(registrationId);

        if (!registrationResult) {
          return;
        }

        const eventResult = await getRegistrationEventBySlug(
          registrationResult.eventSlug,
        );

        if (!cancelled) {
          setRegistration(registrationResult);
          setEvent(eventResult);
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

  if (!registration || !event) {
    return (
      <RegistrationLayout
        eyebrow="Race Registration"
        title="Registration not found"
        description="The demo registration could not be loaded."
        backHref="/registration"
        backLabel="Registration Home"
      >
        <div className="rounded-[28px] border border-red-300/15 bg-red-950/20 p-8 text-center">
          <p className="text-sm leading-6 text-red-100/70">
            The saved demo registration may have been removed or reset.
          </p>

          <button
            type="button"
            onClick={() => navigate("/registration")}
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-cyan-300 px-5 text-[10px] font-black uppercase tracking-[0.14em] text-[#06111d] transition hover:bg-cyan-200"
          >
            Registration Home
          </button>
        </div>
      </RegistrationLayout>
    );
  }

  const confirmed = registration.status === "confirmed";

  return (
    <RegistrationLayout hideHeader>
      <div className="mx-auto max-w-4xl py-4 sm:py-8">
        <section className="relative overflow-hidden rounded-[32px] border border-cyan-300/20 bg-[linear-gradient(135deg,rgba(34,211,238,0.13),rgba(7,17,31,0.98)_48%,rgba(255,107,53,0.10))] p-5 text-center shadow-[0_30px_100px_rgba(0,0,0,0.38)] sm:p-8 lg:p-10">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-cyan-300/10 blur-3xl" />
            <div className="absolute -bottom-24 -right-20 h-64 w-64 rounded-full bg-[#FF6B35]/10 blur-3xl" />
          </div>

          <div className="relative">
            <div className="mx-auto grid h-20 w-20 place-items-center rounded-full border border-emerald-300/30 bg-emerald-300/12 text-emerald-200 shadow-[0_0_45px_rgba(110,231,183,0.15)]">
              <CheckCircle2 className="h-10 w-10" />
            </div>

            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-300/8 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.18em] text-cyan-200">
              <Trophy className="h-3.5 w-3.5" />
              Corner League Registration
            </div>

            <h1 className="mt-5 text-3xl font-black uppercase leading-[0.95] tracking-[-0.045em] text-white sm:text-5xl">
              {confirmed ? "You’re registered!" : "Registration submitted"}
            </h1>

            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-300">
              {confirmed
                ? `${registration.racer.name} is confirmed for ${event.name}.`
                : `${registration.racer.name} has been entered with cash payment pending.`}
            </p>

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
                  {confirmed ? "Confirmed" : "Pending Cash"}
                </p>
              </div>

              <div className="rounded-[20px] border border-white/10 bg-black/20 p-4 sm:col-span-2">
                <p className="text-[9px] font-black uppercase tracking-[0.13em] text-white/35">
                  Classes
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {registration.selectedClasses.map((selection) => (
                    <span
                      key={selection.classId}
                      className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-2 text-[9px] font-black uppercase tracking-[0.1em] text-white/65"
                    >
                      {selection.className}
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
                    ? "Online Demo Payment"
                    : "Cash in Person"}
                </p>
              </div>

              <div className="rounded-[20px] border border-white/10 bg-black/20 p-4">
                <p className="text-[9px] font-black uppercase tracking-[0.13em] text-white/35">
                  Total
                </p>

                <p className="mt-2 text-xl font-black text-white">
                  {formatCurrency(registration.pricing.total)}
                </p>
              </div>
            </div>

            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                onClick={() =>
                  navigate(`/registration/events/${event.slug}/racers`)
                }
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-cyan-300 px-5 text-[10px] font-black uppercase tracking-[0.14em] text-[#06111d] transition hover:bg-cyan-200"
              >
                <ClipboardList className="h-4 w-4" />
                View Entry List
              </button>

              <button
                type="button"
                onClick={() => navigate("/registration/my-registrations")}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-5 text-[10px] font-black uppercase tracking-[0.14em] text-white/70 transition hover:bg-white/10 hover:text-white"
              >
                <CalendarDays className="h-4 w-4" />
                My Registrations
              </button>

              <RegistrationShareButton
                eventName={event.name}
                eventSlug={event.slug}
                startDate={event.startDate}
                endDate={event.endDate}
              />
            </div>

            <button
              type="button"
              onClick={() => navigate(`/registration/events/${event.slug}`)}
              className="mt-6 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-cyan-200"
            >
              Return to Event
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </section>
      </div>
    </RegistrationLayout>
  );
}
