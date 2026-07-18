import {
  AtSign,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  MapPin,
  Phone,
  ShipWheel,
  UserRound,
} from "lucide-react";
import type {
  RegistrationDraft,
  RegistrationEvent,
  RegistrationRaceDay,
} from "../types/registration.types";

type RegistrationReviewStepProps = {
  event: RegistrationEvent;
  draft: RegistrationDraft;
  onEditStep: (step: number) => void;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatRaceDays(days: RegistrationRaceDay[]) {
  return days
    .map((day) => day.charAt(0).toUpperCase() + day.slice(1))
    .join(" & ");
}

function ReviewSection({
  title,
  step,
  icon,
  children,
  onEditStep,
}: {
  title: string;
  step: number;
  icon: React.ReactNode;
  children: React.ReactNode;
  onEditStep: (step: number) => void;
}) {
  return (
    <section className="rounded-[24px] border border-white/10 bg-[#07111F]/82 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl border border-cyan-300/15 bg-cyan-300/10 text-cyan-200">
            {icon}
          </div>

          <h3 className="text-sm font-black uppercase text-white">{title}</h3>
        </div>

        <button
          type="button"
          onClick={() => onEditStep(step)}
          className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[9px] font-black uppercase tracking-[0.12em] text-white/55 transition hover:border-cyan-300/20 hover:bg-cyan-300/10 hover:text-white"
        >
          Edit
        </button>
      </div>

      <div className="pt-4">{children}</div>
    </section>
  );
}

export default function RegistrationReviewStep({
  event,
  draft,
  onEditStep,
}: RegistrationReviewStepProps) {
  return (
    <div className="space-y-5">
      <div>
        <div className="text-[9px] font-black uppercase tracking-[0.18em] text-cyan-200/60">
          Step 6 of 6
        </div>

        <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.035em] text-white sm:text-3xl">
          Review registration
        </h2>

        <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-400">
          Verify the racer, classes, watercraft, contact information, and
          payment selection before submitting the demo registration.
        </p>
      </div>

      <div className="rounded-[20px] border border-emerald-300/15 bg-emerald-300/[0.055] p-4">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-200" />

          <div>
            <p className="text-sm font-black uppercase text-white">
              Ready for review
            </p>

            <p className="mt-1 text-xs leading-5 text-white/45">
              Submitting in the next batch will save this entry locally and
              update the event’s demo registration activity.
            </p>
          </div>
        </div>
      </div>

      <ReviewSection
        title="Racer"
        step={1}
        icon={<UserRound className="h-4 w-4" />}
        onEditStep={onEditStep}
      >
        <p className="text-base font-black uppercase text-white">
          {draft.racer?.name || "No racer selected"}
        </p>

        {draft.racer?.nickname ? (
          <p className="mt-1 text-sm text-cyan-200/65">
            “{draft.racer.nickname}”
          </p>
        ) : null}

        <div className="mt-3 flex flex-wrap gap-2 text-xs text-white/45">
          {draft.racer?.raceNumber ? (
            <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5">
              Racer #{draft.racer.raceNumber}
            </span>
          ) : null}

          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/20 px-3 py-1.5">
            <MapPin className="h-3.5 w-3.5" />
            {draft.racer?.formattedLocation || "Location not listed"}
          </span>
        </div>
      </ReviewSection>

      <ReviewSection
        title="Contact"
        step={2}
        icon={<Phone className="h-4 w-4" />}
        onEditStep={onEditStep}
      >
        <div className="space-y-3 text-sm text-white/65">
          <div className="flex items-center gap-2">
            <AtSign className="h-4 w-4 text-cyan-200" />
            <span>{draft.contact.email}</span>
          </div>

          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-cyan-200" />
            <span>{draft.contact.phone}</span>
          </div>

          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-[#FFB199]" />

            <span>
              {[
                draft.contact.city,
                draft.contact.stateCode,
                draft.contact.countryCode,
              ]
                .filter(Boolean)
                .join(", ")}
            </span>
          </div>
        </div>
      </ReviewSection>

      <ReviewSection
        title="Race classes"
        step={3}
        icon={<CalendarDays className="h-4 w-4" />}
        onEditStep={onEditStep}
      >
        <div className="space-y-3">
          {draft.selectedClasses.map((selection) => (
            <div
              key={selection.classId}
              className="flex flex-col gap-2 rounded-[18px] border border-white/10 bg-black/15 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-sm font-black uppercase text-white">
                  {selection.className}
                </p>

                <p className="mt-1 text-xs text-white/40">
                  {formatRaceDays(selection.raceDays)}
                </p>
              </div>

              <p className="text-sm font-black text-white">
                {formatCurrency(selection.price)}
              </p>
            </div>
          ))}
        </div>
      </ReviewSection>

      <ReviewSection
        title="Watercraft"
        step={4}
        icon={<ShipWheel className="h-4 w-4" />}
        onEditStep={onEditStep}
      >
        <p className="text-base font-black uppercase text-white">
          #{draft.watercraft.boatNumber} {draft.watercraft.make}{" "}
          {draft.watercraft.model}
        </p>

        {draft.watercraft.year ? (
          <p className="mt-2 text-sm text-white/45">
            Model year {draft.watercraft.year}
          </p>
        ) : null}
      </ReviewSection>

      <ReviewSection
        title="Payment"
        step={5}
        icon={<CreditCard className="h-4 w-4" />}
        onEditStep={onEditStep}
      >
        <p className="text-base font-black uppercase text-white">
          {draft.paymentMethod === "online"
            ? "Online card payment"
            : "Cash in person"}
        </p>

        <p className="mt-2 text-sm leading-6 text-white/45">
          {draft.paymentMethod === "online"
            ? "The demo will simulate a successful card payment and confirm the registration."
            : "The registration will remain pending until the organization confirms the cash payment."}
        </p>
      </ReviewSection>

      <section className="rounded-[26px] border border-cyan-300/15 bg-[linear-gradient(135deg,rgba(34,211,238,0.09),rgba(7,17,31,0.95),rgba(255,107,53,0.06))] p-5">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.15em] text-cyan-200/60">
              Final total
            </p>

            <p className="mt-2 text-3xl font-black text-white">
              {formatCurrency(draft.pricing.total)}
            </p>

            <p className="mt-2 text-xs text-white/40">{event.name}</p>
          </div>

          <div className="text-left text-xs leading-6 text-white/45 sm:text-right">
            <p>Class subtotal: {formatCurrency(draft.pricing.classSubtotal)}</p>
            <p>Platform fee: {formatCurrency(draft.pricing.platformFee)}</p>
            <p>Processing fee: {formatCurrency(draft.pricing.processingFee)}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
